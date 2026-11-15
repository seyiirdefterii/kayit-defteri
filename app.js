"use strict";
/* =====================================================================
   MKD · Mobbing Kayıt Defteri — çekirdek
   1. Yardımcılar · 2. Veritabanı · 3. Şifreleme ve kasa · 4. Kayıt (save)
   5. Giriş, kurulum ve kurtarma ekranları · 6. Tarih ve süre hesapları
   7. Kayıt kuralları (taslak, kesinleştirme, ek, geri çekme)
   8. Sistematiklik · 9. Belgeler · 10. Paylaşım, e-posta, takvim
   11. Yedek · 12. Gizlilik perdesi, otomatik kilit, başlatma
   Veriler hiçbir zaman internete gönderilmez.
   ===================================================================== */

/* ---------- 1. YARDIMCILAR ---------- */
const $ = (id) => document.getElementById(id);
const enc = new TextEncoder(), dec = new TextDecoder();
const pad = (n, l) => String(n).padStart(l || 2, "0");
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowIso = () => new Date().toISOString();
function today(){ const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function nowTime(){ const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function localDateOf(iso){ const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function trDate(s){ if(!s) return "–"; const p = s.slice(0, 10).split("-"); return `${p[2]}.${p[1]}.${p[0]}`; }
function trStamp(iso){ if(!iso) return "–"; try { const d = new Date(iso); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; } catch(e){ return iso; } }
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
function trLong(s){ const d = s2d(s); return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()} ${GUNLER[d.getUTCDay()]}`; }
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const b64 = (buf) => { const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let s = ""; for(let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
function lsGet(k, def){ try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch(e){ return def; } }
function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
function shorten(s, n){ s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
const noStr = (n) => "MKD-" + pad(n, 4);
let toastT = 0;
function toast(msg, cls){ const t = $("toast"); t.textContent = msg; t.className = "toast " + (cls || ""); t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200); }

const ITER = 600000;
const LS_FAIL = "mkd-fail", LS_TEMA = "mkd-tema", LS_KVKK = "mkd-kvkk";

/* ---------- 2. VERİTABANI (IndexedDB) ----------
   Önceki "Kayıt Defteri" sürümüyle aynı depo adını kullanır; böylece güncellemede veriler yerinde kalır. */
let DBH = null;
function openDB(){
  if(DBH) return Promise.resolve(DBH);
  return new Promise((res, rej) => {
    const r = indexedDB.open("defter", 1);
    r.onupgradeneeded = () => { const d = r.result; if(!d.objectStoreNames.contains("kv")) d.createObjectStore("kv"); if(!d.objectStoreNames.contains("foto")) d.createObjectStore("foto"); };
    r.onsuccess = () => { DBH = r.result; res(DBH); };
    r.onerror = () => rej(r.error);
  });
}
function rq(r){ return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function os(name, mode){ return (await openDB()).transaction(name, mode).objectStore(name); }
const kvGet = async (k) => rq((await os("kv", "readonly")).get(k));
const kvSet = async (k, v) => rq((await os("kv", "readwrite")).put(v, k));
const fotoGet = async (id) => rq((await os("foto", "readonly")).get(id));
const fotoPut = async (id, v) => rq((await os("foto", "readwrite")).put(v, id));
const fotoDel = async (id) => rq((await os("foto", "readwrite")).delete(id));

/* ---------- 3. ŞİFRELEME VE KASA ----------
   Veriler rastgele üretilmiş bir "veri anahtarı" (DEK) ile AES-256-GCM şifrelenir.
   Veri anahtarı iki ayrı yoldan açılabilir: PIN'den ve kurtarma cevabından türetilen anahtarlar.
   PIN ve kurtarma cevabı hiçbir yere kaydedilmez. */
let data = null, dek = null, dekRaw = null, meta = null, saving = Promise.resolve();

async function deriveKey(secret, saltBytes, iter){
  const base = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: saltBytes, iterations: iter || ITER, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function encBytes(k, bytes){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, bytes);
  return { iv, ct };
}
const decBytes = (k, iv, ct) => crypto.subtle.decrypt({ name: "AES-GCM", iv }, k, ct);
const importDek = (raw) => crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);

// Kurtarma cevabı: büyük-küçük harf, Türkçe karakter ve fazla boşluk farkı önemsenmez
function normCevap(s){
  return String(s || "").normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
async function wrapDek(secret, raw){
  const s = crypto.getRandomValues(new Uint8Array(16));
  const k = await deriveKey(secret, s, ITER);
  const { iv, ct } = await encBytes(k, raw);
  return { salt: b64(s), iter: ITER, iv: b64(iv), ct: b64(ct) };
}
async function unwrapDek(secret, w){
  const k = await deriveKey(secret, unb64(w.salt), w.iter || ITER);
  return new Uint8Array(await decBytes(k, unb64(w.iv), unb64(w.ct)));
}
async function openVeri(raw, kasa){
  const k = await importDek(raw);
  const plain = await decBytes(k, unb64(kasa.veri.iv), unb64(kasa.veri.ct));
  return { k, d: JSON.parse(dec.decode(plain)) };
}
// Önceki sürüm (Kayıt Defteri 1-2): veriler doğrudan PIN anahtarıyla şifreliydi
async function openKasaEski(pin, kasa){
  const s = unb64(kasa.salt);
  const k = await deriveKey(pin, s, kasa.iter || 250000);
  const plain = await decBytes(k, unb64(kasa.iv), unb64(kasa.ct));
  return { key: k, data: JSON.parse(dec.decode(plain)) };
}

function yeniVeri(sektor, hitap){
  return { v: 3, sektor: sektor || "kamu", profil: { hitap: hitap || "" },
    ayar: { otoKilit: 60, kurtarmaHatirlat: true, muhurHatirlat: true },
    sayac: 0, records: [], taslaklar: [], basvurular: [], sayacB: 0, taniklar: [], takipler: [], muhurler: [], gunluk: [],
    lastBackup: null, kurtarmaSon: nowIso(), olusturma: nowIso() };
}
function tamamla(d){
  const n = yeniVeri(d.sektor, (d.profil || {}).hitap);
  ["records", "taslaklar", "basvurular", "taniklar", "takipler", "muhurler", "gunluk"].forEach((k) => { if(!Array.isArray(d[k])) d[k] = n[k]; });
  d.ayar = Object.assign({}, n.ayar, d.ayar || {}); d.profil = d.profil || {};
  if(typeof d.sayac !== "number") d.sayac = d.records.reduce((m, r) => Math.max(m, r.no || 0), 0);
  if(typeof d.sayacB !== "number") d.sayacB = d.basvurular.length;
  return d;
}
function gunlukEkle(tur, metin){ if(!data) return; data.gunluk.push({ t: nowIso(), tur, metin }); if(data.gunluk.length > 300) data.gunluk = data.gunluk.slice(-300); }

/* ---------- 4. KAYDETME ----------
   O anki veri ve anahtar eş zamanlı olarak kopyalanır; böylece kayıt sırasında kilitlense bile son değişiklik kaybolmaz. */
function save(){
  if(!data || !dek || !meta) return saving;
  const snap = JSON.stringify(data), k = dek, m = JSON.parse(JSON.stringify(meta));
  saving = saving.then(async () => {
    const { iv, ct } = await encBytes(k, enc.encode(snap));
    await kvSet("kasa", { v: 3, pin: m.pin, kur: m.kur, veri: { iv: b64(iv), ct: b64(ct) } });
  }).catch(() => toast("Kaydedilemedi. Telefonda yer kalmamış olabilir.", "err"));
  return saving;
}

/* ---------- 5. GİRİŞ, KURULUM VE KURTARMA ---------- */
let ls = { ekran: "giris", buf: "", msg: "", msgCls: "", tmp: {} };
const failAll = () => lsGet(LS_FAIL, { pin: { n: 0, until: 0 }, kur: { n: 0, until: 0 }, log: [] });
function beklemeSuresi(n){ return n < 5 ? 0 : n === 5 ? 60 : n === 6 ? 300 : 1800; }
function failKaydet(tur){
  const f = failAll(); const c = f[tur] || { n: 0, until: 0 };
  c.n++; c.until = Date.now() + beklemeSuresi(c.n) * 1000; f[tur] = c;
  f.log = (f.log || []).concat({ t: nowIso(), tur }).slice(-100); lsSet(LS_FAIL, f);
  return c;
}
function failSifirla(tur){ const f = failAll(); f[tur] = { n: 0, until: 0 }; lsSet(LS_FAIL, f); }
function beklemeMetni(ms){ const s = Math.ceil(ms / 1000); return s >= 60 ? `${Math.ceil(s / 60)} dakika` : `${s} saniye`; }

const LOGO = `<div class="mono"><span>MKD</span><i></i></div>`;
function keypad(okAd){
  const k = (v, l, cls) => `<button type="button" class="key ${cls || ""}" data-key="${v}" aria-label="${l || v}">${l || v}</button>`;
  return `<div class="dots" aria-hidden="true">${Array.from({ length: Math.max(4, ls.buf.length) }, (_, i) => `<i class="${i < ls.buf.length ? "on" : ""}"></i>`).join("")}</div>
    <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => k(n)).join("")}${k("del", "Sil", "fn")}${k(0)}${k("ok", okAd || "Tamam", "fn ok")}</div>`;
}
function lockMsg(){ return `<p class="lmsg ${ls.msgCls}" role="status">${esc(ls.msg)}</p>`; }

function renderLock(){
  const L = $("lock"), e = ls.ekran;
  let h = "";
  if(e === "hosgeldin"){
    h = `<div class="lpanel wide">${LOGO}
      <h1>Mobbing Kayıt Defteri</h1>
      <p class="lsub">İşyerinde yaşadıklarını tarih, kişi ve tanıklarıyla düzenli, sistematik ve güvenilir biçimde kayıt altına al.</p>
      <ul class="lfeat">
        <li><b>Değiştirilemez kayıt.</b> Kesinleşen kayıt numaralanır ve kilitlenir; düzeltmeler tarihli ek olarak tutulur.</li>
        <li><b>Yalnızca bu telefonda, şifreli.</b> Hiçbir sunucuya veri gönderilmez.</li>
        <li><b>Süre takibi ve rapor.</b> Başvuru sürelerini hesaplar, mahkemeye sunulabilir düzende dosya hazırlar.</li>
      </ul>
      <label class="lcheck"><input type="checkbox" id="l-kvkk"> <span><button type="button" class="llink" data-lact="kvkkOku">KVKK bilgilendirmesini</button> okudum, kişisel verilerimin yalnızca bu cihazda işlenmesini onaylıyorum.</span></label>
      <button class="lbtn" type="button" data-lact="basla" id="l-basla" disabled>Başla</button>
      ${lockMsg()}</div>`;
  } else if(e === "kvkk"){
    h = `<div class="lpanel wide doctext"><button class="llink" type="button" data-lact="geri">‹ Geri</button><h2>KVKK bilgilendirmesi</h2><div class="lkvkk"></div>
      <button class="lbtn" type="button" data-lact="geri">Okudum</button></div>`;
  } else if(e === "profil"){
    h = `<div class="lpanel wide">${LOGO}<h2>Seni tanıyalım</h2>
      <p class="lsub">Rehber ve süre hesapları buna göre ayarlanır. Sonradan değiştirebilirsin.</p>
      <div class="lseg" role="group" aria-label="Çalıştığın yer">
        <button type="button" data-lact="sek" data-v="kamu" aria-pressed="${ls.tmp.sektor !== "ozel"}">Kamu</button>
        <button type="button" data-lact="sek" data-v="ozel" aria-pressed="${ls.tmp.sektor === "ozel"}">Özel sektör</button></div>
      <label class="lfield"><span>Sana nasıl hitap edelim? <small>(isteğe bağlı)</small></span><input id="l-hitap" autocomplete="off" value="${esc(ls.tmp.hitap || "")}" placeholder="Örn. Süleyman"></label>
      <button class="lbtn" type="button" data-lact="profilTamam">Devam</button></div>`;
  } else if(["pin1", "pin2", "giris", "yenipin1", "yenipin2"].includes(e)){
    const t = { pin1: ["PIN belirle", "4 ile 8 rakam arasında, tahmin edilmesi zor bir PIN seç."], pin2: ["PIN'i tekrar gir", "Doğrulamak için aynı PIN'i yeniden gir."],
      giris: [ls.tmp.hitap ? `Merhaba, ${ls.tmp.hitap}` : "Mobbing Kayıt Defteri", "Devam etmek için PIN'ini gir."],
      yenipin1: ["Yeni PIN belirle", "Kurtarma cevabın doğrulandı. Yeni PIN'ini belirle."], yenipin2: ["Yeni PIN'i tekrar gir", ""] }[e];
    h = `<div class="lpanel">${LOGO}<h2>${esc(t[0])}</h2><p class="lsub">${esc(t[1])}</p>${keypad(e === "giris" ? "Aç" : "Tamam")}${lockMsg()}
      ${e === "giris" ? `<button class="llink" type="button" data-lact="unuttum">PIN'imi unuttum</button>` : ""}
      ${e === "pin1" || e === "pin2" ? `<button class="llink" type="button" data-lact="geriProfil">‹ Geri</button>` : ""}</div>`;
  } else if(e === "kurtarmaKur" || e === "kurtarmaZorunlu"){
    h = `<div class="lpanel wide">${LOGO}<h2>Kurtarma sorusu</h2>
      <p class="lsub">${e === "kurtarmaZorunlu" ? "Bu sürümde PIN'ini unutursan kayıtlarına kurtarma sorusuyla ulaşabilirsin. Devam etmeden önce bir soru belirle." : "PIN'ini unutursan bu soruyla kayıtlarını açıp yeni PIN belirlersin."}</p>
      <label class="lfield"><span>Soru</span><input id="l-soru" autocomplete="off" placeholder="Örn. En sevdiğim içecek" value="${esc(ls.tmp.soru || "")}"></label>
      <label class="lfield"><span>Cevap</span><input id="l-cevap" type="password" autocomplete="off"></label>
      <label class="lfield"><span>Cevabı tekrar yaz</span><input id="l-cevap2" type="password" autocomplete="off"></label>
      <p class="lhint">Büyük-küçük harf ve Türkçe karakter farkı önemsenmez: "Kahve", "KAHVE" ve "kahve" aynı kabul edilir. Soru giriş ekranında görünür; cevabı başkasının tahmin edemeyeceği bir şey seç ve kimseyle paylaşma.</p>
      <button class="lbtn" type="button" data-lact="kurtarmaKaydet">${e === "kurtarmaZorunlu" ? "Kaydet ve devam et" : "Defteri oluştur"}</button>${lockMsg()}
      ${e === "kurtarmaKur" ? `<button class="llink" type="button" data-lact="geriPin">‹ PIN'i yeniden belirle</button>` : ""}</div>`;
  } else if(e === "kurtarma"){
    const soru = ls.tmp.soru;
    h = `<div class="lpanel wide">${LOGO}<h2>PIN'imi unuttum</h2>
      ${soru ? `<p class="lsub">Kurtarma sorunu cevapla, sonra yeni PIN belirle. Kayıtların yerinde kalır.</p>
        <div class="lsoru">${esc(soru)}</div>
        <label class="lfield"><span>Cevap</span><input id="l-kcevap" type="password" autocomplete="off"></label>
        <button class="lbtn" type="button" data-lact="kurtarmaDene">Doğrula</button>`
      : `<p class="lsub">Bu defter için kurtarma sorusu belirlenmemiş. Kayıtlar PIN olmadan açılamaz.</p>`}
      ${lockMsg()}
      <details class="lmore"><summary>Cevabı da hatırlamıyorum</summary><p>Kayıtlar şifreli olduğu için PIN ya da kurtarma cevabı olmadan kimse açamaz; uygulamada sıfırlama düğmesi bilerek bulunmaz, böylece telefonu ele geçiren biri kayıtlarını silemez. Yedek dosyan varsa yeni bir telefonda ya da defteri yeniden kurduktan sonra yedeği aldığın PIN ile geri yükleyebilirsin. Defteri tamamen sıfırlamak için iPhone'da Ayarlar › Safari › Gelişmiş › Web Sitesi Verileri bölümünden bu sitenin verilerini sil.</p></details>
      <button class="llink" type="button" data-lact="giriseDon">‹ PIN ile giriş</button></div>`;
  } else if(e === "bekle"){
    h = `<div class="lpanel">${LOGO}<h2>${esc(ls.tmp.baslik || "Hazırlanıyor")}</h2><div class="spin"></div><p class="lsub">${esc(ls.tmp.alt || "Şifreleme anahtarı oluşturuluyor, birkaç saniye sürebilir.")}</p></div>`;
  }
  L.innerHTML = h;
  if(e === "kvkk") L.querySelector(".lkvkk").appendChild($("tpl-kvkk").content.cloneNode(true));
  const f = L.querySelector("input:not([type=checkbox])"); if(f && !("ontouchstart" in window)) f.focus();
}
function setMsg(m, cls){ ls.msg = m || ""; ls.msgCls = cls || ""; }

async function showLock(){
  $("app").hidden = true; $("lock").hidden = false; $("curtain").hidden = true;
  const kasa = await kvGet("kasa").catch(() => null);
  ls.buf = ""; setMsg();
  if(kasa){ ls.ekran = "giris"; ls.tmp = { soru: kasa.kur ? kasa.kur.soru : "", hitap: lsGet("mkd-hitap", "") }; }
  else { ls.ekran = lsGet(LS_KVKK, false) ? "profil" : "hosgeldin"; ls.tmp = { sektor: "kamu" }; }
  renderLock();
}

function kolayPin(p){ return /^(\d)\1+$/.test(p) || "01234567890".includes(p) || "98765432109".includes(p); }

async function keyPress(v){
  if(v === "del"){ ls.buf = ls.buf.slice(0, -1); setMsg(); return renderLock(); }
  if(v !== "ok"){ if(ls.buf.length < 8){ ls.buf += v; setMsg(); } renderLock(); return; }
  const pin = ls.buf, e = ls.ekran;
  if(!/^\d{4,8}$/.test(pin)){ setMsg("PIN 4 ile 8 rakam arasında olmalı.", "err"); return renderLock(); }
  if(e === "pin1" || e === "yenipin1"){
    if(kolayPin(pin)){ ls.buf = ""; setMsg("Bu PIN çok kolay tahmin edilir. Başka bir PIN seç.", "err"); return renderLock(); }
    ls.tmp.pin = pin; ls.buf = ""; ls.ekran = e === "pin1" ? "pin2" : "yenipin2"; setMsg(); return renderLock();
  }
  if(e === "pin2" || e === "yenipin2"){
    if(pin !== ls.tmp.pin){ ls.buf = ""; ls.tmp.pin = ""; ls.ekran = e === "pin2" ? "pin1" : "yenipin1"; setMsg("İki PIN aynı değil, baştan gir.", "err"); return renderLock(); }
    ls.buf = "";
    if(e === "pin2"){ ls.ekran = "kurtarmaKur"; setMsg(); return renderLock(); }
    return yeniPinKaydet(pin);
  }
  if(e === "giris") return tryUnlock(pin);
}

async function tryUnlock(pin){
  const f = failAll();
  if(Date.now() < f.pin.until){ ls.buf = ""; setMsg(`Çok fazla yanlış deneme. ${beklemeMetni(f.pin.until - Date.now())} bekle.`, "err"); return renderLock(); }
  ls.ekran = "bekle"; ls.tmp.baslik = "Açılıyor"; ls.tmp.alt = "Kayıtların çözülüyor…"; renderLock();
  const kasa = await kvGet("kasa");
  try {
    if(kasa.v === 3){
      dekRaw = await unwrapDek(pin, kasa.pin);
      const r = await openVeri(dekRaw, kasa); dek = r.k; data = tamamla(r.d); meta = { pin: kasa.pin, kur: kasa.kur || null };
    } else {
      const eski = await openKasaEski(pin, kasa);
      await eskiSurumdenTasi(pin, eski);
    }
  } catch(e){
    dek = null; dekRaw = null; data = null; meta = null;
    const c = failKaydet("pin"); const w = beklemeSuresi(c.n);
    ls.ekran = "giris"; ls.buf = ""; setMsg(w ? `PIN yanlış. ${beklemeMetni(w * 1000)} bekle.` : `PIN yanlış.${c.n >= 3 ? ` (${c.n}. yanlış deneme)` : ""}`, "err"); return renderLock();
  }
  failSifirla("pin");
  girisSonrasi();
}
function girisSonrasi(){
  // Kilitliyken yapılan yanlış denemeleri kayıt altına al ve kullanıcıya göster
  const f = failAll(), log = f.log || [];
  if(log.length){
    const pinN = log.filter((x) => x.tur === "pin").length, kurN = log.filter((x) => x.tur === "kur").length;
    const metin = `${log.length} yanlış deneme (PIN: ${pinN}, kurtarma sorusu: ${kurN}). İlki ${trStamp(log[0].t)}, sonuncusu ${trStamp(log[log.length - 1].t)}.`;
    gunlukEkle("deneme", metin); bildirim = { cls: "warn", baslik: "Son girişinden bu yana yanlış deneme yapıldı", metin };
    f.log = []; lsSet(LS_FAIL, f);
  }
  gunlukEkle("giris", "Defter açıldı");
  lsSet("mkd-hitap", (data.profil && data.profil.hitap) || "");
  if(!meta.kur){ ls.ekran = "kurtarmaZorunlu"; ls.tmp = {}; setMsg(); renderLock(); return; }
  save(); enterApp();
}
async function eskiSurumdenTasi(pin, eski){
  dekRaw = crypto.getRandomValues(new Uint8Array(32)); dek = await importDek(dekRaw);
  const d = eski.data, sorted = (d.records || []).slice().sort((a, b) => (a.kayitZamani || "").localeCompare(b.kayitZamani || ""));
  const nd = yeniVeri(d.sektor, (d.profil || {}).hitap); nd.profil = Object.assign(nd.profil, d.profil || {});
  for(const r of sorted){
    const belgeler = [];
    for(const f of r.fotolar || []){
      try { const rec = await fotoGet(f.id); if(!rec) continue; const plain = await decBytes(eski.key, rec.iv, rec.ct); const e2 = await encBytes(dek, plain); await fotoPut(f.id, { iv: e2.iv, ct: e2.ct, tur: "img", mime: "image/jpeg" }); belgeler.push({ id: f.id, ad: f.ad || "", tur: "img", eklenme: f.eklenme || r.kayitZamani }); } catch(e){}
    }
    nd.sayac++;
    nd.records.push({ id: r.id || uid("k"), no: nd.sayac, olayZamani: r.olayZamani, yer: r.yer || "", kisi: r.kisi || "", rol: r.rol || "", kategori: r.kategori || "k0", davranis: r.davranis || r.tur || "",
      siddet: r.siddet || 0, ne: r.ne || "", soz: r.soz || "", tanikIds: [], tanikAd: r.tanik || "", kanit: r.kanit || "", etkiIs: r.etkiIs || "", etkiSaglik: r.etkiSaglik || r.etki || "",
      belgeler, taslakBaslangic: r.kayitZamani, kesinlesme: r.kayitZamani, oncekiSurum: true, sonDuzenleme: r.duzenlenme || null, ekler: [], geriCekme: null, gonderimler: [] });
  }
  (d.basvurular || []).forEach((a) => {
    const map = { kurum: "sikayet", isveren: "isveren", cimer: "cimer", alo170: "alo170", kdk: "kdk", tihek: "tihek", etik: "etik", tbmm: "tbmm", sendika: "sendika", avukat: "avukat", arabulucu: "arabulucu", savcilik: "savcilik" };
    nd.sayacB++;
    const g = [];
    if(a.cevapTarihi || a.sonuc) g.push({ id: uid("g"), t: a.kayitZamani || nowIso(), tarih: a.cevapTarihi || a.tarih, tur: a.durum === "Sonuçlandı" ? "sonuc" : "not", metin: a.sonuc || "" });
    if(a.not) g.push({ id: uid("g"), t: a.kayitZamani || nowIso(), tarih: a.tarih, tur: "not", metin: a.not });
    nd.basvurular.push({ id: a.id || uid("b"), no: nd.sayacB, tur: map[a.kurum] || "diger", kurum: "", tarih: a.tarih, sayi: a.sayi || "", konu: a.konu || "", sure: a.sure || 30, belgeler: [], kayitZamani: a.kayitZamani || nowIso(), gelismeler: g, geriCekme: a.durum === "Geri çekildi" ? { t: nowIso(), gerekce: "Önceki sürümde geri çekildi olarak işaretlenmişti." } : null });
  });
  nd.lastBackup = d.lastBackup || null;
  data = nd; meta = { pin: await wrapDek(pin, dekRaw), kur: null };
  gunlukEkle("guncelleme", `Defter MKD sürümüne taşındı (${nd.records.length} kayıt, ${nd.basvurular.length} başvuru).`);
}

async function kurtarmaKaydet(){
  const soru = ($("l-soru").value || "").trim(), c1 = $("l-cevap").value, c2 = $("l-cevap2").value;
  ls.tmp.soru = soru;
  if(!soru){ setMsg("Bir soru yaz.", "err"); return renderLock(); }
  if(!normCevap(c1)){ setMsg("Cevabı yaz.", "err"); return renderLock(); }
  if(normCevap(c1) !== normCevap(c2)){ setMsg("İki cevap aynı değil.", "err"); return renderLock(); }
  const zorunlu = ls.ekran === "kurtarmaZorunlu";
  ls.ekran = "bekle"; ls.tmp.baslik = zorunlu ? "Kaydediliyor" : "Defter oluşturuluyor"; ls.tmp.alt = "Şifreleme anahtarları oluşturuluyor, birkaç saniye sürebilir."; renderLock();
  try {
    if(!zorunlu){
      dekRaw = crypto.getRandomValues(new Uint8Array(32)); dek = await importDek(dekRaw);
      data = yeniVeri(ls.tmp.sektor, ls.tmp.hitap);
      meta = { pin: await wrapDek(ls.tmp.pin, dekRaw), kur: null };
      gunlukEkle("kurulum", "Defter oluşturuldu");
    }
    const w = await wrapDek(normCevap(c1), dekRaw); w.soru = soru; meta.kur = w;
    data.kurtarmaSon = nowIso(); gunlukEkle("kurtarma", "Kurtarma sorusu belirlendi");
    lsSet("mkd-hitap", (data.profil && data.profil.hitap) || "");
    await save(); ls.tmp = {};
    enterApp();
  } catch(e){ ls.ekran = zorunlu ? "kurtarmaZorunlu" : "kurtarmaKur"; setMsg("Telefon kayda izin vermedi. Gizli sekmede değilsen tekrar dene.", "err"); renderLock(); }
}
async function kurtarmaDene(){
  const f = failAll();
  if(Date.now() < f.kur.until){ setMsg(`Çok fazla yanlış deneme. ${beklemeMetni(f.kur.until - Date.now())} bekle.`, "err"); return renderLock(); }
  const cevap = normCevap($("l-kcevap").value);
  if(!cevap){ setMsg("Cevabı yaz.", "err"); return renderLock(); }
  ls.ekran = "bekle"; ls.tmp.baslik = "Doğrulanıyor"; ls.tmp.alt = ""; renderLock();
  const kasa = await kvGet("kasa");
  try {
    dekRaw = await unwrapDek(cevap, kasa.kur);
    const r = await openVeri(dekRaw, kasa); dek = r.k; data = tamamla(r.d); meta = { pin: kasa.pin, kur: kasa.kur };
  } catch(e){
    dekRaw = null; const c = failKaydet("kur"); const w = beklemeSuresi(c.n);
    ls.ekran = "kurtarma"; setMsg(w ? `Cevap uyuşmadı. ${beklemeMetni(w * 1000)} bekle.` : "Cevap uyuşmadı.", "err"); return renderLock();
  }
  failSifirla("kur"); ls.ekran = "yenipin1"; ls.buf = ""; setMsg(); renderLock();
}
async function yeniPinKaydet(pin){
  ls.ekran = "bekle"; ls.tmp.baslik = "Kaydediliyor"; renderLock();
  meta.pin = await wrapDek(pin, dekRaw); failSifirla("pin");
  gunlukEkle("pin", "PIN, kurtarma sorusuyla yenilendi");
  data.kurtarmaSon = nowIso(); ls.tmp = {};
  girisSonrasi();
}

$("lock").addEventListener("click", (ev) => {
  const k = ev.target.closest("[data-key]"); if(k){ keyPress(k.dataset.key); return; }
  const a = ev.target.closest("[data-lact]"); if(!a) return;
  const act = a.dataset.lact;
  if(act === "kvkkOku"){ ls.ekran = "kvkk"; renderLock(); window.scrollTo(0, 0); }
  else if(act === "geri"){ ls.ekran = "hosgeldin"; renderLock(); }
  else if(act === "basla"){ lsSet(LS_KVKK, true); ls.ekran = "profil"; renderLock(); }
  else if(act === "sek"){ ls.tmp.sektor = a.dataset.v; ls.tmp.hitap = $("l-hitap").value; renderLock(); }
  else if(act === "profilTamam"){ ls.tmp.hitap = $("l-hitap").value.trim(); ls.ekran = "pin1"; ls.buf = ""; setMsg(); renderLock(); }
  else if(act === "geriProfil"){ ls.ekran = "profil"; ls.buf = ""; setMsg(); renderLock(); }
  else if(act === "geriPin"){ ls.ekran = "pin1"; ls.buf = ""; ls.tmp.pin = ""; setMsg(); renderLock(); }
  else if(act === "kurtarmaKaydet") kurtarmaKaydet();
  else if(act === "unuttum"){ ls.ekran = "kurtarma"; setMsg(); renderLock(); }
  else if(act === "kurtarmaDene") kurtarmaDene();
  else if(act === "giriseDon"){ ls.ekran = "giris"; ls.buf = ""; setMsg(); renderLock(); }
});
$("lock").addEventListener("change", (ev) => { if(ev.target.id === "l-kvkk") $("l-basla").disabled = !ev.target.checked; });
$("lock").addEventListener("keydown", (ev) => {
  if(ev.key === "Enter"){ const b = $("lock").querySelector(".lbtn"); if(b && ev.target.tagName === "INPUT") b.click(); }
});
document.addEventListener("keydown", (ev) => {
  if($("lock").hidden || !["pin1", "pin2", "giris", "yenipin1", "yenipin2"].includes(ls.ekran)) return;
  if(/^\d$/.test(ev.key)) keyPress(ev.key); else if(ev.key === "Backspace") keyPress("del"); else if(ev.key === "Enter") keyPress("ok");
});

const fotoCache = new Map();
function lock(){
  if(data && dek) save();
  data = null; dek = null; if(dekRaw) dekRaw.fill(0); dekRaw = null; meta = null; bildirim = null;
  fotoCache.forEach((u) => URL.revokeObjectURL(u)); fotoCache.clear();
  $("view").textContent = ""; $("print").textContent = "";
  showLock();
}
$("lockBtn").addEventListener("click", lock);

/* ---------- 6. TARİH VE SÜRE HESAPLARI ----------
   Tarihler "YYYY-AA-GG" metni olarak tutulur; hesaplar saat dilimi kaymasın diye UTC'de yapılır. */
const s2d = (s) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const d2s = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (s, n) => { const d = s2d(s); d.setUTCDate(d.getUTCDate() + n); return d2s(d); };
function addMonths(s, n){
  const d = s2d(s), day = d.getUTCDate(); const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(day, last)); return d2s(t);
}
const daysBetween = (a, b) => Math.round((s2d(b) - s2d(a)) / 86400000);
const haftaSonu = (s, cumartesiIs) => { const g = s2d(s).getUTCDay(); return g === 0 || (!cumartesiIs && g === 6); };
const tamTatil = (s) => !!(TATIL[s] && TATIL[s][0] === 1);
const isGunu = (s, cumartesiIs) => !haftaSonu(s, cumartesiIs) && !tamTatil(s);
function uzat(s){ let x = s, n = 0; while(!isGunu(x) && n < 20){ x = addDays(x, 1); n++; } return x; }
function addIsGunu(s, n, cumartesiIs){ let x = s, c = 0; while(c < n){ x = addDays(x, 1); if(isGunu(x, cumartesiIs)) c++; } return x; }
function adliTatilde(s){ const md = s.slice(5); return md >= "07-20" && md <= "08-31"; }
// Son gün: tatile denk gelirse ilk iş gününe uzar; idari dava sürelerinde adli tatil kuralı da uygulanır
function sonGun(ham, opt){
  opt = opt || {}; let s = ham; const notlar = [];
  if(opt.adli && adliTatilde(s)){ s = s.slice(0, 4) + "-09-07"; notlar.push("Son gün adli tatile denk geldiği için tatilin bitiminden itibaren 7 gün uzadı (İYUK md. 61)."); }
  const u = uzat(s); if(u !== s) notlar.push(`Son gün (${trDate(s)}) tatil ya da hafta sonu olduğu için ilk iş gününe uzadı.`);
  if(TATIL[u] && TATIL[u][0] === 0.5) notlar.push("Son gün arife: öğleden sonra resmî tatildir, işlemini sabahtan yap.");
  if(+u.slice(0, 4) > TATIL_SON_YIL) notlar.push(`${TATIL_SON_YIL} sonrası resmî tatiller hesaba katılmadı.`);
  return { son: u, notlar };
}
function sure(ad, ham, kaynak, opt){
  const r = sonGun(ham, opt); return { ad, son: r.son, kaynak: kaynak || "", not: [(opt && opt.not) || ""].concat(r.notlar).filter(Boolean).join(" "), yasal: !(opt && opt.takip) };
}
// "Ne oldu?" türüne göre son günleri üretir
function sureHesapla(tur, t){
  const L = [];
  if(tur === "basvurdum"){
    L.push(sure("İdarenin cevap vermesi gereken son gün", addDays(t, 30), "3071 s.K. md. 7 · İYUK md. 10"));
    L.push(sure("Cevap gelmezse dava açma son günü", addDays(addDays(t, 30), 60), "İYUK md. 10", { adli: true, not: "30 gün içinde cevap verilmezse istek reddedilmiş sayılır; 60 günlük dava süresi bu tarihten başlar." }));
    L.push(sure("Cevap gelmezse Kamu Denetçiliği Kurumu'na başvuru son günü", addMonths(addDays(t, 60), 6), "6328 s.K. md. 17", { not: "İdare 60 gün içinde cevap vermezse bu sürenin bitiminden itibaren 6 ay." }));
  } else if(tur === "red"){
    L.push(sure("İptal / tam yargı davası açma son günü", addDays(t, 60), "İYUK md. 7", { adli: true }));
    L.push(sure("Kamu Denetçiliği Kurumu'na başvuru son günü", addMonths(t, 6), "6328 s.K. md. 17", { not: "Dava süresi içinde yapılan başvuru dava süresini durdurur." }));
  } else if(tur === "disiplin"){
    L.push(sure("Disiplin cezasına itiraz son günü", addDays(t, 7), "657 s.K. md. 135", { not: "Süresinde itiraz edilmeyen ceza kesinleşir." }));
    L.push(sure("İptal davası (genel süre) son günü", addDays(t, 60), "İYUK md. 7", { adli: true, not: "İtiraz ettiysen dava süresi itirazın sonucuna göre değişebilir; avukatına sor." }));
  } else if(tur === "sikayetkarar"){
    L.push(sure("Şikâyet kararına itiraz son günü", addDays(t, 10), "Şikâyet ve Müracaatlar Yönetmeliği"));
  } else if(tur === "bilgired"){
    L.push(sure("Bilgi Edinme Değerlendirme Kurulu'na itiraz son günü", addDays(t, 15), "4982 s.K. md. 13", { not: "Kurula itiraz, idari yargıya başvuru süresini durdurur." }));
  } else if(tur === "suc"){
    L.push(sure("Savcılığa şikâyet son günü (şikâyete bağlı suçlar)", addMonths(t, 6), "TCK md. 73", { not: "Fiili ve faili öğrendiğin günden itibaren 6 ay. Tehdit gibi bazı suçlar şikâyete bağlı değildir." }));
  } else if(tur === "fesih"){
    L.push({ ad: "Haklı nedenle fesih: 6 iş günü", son: addIsGunu(t, 6, true), kaynak: "İş K. md. 26", not: "Temkinli hesap: cumartesi iş günü sayıldı. Süre öğrenmeden itibaren işler; süreklilik gösteren davranışlarda son olaydan başladığı kabul edilir.", yasal: true });
    L.push(sure("Haklı nedenle fesih: her hâlde 1 yıl", addMonths(t, 12), "İş K. md. 26", { not: "Olaydan itibaren 1 yıl geçtikten sonra fesih hakkı kullanılamaz." }));
  }
  return L;
}
// Başvurunun gelişmelerine göre son günleri üretir
function basvuruSureleri(b){
  const tur = turBul(b.tur), G = b.gelismeler || [];
  const kapandi = !!b.geriCekme || G.some((g) => g.tur === "sonuc");
  const cevaplandi = G.some((g) => ["olumlu", "olumsuz", "sonuc"].includes(g.tur));
  const L = [];
  const cevapHam = tur.isg ? addIsGunu(b.tarih, +b.sure || tur.sure) : addDays(b.tarih, +b.sure || tur.sure);
  const c = tur.isg ? { ad: "", son: cevapHam, kaynak: tur.kaynak, not: tur.bilgi, yasal: tur.yasal } : sure("", cevapHam, tur.kaynak, { not: tur.bilgi, takip: !tur.yasal });
  c.ad = tur.yasal ? "Cevap / karar için yasal son gün" : "Takip süresi"; c.tamam = cevaplandi; L.push(c);
  const kamu = data.sektor === "kamu";
  if(tur.zimni && kamu && !cevaplandi){
    L.push(sure("Cevap gelmezse dava açma son günü", addDays(addDays(b.tarih, 30), 60), "İYUK md. 10", { adli: true, not: "30 gün içinde cevap verilmezse istek reddedilmiş sayılır ve dava süresi başlar." }));
    L.push(sure("Cevap gelmezse KDK'ya başvuru son günü", addMonths(addDays(b.tarih, 60), 6), "6328 s.K. md. 17"));
  }
  const red = G.filter((g) => g.tur === "olumsuz").slice(-1)[0];
  if(red){
    if(kamu && (tur.zimni || tur.k === "itiraz")) L.push(...sureHesapla("red", red.tarih));
    if(tur.k === "sikayet") L.push(...sureHesapla("sikayetkarar", red.tarih));
    if(tur.k === "bilgi") L.push(...sureHesapla("bilgired", red.tarih));
  }
  L.forEach((x) => { if(kapandi) x.tamam = true; });
  return L;
}
function kalanGun(son){ return daysBetween(today(), son); }
function sureDurum(x){
  if(x.tamam) return { cls: "done", txt: "Tamamlandı" };
  const k = kalanGun(x.son);
  if(k < 0) return { cls: "past", txt: `${-k} gün önce doldu` };
  if(k === 0) return { cls: "crit", txt: "Bugün son gün" };
  if(k <= 3) return { cls: "crit", txt: `${k} gün kaldı` };
  if(k <= 14) return { cls: "soon", txt: `${k} gün kaldı` };
  return { cls: "ok", txt: `${k} gün kaldı` };
}
function tumSureler(){
  const out = [];
  data.basvurular.forEach((b) => basvuruSureleri(b).forEach((x) => out.push(Object.assign({ kaynakAd: `B-${pad(b.no, 3)} · ${turBul(b.tur).ad}`, git: ["basvuru", b.id] }, x))));
  data.takipler.forEach((t) => sureHesapla(t.tur, t.tarih).forEach((x) => out.push(Object.assign({ kaynakAd: (HESAP_TURLERI.find((h) => h.k === t.tur) || {}).ad + (t.not ? " · " + t.not : ""), git: ["takip", t.id] }, x))));
  return out.sort((a, b) => a.son.localeCompare(b.son));
}

/* ---------- 7. KAYIT KURALLARI ----------
   Kesinleşen kayıt değiştirilmez ve silinmez. Yalnızca ek/düzeltme, gönderim notu ve geri çekme işareti eklenebilir. */
const aktifKayitlar = () => data.records.filter((r) => !r.geriCekme);
const kayitSirali = (R) => R.slice().sort((a, b) => (a.olayZamani || "").localeCompare(b.olayZamani || "") || a.no - b.no);
const kayitBul = (id) => data.records.find((r) => r.id === id);
const taslakBul = (id) => data.taslaklar.find((r) => r.id === id);
const tanikBul = (id) => data.taniklar.find((t) => t.id === id);
function yeniTaslak(){
  const t = { id: uid("t"), olusturma: nowIso(), guncelleme: nowIso(), adim: 0, olayTarih: today(), olaySaat: nowTime(), yer: "", kisi: "", rol: "",
    kategori: "k1", davranis: "", davranisDiger: "", siddet: 0, ne: "", soz: "", tanikIds: [], kanit: "", etkiIs: "", etkiSaglik: "", belgeler: [] };
  data.taslaklar.push(t); return t;
}
function taslakDavranis(t){ return t.davranis === "__diger" ? (t.davranisDiger || "").trim() : t.davranis; }
function taslakEksik(t){
  const e = [];
  if(!t.olayTarih || !t.olaySaat) e.push("olay tarihi ve saati");
  if(`${t.olayTarih}T${t.olaySaat}` > `${today()}T${nowTime()}`) e.push("ileri bir tarih girilemez");
  if(!(t.kisi || "").trim()) e.push("davranışı yapan kişi");
  if(!taslakDavranis(t)) e.push("davranış");
  if(!(t.ne || "").trim()) e.push("olayın anlatımı");
  return e;
}
function kesinlestir(t){
  data.sayac = (data.sayac || 0) + 1;
  const r = { id: uid("k"), no: data.sayac, olayZamani: `${t.olayTarih}T${t.olaySaat}`, yer: t.yer.trim(), kisi: t.kisi.trim(), rol: t.rol.trim(),
    kategori: t.kategori, davranis: taslakDavranis(t), siddet: t.siddet || 0, ne: t.ne.trim(), soz: t.soz.trim(),
    tanikIds: t.tanikIds.slice(), tanikAd: t.tanikIds.map((id) => (tanikBul(id) || {}).ad).filter(Boolean).join(", "),
    kanit: t.kanit.trim(), etkiIs: t.etkiIs.trim(), etkiSaglik: t.etkiSaglik.trim(), belgeler: t.belgeler.slice(),
    taslakBaslangic: t.olusturma, kesinlesme: nowIso(), ekler: [], geriCekme: null, gonderimler: [] };
  data.records.push(r); data.taslaklar = data.taslaklar.filter((x) => x.id !== t.id);
  return r;
}
function gecikme(r){
  const g = daysBetween(r.olayZamani.slice(0, 10), localDateOf(r.kesinlesme));
  return g <= 0 ? { cls: "ok", txt: "Olay günü kaydedildi" } : { cls: g <= 3 ? "soon" : "past", txt: `Olaydan ${g} gün sonra kaydedildi` };
}

/* ---------- 8. SİSTEMATİKLİK ---------- */
function weekKey(s){ const d = s2d(s); const g = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - g); return d2s(d); }
function sistematik(R){
  R = kayitSirali(R);
  if(!R.length) return null;
  const ilk = R[0].olayZamani.slice(0, 10), son = R[R.length - 1].olayZamani.slice(0, 10);
  const gun = daysBetween(ilk, son) + 1;
  const hSet = new Set(R.map((r) => weekKey(r.olayZamani)));
  const hSpan = Math.floor(daysBetween(weekKey(ilk), weekKey(son)) / 7) + 1;
  let seri = 0, enUzun = 0; for(let w = weekKey(ilk); w <= weekKey(son); w = addDays(w, 7)){ if(hSet.has(w)){ seri++; enUzun = Math.max(enUzun, seri); } else seri = 0; }
  const grup = {}; R.forEach((r) => { grup[r.kategori] = (grup[r.kategori] || 0) + 1; });
  const dav = {}; R.forEach((r) => { if(r.davranis) dav[r.davranis] = (dav[r.davranis] || 0) + 1; });
  const sv = R.filter((r) => r.siddet), yarim = Math.floor(sv.length / 2);
  const ort = (a) => a.length ? a.reduce((x, r) => x + r.siddet, 0) / a.length : 0;
  const trend = sv.length >= 4 ? ort(sv.slice(yarim)) - ort(sv.slice(0, yarim)) : null;
  return { n: R.length, ilk, son, gun, hafta: hSet.size, hSpan, oran: hSet.size / hSpan, enUzun, grup, dav, trend, ortSiddet: ort(sv),
    sureYuzde: Math.min(1, gun / 182), siklikYuzde: hSet.size / hSpan, tanikli: R.filter((r) => r.tanikIds.length || r.tanikAd).length,
    belgeli: R.filter((r) => r.belgeler.length || r.kanit).length, ayniGun: R.filter((r) => gecikme(r).cls === "ok").length };
}
function kisiBazli(R){
  const m = {}; R.forEach((r) => { (m[r.kisi] = m[r.kisi] || []).push(r); });
  return Object.entries(m).map(([k, L]) => ({ kisi: k, rol: L[L.length - 1].rol, s: sistematik(L) })).sort((a, b) => b.s.n - a.s.n);
}

/* ---------- 9. BELGELER (fotoğraf ve PDF) ---------- */
function processImage(file){
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const max = 2000, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob((b) => b ? res(b) : rej(new Error("dönüştürülemedi")), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("okunamadı")); };
    img.src = url;
  });
}
// Dosyaları şifreleyip depoya koyar; belge bilgilerini döndürür
async function belgeleriAl(files){
  const out = [];
  for(const f of files){
    try {
      const pdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      if(pdf && f.size > 20 * 1024 * 1024){ toast("PDF 20 MB'tan büyük olamaz.", "err"); continue; }
      const blob = pdf ? f : await processImage(f);
      const id = uid("f"), e = await encBytes(dek, await blob.arrayBuffer());
      await fotoPut(id, { iv: e.iv, ct: e.ct, tur: pdf ? "pdf" : "img", mime: pdf ? "application/pdf" : "image/jpeg" });
      out.push({ id, ad: pdf ? f.name.replace(/\.pdf$/i, "") : "", tur: pdf ? "pdf" : "img", eklenme: nowIso(), boyut: blob.size });
    } catch(e){ toast("Bir dosya okunamadı.", "err"); }
  }
  return out;
}
async function belgeBlob(id){
  const rec = await fotoGet(id); if(!rec || !dek) return null;
  const buf = await decBytes(dek, rec.iv, rec.ct);
  return new Blob([buf], { type: rec.mime || (rec.tur === "pdf" ? "application/pdf" : "image/jpeg") });
}
async function belgeUrl(id){
  if(fotoCache.has(id)) return fotoCache.get(id);
  try { const b = await belgeBlob(id); if(!b) return null; const u = URL.createObjectURL(b); fotoCache.set(id, u); return u; } catch(e){ return null; }
}
async function belgeDataUrl(id){ const b = await belgeBlob(id); if(!b) return null; return "data:image/jpeg;base64," + b64(await b.arrayBuffer()); }
async function belgeAc(id, ad, tur){
  const u = await belgeUrl(id); if(!u) return toast("Belge açılamadı.", "err");
  if(tur === "pdf"){ const w = window.open(u, "_blank"); if(!w){ const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); } return; }
  $("viewerImg").src = u; $("viewerCap").textContent = ad || ""; $("viewer").hidden = false;
}
$("viewerClose").addEventListener("click", () => { $("viewer").hidden = true; $("viewerImg").src = ""; });
async function hydrateImgs(root){
  for(const img of (root || document).querySelectorAll("img[data-foto]")){ const u = await belgeUrl(img.dataset.foto); if(u) img.src = u; img.removeAttribute("data-foto"); }
}
function tumBelgeIdleri(d){
  d = d || data; const ids = [];
  d.records.forEach((r) => { r.belgeler.forEach((b) => ids.push(b.id)); (r.ekler || []).forEach((e) => (e.belgeler || []).forEach((b) => ids.push(b.id))); });
  d.taslaklar.forEach((t) => t.belgeler.forEach((b) => ids.push(b.id)));
  d.basvurular.forEach((b) => { (b.belgeler || []).forEach((x) => ids.push(x.id)); (b.gelismeler || []).forEach((g) => (g.belgeler || []).forEach((x) => ids.push(x.id))); });
  return ids;
}

/* ---------- 10. PAYLAŞIM, E-POSTA, TAKVİM ---------- */
async function shareFile(name, content, mime, text){
  const file = new File([content], name, { type: mime });
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try { await navigator.share({ files: [file], title: name, text: text || undefined }); return "shared"; }
    catch(e){ if(e && e.name === "AbortError") return "cancel"; }
  }
  const url = URL.createObjectURL(file), a = document.createElement("a"); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 15000);
  return "downloaded";
}
async function shareText(title, text){
  if(navigator.share){ try { await navigator.share({ title, text }); return "shared"; } catch(e){ if(e && e.name === "AbortError") return "cancel"; } }
  try { await navigator.clipboard.writeText(text); return "copied"; } catch(e){ return "fail"; }
}
function mailAc(to, subject, body){
  const u = `mailto:${encodeURIComponent(to || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 7000))}`;
  window.location.href = u;
}
function icsDosya(L){
  const st = (s) => s.replace(/-/g, ""), now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const ev = L.map((x, i) => [
    "BEGIN:VEVENT", `UID:mkd-${st(x.son)}-${i}-${Math.random().toString(36).slice(2, 8)}@mkd`, `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${st(x.son)}`, `DTEND;VALUE=DATE:${st(addDays(x.son, 1))}`,
    `SUMMARY:${icsEsc("Son gün: " + x.ad)}`, `DESCRIPTION:${icsEsc((x.kaynakAd ? x.kaynakAd + ". " : "") + (x.kaynak ? "Dayanak: " + x.kaynak + ". " : "") + (x.not || ""))}`,
    "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc("3 gün kaldı: " + x.ad)}`, "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc("Yarın son gün: " + x.ad)}`, "END:VALARM",
    "END:VEVENT"].join("\r\n")).join("\r\n");
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MKD//TR\r\nCALSCALE:GREGORIAN\r\n${ev}\r\nEND:VCALENDAR\r\n`;
}
function icsEsc(s){ return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
async function takvimeEkle(L){
  const r = await shareFile(`mkd-sure-${today()}.ics`, icsDosya(L), "text/calendar");
  if(r !== "cancel") toast("Takvim dosyası hazır. Açınca iPhone Takvim'e eklenir.");
}

/* ---------- 11. YEDEK ---------- */
async function yedekAl(){
  data.lastBackup = nowIso(); gunlukEkle("yedek", "Yedek alındı"); await save();
  const fotolar = [];
  for(const id of tumBelgeIdleri()){ const r = await fotoGet(id); if(r) fotolar.push({ id, iv: b64(r.iv), ct: b64(r.ct), tur: r.tur || "img", mime: r.mime || "image/jpeg" }); }
  const yedek = { tur: "mkd-yedek", v: 3, olusturma: data.lastBackup, kasa: await kvGet("kasa"), fotolar };
  return shareFile(`mkd-yedek-${today()}.json`, JSON.stringify(yedek), "application/json");
}
// Yedek, mevcut kayıtların üzerine yazmaz. Boş deftere tamamen, dolu deftere yalnızca eksikleri ekler.
async function yedekYukle(file, secret, cevapMi){
  const j = JSON.parse(await file.text());
  const kasa = j.kasa || j; let gelen, gelenKey;
  if(kasa.v === 3){
    const raw = await unwrapDek(cevapMi ? normCevap(secret) : secret, cevapMi ? kasa.kur : kasa.pin);
    const r = await openVeri(raw, kasa); gelen = tamamla(r.d); gelenKey = r.k;
  } else {
    const e = await openKasaEski(secret, kasa);
    gelen = await eskiYedegiDonustur(e, j);
    return yedekBirlestir(gelen, null, j, true);
  }
  return yedekBirlestir(gelen, gelenKey, j, false);
}
async function eskiYedegiDonustur(eski, j){
  // Eski sürüm yedeği: fotoğraflar eski anahtarla çözülüp bu defterin anahtarıyla şifrelenir
  const fmap = new Map((j.fotolar || []).map((x) => [x.id, x]));
  const d = eski.data, sorted = (d.records || []).slice().sort((a, b) => (a.kayitZamani || "").localeCompare(b.kayitZamani || ""));
  const nd = yeniVeri(d.sektor, (d.profil || {}).hitap); nd.profil = Object.assign(nd.profil, d.profil || {});
  for(const r of sorted){
    const belgeler = [];
    for(const f of r.fotolar || []){
      const src = fmap.get(f.id); if(!src) continue;
      try { const plain = await decBytes(eski.key, unb64(src.iv), unb64(src.ct)); const e2 = await encBytes(dek, plain); await fotoPut(f.id, { iv: e2.iv, ct: e2.ct, tur: "img", mime: "image/jpeg" }); belgeler.push({ id: f.id, ad: f.ad || "", tur: "img", eklenme: f.eklenme || r.kayitZamani }); } catch(e){}
    }
    nd.sayac++;
    nd.records.push({ id: r.id || uid("k"), no: nd.sayac, olayZamani: r.olayZamani, yer: r.yer || "", kisi: r.kisi || "", rol: r.rol || "", kategori: r.kategori || "k0", davranis: r.davranis || r.tur || "",
      siddet: r.siddet || 0, ne: r.ne || "", soz: r.soz || "", tanikIds: [], tanikAd: r.tanik || "", kanit: r.kanit || "", etkiIs: r.etkiIs || "", etkiSaglik: r.etkiSaglik || r.etki || "",
      belgeler, taslakBaslangic: r.kayitZamani, kesinlesme: r.kayitZamani, oncekiSurum: true, ekler: [], geriCekme: null, gonderimler: [] });
  }
  return nd;
}
async function yedekBirlestir(gelen, gelenKey, j, fotolarHazir){
  const fmap = new Map((j.fotolar || []).map((x) => [x.id, x]));
  const kopyala = async (ids) => {
    if(fotolarHazir) return;
    for(const id of ids){ const src = fmap.get(id); if(!src) continue; if(await fotoGet(id)) continue;
      const plain = await decBytes(gelenKey, unb64(src.iv), unb64(src.ct)); const e2 = await encBytes(dek, plain);
      await fotoPut(id, { iv: e2.iv, ct: e2.ct, tur: src.tur || "img", mime: src.mime || "image/jpeg" }); }
  };
  if(!data.records.length && !data.basvurular.length){
    // Boş defter: yedek olduğu gibi geri yüklenir (numaralar korunur)
    await kopyala(tumBelgeIdleri(gelen));
    const profil = Object.assign({}, gelen.profil, data.profil.ad ? data.profil : {});
    const g = data.gunluk; data = gelen; data.profil = profil; data.gunluk = (gelen.gunluk || []).concat(g);
    gunlukEkle("geriYukleme", `Yedekten geri yüklendi: ${data.records.length} kayıt, ${data.basvurular.length} başvuru.`);
    await save(); return { tam: true, k: data.records.length, b: data.basvurular.length };
  }
  const ids = new Set(data.records.map((r) => r.id)), nos = new Map(data.records.map((r) => [r.no, r.id]));
  const yeni = gelen.records.filter((r) => !ids.has(r.id));
  const cakisan = yeni.filter((r) => nos.has(r.no));
  if(cakisan.length) throw Object.assign(new Error("cakisma"), { kod: "cakisma" });
  const yeniB = gelen.basvurular.filter((b) => !data.basvurular.some((x) => x.id === b.id));
  const yeniT = gelen.taniklar.filter((t) => !data.taniklar.some((x) => x.id === t.id));
  await kopyala(yeni.flatMap((r) => r.belgeler.map((b) => b.id).concat((r.ekler || []).flatMap((e) => (e.belgeler || []).map((b) => b.id)))).concat(yeniB.flatMap((b) => (b.belgeler || []).map((x) => x.id))));
  data.records = data.records.concat(yeni); data.basvurular = data.basvurular.concat(yeniB); data.taniklar = data.taniklar.concat(yeniT);
  data.sayac = Math.max(data.sayac, ...data.records.map((r) => r.no));
  data.sayacB = Math.max(data.sayacB, ...data.basvurular.map((b) => b.no || 0), 0);
  gunlukEkle("geriYukleme", `Yedekten ${yeni.length} kayıt, ${yeniB.length} başvuru eklendi.`);
  await save(); return { tam: false, k: yeni.length, b: yeniB.length };
}

/* ---------- 12. GİZLİLİK PERDESİ, OTOMATİK KİLİT, BAŞLATMA ---------- */
let hiddenAt = 0, bildirim = null;
function onHide(){ if(data){ $("curtain").hidden = false; hiddenAt = Date.now(); save(); if(data.ayar.otoKilit === 0) lock(); } }
document.addEventListener("visibilitychange", () => {
  if(document.hidden) return onHide();
  if(!data) return;
  if(Date.now() - hiddenAt > (data.ayar.otoKilit ?? 60) * 1000) lock(); else $("curtain").hidden = true;
});
window.addEventListener("pagehide", onHide);
["gesturestart", "gesturechange", "gestureend"].forEach((ev) => document.addEventListener(ev, (e) => {
  if(!e.target.closest || !e.target.closest("#viewer")) e.preventDefault();
}, { passive: false }));

let tema = Object.assign({ mod: "auto", boyut: 16 }, lsGet(LS_TEMA, {}));
const darkMQ = window.matchMedia("(prefers-color-scheme: dark)");
function applyTheme(){
  const dark = tema.mod === "dark" || (tema.mod === "auto" && darkMQ.matches);
  document.documentElement.dataset.mode = dark ? "dark" : "light";
  document.documentElement.style.fontSize = (tema.boyut || 16) + "px";
}
darkMQ.addEventListener?.("change", applyTheme);

document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  if(!window.crypto || !crypto.subtle || !window.indexedDB){ document.body.innerHTML = "<p style='padding:24px;font-family:system-ui'>Bu uygulama yalnızca güvenli (https) bağlantıda ve güncel bir tarayıcıda çalışır.</p>"; return; }
  try {
    const v1 = lsGet("defter-kasa-v1", null);   // ilk sürümden kalan veri
    if(v1 && !(await kvGet("kasa"))){ await kvSet("kasa", Object.assign({ iter: 250000 }, v1)); localStorage.removeItem("defter-kasa-v1"); }
  } catch(e){}
  showLock();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
});
