"use strict";
/* =====================================================================
   MKD · Sayfalar ve eylemler
   Her sayfa: { t: başlık, parent: geri gidilecek sayfa, tab: alt menü, r(): HTML, after(): bağlama }
   Düğmeler data-act ile, alanlar data-f ile çalışır.
   ===================================================================== */

let cur = { p: "ozet", id: null }, ui = { surecSeg: "sureler", zamanF: "hepsi", kSearch: "", kKisi: "", kGrup: "", rehberSek: null, yedekCevap: false, acik: "" };
let sonOlusan = null;

/* ---------- Küçük parçalar ---------- */
const ic = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 14h6M9 18h4"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  time: '<svg viewBox="0 0 24 24"><path d="M12 3v18M6 7h6M12 12h6M6 17h6"/><circle cx="12" cy="7" r="1"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0M16 4a3.5 3.5 0 0 1 0 7M18 21a7 7 0 0 0-3-5.7"/></svg>',
  print: '<svg viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>',
  seal: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  cog: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>'
};
const chip = (t, cls) => `<span class="chip ${cls || ""}">${esc(t)}</span>`;
const card = (title, inner, extra) => `<section class="card">${title ? `<div class="card-h"><h3>${title}</h3>${extra || ""}</div>` : ""}${inner}</section>`;
const kpi = (big, small, cls) => `<div class="kpi ${cls || ""}"><b>${big}</b><span>${small}</span></div>`;
const empty = (t, s, btn) => `<div class="empty"><b>${t}</b><span>${s}</span>${btn || ""}</div>`;
const field = (lb, inner, hint) => `<label class="field"><span class="lb">${lb}</span>${inner}${hint ? `<span class="hint">${hint}</span>` : ""}</label>`;
const inp = (f, v, attrs) => `<input data-f="${f}" value="${esc(v)}" ${attrs || ""}>`;
const ta = (f, v, attrs) => `<textarea data-f="${f}" ${attrs || ""}>${esc(v)}</textarea>`;
const navRow = (p, icon, t, s, extra) => `<button type="button" class="row" data-act="git" data-p="${p}"${extra || ""}><span class="ri">${ic[icon]}</span><span class="rt">${t}${s ? `<small>${s}</small>` : ""}</span><span class="rc">${ic.chev}</span></button>`;
const meter = (lb, v, txt) => `<div class="meter"><div class="mh"><span>${lb}</span><b>${txt}</b></div><div class="mt"><i style="width:${Math.round(Math.min(1, v) * 100)}%"></i></div></div>`;
function seg(group, val, opts){ return `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" data-act="seg" data-g="${group}" data-v="${v}" aria-pressed="${String(v) === String(val)}">${l}</button>`).join("")}</div>`; }
function opts(list, val){ return list.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(val) ? " selected" : ""}>${esc(l)}</option>`).join(""); }
const uniqVals = (k) => [...new Set(data.records.map((r) => r[k]).concat(data.taslaklar.map((t) => t[k])).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr"));
const datalist = (id, vals) => `<datalist id="${id}">${vals.map((v) => `<option value="${esc(v)}">`).join("")}</datalist>`;
const sevBar = (s) => `<span class="sev s${s || 0}" title="${SEV_AD[s || 0]}"></span>`;
const belgeSay = (r) => r.belgeler.length + (r.ekler || []).reduce((a, e) => a + (e.belgeler || []).length, 0);

function belgeGrid(L, opt){
  if(!L || !L.length) return "";
  return `<div class="belgeler">${L.map((b) => `<div class="belge"><button type="button" data-act="belgeAc" data-id="${b.id}" data-tur="${b.tur}" data-ad="${esc(b.ad)}" aria-label="Belgeyi aç">
    ${b.tur === "pdf" ? `<span class="pdf">${ic.doc}<small>PDF</small></span>` : `<img data-foto="${b.id}" alt="">`}</button>
    ${opt && opt.edit ? `<input data-belge-ad="${b.id}" value="${esc(b.ad)}" placeholder="Açıklama">
      <button type="button" class="x" data-act="belgeKaldir" data-id="${b.id}" aria-label="Kaldır">✕</button>` : (b.ad ? `<span class="cap">${esc(b.ad)}</span>` : "")}</div>`).join("")}</div>`;
}
const belgeEkleBtn = (hedef, etiket) => `<button type="button" class="btn soft" data-act="belgeSec" data-hedef="${hedef}">${ic.cam}${etiket || "Fotoğraf ya da PDF ekle"}</button>`;

function recCard(r){
  const k = katBul(r.kategori), nb = belgeSay(r), nt = r.tanikIds.length || (r.tanikAd ? r.tanikAd.split(",").length : 0);
  return `<button type="button" class="rec${r.geriCekme ? " withdrawn" : ""}" data-act="git" data-p="kayit" data-id="${r.id}">
    ${sevBar(r.siddet)}<span class="rec-b">
    <span class="rec-h"><span class="no">${noStr(r.no)}</span><span class="when">${trDate(r.olayZamani)} · ${r.olayZamani.slice(11, 16)}</span></span>
    <span class="rec-who">${esc(r.kisi)}${r.rol ? `<small> · ${esc(r.rol)}</small>` : ""}</span>
    <span class="rec-what">${esc(r.davranis || k.kisa)}</span>
    <span class="rec-f">${chip(k.kisa, "acc")}${nt ? chip(nt + " tanık") : ""}${nb ? chip(nb + " belge") : ""}${(r.ekler || []).length ? chip(r.ekler.length + " ek", "gold") : ""}${r.geriCekme ? chip("Geri çekildi", "warn") : ""}</span>
    </span></button>`;
}
function sureCard(x){
  const d = sureDurum(x), k = kalanGun(x.son);
  return `<div class="sure ${d.cls}"><div class="sn"><b>${x.tamam ? "✓" : k < 0 ? "–" : k}</b><small>${x.tamam ? "" : k < 0 ? "doldu" : "gün"}</small></div>
    <div class="sb"><b>${esc(x.ad)}</b><span>${trLong(x.son)}</span>${x.kaynakAd ? `<span class="src">${esc(x.kaynakAd)}</span>` : ""}
    ${x.kaynak ? `<span class="law">${esc(x.kaynak)}${x.yasal ? "" : " · takip süresi"}</span>` : ""}${x.not ? `<span class="nt">${esc(x.not)}</span>` : ""}
    <span class="st">${d.txt}</span></div>${x.git ? `<button type="button" class="go" data-act="git" data-p="${x.git[0]}" data-id="${x.git[1]}" aria-label="Aç">${ic.chev}</button>` : ""}</div>`;
}
function basvuruDurum(b){
  if(b.geriCekme) return { t: "Geri çekildi", c: "warn" };
  const G = b.gelismeler || [], son = G.filter((g) => g.tur !== "not" && g.tur !== "ek").slice(-1)[0];
  if(son) return { sonuc: { t: "Sonuçlandı", c: "ok" }, olumsuz: { t: "Olumsuz cevap", c: "warn" }, olumlu: { t: "Olumlu cevap", c: "ok" }, bekletici: { t: "İnceleniyor", c: "amber" } }[son.tur] || { t: "Bekliyor", c: "amber" };
  return { t: "Cevap bekleniyor", c: "amber" };
}

/* ---------- Sayfalar ---------- */
const P = {};

/* ÖZET */
P.ozet = { t: "Özet", tab: "ozet", r(){
  const R = aktifKayitlar(), p = data.profil, h = new Date().getHours();
  const ad = p.hitap || (p.ad || "").split(" ")[0] || "";
  const buAy = R.filter((r) => r.olayZamani.slice(0, 7) === today().slice(0, 7)).length;
  const w26 = new Set(); const sinir = addDays(weekKey(today()), -25 * 7); R.forEach((r) => { const w = weekKey(r.olayZamani); if(w >= sinir) w26.add(w); });
  const S = tumSureler().filter((x) => !x.tamam && kalanGun(x.son) >= 0);
  let o = "";
  if(bildirim) o += `<div class="alert ${bildirim.cls}"><b>${esc(bildirim.baslik)}</b><span>${esc(bildirim.metin)}</span><button type="button" class="btn ghost small" data-act="bildirimKapat">Anladım</button></div>`;
  o += `<div class="hero"><p class="date">${trLong(today())}</p><h2>${h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar"}${ad ? ", " + esc(ad) : ""}</h2>
    <p>${R.length ? `Defterinde ${R.length} kesinleşmiş kayıt var. Son kayıt ${noStr(data.sayac)}.` : "Henüz kayıt yok. Yaşadığın ilk olayı hemen kaydet; aynı gün tutulan kayıt daha güçlüdür."}</p>
    <button type="button" class="cta" data-act="git" data-p="yeni">${ic.plus}<span>Yeni kayıt<small>Adım adım, 2 dakikada</small></span></button></div>`;
  o += `<div class="kpis">${kpi(R.length, "kesin kayıt")}${kpi(buAy, "bu ay")}${kpi(`${w26.size}<small>/26</small>`, "olaylı hafta")}${kpi(S.length, "açık süre", S.some((x) => kalanGun(x.son) <= 3) ? "crit" : "")}</div>`;
  if(data.taslaklar.length) o += card("Tamamlanmamış taslaklar", `<div class="list">${data.taslaklar.map((t) => `<button type="button" class="row" data-act="taslakAc" data-id="${t.id}"><span class="ri">${ic.pen}</span><span class="rt">${esc(t.kisi || "Kişi girilmedi")} · ${trDate(t.olayTarih)}<small>Taslak · ${trStamp(t.olusturma)} tarihinde başlandı. Kesinleştirilmeden kayıt sayılmaz.</small></span><span class="rc">${ic.chev}</span></button>`).join("")}</div>`);
  if(S.length) o += card("Yaklaşan süreler", S.slice(0, 3).map(sureCard).join(""), `<button type="button" class="link" data-act="git" data-p="surecler">Tümü</button>`);
  const hat = [];
  const sonM = data.muhurler.slice(-1)[0], muhursuz = data.records.filter((r) => r.no > (sonM ? sonM.sonNo : 0)).length;
  if(data.ayar.muhurHatirlat && muhursuz && (!sonM || daysBetween(localDateOf(sonM.t), today()) >= 30 || (sonM && localDateOf(sonM.t).slice(0, 7) !== today().slice(0, 7) && muhursuz >= 1)))
    hat.push(["muhur", "seal", "Kayıtlarını mühürle", `${muhursuz} kayıt henüz dışarıya gönderilmedi. Mühürleyip kendine e-postayla gönder.`]);
  if(R.length && (!data.lastBackup || daysBetween(localDateOf(data.lastBackup), today()) > 7)) hat.push(["yedek", "save", "Yedek almanın zamanı", data.lastBackup ? `Son yedek ${trStamp(data.lastBackup)}` : "Henüz hiç yedek almadın."]);
  if(data.ayar.kurtarmaHatirlat && daysBetween(localDateOf(data.kurtarmaSon || data.olusturma), today()) >= 30) hat.push(["kurtarma-dene", "shield", "Kurtarma cevabını hatırlıyor musun?", "Kısa bir denemeyle PIN'ini unuttuğunda kayıtlarına ulaşabileceğinden emin ol."]);
  if(!(p.ad && p.unvan)) hat.push(["profil", "user", "Profilini tamamla", "Ad, unvan ve kurum bilgilerin rapor ve dilekçelere otomatik yazılır."]);
  if(hat.length) o += card("Hatırlatmalar", `<div class="list">${hat.map(([pg, i, t, s]) => navRow(pg, i, t, s)).join("")}</div>`);
  const s = sistematik(R);
  if(s) o += card("Sistematiklik", `${meter("Süre <small>(Leymann: en az 6 ay)</small>", s.sureYuzde, `${s.gun} gün`)}${meter("Sıklık <small>(en az haftada bir)</small>", s.siklikYuzde, `${s.hafta}/${s.hSpan} hafta`)}`, `<button type="button" class="link" data-act="git" data-p="sistematik">Ayrıntı</button>`);
  const son = kayitSirali(data.records).reverse().slice(0, 3);
  if(son.length) o += card("Son kayıtlar", `<div class="recs">${son.map(recCard).join("")}</div>`, `<button type="button" class="link" data-act="git" data-p="kayitlar">Tümü</button>`);
  return o;
} };

/* KAYITLAR */
P.kayitlar = { t: "Kayıtlar", tab: "kayitlar", r(){
  if(!data.records.length && !data.taslaklar.length) return empty("Henüz kayıt yok", "İlk olayı ortadaki + düğmesiyle ekle. Kesinleşen her kayıt sıra numarası alır ve kilitlenir.", `<button type="button" class="btn" data-act="git" data-p="yeni">${ic.plus}Yeni kayıt</button>`);
  const kisiler = uniqVals("kisi").filter((k) => data.records.some((r) => r.kisi === k));
  let o = `<div class="search"><input type="search" id="k-ara" placeholder="Kayıtlarda ara: isim, söz, yer…" value="${esc(ui.kSearch)}"></div>
    <div class="filters"><select id="k-kisi"><option value="">Herkes</option>${opts(kisiler.map((k) => [k, k]), ui.kKisi)}</select>
    <select id="k-grup"><option value="">Tüm gruplar</option>${opts(KATEGORILER.map((c) => [c.k, c.kisa]), ui.kGrup)}</select></div>`;
  if(data.taslaklar.length) o += `<div class="drafts">${data.taslaklar.map((t) => `<button type="button" class="draft" data-act="taslakAc" data-id="${t.id}"><b>Taslak</b><span>${esc(t.kisi || "Kişi girilmedi")} · ${trDate(t.olayTarih)}</span><small>Kesinleştirilmedi</small></button>`).join("")}</div>`;
  o += `<div id="k-list"></div>`;
  return o;
}, after(){ kayitListesi(); } };
function kayitListesi(){
  const q = ui.kSearch.trim().toLocaleLowerCase("tr");
  const L = kayitSirali(data.records).reverse().filter((r) => (!ui.kKisi || r.kisi === ui.kKisi) && (!ui.kGrup || r.kategori === ui.kGrup) &&
    (!q || [r.kisi, r.rol, r.yer, r.ne, r.soz, r.tanikAd, r.kanit, r.davranis, noStr(r.no), (r.ekler || []).map((e) => e.metin).join(" ")].join(" ").toLocaleLowerCase("tr").includes(q)));
  const box = $("k-list"); if(!box) return;
  box.innerHTML = `<p class="note">${L.length} kayıt · numaralar kesintisizdir (1–${data.sayac})</p><div class="recs">${L.map(recCard).join("") || empty("Sonuç yok", "Bu aramaya uyan kayıt bulunamadı.")}</div>`;
}

/* KAYIT AYRINTISI */
P.kayit = { t: "Kayıt", parent: "kayitlar", title(){ const r = kayitBul(cur.id); return r ? noStr(r.no) : "Kayıt"; }, r(){
  const r = kayitBul(cur.id); if(!r) return empty("Kayıt bulunamadı", "");
  const k = katBul(r.kategori), g = gecikme(r), yeni = sonOlusan === r.id;
  let o = "";
  if(yeni) o += `<div class="alert ok"><b>${noStr(r.no)} kesinleşti ve kilitlendi</b><span>Şimdi bir kopyasını kendine e-postayla gönder. Gönderim tarihi e-posta sağlayıcının kayıtlarında tutulur ve kaydın o gün var olduğunu destekler.</span></div>`;
  o += `<section class="card rec-detail${r.geriCekme ? " withdrawn" : ""}">
    <div class="rd-top"><span class="no big">${noStr(r.no)}</span>${r.geriCekme ? chip("Geri çekildi", "warn") : `<span class="locked">${ic.lock}Kilitli</span>`}</div>
    <h2 class="rd-when">${trLong(r.olayZamani)} · ${r.olayZamani.slice(11, 16)}</h2>
    <div class="rec-f">${chip(g.txt, g.cls)}${chip(k.kisa, "acc")}${r.siddet ? chip("Şiddet " + r.siddet + " · " + SEV_AD[r.siddet], r.siddet >= 4 ? "warn" : r.siddet >= 3 ? "amber" : "") : ""}</div>
    <dl class="kv">
      <dt>Kişi</dt><dd>${esc(r.kisi)}${r.rol ? ` <small>(${esc(r.rol)})</small>` : ""}</dd>
      ${r.yer ? `<dt>Yer</dt><dd>${esc(r.yer)}</dd>` : ""}
      <dt>Davranış</dt><dd>${esc(r.davranis)}<small class="block">${esc(k.ad)}</small></dd>
      <dt>Olayın anlatımı</dt><dd class="pre">${esc(r.ne)}</dd>
      ${r.soz ? `<dt>Aynen söylenen söz</dt><dd class="quote">“${esc(r.soz)}”</dd>` : ""}
      ${r.tanikAd ? `<dt>Tanıklar</dt><dd>${esc(r.tanikAd)}</dd>` : ""}
      ${r.kanit ? `<dt>Diğer kanıtlar</dt><dd>${esc(r.kanit)}</dd>` : ""}
      ${r.etkiIs ? `<dt>İşine etkisi</dt><dd>${esc(r.etkiIs)}</dd>` : ""}
      ${r.etkiSaglik ? `<dt>Sağlığına etkisi</dt><dd>${esc(r.etkiSaglik)}</dd>` : ""}
    </dl>${belgeGrid(r.belgeler)}
    <div class="stamps"><span>Taslak başlangıcı: <b>${trStamp(r.taslakBaslangic)}</b></span><span>Kesinleşme: <b>${trStamp(r.kesinlesme)}</b></span>
    ${r.oncekiSurum ? `<span class="warnline">Bu kayıt MKD öncesindeki sürümde oluşturuldu; o sürümde kayıtlar düzenlenebiliyordu.${r.sonDuzenleme ? " Son düzenleme: " + trStamp(r.sonDuzenleme) : ""}</span>` : ""}</div>
    ${r.geriCekme ? `<div class="alert warn"><b>Geri çekildi · ${trStamp(r.geriCekme.t)}</b><span>Gerekçe: ${esc(r.geriCekme.gerekce)}</span></div>` : ""}
  </section>`;
  // Ekler
  o += card("Düzeltmeler ve ekler", (r.ekler.length ? `<ol class="tl">${r.ekler.map((e) => `<li><b>${e.tur === "duzeltme" ? "Düzeltme" : "Ek bilgi"} · ${trStamp(e.t)}</b><p class="pre">${esc(e.metin)}</p>${belgeGrid(e.belgeler)}</li>`).join("")}</ol>` : `<p class="note">Bu kayda eklenmiş düzeltme ya da ek yok. Asıl metin değiştirilemez; bir hata ya da eksik fark edersen buradan tarihli bir ek girebilirsin.</p>`) +
    (r.geriCekme ? "" : ui.acik === "ek" ? `<div class="subform">
      ${seg("ekTur", ui.ekTur || "ek", [["ek", "Ek bilgi"], ["duzeltme", "Düzeltme"]])}
      ${field("Metin", `<textarea id="e-metin" placeholder="Örn. Saat 14.00 değil 15.00'ti. / Bugün aynı konuda yazılı talimat geldi."></textarea>`)}
      ${belgeGrid(geciciBelge.ek || [], { edit: true })}${belgeEkleBtn("ek", "Belge ekle")}
      <p class="hint">Eklendikten sonra değiştirilemez; kendi tarihi ve saatiyle kayda bağlanır.</p>
      <div class="btns"><button type="button" class="btn" data-act="ekKaydet" data-confirm="Eklensin mi? Değiştirilemez">Ekle ve kilitle</button><button type="button" class="btn ghost" data-act="acKapa" data-v="">Vazgeç</button></div></div>`
    : `<button type="button" class="btn soft" data-act="acKapa" data-v="ek">${ic.pen}Düzeltme / ek gir</button>`));
  // Gönderim
  const G = r.gonderimler || [];
  o += card("Dışarıya kopya", `<p class="note">Kendine ya da güvendiğin bir kişiye gönderilen e-posta, kaydın o tarihte var olduğunu destekler.</p>
    <div class="btns col"><button type="button" class="btn" data-act="gonder" data-kime="kendim">${ic.mail}Kendime e-posta gönder</button>
    <button type="button" class="btn ghost" data-act="gonder" data-kime="guven">${ic.mail}${esc(data.profil.guvenAd ? data.profil.guvenAd + "'e gönder" : "Güvendiğim kişiye gönder")}</button>
    <button type="button" class="btn ghost" data-act="gonder" data-kime="paylas">${ic.share}Başka yolla paylaş</button></div>
    ${G.length ? `<ul class="mini">${G.map((x) => `<li>${trStamp(x.t)} · ${esc(x.kime)} · ${esc(x.yol)}</li>`).join("")}</ul>` : ""}`);
  // Süre
  const tck = sureHesapla("suc", r.olayZamani.slice(0, 10))[0];
  o += card("İlgili süre", `${sureCard(tck)}<p class="hint">Olay hakaret, tehdit gibi şikâyete bağlı bir suç oluşturuyorsa. Faili sonradan öğrendiysen süre o tarihten başlar.</p>
    <div class="btns"><button type="button" class="btn ghost small" data-act="takibeAl" data-tur="suc" data-tarih="${r.olayZamani.slice(0, 10)}" data-not="${noStr(r.no)}">Takibe ekle</button></div>`);
  if(!r.geriCekme) o += ui.acik === "geri" ? card("Kaydı geri çek", `<p class="note">Kayıt silinmez; "geri çekildi" olarak işaretlenir, numarası korunur ve raporda gerekçesiyle görünür. Bu işlem geri alınamaz.</p>
      ${field("Gerekçe", `<textarea id="g-gerekce" placeholder="Örn. Aynı olayı yanlışlıkla iki kez girdim (bkz. MKD-0012)."></textarea>`)}
      <div class="btns"><button type="button" class="btn danger" data-act="geriCek" data-confirm="Emin misin? Geri alınamaz">Geri çek</button><button type="button" class="btn ghost" data-act="acKapa" data-v="">Vazgeç</button></div>`)
    : `<button type="button" class="btn ghost danger block" data-act="acKapa" data-v="geri">Kaydı geri çek</button>`;
  return o;
}, after(){ hydrateImgs($("view")); } };
let geciciBelge = {};

/* YENİ KAYIT SİHİRBAZI */
const ADIMLAR = [
  { ad: "Ne zaman, nerede?", r(t){ return `${field("Tarih", `<input type="date" data-f="olayTarih" value="${t.olayTarih}" max="${today()}">`)}${field("Saat", `<input type="time" data-f="olaySaat" value="${t.olaySaat}">`)}
    ${field("Yer", inp("yer", t.yer, 'list="dl-yer" placeholder="Örn. müdür odası, koridor, WhatsApp grubu"'), "Olay yazışma ya da telefonla olduysa onu yaz.")}${datalist("dl-yer", uniqVals("yer"))}`; } },
  { ad: "Kim?", r(t){ return `${field("Davranışı yapan kişi", inp("kisi", t.kisi, 'list="dl-kisi" autocomplete="off" placeholder="Ad soyad"'))}${datalist("dl-kisi", uniqVals("kisi"))}
    ${field("Görevi / unvanı", inp("rol", t.rol, 'list="dl-rol" placeholder="Örn. birim sorumlusu, müdür"'))}${datalist("dl-rol", uniqVals("rol"))}
    <p class="hint">Birden fazla kişi varsa en belirleyici olanı yaz, diğerlerini anlatımda belirt.</p>`; } },
  { ad: "Ne tür bir davranış?", r(t){
    const k = katBul(t.kategori);
    return `<span class="lb">Grup <small>(Leymann sınıflaması)</small></span><div class="cats">${KATEGORILER.map((c) => `<button type="button" data-act="kat" data-v="${c.k}" aria-pressed="${c.k === t.kategori}"><b>${c.kisa}</b><small>${c.ad}</small></button>`).join("")}</div>
    ${field("Davranış", `<select data-f="davranis"><option value="">Seç…</option>${opts(k.dav.map((d) => [d, d]).concat([["__diger", "Diğer (kendim yazacağım)"]]), t.davranis)}</select>`)}
    ${t.davranis === "__diger" ? field("Kısaca yaz", inp("davranisDiger", t.davranisDiger)) : ""}
    <span class="lb">Şiddeti</span><div class="scale">${[1, 2, 3, 4, 5].map((v) => `<button type="button" data-act="siddet" data-v="${v}" aria-pressed="${t.siddet === v}"><b>${v}</b><small>${SEV_AD[v]}</small></button>`).join("")}</div>`; } },
  { ad: "Ne oldu?", r(t){ return `${field("Olayın anlatımı", ta("ne", t.ne, 'rows="7" placeholder="Ne yapıldı, ne istendi, sen ne cevap verdin? Yorum katmadan, olduğu gibi."'), "Kim, ne yaptı, ne dedi, sen ne yaptın: sırasıyla ve sade.")}
    ${field("Aynen söylenen söz", ta("soz", t.soz, 'rows="3" placeholder="Duyduğun gibi, kelimesi kelimesine"'), "Mahkemede en değerli kısımlardan biridir. Hatırladığın kadarını yaz.")}`; } },
  { ad: "Tanık ve belge", r(t){
    return `<span class="lb">Tanıklar <small>(olayı gören ya da duyan)</small></span>
    <div class="tchips">${data.taniklar.map((w) => `<button type="button" data-act="tanikSec" data-id="${w.id}" aria-pressed="${t.tanikIds.includes(w.id)}">${esc(w.ad)}${w.unvan ? `<small>${esc(w.unvan)}</small>` : ""}</button>`).join("") || `<span class="note">Henüz tanık eklenmedi.</span>`}</div>
    <div class="inline"><input id="w-yeni" placeholder="Yeni tanık adı" autocomplete="off"><button type="button" class="btn soft small" data-act="tanikHizli">Ekle</button></div>
    ${field("Diğer kanıtlar", inp("kanit", t.kanit, 'placeholder="Örn. görevlendirme yazısı sayı 123, e-posta, nöbet listesi"'))}
    <span class="lb">Belgeler <small>(ekran görüntüsü, yazı, PDF)</small></span>
    ${belgeGrid(t.belgeler, { edit: true })}${belgeEkleBtn("taslak")}
    <div class="warn small"><b>Üçüncü kişi bilgisi ekleme.</b> Görüntüde hasta adı, TC kimlik no ya da başkalarına ait kişisel bilgi varsa önce o kısmı kırp veya kapat. Fotoğrafların konum ve cihaz bilgileri silinir; PDF'ler olduğu gibi saklanır.</div>`; } },
  { ad: "Sende bıraktığı etki", r(t){ return `<p class="note">İsteğe bağlı. Zararın ispatında önemlidir.</p>
    ${field("İşine etkisi", inp("etkiIs", t.etkiIs, 'placeholder="Örn. görev yerim değişti, izin alamadım"'))}
    ${field("Sağlığına etkisi", inp("etkiSaglik", t.etkiSaglik, 'placeholder="Örn. uyuyamadım, doktora gittim"'), "Sağlık bilgisi özel nitelikli kişisel veridir; rapora eklenip eklenmeyeceğini rapor ekranında seçersin.")}`; } },
  { ad: "Gözden geçir ve kesinleştir", r(t){
    const e = taslakEksik(t), k = katBul(t.kategori);
    return `<dl class="kv review">
      <dt>Zaman</dt><dd>${t.olayTarih ? trLong(t.olayTarih) : "–"} · ${esc(t.olaySaat)}</dd>${t.yer ? `<dt>Yer</dt><dd>${esc(t.yer)}</dd>` : ""}
      <dt>Kişi</dt><dd>${esc(t.kisi) || "–"}${t.rol ? ` <small>(${esc(t.rol)})</small>` : ""}</dd>
      <dt>Davranış</dt><dd>${esc(taslakDavranis(t)) || "–"}<small class="block">${esc(k.kisa)}${t.siddet ? " · Şiddet " + t.siddet : ""}</small></dd>
      <dt>Anlatım</dt><dd class="pre">${esc(t.ne) || "–"}</dd>${t.soz ? `<dt>Söz</dt><dd class="quote">“${esc(t.soz)}”</dd>` : ""}
      ${t.tanikIds.length ? `<dt>Tanıklar</dt><dd>${esc(t.tanikIds.map((id) => (tanikBul(id) || {}).ad).filter(Boolean).join(", "))}</dd>` : ""}
      ${t.kanit ? `<dt>Kanıt</dt><dd>${esc(t.kanit)}</dd>` : ""}${t.belgeler.length ? `<dt>Belge</dt><dd>${t.belgeler.length} dosya</dd>` : ""}
    </dl>
    ${e.length ? `<div class="alert warn"><b>Eksik bilgi</b><span>Kesinleştirmek için: ${esc(e.join(", "))}.</span></div>` : `<div class="alert gold"><b>Kesinleştirdiğinde</b><span>Kayda ${noStr(data.sayac + 1)} numarası verilir, kesinleşme anı yazılır ve kayıt kilitlenir. Sonradan yalnızca tarihli düzeltme ya da ek girebilirsin.</span></div>`}
    <div class="btns col"><button type="button" class="btn big" data-act="kesinlestir" ${e.length ? "disabled" : ""} data-confirm="Kilitlensin mi? Bu işlem geri alınamaz">${ic.lock}Kesinleştir ve kilitle</button>
    <button type="button" class="btn ghost" data-act="taslakBirak">Taslak olarak bırak</button>
    <button type="button" class="btn ghost danger" data-act="taslakSil" data-confirm="Taslak ve belgeleri silinsin mi?">Taslağı sil</button></div>
    <p class="hint">Taslak ${trStamp(t.olusturma)} tarihinde başlatıldı; bu an da kayda yazılır.</p>`; } }
];
P.yeni = { t: "Yeni kayıt", tab: "yeni", parent: null, r(){
  let t = taslakBul(cur.id); if(!t){ t = yeniTaslak(); cur.id = t.id; }
  const a = Math.min(t.adim || 0, ADIMLAR.length - 1), S = ADIMLAR[a];
  return `<div class="wiz"><div class="wz-h"><span>Adım ${a + 1} / ${ADIMLAR.length}</span><b>${S.ad}</b><div class="wz-bar"><i style="width:${(a + 1) / ADIMLAR.length * 100}%"></i></div></div>
    <div class="wz-steps">${ADIMLAR.map((x, i) => `<button type="button" data-act="adim" data-v="${i}" aria-current="${i === a}" aria-label="${x.ad}">${i + 1}</button>`).join("")}</div>
    <section class="card wz-b">${S.r(t)}</section>
    ${a < ADIMLAR.length - 1 ? `<div class="wz-nav">${a ? `<button type="button" class="btn ghost" data-act="adim" data-v="${a - 1}">Geri</button>` : `<span></span>`}<button type="button" class="btn" data-act="adim" data-v="${a + 1}">İleri</button></div>` : ""}
    <p class="hint center">Yazdıkların her adımda taslak olarak şifreli kaydedilir.</p></div>`;
}, after(){ hydrateImgs($("view")); } };
function wizTopla(){
  const t = taslakBul(cur.id); if(!t || cur.p !== "yeni") return t;
  $("view").querySelectorAll("[data-f]").forEach((n) => { t[n.dataset.f] = n.value; });
  $("view").querySelectorAll("[data-belge-ad]").forEach((n) => { const b = t.belgeler.find((x) => x.id === n.dataset.belgeAd); if(b) b.ad = n.value; });
  t.guncelleme = nowIso();
  return t;
}
const taslakBos = (t) => !t.kisi && !t.ne && !t.soz && !t.yer && !t.belgeler.length && !t.tanikIds.length && !t.kanit && !t.davranis;

/* SÜREÇLER */
P.surecler = { t: "Süreçler", tab: "surecler", r(){
  let o = seg("surecSeg", ui.surecSeg, [["sureler", "Süreler"], ["basvurular", "Başvurular"]]);
  if(ui.surecSeg === "sureler"){
    const S = tumSureler(), acik = S.filter((x) => !x.tamam && kalanGun(x.son) >= 0), gecmis = S.filter((x) => !x.tamam && kalanGun(x.son) < 0);
    o += `<div class="btns"><button type="button" class="btn" data-act="git" data-p="hesap">${ic.time}Süre hesapla</button>${acik.length ? `<button type="button" class="btn ghost" data-act="takvimTum">${ic.cal}Takvime ekle</button>` : ""}</div>`;
    o += acik.length ? acik.map(sureCard).join("") : empty("Açık süre yok", "Bir başvuru eklediğinde ya da süre hesapladığında son günler burada geri sayımla görünür.");
    if(data.sektor === "ozel"){ const R = kayitSirali(aktifKayitlar()), son = R[R.length - 1]; if(son) o += card("Son olaya göre", sureHesapla("fesih", son.olayZamani.slice(0, 10)).map(sureCard).join("") + `<p class="hint">Son kayıtlı olay: ${noStr(son.no)} (${trDate(son.olayZamani)}). Fesih kararını mutlaka avukatınla ver.</p>`); }
    if(gecmis.length) o += `<details class="doc"><summary>Süresi dolanlar (${gecmis.length})</summary><div class="body">${gecmis.map(sureCard).join("")}</div></details>`;
    o += `<p class="hint">Süreler genel kurallara göre hesaplanır; tebliğ tarihi, özel kanunlar ve somut durum sonucu değiştirebilir. Hak düşürücü süreler için avukatına danış.</p>`;
  } else {
    o += `<button type="button" class="btn" data-act="git" data-p="basvuru-yeni">${ic.plus}Yeni başvuru</button>`;
    const L = data.basvurular.slice().sort((a, b) => b.tarih.localeCompare(a.tarih));
    o += L.length ? `<div class="list cards">${L.map((b) => { const d = basvuruDurum(b), nx = basvuruSureleri(b).filter((x) => !x.tamam && kalanGun(x.son) >= 0)[0];
      return `<button type="button" class="app" data-act="git" data-p="basvuru" data-id="${b.id}"><span class="ah"><span class="no">B-${pad(b.no, 3)}</span>${chip(d.t, d.c)}</span>
        <b>${esc(turBul(b.tur).ad)}</b><span class="note">${trDate(b.tarih)}${b.kurum ? " · " + esc(b.kurum) : ""}${b.sayi ? " · No: " + esc(b.sayi) : ""}</span>${b.konu ? `<span>${esc(shorten(b.konu, 90))}</span>` : ""}
        ${nx ? `<span class="nx ${sureDurum(nx).cls}">${esc(nx.ad)}: ${sureDurum(nx).txt}</span>` : ""}</button>`; }).join("")}</div>`
      : empty("Henüz başvuru yok", "Verdiğin dilekçe ve şikâyetleri ekle; cevap ve dava sürelerini senin yerine takip ederim.");
  }
  return o;
} };
P["basvuru-yeni"] = { t: "Yeni başvuru", parent: "surecler", r(){
  const L = BASVURU_TURLERI.filter((x) => x.sek === "hepsi" || x.sek === data.sektor);
  const f = ui.bf || (ui.bf = { tur: L[0].k, kurum: "", tarih: today(), sayi: "", konu: "", sure: L[0].sure, not: "" });
  const tur = turBul(f.tur);
  return card("", `${field("Başvuru türü", `<select id="bf-tur">${opts(L.map((x) => [x.k, x.ad]), f.tur)}</select>`, esc(tur.bilgi) + (tur.kaynak ? ` <span class="law">${esc(tur.kaynak)}</span>` : ""))}
    ${field("Merci", `<input id="bf-kurum" value="${esc(f.kurum)}" placeholder="Örn. … Hastanesi Başhekimliği">`)}
    <div class="two">${field("Başvuru tarihi", `<input type="date" id="bf-tarih" value="${f.tarih}" max="${today()}">`)}${field("Evrak / başvuru no", `<input id="bf-sayi" value="${esc(f.sayi)}" placeholder="E-12345">`)}</div>
    ${field("Konu", `<textarea id="bf-konu" rows="3" placeholder="Örn. Birim sorumlusunun sözlü baskıları hakkında şikâyet">${esc(f.konu)}</textarea>`)}
    ${field(tur.isg ? "Cevap süresi (iş günü)" : "Cevap süresi (gün)", `<input type="number" inputmode="numeric" id="bf-sure" min="1" max="365" value="${f.sure}">`, tur.yasal ? "Yasal süre otomatik girildi." : "Takip için varsayılan süre; değiştirebilirsin.")}
    <span class="lb">Belgeler <small>(dilekçenin fotoğrafı, evrak kaydı, PDF)</small></span>${belgeGrid(geciciBelge.basvuru || [], { edit: true })}${belgeEkleBtn("basvuru")}
    ${field("Not", `<textarea id="bf-not" rows="2" placeholder="Örn. Yazı işlerine teslim ettim, görevli adı">${esc(f.not)}</textarea>`)}
    <p class="hint">Kaydedilen başvurunun temel bilgileri kilitlenir. Sonradan gelişmeler (cevap, itiraz, not) tarihleriyle eklenir.</p>
    <button type="button" class="btn block" data-act="basvuruKaydet">Başvuruyu kaydet</button>`);
}, after(){ hydrateImgs($("view")); } };
function bfTopla(){ if(!ui.bf || !$("bf-tur")) return; ["tur", "kurum", "tarih", "sayi", "konu", "sure", "not"].forEach((k) => { ui.bf[k] = $("bf-" + k).value; }); }

P.basvuru = { t: "Başvuru", parent: "surecler", title(){ const b = data.basvurular.find((x) => x.id === cur.id); return b ? "B-" + pad(b.no, 3) : "Başvuru"; }, r(){
  const b = data.basvurular.find((x) => x.id === cur.id); if(!b) return empty("Başvuru bulunamadı", "");
  const tur = turBul(b.tur), d = basvuruDurum(b), S = basvuruSureleri(b);
  let o = `<section class="card"><div class="rd-top"><span class="no big">B-${pad(b.no, 3)}</span>${chip(d.t, d.c)}</div><h2 class="rd-when">${esc(tur.ad)}</h2>
    <dl class="kv"><dt>Tarih</dt><dd>${trLong(b.tarih)}</dd>${b.kurum ? `<dt>Merci</dt><dd>${esc(b.kurum)}</dd>` : ""}${b.sayi ? `<dt>Evrak no</dt><dd>${esc(b.sayi)}</dd>` : ""}
    ${b.konu ? `<dt>Konu</dt><dd class="pre">${esc(b.konu)}</dd>` : ""}<dt>Dayanak</dt><dd>${esc(tur.kaynak || "–")}<small class="block">${esc(tur.bilgi)}</small></dd></dl>
    ${belgeGrid(b.belgeler)}<div class="stamps"><span>Kayda geçti: <b>${trStamp(b.kayitZamani)}</b></span></div>
    ${b.geriCekme ? `<div class="alert warn"><b>Geri çekildi · ${trStamp(b.geriCekme.t)}</b><span>${esc(b.geriCekme.gerekce)}</span></div>` : ""}</section>`;
  o += card("Süreler", S.map(sureCard).join("") + `<div class="btns"><button type="button" class="btn ghost small" data-act="takvimBasvuru">${ic.cal}Takvime ekle</button></div>`);
  const G = b.gelismeler || [];
  o += card("Gelişmeler", (G.length ? `<ol class="tl">${G.slice().sort((x, y) => x.tarih.localeCompare(y.tarih)).map((g) => `<li><b>${esc(gelismeBul(g.tur).ad)} · ${trDate(g.tarih)}</b>${g.metin ? `<p class="pre">${esc(g.metin)}</p>` : ""}${belgeGrid(g.belgeler)}<small>Kayda geçti: ${trStamp(g.t)}</small></li>`).join("")}</ol>` : `<p class="note">Henüz gelişme yok.</p>`) +
    (b.geriCekme ? "" : ui.acik === "gelisme" ? `<div class="subform">${field("Ne oldu?", `<select id="gl-tur">${opts(GELISME_TURLERI.map((x) => [x.k, x.ad]), "olumsuz")}</select>`)}
      ${field("Tarih <small>(cevap için tebliğ tarihi)</small>", `<input type="date" id="gl-tarih" value="${today()}" max="${today()}">`, "Süreler tebliğ tarihinden sonraki gün başlar.")}
      ${field("Açıklama", `<textarea id="gl-metin" rows="3" placeholder="Örn. Şikâyetimin yersiz olduğu bildirildi, sayı 456"></textarea>`)}
      ${belgeGrid(geciciBelge.gelisme || [], { edit: true })}${belgeEkleBtn("gelisme", "Cevap yazısını ekle")}
      <div class="btns"><button type="button" class="btn" data-act="gelismeKaydet">Gelişmeyi kaydet</button><button type="button" class="btn ghost" data-act="acKapa" data-v="">Vazgeç</button></div></div>`
      : `<button type="button" class="btn soft" data-act="acKapa" data-v="gelisme">${ic.plus}Gelişme ekle</button>`));
  if(!b.geriCekme) o += ui.acik === "bgeri" ? card("Başvuruyu geri çek", `${field("Gerekçe", `<textarea id="bg-gerekce" rows="2"></textarea>`)}<div class="btns"><button type="button" class="btn danger" data-act="basvuruGeriCek" data-confirm="Emin misin?">Geri çek</button><button type="button" class="btn ghost" data-act="acKapa" data-v="">Vazgeç</button></div>`)
    : `<button type="button" class="btn ghost danger block" data-act="acKapa" data-v="bgeri">Başvuruyu geri çektim</button>`;
  return o;
}, after(){ hydrateImgs($("view")); } };

P.hesap = { t: "Süre hesapla", parent: "surecler", r(){
  const L = HESAP_TURLERI.filter((x) => x.sek === "hepsi" || x.sek === data.sektor);
  const h = ui.hs || (ui.hs = { tur: L[0].k, tarih: today(), not: "" });
  if(!L.some((x) => x.k === h.tur)) h.tur = L[0].k;
  const tt = HESAP_TURLERI.find((x) => x.k === h.tur), S = sureHesapla(h.tur, h.tarih);
  return card("", `${field("Ne oldu?", `<select id="hs-tur">${opts(L.map((x) => [x.k, x.ad]), h.tur)}</select>`)}
    ${field(tt.tarihAd, `<input type="date" id="hs-tarih" value="${h.tarih}">`)}${field("Not <small>(isteğe bağlı)</small>", `<input id="hs-not" value="${esc(h.not)}" placeholder="Örn. uyarma cezası, sayı 789">`)}`) +
    `<div class="results">${S.map(sureCard).join("")}</div>
    <div class="btns"><button type="button" class="btn" data-act="takibeAl" data-tur="${h.tur}" data-tarih="${h.tarih}">Takibe ekle</button><button type="button" class="btn ghost" data-act="takvimHesap">${ic.cal}Takvime ekle</button></div>
    <p class="hint">Genel kurallara göre hesaplanır; son gün tatile denk gelirse ilk iş gününe uzatılır. Hukuki danışmanlık yerine geçmez.</p>`;
} };
P.takip = { t: "Süre takibi", parent: "surecler", r(){
  const t = data.takipler.find((x) => x.id === cur.id); if(!t) return empty("Takip bulunamadı", "");
  const h = HESAP_TURLERI.find((x) => x.k === t.tur) || {};
  return card(esc(h.ad || ""), `<p class="note">${esc(h.tarihAd || "Tarih")}: <b>${trLong(t.tarih)}</b>${t.not ? ` · ${esc(t.not)}` : ""}</p>${sureHesapla(t.tur, t.tarih).map(sureCard).join("")}
    <div class="btns"><button type="button" class="btn ghost" data-act="takvimTakip">${ic.cal}Takvime ekle</button><button type="button" class="btn ghost danger" data-act="takipSil" data-confirm="Takipten çıkarılsın mı?">Takipten çıkar</button></div>`);
} };

/* DAHA */
P.daha = { t: "Daha", tab: "daha", r(){
  return `<p class="mtitle">Analiz</p><div class="list menu">${navRow("sistematik", "chart", "Sistematiklik", "Süre, sıklık ve kişi bazlı tablo")}${navRow("zaman", "time", "Zaman çizelgesi", "Olaylar ve süreçler tarih sırasıyla")}${navRow("taniklar", "users", "Tanıklar", `${data.taniklar.length} kişi`)}</div>
    <p class="mtitle">Dosya</p><div class="list menu">${navRow("rapor", "print", "Rapor ve yazdır", "Mahkemeye sunulabilir olay dosyası")}${navRow("muhur", "seal", "Mühürleme ve gönderimler", data.muhurler.length ? `Son mühür ${trStamp(data.muhurler[data.muhurler.length - 1].t)}` : "Henüz mühürlenmedi")}${navRow("dilekce", "pen", "Dilekçe şablonları", "Kayıtlarından otomatik doldurulur")}</div>
    <p class="mtitle">Bilgi</p><div class="list menu">${navRow("rehber", "book", "Rehber", "Haklar, başvuru yolları, süreler")}${navRow("isleyis", "info", "Uygulamanın işleyişi", "Kayıtların nasıl korunduğu")}${navRow("kvkk", "shield", "KVKK bilgilendirmesi", "")}</div>
    <p class="mtitle">Ayarlar</p><div class="list menu">${navRow("profil", "user", "Profil", "Rapor ve dilekçe bilgileri, e-posta")}${navRow("guvenlik", "lock", "Güvenlik", "PIN, kurtarma sorusu, otomatik kilit")}${navRow("yedek", "save", "Yedek", data.lastBackup ? "Son yedek " + trStamp(data.lastBackup) : "Henüz yedek yok")}${navRow("gorunum", "eye", "Görünüm", "Açık / koyu, yazı boyutu")}</div>
    <p class="foot">MKD · Mobbing Kayıt Defteri · sürüm 3.0<br>© 2026 Süleyman Altundağ</p>`;
} };

/* SİSTEMATİKLİK */
P.sistematik = { t: "Sistematiklik", parent: "daha", r(){
  const R = aktifKayitlar(), s = sistematik(R);
  if(!s) return empty("Henüz kayıt yok", "Kayıt ekledikçe davranışların ne kadar düzenli tekrarlandığı burada görünecek.");
  const w = []; const bas = addDays(weekKey(today()), -25 * 7), set = new Set(R.map((r) => weekKey(r.olayZamani)));
  const cnt = {}; R.forEach((r) => { const k = weekKey(r.olayZamani); cnt[k] = (cnt[k] || 0) + 1; });
  for(let i = 0; i < 26; i++){ const k = addDays(bas, i * 7); w.push(`<i class="${set.has(k) ? cnt[k] > 2 ? "on3" : cnt[k] > 1 ? "on2" : "on" : ""}" title="${trDate(k)} haftası: ${cnt[k] || 0}"></i>`); }
  const maxG = Math.max(...Object.values(s.grup)), dav = Object.entries(s.dav).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const trend = s.trend == null ? "Yeterli veri yok" : s.trend > 0.3 ? "Artıyor" : s.trend < -0.3 ? "Azalıyor" : "Benzer";
  let o = card("Genel tablo", `${meter("Süre", s.sureYuzde, s.gun >= 182 ? `${s.gun} gün · ölçüt karşılandı` : `${s.gun} / 182 gün`)}${meter("Sıklık", s.siklikYuzde, `${s.hafta} / ${s.hSpan} hafta · %${Math.round(s.siklikYuzde * 100)}`)}
    <div class="kpis">${kpi(s.n, "kayıt")}${kpi(s.enUzun, "hafta kesintisiz seri")}${kpi(`%${Math.round(s.ayniGun / s.n * 100)}`, "olay günü kaydedildi")}${kpi(s.ortSiddet ? s.ortSiddet.toFixed(1) : "–", "ort. şiddet")}</div>
    <dl class="kv"><dt>İlk olay</dt><dd>${trDate(s.ilk)}</dd><dt>Son olay</dt><dd>${trDate(s.son)}</dd><dt>Tanıklı kayıt</dt><dd>${s.tanikli} / ${s.n}</dd><dt>Belgeli kayıt</dt><dd>${s.belgeli} / ${s.n}</dd><dt>Şiddet eğilimi</dt><dd>${trend}</dd></dl>`);
  o += card("Son 26 hafta", `<div class="weeks">${w.join("")}</div><p class="hint">Her kare bir hafta; koyulaştıkça o hafta daha çok olay var. Leymann ölçütü: en az 6 ay boyunca, en az haftada bir.</p>`);
  o += card("Davranış grupları", `<div class="bars">${KATEGORILER.concat([KAT0]).filter((c) => s.grup[c.k]).map((c) => `<div class="bar"><span>${c.kisa}</span><div class="bt"><i style="width:${s.grup[c.k] / maxG * 100}%"></i></div><b>${s.grup[c.k]}</b></div>`).join("")}</div>
    ${dav.length ? `<p class="lb">En sık davranışlar</p><ul class="mini">${dav.map(([d, n]) => `<li>${esc(d)} <b>${n}</b></li>`).join("")}</ul>` : ""}`);
  o += card("Kişilere göre", kisiBazli(R).map(({ kisi, rol, s: k }) => `<div class="person"><div class="ph"><b>${esc(kisi)}</b>${rol ? `<small>${esc(rol)}</small>` : ""}<span>${k.n} kayıt</span></div>
    ${meter("Süre", k.sureYuzde, `${k.gun} gün`)}${meter("Sıklık", k.siklikYuzde, `${k.hafta}/${k.hSpan} hafta`)}<p class="note">${trDate(k.ilk)} – ${trDate(k.son)} · en uzun seri ${k.enUzun} hafta · ${Object.keys(k.grup).length} farklı davranış grubu</p></div>`).join(""));
  o += `<p class="hint">Bu tablo kayıtlarından hesaplanır; mobbingin varlığına ilişkin hukuki bir değerlendirme değildir. Yargıtay süreklilik ve sistematikliği somut olayın özelliklerine göre değerlendirir.</p>`;
  return o;
} };

/* ZAMAN ÇİZELGESİ */
function zamanOgeleri(){
  const L = [];
  data.records.forEach((r) => L.push({ t: r.olayZamani, tur: "olay", r }));
  data.basvurular.forEach((b) => { L.push({ t: b.tarih + "T12:00", tur: "basvuru", b }); (b.gelismeler || []).forEach((g) => L.push({ t: g.tarih + "T12:01", tur: "gelisme", b, g })); });
  data.muhurler.forEach((m) => L.push({ t: m.t, tur: "muhur", m }));
  return L.sort((a, b) => b.t.localeCompare(a.t));
}
P.zaman = { t: "Zaman çizelgesi", parent: "daha", r(){
  const f = ui.zamanF, L = zamanOgeleri().filter((x) => f === "hepsi" || (f === "olay" ? x.tur === "olay" : x.tur !== "olay"));
  if(!L.length) return seg("zamanF", f, [["hepsi", "Hepsi"], ["olay", "Olaylar"], ["surec", "Süreçler"]]) + empty("Çizelge boş", "Kayıt ve başvuru ekledikçe burada tarih sırasıyla görünür.");
  let ay = "", o = seg("zamanF", f, [["hepsi", "Hepsi"], ["olay", "Olaylar"], ["surec", "Süreçler"]]) + `<div class="timeline">`;
  L.forEach((x) => {
    const d = x.t.slice(0, 10), a = d.slice(0, 7);
    if(a !== ay){ ay = a; o += `<h4 class="tm">${AYLAR[+a.slice(5) - 1]} ${a.slice(0, 4)}</h4>`; }
    if(x.tur === "olay") o += `<button type="button" class="ti olay${x.r.geriCekme ? " withdrawn" : ""}" data-act="git" data-p="kayit" data-id="${x.r.id}"><span class="td">${d.slice(8)}<small>${x.t.slice(11, 16)}</small></span><span class="tb"><b>${noStr(x.r.no)} · ${esc(x.r.kisi)}</b><span>${esc(x.r.davranis)}</span></span>${sevBar(x.r.siddet)}</button>`;
    else if(x.tur === "basvuru") o += `<button type="button" class="ti surec" data-act="git" data-p="basvuru" data-id="${x.b.id}"><span class="td">${d.slice(8)}</span><span class="tb"><b>Başvuru B-${pad(x.b.no, 3)}</b><span>${esc(turBul(x.b.tur).ad)}${x.b.kurum ? " · " + esc(x.b.kurum) : ""}</span></span></button>`;
    else if(x.tur === "gelisme") o += `<button type="button" class="ti surec" data-act="git" data-p="basvuru" data-id="${x.b.id}"><span class="td">${d.slice(8)}</span><span class="tb"><b>B-${pad(x.b.no, 3)} · ${esc(gelismeBul(x.g.tur).ad)}</b><span>${esc(shorten(x.g.metin, 80))}</span></span></button>`;
    else o += `<div class="ti muhur"><span class="td">${trDate(x.t).slice(0, 2)}</span><span class="tb"><b>Mühürlendi</b><span>${noStr(x.m.ilkNo)} – ${noStr(x.m.sonNo)} · ${x.m.adet} kayıt</span></span></div>`;
  });
  return o + `</div>`;
} };

/* TANIKLAR */
P.taniklar = { t: "Tanıklar", parent: "daha", r(){
  const say = (id) => data.records.filter((r) => r.tanikIds.includes(id)).length;
  let o = card("Yeni tanık", `${field("Ad soyad", `<input id="tn-ad" autocomplete="off">`)}${field("Unvanı / seninle ilişkisi", `<input id="tn-unvan" placeholder="Örn. aynı birimde tekniker">`)}<button type="button" class="btn" data-act="tanikEkle">Tanığı ekle</button>
    <p class="hint">Yalnızca gerekli bilgileri yaz. Tanığın adını bir kuruma vermeden önce onunla konuş.</p>`);
  o += data.taniklar.length ? `<div class="list menu">${data.taniklar.map((w) => `<button type="button" class="row" data-act="git" data-p="tanik" data-id="${w.id}"><span class="ri">${ic.user}</span><span class="rt">${esc(w.ad)}<small>${esc(w.unvan || "")}${w.unvan ? " · " : ""}${say(w.id)} olayda tanık · ${{ olumlu: "tanıklık edebilir", cekimser: "çekimser", "": "konuşulmadı" }[w.durum || ""]}</small></span><span class="rc">${ic.chev}</span></button>`).join("")}</div>`
    : empty("Henüz tanık yok", "Olayları görenleri buraya ekle; kayıt girerken tek dokunuşla seçebilirsin.");
  return o;
} };
P.tanik = { t: "Tanık", parent: "taniklar", r(){
  const w = tanikBul(cur.id); if(!w) return empty("Tanık bulunamadı", "");
  const R = kayitSirali(data.records.filter((r) => r.tanikIds.includes(w.id)));
  return card("Bilgiler", `${field("Ad soyad", `<input id="tn-ad" value="${esc(w.ad)}">`)}${field("Unvanı / ilişkisi", `<input id="tn-unvan" value="${esc(w.unvan || "")}">`)}
    <span class="lb">Tanıklık durumu</span>${seg("tanikDurum", w.durum || "", [["", "Konuşulmadı"], ["olumlu", "Tanıklık edebilir"], ["cekimser", "Çekimser"]])}
    ${field("Not", `<textarea id="tn-not" rows="2">${esc(w.not || "")}</textarea>`)}<button type="button" class="btn" data-act="tanikKaydet">Kaydet</button>
    <p class="hint">Tanık bilgisindeki değişiklik, kesinleşmiş kayıtlardaki tanık adını değiştirmez.</p>`) +
    card(`Tanık olduğu olaylar (${R.length})`, R.length ? `<div class="recs">${R.map(recCard).join("")}</div>` : `<p class="note">Henüz bir kayıtta seçilmedi.</p>`) +
    (R.length ? "" : `<button type="button" class="btn ghost danger block" data-act="tanikSil" data-confirm="Silinsin mi?">Tanığı listeden çıkar</button>`);
} };

/* RAPOR */
P.rapor = { t: "Rapor ve yazdır", parent: "daha", r(){
  const s = kayitSirali(data.records), r = ui.rp || (ui.rp = { bas: s.length ? s[0].olayZamani.slice(0, 10) : today(), bit: today(), kisi: "", foto: true, saglik: true });
  const say = raporKayitlari().length;
  return card("Olay dosyası", `<p class="note">Kapak, işleyiş açıklaması, özet ve sistematiklik tablosu, zaman çizelgesi, numaralı olaylar (düzeltmeler ve geri çekilenler dahil), tanık listesi, başvuru ve süre tablosu, gönderim ve mühür kayıtları, ekler ve beyan bölümüyle A4 düzeninde hazırlanır.</p>
    <div class="two">${field("Başlangıç", `<input type="date" id="rp-bas" value="${r.bas}">`)}${field("Bitiş", `<input type="date" id="rp-bit" value="${r.bit}">`)}</div>
    ${field("Kişi", `<select id="rp-kisi"><option value="">Herkes</option>${opts(uniqVals("kisi").filter((k) => data.records.some((x) => x.kisi === k)).map((k) => [k, k]), r.kisi)}</select>`)}
    <label class="toggle"><span>Fotoğraf eklerini dahil et</span><input type="checkbox" id="rp-foto" ${r.foto ? "checked" : ""}></label>
    <label class="toggle"><span>"Sağlığına etkisi" bilgisini dahil et</span><input type="checkbox" id="rp-saglik" ${r.saglik ? "checked" : ""}></label>
    <p class="note"><b>${say}</b> kayıt rapora girecek. Geri çekilen kayıtlar da gerekçesiyle yer alır.</p>
    <div class="btns col"><button type="button" class="btn" data-act="raporYazdir">${ic.print}Yazdır / PDF olarak kaydet</button><button type="button" class="btn ghost" data-act="raporPaylas">${ic.share}Dosya olarak paylaş (.html)</button></div>
    <p class="hint">iPhone'da yazdırma ekranında iki parmakla büyütüp sağ üstteki paylaş düğmesiyle PDF olarak kaydedebilirsin. Yazdırma açılmazsa dosya olarak paylaş, Dosyalar'da açıp oradan yazdır.</p>`) +
    `<div class="warn">Bu dosya hassas kişisel veriler içerir. Yalnızca avukatına, sendikana ya da başvurduğun resmî kuruma ver. Sosyal medyada paylaşma.</div>`;
} };
function rpTopla(){ if(!$("rp-bas")) return; ui.rp = { bas: $("rp-bas").value, bit: $("rp-bit").value, kisi: $("rp-kisi").value, foto: $("rp-foto").checked, saglik: $("rp-saglik").checked }; }
function raporKayitlari(){ const r = ui.rp || {}; return kayitSirali(data.records).filter((x) => { const d = x.olayZamani.slice(0, 10); return (!r.bas || d >= r.bas) && (!r.bit || d <= r.bit) && (!r.kisi || x.kisi === r.kisi); }); }

/* MÜHÜR */
P.muhur = { t: "Mühürleme ve gönderimler", parent: "daha", r(){
  const son = data.muhurler.slice(-1)[0], bas = son ? son.sonNo + 1 : 1, yeni = data.records.filter((r) => r.no >= bas);
  const ekSonra = son ? data.records.filter((r) => r.no < bas && (r.ekler || []).some((e) => e.t > son.t)).length : 0;
  let o = card("Mühürleme nedir?", `<p class="note">Mühürleme, o ana kadarki kayıtlarını tek bir dosya hâlinde kendine ya da avukatına e-postayla göndermektir. Dosyada son mühürden bu yana eklenen kayıtların tam metni ve defterdeki tüm kayıtların numara–tarih dizini bulunur. Gönderim tarihi e-posta sağlayıcısında tutulduğu için kayıtların o tarihte var olduğunu destekler. Ayda bir yapman önerilir.</p>`);
  o += card("Sıradaki mühür", yeni.length || ekSonra ? `<p><b>${yeni.length}</b> yeni kayıt${yeni.length ? ` (${noStr(bas)} – ${noStr(data.sayac)})` : ""}${ekSonra ? `, önceki kayıtlara eklenen <b>${ekSonra}</b> düzeltme/ek` : ""}.</p>
    <div class="btns col"><button type="button" class="btn" data-act="muhurle">${ic.seal}Mühürle ve paylaş</button><button type="button" class="btn ghost" data-act="muhurMetin">${ic.mail}Dizini e-posta metni olarak gönder</button></div>
    <p class="hint">Paylaş ekranında Mail'i seç, alıcıya kendi adresini ya da avukatının adresini yaz. Dosya ekli gider.</p>`
    : `<p class="note">Mühürlenmemiş kayıt yok.${son ? ` Son mühür ${trStamp(son.t)}.` : ""}</p>`);
  o += `<label class="toggle"><span>Ayda bir mühürleme hatırlatması</span><input type="checkbox" data-act-chg="muhurHatirlat" ${data.ayar.muhurHatirlat ? "checked" : ""}></label>`;
  if(data.muhurler.length) o += card("Mühür geçmişi", `<ul class="mini">${data.muhurler.slice().reverse().map((m) => `<li>${trStamp(m.t)} · ${noStr(m.ilkNo)} – ${noStr(m.sonNo)} · ${m.adet} kayıt · ${esc(m.yol)}</li>`).join("")}</ul>`);
  const G = data.records.flatMap((r) => (r.gonderimler || []).map((g) => Object.assign({ no: r.no }, g))).sort((a, b) => b.t.localeCompare(a.t));
  o += card("Kayıt gönderimleri", G.length ? `<ul class="mini">${G.slice(0, 40).map((g) => `<li>${trStamp(g.t)} · ${noStr(g.no)} · ${esc(g.kime)}</li>`).join("")}</ul>` : `<p class="note">Henüz tek tek gönderilen kayıt yok. Kayıt ayrıntısındaki "Kendime e-posta gönder" düğmesini kullan.</p>`);
  o += card("E-posta adreslerin", `<p class="note">${data.profil.eposta ? `Kendi adresin: <b>${esc(data.profil.eposta)}</b>` : "Kendi e-posta adresini girersen gönderim ekranı adresinle hazır açılır."}${data.profil.guvenEposta ? `<br>Güvendiğin kişi: <b>${esc(data.profil.guvenAd || "")} ${esc(data.profil.guvenEposta)}</b>` : ""}</p>${navRow("profil", "user", "Adresleri düzenle", "")}`);
  o += card("KEP ile daha güçlü kanıt", `<p class="note">Kayıtlı Elektronik Posta (KEP), gönderim ve teslim zamanını zaman damgalı kayıtla belgeler; ispat gücü sıradan e-postadan yüksektir. PTT ya da yetkili bir KEP sağlayıcısından ücretli adres alıp mühür dosyasını kendi KEP adresine gönderebilirsin.</p>`);
  return o;
} };

/* DİLEKÇE */
P.dilekce = { t: "Dilekçe şablonları", parent: "daha", r(){
  const d = ui.dl || (ui.dl = { tur: data.sektor === "ozel" ? "isveren" : "kurum", secim: "hepsi", makam: "", metin: "" });
  const T = SABLONLAR.filter((x) => !x.sek || x.sek === data.sektor), t = SABLONLAR.find((x) => x.k === d.tur) || T[0];
  if(!d.makam) d.makam = t.makam(data.profil);
  return card("", `${field("Şablon", `<select id="dl-tur">${opts(T.map((x) => [x.k, x.ad]), d.tur)}</select>`, esc(t.bilgi))}
    ${field("Hitap edilen makam", `<input id="dl-makam" value="${esc(d.makam)}">`)}
    ${t.olaylar === false ? "" : field("Dilekçede anılacak olaylar", `<select id="dl-secim">${opts([["hepsi", "Tümü (özet)"], ["agir", "Şiddeti 3 ve üzeri"], ["son5", "Son 5 olay"]], d.secim)}</select>`)}
    <button type="button" class="btn soft" data-act="dilekceOlustur">${ic.pen}Dilekçeyi oluştur</button>`) +
    (d.metin ? card("Dilekçe metni <small>(düzenleyebilirsin)</small>", `<textarea id="dl-metin" class="letter">${esc(d.metin)}</textarea>
      <div class="btns"><button type="button" class="btn" data-act="dilekceYazdir">Yazdır / PDF</button><button type="button" class="btn ghost" data-act="dilekceKopyala">Kopyala</button><button type="button" class="btn ghost" data-act="dilekcePaylas">Paylaş</button></div>
      <p class="hint">Şablon bir başlangıçtır. Göndermeden önce oku, eksik bilgileri tamamla ve mümkünse bir avukata ya da sendikana göster.</p>`) : "");
} };

/* BİLGİ SAYFALARI */
P.rehber = { t: "Rehber", parent: "daha", r(){ const s = ui.rehberSek || data.sektor; return seg("rehberSek", s, [["kamu", "Kamu"], ["ozel", "Özel sektör"]]) + `<div id="tplhost" class="docs"></div>`; },
  after(){ const h = $("tplhost"); h.appendChild($("tpl-rehber").content.cloneNode(true)); const s = ui.rehberSek || data.sektor; h.querySelectorAll("[data-sek]").forEach((n) => { n.hidden = n.dataset.sek !== s; }); } };
P.isleyis = { t: "Uygulamanın işleyişi", parent: "daha", r(){ return `<section class="card doctext" id="tplhost"></section><p class="hint">Bu açıklama raporun sonunda da yer alır.</p>`; }, after(){ $("tplhost").appendChild($("tpl-isleyis").content.cloneNode(true)); } };
P.kvkk = { t: "KVKK bilgilendirmesi", parent: "daha", r(){ return `<div id="tplhost" class="docs"></div>`; }, after(){ $("tplhost").appendChild($("tpl-kvkk").content.cloneNode(true)); } };

/* AYARLAR */
P.profil = { t: "Profil", parent: "daha", r(){
  const p = data.profil, f = (k, lb, ph, t) => field(lb, `<input id="pr-${k}" value="${esc(p[k] || "")}" ${t ? `type="${t}"` : ""} placeholder="${ph || ""}" autocomplete="off">`);
  return card("Rapor ve dilekçe bilgileri", `${f("ad", "Ad soyad")}<div class="two">${f("unvan", "Unvan", "Örn. Radyoloji teknikeri")}${f("sicil", "Sicil no <small>(isteğe bağlı)</small>")}</div>
    ${f("kurum", "Kurum", "Örn. … Devlet Hastanesi")}${f("birim", "Birim", "Örn. Radyoloji servisi")}${f("hitap", "Sana nasıl hitap edelim?")}
    <span class="lb">Çalıştığın yer</span>${seg("sektor", data.sektor, [["kamu", "Kamu"], ["ozel", "Özel sektör"]])}`) +
    card("E-posta", `${f("eposta", "Kendi e-posta adresin", "ornek@eposta.com", "email")}${f("guvenAd", "Güvendiğin kişi <small>(avukat, sendika temsilcisi, yakının)</small>", "Ad")}${f("guvenEposta", "Onun e-posta adresi", "", "email")}
    <p class="hint">Bu adresler yalnızca gönderim ekranını hazır açmak için kullanılır; uygulama kendisi e-posta göndermez.</p>`) +
    `<button type="button" class="btn block" data-act="profilKaydet">Kaydet</button>`;
} };
P.guvenlik = { t: "Güvenlik", parent: "daha", r(){
  const deneme = data.gunluk.filter((g) => g.tur === "deneme");
  return card("Otomatik kilit", `<p class="note">Uygulamadan çıktığında ne kadar sonra kilitlensin?</p>${seg("otoKilit", data.ayar.otoKilit, [[0, "Hemen"], [60, "1 dk"], [300, "5 dk"]])}`) +
    card("PIN'i değiştir", `${field("Şu anki PIN", `<input id="c-eski" type="password" inputmode="numeric" maxlength="8" autocomplete="off">`)}<div class="two">${field("Yeni PIN", `<input id="c-pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off">`)}${field("Tekrar", `<input id="c-pin2" type="password" inputmode="numeric" maxlength="8" autocomplete="off">`)}</div>
      <button type="button" class="btn ghost" data-act="pinDegistir">PIN'i değiştir</button><p class="hint">Kayıtlar yeniden şifrelenmez; yalnızca anahtarın kilidi değişir. Eski yedekler eski PIN'le açılır.</p>`) +
    card("Kurtarma sorusu", `<p class="note">Şu anki soru: <b>${esc(meta.kur ? meta.kur.soru : "belirlenmedi")}</b></p>
      ${field("Şu anki PIN", `<input id="k-pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off">`)}${field("Yeni soru", `<input id="k-soru" autocomplete="off">`)}
      <div class="two">${field("Cevap", `<input id="k-cevap" type="password" autocomplete="off">`)}${field("Tekrar", `<input id="k-cevap2" type="password" autocomplete="off">`)}</div>
      <button type="button" class="btn ghost" data-act="kurtarmaDegistir">Soruyu değiştir</button>
      <label class="toggle"><span>Ayda bir hatırlatma denemesi</span><input type="checkbox" data-act-chg="kurtarmaHatirlat" ${data.ayar.kurtarmaHatirlat ? "checked" : ""}></label>
      ${navRow("kurtarma-dene", "shield", "Cevabımı şimdi dene", "")}`) +
    card("Giriş denemeleri", deneme.length ? `<ul class="mini">${deneme.slice().reverse().slice(0, 20).map((g) => `<li>${trStamp(g.t)} · ${esc(g.metin)}</li>`).join("")}</ul>` : `<p class="note">Kayıtlı yanlış deneme yok.</p>`, `<button type="button" class="link" data-act="git" data-p="gunluk">İşlem günlüğü</button>`) +
    card("Uygulanan önlemler", `<ul class="plain">
      <li>Kayıtlar ve belgeler AES-256-GCM ile şifrelenir. Anahtar PIN'inden ve kurtarma cevabından türetilen anahtarlarla korunur (PBKDF2-SHA256, 600.000 tur).</li>
      <li>Uygulama internete veri gönderemez; bu, sayfaya eklenen içerik güvenlik politikasıyla (CSP) engellenmiştir. Reklam, analiz ya da takip kodu yoktur.</li>
      <li>Yanlış PIN denemelerinde kayıtlar <b>silinmez</b>; 5. denemeden sonra bekleme süresi 1, 5 ve 30 dakikaya çıkar, denemeler sana bildirilir.</li>
      <li>Uygulamada tüm verileri silen bir düğme bilerek yoktur; telefonu ele geçiren biri kayıtlarını uygulamadan silemez.</li>
      <li>Uygulama arka plana geçince ekran örtülür. Fotoğraflardaki konum ve cihaz bilgileri silinir.</li></ul>`);
} };
P["kurtarma-dene"] = { t: "Kurtarma cevabını dene", parent: "guvenlik", r(){
  return card("", `<div class="lsoru inapp">${esc(meta.kur ? meta.kur.soru : "Kurtarma sorusu belirlenmedi")}</div>${field("Cevap", `<input id="kd-cevap" type="password" autocomplete="off">`)}<button type="button" class="btn" data-act="kurtarmaDeneme">Dene</button>
    <p class="hint">Bu deneme bekleme süresine sayılmaz. Hatırlamıyorsan Güvenlik bölümünden yeni bir soru belirle.</p>`);
} };
P.gunluk = { t: "İşlem günlüğü", parent: "guvenlik", r(){
  return card("", data.gunluk.length ? `<ul class="mini">${data.gunluk.slice().reverse().map((g) => `<li>${trStamp(g.t)} · ${esc(g.metin)}</li>`).join("")}</ul>` : `<p class="note">Boş.</p>`) + `<p class="hint">Günlük şifreli tutulur ve raporda yer almaz; güvenlik takibin içindir.</p>`;
} };
P.yedek = { t: "Yedek", parent: "daha", r(){
  return card("Yedek al", `<p class="note">Kayıtların yalnızca bu telefonda. Telefon kaybolur ya da uygulama silinirse kayıtlar da gider. <b>Haftada bir yedek al</b> ve iCloud Drive gibi güvenli bir yere kaydet. Yedek dosyası da şifrelidir; PIN'in ya da kurtarma cevabınla açılır.</p>
    <p>${chip(data.lastBackup ? "Son yedek: " + trStamp(data.lastBackup) : "Henüz yedek almadın", data.lastBackup ? "acc" : "amber")}</p><button type="button" class="btn" data-act="yedekAl">${ic.save}Yedek al</button>`) +
    card("Yedekten geri yükle", `<p class="note">Geri yükleme mevcut kayıtların üzerine yazmaz. Defter boşsa yedek numaralarıyla birlikte geri gelir; doluysa yalnızca eksik kayıtlar eklenir.</p>
    ${seg("yedekCevap", ui.yedekCevap ? 1 : 0, [[0, "Yedeğin PIN'i"], [1, "Kurtarma cevabı"]])}
    ${ui.yedekCevap ? field("Yedeği aldığın defterin kurtarma cevabı", `<input id="bk-sec" type="password" autocomplete="off">`) : field("Yedeği aldığın PIN", `<input id="bk-sec" type="password" inputmode="numeric" maxlength="8" autocomplete="off">`)}
    <input type="file" id="bk-file" accept=".json,application/json" hidden><button type="button" class="btn ghost" data-act="yedekSec">Yedek dosyası seç</button>`);
} };
P.gorunum = { t: "Görünüm", parent: "daha", r(){
  return card("Tema", seg("mod", tema.mod, [["auto", "Otomatik"], ["light", "Açık"], ["dark", "Koyu"]])) + card("Yazı boyutu", seg("boyut", tema.boyut, [[16, "Normal"], [18, "Büyük"], [20, "Çok büyük"]]));
} };

/* ---------- Yönlendirme ---------- */
function go(p, id, opt){
  if(cur.p === "yeni" && p !== "yeni"){ const t = wizTopla(); if(t && taslakBos(t)) data.taslaklar = data.taslaklar.filter((x) => x.id !== t.id); save(); }
  if(cur.p === "basvuru-yeni" && p !== "basvuru-yeni"){ bfTopla(); }
  if(p !== cur.p || id !== cur.id){ ui.acik = ""; if(p !== "kayit") sonOlusan = null; geciciBelgeTemizle(); }
  cur = { p, id: id || null };
  render(opt && opt.keepScroll);
}
function render(keepScroll){
  const pg = P[cur.p] || P.ozet, y = window.scrollY;
  $("pageTitle").textContent = pg.title ? pg.title() : pg.t;
  $("backBtn").hidden = !pg.parent;
  const tab = pg.tab || (function f(p){ const x = P[p]; return x ? (x.tab || (x.parent ? f(x.parent) : "ozet")) : "ozet"; })(pg.parent);
  document.querySelectorAll(".tabbar [data-tab]").forEach((b) => b.setAttribute("aria-current", String(b.dataset.tab === tab)));
  $("view").innerHTML = pg.r();
  if(pg.after) pg.after();
  window.scrollTo(0, keepScroll ? y : 0);
}
function enterApp(){
  $("lock").hidden = true; $("lock").innerHTML = ""; $("app").hidden = false;
  cur = { p: "ozet", id: null }; render(); yetimTemizle();
  if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}
$("backBtn").addEventListener("click", () => { const pg = P[cur.p]; if(pg && pg.parent) go(pg.parent); });
document.querySelector(".tabbar").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if(b && data) go(b.dataset.tab); });

/* ---------- Eylemler ---------- */
const ACT = {
  git: (el) => go(el.dataset.p, el.dataset.id),
  seg(el){
    const g = el.dataset.g, v = el.dataset.v;
    if(g === "surecSeg" || g === "zamanF" || g === "rehberSek"){ ui[g] = v; return render(); }
    if(g === "ekTur"){ ui.ekTur = v; const m = $("e-metin") ? $("e-metin").value : ""; render(true); if($("e-metin")) $("e-metin").value = m; return; }
    if(g === "yedekCevap"){ ui.yedekCevap = v === "1"; return render(true); }
    if(g === "otoKilit"){ data.ayar.otoKilit = +v; save(); return render(true); }
    if(g === "sektor"){ data.sektor = v; save(); return render(true); }
    if(g === "mod"){ tema.mod = v; lsSet(LS_TEMA, tema); applyTheme(); return render(true); }
    if(g === "boyut"){ tema.boyut = +v; lsSet(LS_TEMA, tema); applyTheme(); return render(true); }
    if(g === "tanikDurum"){ const w = tanikBul(cur.id); w.durum = v; save(); return render(true); }
  },
  bildirimKapat(){ bildirim = null; render(true); },
  acKapa(el){ ui.acik = el.dataset.v; if(!ui.acik){ geciciBelgeTemizle(); } render(true); },
  belgeAc: (el) => belgeAc(el.dataset.id, el.dataset.ad, el.dataset.tur),
  belgeSec(el){ belgeHedef = el.dataset.hedef; const f = $("dosyaSec"); f.value = ""; f.click(); },
  async belgeKaldir(el){
    const id = el.dataset.id;
    if(cur.p === "yeni"){ const t = wizTopla(); t.belgeler = t.belgeler.filter((b) => b.id !== id); save(); }
    else Object.keys(geciciBelge).forEach((k) => { geciciBelge[k] = (geciciBelge[k] || []).filter((b) => b.id !== id); });
    await fotoDel(id).catch(() => {}); render(true);
  },
  // Sihirbaz
  taslakAc: (el) => go("yeni", el.dataset.id),
  adim(el){ const t = wizTopla(); t.adim = +el.dataset.v; save(); render(); },
  kat(el){ const t = wizTopla(); if(t.kategori !== el.dataset.v){ t.kategori = el.dataset.v; t.davranis = ""; } render(true); },
  siddet(el){ const t = wizTopla(); t.siddet = t.siddet === +el.dataset.v ? 0 : +el.dataset.v; render(true); },
  tanikSec(el){ const t = wizTopla(), id = el.dataset.id; t.tanikIds = t.tanikIds.includes(id) ? t.tanikIds.filter((x) => x !== id) : t.tanikIds.concat(id); render(true); },
  tanikHizli(){ const t = wizTopla(), ad = $("w-yeni").value.trim(); if(!ad) return; const w = tanikYeni(ad, ""); t.tanikIds.push(w.id); save(); render(true); },
  async kesinlestir(){
    const t = wizTopla(); const e = taslakEksik(t); if(e.length) return toast("Eksik: " + e.join(", "), "err");
    const r = kesinlestir(t); gunlukEkle("kayit", `${noStr(r.no)} kesinleştirildi`); await save();
    sonOlusan = r.id; cur = { p: "kayit", id: r.id }; ui.acik = ""; render();
  },
  taslakBirak(){ wizTopla(); save(); toast("Taslak saklandı. Kayıtlar sayfasından devam edebilirsin."); go("kayitlar"); },
  async taslakSil(){ const t = taslakBul(cur.id); if(!t) return; for(const b of t.belgeler) await fotoDel(b.id).catch(() => {}); data.taslaklar = data.taslaklar.filter((x) => x.id !== t.id); cur.p = "kayitlar"; save(); go("kayitlar"); },
  // Kayıt ayrıntısı
  async ekKaydet(){
    const r = kayitBul(cur.id), metin = ($("e-metin").value || "").trim();
    if(!metin) return toast("Metni yaz.", "err");
    syncGeciciAd("ek");
    r.ekler.push({ id: uid("e"), t: nowIso(), tur: ui.ekTur === "duzeltme" ? "duzeltme" : "ek", metin, belgeler: (geciciBelge.ek || []).slice() });
    geciciBelge.ek = []; ui.acik = ""; gunlukEkle("ek", `${noStr(r.no)} kaydına ${ui.ekTur === "duzeltme" ? "düzeltme" : "ek"} girildi`); await save(); render(true); toast("Eklendi ve kilitlendi.");
  },
  async geriCek(){
    const r = kayitBul(cur.id), g = ($("g-gerekce").value || "").trim();
    if(!g) return toast("Gerekçeyi yaz.", "err");
    r.geriCekme = { t: nowIso(), gerekce: g }; ui.acik = ""; gunlukEkle("geri", `${noStr(r.no)} geri çekildi`); await save(); render();
  },
  async gonder(el){
    const r = kayitBul(cur.id), kime = el.dataset.kime, p = data.profil;
    const { konu, metin } = kayitOzetMetni(r);
    if(kime === "paylas"){ const s = await shareText(konu, metin); if(s === "cancel") return; r.gonderimler.push({ t: nowIso(), kime: "Paylaşım", yol: s === "copied" ? "panoya kopyalandı" : "paylaşım ekranı" }); }
    else {
      const to = kime === "kendim" ? p.eposta : p.guvenEposta;
      if(!to){ toast(kime === "kendim" ? "Önce Profil'den kendi e-posta adresini gir." : "Önce Profil'den güvendiğin kişinin adresini gir.", "err"); return go("profil"); }
      r.gonderimler.push({ t: nowIso(), kime: kime === "kendim" ? "Kendime" : (p.guvenAd || "Güvendiğim kişi"), yol: "e-posta ekranı açıldı (" + to + ")" });
      await save(); mailAc(to, konu, metin); return render(true);
    }
    await save(); render(true);
  },
  takibeAl(el){ data.takipler.push({ id: uid("s"), tur: el.dataset.tur, tarih: el.dataset.tarih, not: el.dataset.not || ($("hs-not") ? $("hs-not").value.trim() : ""), t: nowIso() }); save(); toast("Süre takibe alındı."); if(cur.p === "hesap") go("surecler"); },
  takvimTum(){ takvimeEkle(tumSureler().filter((x) => !x.tamam && kalanGun(x.son) >= 0)); },
  takvimHesap(){ takvimeEkle(sureHesapla(ui.hs.tur, ui.hs.tarih)); },
  takvimTakip(){ const t = data.takipler.find((x) => x.id === cur.id); takvimeEkle(sureHesapla(t.tur, t.tarih)); },
  takvimBasvuru(){ const b = data.basvurular.find((x) => x.id === cur.id); takvimeEkle(basvuruSureleri(b).filter((x) => !x.tamam).map((x) => Object.assign({ kaynakAd: `B-${pad(b.no, 3)} ${turBul(b.tur).ad}` }, x))); },
  takipSil(){ data.takipler = data.takipler.filter((x) => x.id !== cur.id); save(); go("surecler"); },
  // Başvuru
  async basvuruKaydet(){
    bfTopla(); const f = ui.bf, tur = turBul(f.tur);
    if(!f.tarih) return toast("Başvuru tarihini gir.", "err");
    syncGeciciAd("basvuru");
    data.sayacB = (data.sayacB || 0) + 1;
    const b = { id: uid("b"), no: data.sayacB, tur: f.tur, kurum: f.kurum.trim(), tarih: f.tarih, sayi: f.sayi.trim(), konu: f.konu.trim(), sure: Math.max(1, +f.sure || tur.sure),
      belgeler: (geciciBelge.basvuru || []).slice(), kayitZamani: nowIso(), gelismeler: f.not.trim() ? [{ id: uid("g"), t: nowIso(), tarih: f.tarih, tur: "not", metin: f.not.trim() }] : [], geriCekme: null };
    data.basvurular.push(b); geciciBelge.basvuru = []; ui.bf = null; gunlukEkle("basvuru", `B-${pad(b.no, 3)} kaydedildi`); await save(); go("basvuru", b.id);
  },
  async gelismeKaydet(){
    const b = data.basvurular.find((x) => x.id === cur.id), tarih = $("gl-tarih").value;
    if(!tarih) return toast("Tarihi gir.", "err");
    syncGeciciAd("gelisme");
    b.gelismeler.push({ id: uid("g"), t: nowIso(), tarih, tur: $("gl-tur").value, metin: $("gl-metin").value.trim(), belgeler: (geciciBelge.gelisme || []).slice() });
    geciciBelge.gelisme = []; ui.acik = ""; await save(); render(true);
  },
  async basvuruGeriCek(){ const b = data.basvurular.find((x) => x.id === cur.id), g = $("bg-gerekce").value.trim(); if(!g) return toast("Gerekçeyi yaz.", "err"); b.geriCekme = { t: nowIso(), gerekce: g }; ui.acik = ""; await save(); render(); },
  // Tanık
  tanikEkle(){ const ad = $("tn-ad").value.trim(); if(!ad) return toast("Adı yaz.", "err"); tanikYeni(ad, $("tn-unvan").value.trim()); save(); render(); },
  tanikKaydet(){ const w = tanikBul(cur.id); w.ad = $("tn-ad").value.trim() || w.ad; w.unvan = $("tn-unvan").value.trim(); w.not = $("tn-not").value.trim(); save(); toast("Kaydedildi."); render(true); },
  tanikSil(){ data.taniklar = data.taniklar.filter((w) => w.id !== cur.id); data.taslaklar.forEach((t) => { t.tanikIds = t.tanikIds.filter((x) => x !== cur.id); }); save(); go("taniklar"); },
  // Rapor, mühür, dilekçe (rapor.js)
  raporYazdir(){ rpTopla(); raporYazdir(); },
  raporPaylas(){ rpTopla(); raporPaylas(); },
  muhurle: () => muhurle(),
  muhurMetin: () => muhurMetin(),
  dilekceOlustur(){ const d = ui.dl; d.tur = $("dl-tur").value; d.makam = $("dl-makam").value; d.secim = $("dl-secim") ? $("dl-secim").value : "hepsi"; if(!aktifKayitlar().length && SABLONLAR.find((x) => x.k === d.tur).olaylar !== false) return toast("Önce en az bir kayıt kesinleştir.", "err"); d.metin = dilekceMetni(d); render(true); if(!(data.profil.ad)) toast("Profil bilgilerin eksik; doldurursan dilekçeye otomatik eklenir."); },
  dilekceYazdir(){ ui.dl.metin = $("dl-metin").value; printHtml(`<section class="p-letter">${ui.dl.metin.split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join("")}</section>`); },
  async dilekceKopyala(){ ui.dl.metin = $("dl-metin").value; try { await navigator.clipboard.writeText(ui.dl.metin); toast("Kopyalandı."); } catch(e){ $("dl-metin").select(); toast("Metin seçildi, kendin kopyala."); } },
  async dilekcePaylas(){ ui.dl.metin = $("dl-metin").value; await shareFile(`dilekce-${today()}.txt`, ui.dl.metin, "text/plain"); },
  // Ayarlar
  profilKaydet(){
    ["ad", "unvan", "sicil", "kurum", "birim", "hitap", "eposta", "guvenAd", "guvenEposta"].forEach((k) => { data.profil[k] = $("pr-" + k).value.trim(); });
    lsSet("mkd-hitap", data.profil.hitap || ""); save(); toast("Profil kaydedildi.");
  },
  async pinDegistir(){
    const eski = $("c-eski").value, p1 = $("c-pin").value, p2 = $("c-pin2").value;
    if(!/^\d{4,8}$/.test(p1)) return toast("Yeni PIN 4 ile 8 rakam arasında olmalı.", "err");
    if(p1 !== p2) return toast("İki PIN aynı değil.", "err");
    if(kolayPin(p1)) return toast("Bu PIN çok kolay tahmin edilir.", "err");
    toast("Kontrol ediliyor…");
    try { await unwrapDek(eski, meta.pin); } catch(e){ return toast("Şu anki PIN yanlış.", "err"); }
    meta.pin = await wrapDek(p1, dekRaw); gunlukEkle("pin", "PIN değiştirildi"); await save(); toast("PIN değişti. Yeni bir yedek al."); render(true);
  },
  async kurtarmaDegistir(){
    const pin = $("k-pin").value, soru = $("k-soru").value.trim(), c1 = $("k-cevap").value, c2 = $("k-cevap2").value;
    if(!soru) return toast("Yeni soruyu yaz.", "err");
    if(!normCevap(c1)) return toast("Cevabı yaz.", "err");
    if(normCevap(c1) !== normCevap(c2)) return toast("İki cevap aynı değil.", "err");
    toast("Kontrol ediliyor…");
    try { await unwrapDek(pin, meta.pin); } catch(e){ return toast("PIN yanlış.", "err"); }
    const w = await wrapDek(normCevap(c1), dekRaw); w.soru = soru; meta.kur = w; data.kurtarmaSon = nowIso();
    gunlukEkle("kurtarma", "Kurtarma sorusu değiştirildi"); await save(); toast("Kurtarma sorusu değişti."); render();
  },
  async kurtarmaDeneme(){
    const c = normCevap($("kd-cevap").value); if(!c) return;
    toast("Kontrol ediliyor…");
    try { await unwrapDek(c, meta.kur); data.kurtarmaSon = nowIso(); save(); toast("Doğru. Kurtarma cevabın çalışıyor.", "ok"); go("guvenlik"); }
    catch(e){ toast("Uyuşmadı. Hatırlamıyorsan yeni bir soru belirle.", "err"); }
  },
  async yedekAl(){ const r = await yedekAl(); if(r !== "cancel") toast("Yedek hazır. \"Dosyalar'a Kaydet\" ile iCloud Drive'a kaydet."); render(true); },
  yedekSec(){ if(!$("bk-sec").value) return toast(ui.yedekCevap ? "Önce kurtarma cevabını yaz." : "Önce yedeğin PIN'ini yaz.", "err"); $("bk-file").value = ""; $("bk-file").click(); }
};
// Hiçbir kayda bağlı olmayan (yarım kalmış yüklemelerden kalan) şifreli dosyaları temizler
async function yetimTemizle(){
  try {
    const keys = await rq((await os("foto", "readonly")).getAllKeys()); if(!data) return;
    const ref = new Set(tumBelgeIdleri()); Object.values(geciciBelge).forEach((L) => (L || []).forEach((b) => ref.add(b.id)));
    for(const k of keys) if(!ref.has(k)) await fotoDel(k);
  } catch(e){}
}
function tanikYeni(ad, unvan){ const w = { id: uid("w"), ad, unvan: unvan || "", durum: "", not: "", t: nowIso() }; data.taniklar.push(w); return w; }
function syncGeciciAd(k){ $("view").querySelectorAll("[data-belge-ad]").forEach((n) => { const b = (geciciBelge[k] || []).find((x) => x.id === n.dataset.belgeAd); if(b) b.ad = n.value.trim(); }); }
async function geciciBelgeTemizle(){ for(const k of Object.keys(geciciBelge)){ for(const b of geciciBelge[k] || []) await fotoDel(b.id).catch(() => {}); geciciBelge[k] = []; } }

// Tıklama: iki adımlı onay (data-confirm) ve eylemler
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-act]"); if(!el || !data || el.closest("#lock")) return;
  if(el.dataset.confirm && !el.dataset.armed){
    el.dataset.armed = "1"; el.dataset.orig = el.innerHTML; el.textContent = el.dataset.confirm; el.classList.add("armed");
    setTimeout(() => { if(el.isConnected && el.dataset.armed){ delete el.dataset.armed; el.innerHTML = el.dataset.orig; el.classList.remove("armed"); } }, 5000);
    return;
  }
  const f = ACT[el.dataset.act]; if(f) f(el, ev);
});
document.addEventListener("change", async (ev) => {
  if(!data) return;
  const t = ev.target;
  if(t.dataset && t.dataset.actChg){ data.ayar[t.dataset.actChg] = t.checked; save(); return; }
  if(t.id === "dosyaSec"){ await dosyalarGeldi([...t.files]); return; }
  if(t.id === "bk-file"){
    const f = t.files[0]; if(!f) return; toast("Yedek açılıyor…");
    try { const r = await yedekYukle(f, $("bk-sec").value, ui.yedekCevap); toast(r.tam ? `Yedek geri yüklendi: ${r.k} kayıt, ${r.b} başvuru.` : `${r.k} kayıt ve ${r.b} başvuru eklendi.`, "ok"); render(); }
    catch(e){ toast(e && e.kod === "cakisma" ? "Bu yedek başka bir defterden; numaralar çakıştığı için birleştirilmedi." : "Yedek açılamadı. PIN/cevap yanlış ya da dosya bu uygulamanın yedeği değil.", "err"); }
    return;
  }
  if(t.id === "k-kisi"){ ui.kKisi = t.value; kayitListesi(); }
  if(t.id === "k-grup"){ ui.kGrup = t.value; kayitListesi(); }
  if(t.id === "bf-tur"){ bfTopla(); ui.bf.sure = turBul(ui.bf.tur).sure; render(true); }
  if(t.id === "hs-tur" || t.id === "hs-tarih"){ ui.hs = { tur: $("hs-tur").value, tarih: $("hs-tarih").value || today(), not: $("hs-not").value }; render(true); }
  if(["rp-bas", "rp-bit", "rp-kisi", "rp-foto", "rp-saglik"].includes(t.id)){ rpTopla(); render(true); }
  if(t.id === "dl-tur"){ ui.dl.tur = t.value; ui.dl.makam = ""; ui.dl.metin = ""; render(true); }
  if(cur.p === "yeni" && t.dataset && t.dataset.f === "davranis"){ wizTopla(); render(true); }
});
document.addEventListener("input", (ev) => { if(ev.target.id === "k-ara"){ ui.kSearch = ev.target.value; kayitListesi(); } });

// Dosya seçici (tek, gizli)
let belgeHedef = "";
(function(){ const f = document.createElement("input"); f.type = "file"; f.id = "dosyaSec"; f.multiple = true; f.accept = "image/*,application/pdf"; f.hidden = true; document.body.appendChild(f); })();
async function dosyalarGeldi(files){
  if(!files.length) return;
  toast("Belgeler hazırlanıyor…");
  const L = await belgeleriAl(files);
  if(belgeHedef === "taslak"){ const t = wizTopla(); t.belgeler.push(...L); save(); }
  else { geciciBelge[belgeHedef] = (geciciBelge[belgeHedef] || []); syncGeciciAd(belgeHedef); geciciBelge[belgeHedef].push(...L); }
  render(true); if(L.length) toast(`${L.length} belge eklendi.`);
}
