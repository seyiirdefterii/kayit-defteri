"use strict";
/* =====================================================================
   MKD · Rapor, mühür, e-posta özeti ve dilekçe metinleri
   ===================================================================== */

function profilAd(){ return data.profil.ad || "[Ad Soyad]"; }
function kayitDurum(r){ return r.geriCekme ? `Geri çekildi (${trStamp(r.geriCekme.t)})` : "Kesin"; }

/* ---------- Tek kaydın e-posta özeti ---------- */
function kayitOzetMetni(r){
  const k = katBul(r.kategori), p = data.profil;
  const satir = (a, b) => b ? `${a}: ${b}\n` : "";
  let m = `MOBBİNG KAYIT DEFTERİ (MKD) · KAYIT ÖZETİ\n\n`;
  m += satir("Kayıt no", noStr(r.no)) + satir("Kaydı tutan", p.ad || p.hitap || "") + satir("Olay tarihi", `${trLong(r.olayZamani)} ${r.olayZamani.slice(11, 16)}`) + satir("Yer", r.yer);
  m += satir("Kişi", r.kisi + (r.rol ? ` (${r.rol})` : "")) + satir("Davranış grubu", k.ad) + satir("Davranış", r.davranis) + satir("Şiddet", r.siddet ? `${r.siddet}/5 (${SEV_AD[r.siddet]})` : "");
  m += `\nOlayın anlatımı:\n${r.ne}\n`;
  if(r.soz) m += `\nAynen söylenen söz:\n"${r.soz}"\n`;
  m += "\n" + satir("Tanıklar", r.tanikAd) + satir("Diğer kanıtlar", r.kanit) + satir("İşine etkisi", r.etkiIs);
  if(r.belgeler.length) m += satir("Belgeler", `${r.belgeler.length} dosya (${r.belgeler.map((b) => b.ad || (b.tur === "pdf" ? "PDF" : "fotoğraf")).join(", ")}) · uygulamada şifreli saklanıyor`);
  (r.ekler || []).forEach((e) => { m += `\n${e.tur === "duzeltme" ? "DÜZELTME" : "EK"} (${trStamp(e.t)}):\n${e.metin}\n`; });
  if(r.geriCekme) m += `\nGERİ ÇEKİLDİ (${trStamp(r.geriCekme.t)}): ${r.geriCekme.gerekce}\n`;
  m += `\n` + satir("Taslak başlangıcı", trStamp(r.taslakBaslangic)) + satir("Kesinleşme", trStamp(r.kesinlesme)) + satir("Bu özetin hazırlandığı an", trStamp(nowIso()));
  m += `\n— Bu özet MKD uygulamasında kesinleşmiş ve değiştirilemeyen kayıttan hazırlanmıştır. Kayıt numaraları kesintisizdir. Bu e-postayı silmeyin; kaydın bu tarihte var olduğunu gösterir.`;
  return { konu: `${noStr(r.no)} · ${trDate(r.olayZamani)} tarihli olay kaydı`, metin: m };
}

/* ---------- Ortak rapor parçaları ---------- */
const runHead = (baslik, no) => `<div class="p-runhead"><span>${esc(baslik)} · ${esc(profilAd())}</span><span>${esc(no)}</span></div>`;
function evBlock(r, ekMap, opt){
  const k = katBul(r.kategori), g = gecikme(r);
  const rows = [["Olay tarihi / saati", `${trDate(r.olayZamani)} ${r.olayZamani.slice(11, 16)} (${GUNLER[s2d(r.olayZamani).getUTCDay()]})`], ["Yer", r.yer], ["Kişi", r.kisi + (r.rol ? " (" + r.rol + ")" : "")],
    ["Davranış grubu", k.ad], ["Davranış", r.davranis], ["Şiddet", r.siddet ? `${r.siddet} / 5 (${SEV_AD[r.siddet]})` : ""],
    ["Olayın anlatımı", r.ne], ["Aynen söylenen söz", r.soz ? `"${r.soz}"` : ""], ["Tanıklar", r.tanikAd], ["Diğer kanıtlar", r.kanit],
    ["Ekler", r.belgeler.map((b) => `${ekMap.get(b.id) || (b.tur === "pdf" ? "PDF" : "Fotoğraf")}${b.ad ? " (" + b.ad + ")" : ""}`).join(", ")],
    ["İşine etkisi", r.etkiIs], ["Sağlığına etkisi", opt.saglik ? r.etkiSaglik : ""],
    ["Taslak başlangıcı", trStamp(r.taslakBaslangic)], ["Kesinleşme", `${trStamp(r.kesinlesme)} · ${g.txt}`],
    ["Dış kopya", (r.gonderimler || []).map((x) => `${trStamp(x.t)} ${x.kime}`).join("; ")],
    ["Not", r.oncekiSurum ? "Bu kayıt MKD öncesindeki, kayıtların düzenlenebildiği sürümde oluşturulmuştur." : ""]];
  let h = `<div class="p-ev${r.geriCekme ? " p-geri" : ""}"><div class="p-ev-h"><span>${noStr(r.no)}${r.geriCekme ? " · GERİ ÇEKİLDİ" : ""}</span><span>${trDate(r.olayZamani)} ${r.olayZamani.slice(11, 16)}</span></div>
    <table>${rows.filter((x) => x[1]).map(([a, b]) => `<tr><td>${a}</td><td>${esc(b)}</td></tr>`).join("")}</table>`;
  (r.ekler || []).forEach((e) => { h += `<div class="p-ek-kayit"><b>${e.tur === "duzeltme" ? "Düzeltme" : "Ek bilgi"} · ${trStamp(e.t)}</b><br>${esc(e.metin)}${(e.belgeler || []).length ? `<br><i>Ekler: ${e.belgeler.map((b) => ekMap.get(b.id) || "belge").join(", ")}</i>` : ""}</div>`; });
  if(r.geriCekme) h += `<div class="p-ek-kayit"><b>Geri çekildi · ${trStamp(r.geriCekme.t)}</b><br>Gerekçe: ${esc(r.geriCekme.gerekce)}</div>`;
  return h + `</div>`;
}
function dizinTablo(){
  return `<table class="p-tbl"><thead><tr><th>No</th><th>Olay tarihi</th><th>Kesinleşme</th><th>Kişi</th><th>Davranış</th><th>Ek</th><th>Durum</th></tr></thead><tbody>
    ${data.records.slice().sort((a, b) => a.no - b.no).map((r) => `<tr><td>${noStr(r.no)}</td><td>${trDate(r.olayZamani)} ${r.olayZamani.slice(11, 16)}</td><td>${trStamp(r.kesinlesme)}</td><td>${esc(r.kisi)}</td><td>${esc(shorten(r.davranis, 60))}</td><td>${(r.ekler || []).length || "–"}</td><td>${kayitDurum(r)}</td></tr>`).join("")}</tbody></table>`;
}
function isleyisHtml(){ const d = document.createElement("div"); d.appendChild($("tpl-isleyis").content.cloneNode(true)); d.querySelector("h3").remove(); return d.innerHTML; }

/* ---------- Olay dosyası ---------- */
async function buildReport(){
  const R = raporKayitlari(), opt = ui.rp || { foto: true, saglik: true }, p = data.profil;
  const now = new Date(), fileNo = `MKD-OD-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const run = runHead("Olay Dosyası", fileNo), aktif = R.filter((r) => !r.geriCekme);
  const ekler = []; R.forEach((r) => { r.belgeler.forEach((b) => ekler.push({ r, b })); (r.ekler || []).forEach((e) => (e.belgeler || []).forEach((b) => ekler.push({ r, b, ek: e }))); });
  ekler.forEach((e, i) => { e.no = "Ek-" + (i + 1); });
  const ekMap = new Map(ekler.map((e) => [e.b.id, e.no]));
  const donem = R.length ? `${trDate(R[0].olayZamani)} – ${trDate(R[R.length - 1].olayZamani)}` : "–";
  const s = sistematik(aktif);
  let h = `<section class="p-page p-cover"><div><p class="p-brand">MKD · MOBBİNG KAYIT DEFTERİ</p>
    <h1>İŞYERİNDE PSİKOLOJİK TACİZ (MOBBİNG)<br>OLAY DOSYASI</h1><p class="sub">Kronolojik olay kayıtları, sistematiklik tablosu, tanık ve başvuru listeleri ile ekler</p>
    <table class="p-meta"><tr><td>Hazırlayan</td><td>${esc(profilAd())}</td></tr><tr><td>Unvanı</td><td>${esc(p.unvan || "–")}</td></tr>${p.sicil ? `<tr><td>Sicil No</td><td>${esc(p.sicil)}</td></tr>` : ""}
      <tr><td>Kurumu / Birimi</td><td>${esc(p.kurum || "–")}${p.birim ? " / " + esc(p.birim) : ""}</td></tr><tr><td>Kapsadığı dönem</td><td>${donem}</td></tr>
      <tr><td>Rapordaki kayıt</td><td>${R.length} (${R.length - aktif.length} geri çekilmiş)</td></tr><tr><td>Defterdeki toplam kayıt</td><td>${data.sayac} (${noStr(1)} – ${noStr(data.sayac)}, kesintisiz)</td></tr>
      <tr><td>Ek sayısı</td><td>${ekler.length}</td></tr><tr><td>Dosya No</td><td>${fileNo}</td></tr><tr><td>Hazırlanma</td><td>${trStamp(now.toISOString())}</td></tr></table></div>
    <div class="p-conf"><b>GİZLİDİR</b> — Bu dosya kişisel veriler içerir. Yalnızca yetkili merciler ve hukuki temsilci tarafından incelenmek üzere hazırlanmıştır.</div></section>`;
  const B = ["Açıklamalar", "Özet", "Sistematiklik", "Zaman çizelgesi", "Olay çizelgesi", "Olay ayrıntıları", "Tanık listesi", "Başvurular ve süreler", "Dış kopya ve mühür kayıtları", "Defter dizini", "Ekler", "Beyan", "Uygulamanın işleyişi"];
  h += `<section class="p-page">${run}<h2 class="p-h">İÇİNDEKİLER</h2><table class="p-toc">${B.map((b, i) => `<tr><td>${i + 1}. ${b}</td></tr>`).join("")}</table></section>`;
  h += `<section class="p-page">${run}<h2 class="p-h">1. AÇIKLAMALAR</h2>
    <p>Bu dosyadaki kayıtlar, MKD uygulamasında olaylar yaşandıkça tutulmuştur. Her kayıt yazılırken taslaktır; kullanıcı kaydı kesinleştirdiğinde bir sıra numarası (MKD-0001 biçiminde) ve kesinleşme anı verilir ve kayıt kilitlenir. Kesinleşmiş kayıt uygulama içinden değiştirilemez ve silinemez. Sonradan yapılan düzeltme ve eklemeler, asıl metin korunarak kendi tarih ve saatiyle "Düzeltme" veya "Ek bilgi" olarak gösterilmiştir. Yanlışlıkla girildiği için geri çekilen kayıtlar silinmemiş, gerekçesiyle birlikte dosyada bırakılmıştır.</p>
    <p>"Olay tarihi" olayın yaşandığı zamanı, "Kesinleşme" kaydın kilitlendiği anı gösterir. "Dış kopya" kaydın e-postayla gönderildiği zamanları; "Mühür" kayıtların dosya hâlinde dışarıya gönderildiği zamanları gösterir. Davranış grupları Heinz Leymann'ın sınıflamasına dayanır. Uygulamanın işleyişi ve sınırları son bölümde ayrıca açıklanmıştır.</p></section>`;
  const kisiler = kisiBazli(aktif);
  h += `<section class="p-page">${run}<h2 class="p-h">2. ÖZET</h2>
    <table class="p-tbl"><tbody><tr><th>Kayıt (geri çekilenler hariç)</th><td>${aktif.length}</td><th>Kapsadığı dönem</th><td>${donem}</td></tr>
      <tr><th>Tanıklı kayıt</th><td>${s ? s.tanikli : 0}</td><th>Belgeli kayıt</th><td>${s ? s.belgeli : 0}</td></tr>
      <tr><th>Olay günü kesinleşen</th><td>${s ? s.ayniGun : 0}</td><th>Ortalama şiddet (1–5)</th><td>${s && s.ortSiddet ? s.ortSiddet.toFixed(1) : "–"}</td></tr></tbody></table>
    <p><b>Kişilere göre</b></p><table class="p-tbl"><thead><tr><th>Ad soyad</th><th>Görevi</th><th>Kayıt</th><th>İlk</th><th>Son</th></tr></thead><tbody>
      ${kisiler.map((x) => `<tr><td>${esc(x.kisi)}</td><td>${esc(x.rol || "–")}</td><td>${x.s.n}</td><td>${trDate(x.s.ilk)}</td><td>${trDate(x.s.son)}</td></tr>`).join("")}</tbody></table>
    <p><b>Davranış gruplarına göre</b></p><table class="p-tbl"><thead><tr><th>Grup (Leymann)</th><th>Kayıt</th></tr></thead><tbody>
      ${s ? Object.entries(s.grup).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(katBul(k).ad)}</td><td>${v}</td></tr>`).join("") : ""}</tbody></table></section>`;
  const aylar = {}; aktif.forEach((r) => { const a = r.olayZamani.slice(0, 7); aylar[a] = (aylar[a] || 0) + 1; });
  h += `<section class="p-page">${run}<h2 class="p-h">3. SİSTEMATİKLİK</h2>${s ? `
    <table class="p-tbl"><tbody><tr><th>İlk ve son olay arası</th><td>${s.gun} gün</td><th>Olay görülen hafta</th><td>${s.hafta} / ${s.hSpan} (%${Math.round(s.siklikYuzde * 100)})</td></tr>
    <tr><th>En uzun kesintisiz seri</th><td>${s.enUzun} hafta</td><th>Leymann süre ölçütü (≥ 6 ay)</th><td>${s.gun >= 182 ? "Karşılanıyor" : `${182 - s.gun} gün eksik`}</td></tr></tbody></table>
    <p><b>Kişi bazında</b></p><table class="p-tbl"><thead><tr><th>Kişi</th><th>Kayıt</th><th>Süre (gün)</th><th>Olaylı hafta</th><th>En uzun seri</th><th>Farklı grup</th></tr></thead><tbody>
    ${kisiler.map((x) => `<tr><td>${esc(x.kisi)}</td><td>${x.s.n}</td><td>${x.s.gun}</td><td>${x.s.hafta} / ${x.s.hSpan}</td><td>${x.s.enUzun}</td><td>${Object.keys(x.s.grup).length}</td></tr>`).join("")}</tbody></table>
    <p><b>Aylara göre</b></p><table class="p-tbl"><thead><tr><th>Ay</th><th>Kayıt</th></tr></thead><tbody>${Object.keys(aylar).sort().map((a) => `<tr><td>${AYLAR[+a.slice(5) - 1]} ${a.slice(0, 4)}</td><td>${aylar[a]}</td></tr>`).join("")}</tbody></table>
    <p class="p-note">Bu tablo kayıtlardan hesaplanmıştır; hukuki bir değerlendirme değildir. Leymann ölçütü: davranışların en az 6 ay boyunca en az haftada bir tekrarlanması.</p>` : "<p>Kayıt yok.</p>"}</section>`;
  const Z = []; R.forEach((r) => Z.push([r.olayZamani, `${noStr(r.no)}`, `${r.kisi}: ${r.davranis}${r.geriCekme ? " (geri çekildi)" : ""}`]));
  data.basvurular.forEach((b) => { Z.push([b.tarih + "T12:00", `B-${pad(b.no, 3)}`, `Başvuru: ${turBul(b.tur).ad}${b.kurum ? " · " + b.kurum : ""}${b.sayi ? " · No " + b.sayi : ""}`]); (b.gelismeler || []).forEach((g) => Z.push([g.tarih + "T12:01", `B-${pad(b.no, 3)}`, `${gelismeBul(g.tur).ad}${g.metin ? ": " + shorten(g.metin, 120) : ""}`])); });
  Z.sort((a, b) => a[0].localeCompare(b[0]));
  h += `<section class="p-page">${run}<h2 class="p-h">4. ZAMAN ÇİZELGESİ</h2><table class="p-tbl"><thead><tr><th>Tarih</th><th>No</th><th>Olay / süreç</th></tr></thead><tbody>
    ${Z.map((z) => `<tr><td>${trDate(z[0])}</td><td>${z[1]}</td><td>${esc(z[2])}</td></tr>`).join("")}</tbody></table></section>`;
  h += `<section class="p-page">${run}<h2 class="p-h">5. OLAY ÇİZELGESİ</h2><table class="p-tbl"><thead><tr><th>No</th><th>Tarih</th><th>Saat</th><th>Kişi</th><th>Davranış</th><th>Şiddet</th><th>Kesinleşme</th></tr></thead><tbody>
    ${R.map((r) => `<tr><td>${noStr(r.no)}</td><td>${trDate(r.olayZamani)}</td><td>${r.olayZamani.slice(11, 16)}</td><td>${esc(r.kisi)}</td><td>${esc(r.davranis)}${r.geriCekme ? " <i>(geri çekildi)</i>" : ""}</td><td>${r.siddet || "–"}</td><td>${trStamp(r.kesinlesme)}</td></tr>`).join("")}</tbody></table></section>`;
  h += `<section class="p-page">${run}<h2 class="p-h">6. OLAY AYRINTILARI</h2>${R.map((r) => evBlock(r, ekMap, opt)).join("")}</section>`;
  const tk = {}; R.forEach((r) => { const adlar = r.tanikIds.length ? r.tanikIds.map((id) => (tanikBul(id) || {}).ad).filter(Boolean) : (r.tanikAd || "").split(/[,;]/).map((x) => x.trim()).filter(Boolean); adlar.forEach((a) => { (tk[a] = tk[a] || []).push(noStr(r.no)); }); });
  h += `<section class="p-page">${run}<h2 class="p-h">7. TANIK LİSTESİ</h2>${Object.keys(tk).length ? `<table class="p-tbl"><thead><tr><th>Tanık</th><th>Unvanı / ilişkisi</th><th>Tanık olduğu kayıtlar</th><th>Sayı</th></tr></thead><tbody>
    ${Object.entries(tk).sort((a, b) => b[1].length - a[1].length).map(([a, l]) => `<tr><td>${esc(a)}</td><td>${esc((data.taniklar.find((w) => w.ad === a) || {}).unvan || "–")}</td><td>${l.join(", ")}</td><td>${l.length}</td></tr>`).join("")}</tbody></table>` : "<p>Kayıtlarda tanık belirtilmemiştir.</p>"}</section>`;
  const A = data.basvurular.slice().sort((a, b) => a.tarih.localeCompare(b.tarih));
  h += `<section class="p-page">${run}<h2 class="p-h">8. BAŞVURULAR VE SÜRELER</h2>${A.length ? A.map((b) => `<div class="p-ev"><div class="p-ev-h"><span>B-${pad(b.no, 3)} · ${esc(turBul(b.tur).ad)}</span><span>${trDate(b.tarih)}</span></div><table>
    ${[["Merci", b.kurum], ["Evrak no", b.sayi], ["Konu", b.konu], ["Dayanak", turBul(b.tur).kaynak], ["Durum", basvuruDurum(b).t], ["Kayda geçti", trStamp(b.kayitZamani)]].filter((x) => x[1]).map(([a, v]) => `<tr><td>${a}</td><td>${esc(v)}</td></tr>`).join("")}
    ${(b.gelismeler || []).map((g) => `<tr><td>${trDate(g.tarih)}</td><td>${esc(gelismeBul(g.tur).ad)}${g.metin ? ": " + esc(g.metin) : ""}</td></tr>`).join("")}
    ${basvuruSureleri(b).map((x) => `<tr><td>Süre</td><td>${esc(x.ad)}: ${trDate(x.son)} (${esc(x.kaynak || "takip")}) · ${sureDurum(x).txt}</td></tr>`).join("")}</table></div>`).join("") : "<p>Kayıtlı başvuru bulunmamaktadır.</p>"}</section>`;
  const G = data.records.flatMap((r) => (r.gonderimler || []).map((g) => [g.t, noStr(r.no), g.kime, g.yol])).sort((a, b) => a[0].localeCompare(b[0]));
  h += `<section class="p-page">${run}<h2 class="p-h">9. DIŞ KOPYA VE MÜHÜR KAYITLARI</h2>
    <p><b>Mühürler</b></p>${data.muhurler.length ? `<table class="p-tbl"><thead><tr><th>Zaman</th><th>Kapsam</th><th>Kayıt</th><th>Yol</th></tr></thead><tbody>${data.muhurler.map((m) => `<tr><td>${trStamp(m.t)}</td><td>${noStr(m.ilkNo)} – ${noStr(m.sonNo)}</td><td>${m.adet}</td><td>${esc(m.yol)}</td></tr>`).join("")}</tbody></table>` : "<p>Mühür kaydı yok.</p>"}
    <p><b>Kayıt bazında gönderimler</b></p>${G.length ? `<table class="p-tbl"><thead><tr><th>Zaman</th><th>Kayıt</th><th>Alıcı</th><th>Yol</th></tr></thead><tbody>${G.map((g) => `<tr><td>${trStamp(g[0])}</td><td>${g[1]}</td><td>${esc(g[2])}</td><td>${esc(g[3])}</td></tr>`).join("")}</tbody></table>` : "<p>Gönderim kaydı yok.</p>"}
    <p class="p-note">Uygulama, gönderim ekranının açıldığı anı not eder. Gönderimin kendisi ve tarihi, kullanıcının e-posta hesabındaki iletiyle doğrulanabilir.</p></section>`;
  h += `<section class="p-page">${run}<h2 class="p-h">10. DEFTER DİZİNİ</h2><p>Defterdeki tüm kayıtlar numara sırasıyla aşağıdadır (rapor filtresinden bağımsız). Numaralar 1'den ${data.sayac}'e kadar kesintisizdir.</p>${dizinTablo()}</section>`;
  h += `<section class="p-page">${run}<h2 class="p-h">11. EKLER</h2>${ekler.length ? `<table class="p-tbl"><thead><tr><th>Ek no</th><th>İlgili kayıt</th><th>Tür</th><th>Açıklama</th><th>Eklenme</th></tr></thead><tbody>
    ${ekler.map((e) => `<tr><td>${e.no}</td><td>${noStr(e.r.no)}${e.ek ? " (sonradan ek)" : ""}</td><td>${e.b.tur === "pdf" ? "PDF" : "Fotoğraf"}</td><td>${esc(e.b.ad || "–")}</td><td>${trStamp(e.b.eklenme)}</td></tr>`).join("")}</tbody></table>
    ${ekler.some((e) => e.b.tur === "pdf") ? `<p class="p-note">PDF ekleri bu dosyaya gömülmemiştir; uygulamadan ayrıca çıktı alınarak dosyaya eklenmelidir.</p>` : ""}` : "<p>Ek bulunmamaktadır.</p>"}</section>`;
  if(opt.foto) for(const e of ekler.filter((x) => x.b.tur === "img")){
    const src = await belgeDataUrl(e.b.id).catch(() => null);
    if(src) h += `<section class="p-page">${run}<div class="p-ek"><img src="${src}" alt=""><p class="cap"><b>${e.no}</b> · ${noStr(e.r.no)} numaralı kayıt (${trDate(e.r.olayZamani)}) · ${esc(e.b.ad || "Fotoğraf")}</p></div></section>`;
  }
  h += `<section class="p-page">${run}<h2 class="p-h">12. BEYAN</h2>
    <p>Bu dosyada yer alan kayıtların, yaşadığım olaylara ilişkin olarak olayların yaşandığı tarihlerde ya da bu tarihlere yakın zamanlarda tarafımdan tutulduğunu ve bildiğim kadarıyla gerçeği yansıttığını beyan ederim.</p>
    <p class="p-note">Ekler olaylarla ilgili ekran görüntüsü ve belge görüntüleridir. Gizlilik amacıyla fotoğrafların konum ve cihaz bilgileri kaldırılmıştır. İstenmesi hâlinde asılları ibraz edilebilir.</p>
    <div class="p-sign"><div>${esc(profilAd())}<br>${esc(p.unvan || "")}<br><br>Tarih: ${now.toLocaleDateString("tr-TR")}<br><br>İmza</div></div></section>`;
  h += `<section class="p-page">${run}<h2 class="p-h">13. UYGULAMANIN İŞLEYİŞİ</h2><div class="p-isleyis">${isleyisHtml()}</div></section>`;
  return { html: h, fileNo };
}

async function waitImages(box){ await Promise.all([...box.querySelectorAll("img")].map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))); }
async function printHtml(html){
  const box = $("print"); box.innerHTML = html; await waitImages(box);
  const clear = () => { box.textContent = ""; window.removeEventListener("afterprint", clear); };
  window.addEventListener("afterprint", clear);
  try { window.print(); } catch(e){ return false; }
  return true;
}
function standaloneDoc(title, body){
  const css = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch(e){ return []; } })
    .filter((r) => r.type === CSSRule.MEDIA_RULE && r.conditionText === "print").map((r) => [...r.cssRules].map((x) => x.cssText).join("\n")).join("\n");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>@page{size:A4;margin:16mm 15mm 18mm} body{margin:0;background:#fff;color:#000} #print{display:block!important;font-family:"Times New Roman",Georgia,serif;line-height:1.4;max-width:190mm;margin:0 auto;padding:10mm}
${css.replace(/body\s*>\s*\*?:not\(#print\)\s*\{[^}]*\}/g, "")}
@media screen{.p-page{border-bottom:2px dashed #999;padding-bottom:10mm;margin-bottom:10mm}}</style></head><body><div id="print">${body}</div></body></html>`;
}
async function raporYazdir(){
  if(!raporKayitlari().length) return toast("Seçilen aralıkta kayıt yok.", "err");
  toast("Rapor hazırlanıyor…");
  const { html } = await buildReport();
  if(!(await printHtml(html))) toast("Yazdırma açılamadı. \"Dosya olarak paylaş\"ı dene.", "err");
}
async function raporPaylas(){
  if(!raporKayitlari().length) return toast("Seçilen aralıkta kayıt yok.", "err");
  toast("Dosya hazırlanıyor…");
  const { html, fileNo } = await buildReport();
  const r = await shareFile(`${fileNo}.html`, standaloneDoc("Olay Dosyası " + fileNo, html), "text/html");
  if(r !== "cancel") toast("Dosya hazır. Dosyalar'da açıp Paylaş › Yazdır diyebilirsin.");
}

/* ---------- Mühür ---------- */
function muhurKapsam(){
  const son = data.muhurler.slice(-1)[0], bas = son ? son.sonNo + 1 : 1;
  const yeni = data.records.filter((r) => r.no >= bas).sort((a, b) => a.no - b.no);
  const ekSonra = son ? data.records.filter((r) => r.no < bas && ((r.ekler || []).some((e) => e.t > son.t) || (r.geriCekme && r.geriCekme.t > son.t))) : [];
  return { son, bas, yeni, ekSonra };
}
function muhurBelgesi(K, t){
  const run = runHead("Mühür", "MKD-M-" + t.replace(/[-:T]/g, "").slice(0, 12)), ekMap = new Map();
  let h = `<section class="p-page">${run}<p class="p-brand">MKD · MOBBİNG KAYIT DEFTERİ</p><h1 class="p-mh">KAYIT MÜHRÜ</h1>
    <table class="p-meta"><tr><td>Kaydı tutan</td><td>${esc(profilAd())}</td></tr><tr><td>Mühür anı</td><td>${trStamp(t)}</td></tr>
    <tr><td>Yeni kayıtlar</td><td>${K.yeni.length ? `${noStr(K.yeni[0].no)} – ${noStr(K.yeni[K.yeni.length - 1].no)} (${K.yeni.length} kayıt)` : "Yok"}</td></tr>
    <tr><td>Defterdeki toplam kayıt</td><td>${data.sayac} (${noStr(1)} – ${noStr(data.sayac)})</td></tr><tr><td>Önceki mühür</td><td>${K.son ? trStamp(K.son.t) : "Yok (ilk mühür)"}</td></tr></table>
    <p>Bu dosya, belirtilen anda MKD uygulamasında bulunan kayıtların dizinini ve son mühürden bu yana eklenen kayıtların tam metnini içerir. Dosyanın gönderildiği e-postanın tarihi, kayıtların bu tarihte var olduğunu gösterir. Lütfen bu e-postayı silmeyin.</p></section>`;
  h += `<section class="p-page">${run}<h2 class="p-h">DEFTER DİZİNİ</h2>${dizinTablo()}</section>`;
  if(K.yeni.length) h += `<section class="p-page">${run}<h2 class="p-h">YENİ KAYITLAR</h2>${K.yeni.map((r) => evBlock(r, ekMap, { saglik: true })).join("")}</section>`;
  if(K.ekSonra.length) h += `<section class="p-page">${run}<h2 class="p-h">ÖNCEKİ KAYITLARA SONRADAN EKLENENLER</h2>${K.ekSonra.map((r) => evBlock(r, ekMap, { saglik: true })).join("")}</section>`;
  return h;
}
function muhurKaydet(K, t, yol){
  data.muhurler.push({ id: uid("m"), t, ilkNo: K.bas, sonNo: Math.max(data.sayac, K.son ? K.son.sonNo : 0), adet: K.yeni.length, yol });
  gunlukEkle("muhur", `Mühürlendi: ${K.yeni.length} yeni kayıt (${yol})`); save();
}
async function muhurle(){
  const K = muhurKapsam(), t = nowIso();
  if(!K.yeni.length && !K.ekSonra.length) return toast("Mühürlenecek yeni bir şey yok.");
  const ad = `MKD-muhur-${localDateOf(t).replace(/-/g, "")}-${pad(new Date(t).getHours())}${pad(new Date(t).getMinutes())}.html`;
  const r = await shareFile(ad, standaloneDoc("MKD Kayıt Mührü", muhurBelgesi(K, t)), "text/html",
    `MKD kayıt mührü · ${trStamp(t)} · ${K.yeni.length} yeni kayıt, defterde toplam ${data.sayac} kayıt. Bu e-postayı silmeyin.`);
  if(r === "cancel") return;
  muhurKaydet(K, t, r === "shared" ? "dosya paylaşıldı" : "dosya indirildi");
  toast(r === "shared" ? "Mühür kaydedildi." : "Dosya indirildi; e-postana ekleyip kendine gönder.");
  render(true);
}
function muhurMetin(){
  const K = muhurKapsam(), t = nowIso(), to = data.profil.eposta;
  if(!to){ toast("Önce Profil'den kendi e-posta adresini gir.", "err"); return go("profil"); }
  let m = `MKD KAYIT MÜHRÜ · ${trStamp(t)}\nKaydı tutan: ${profilAd()}\nDefterdeki toplam kayıt: ${data.sayac}\n\nDİZİN (no | olay | kesinleşme | kişi | davranış | durum)\n`;
  data.records.slice().sort((a, b) => a.no - b.no).forEach((r) => { m += `${noStr(r.no)} | ${trDate(r.olayZamani)} ${r.olayZamani.slice(11, 16)} | ${trStamp(r.kesinlesme)} | ${r.kisi} | ${shorten(r.davranis, 50)} | ${kayitDurum(r)}${(r.ekler || []).length ? ` | ${r.ekler.length} ek` : ""}\n`; });
  K.yeni.forEach((r) => { m += `\n----------\n` + kayitOzetMetni(r).metin + "\n"; });
  m += `\n— Bu e-posta MKD uygulamasından hazırlanmıştır. Silmeyin.`;
  muhurKaydet(K, t, "e-posta metni (" + to + ")");
  mailAc(to, `MKD kayıt mührü · ${trDate(localDateOf(t))} · ${data.sayac} kayıt`, m);
  render(true);
}

/* ---------- Dilekçe şablonları ---------- */
const SABLONLAR = [
  { k: "kurum", sek: "kamu", ad: "Kurum içi şikâyet dilekçesi", makam: (p) => `${p.kurum ? p.kurum.toLocaleUpperCase("tr") + " " : ""}[MÜDÜRLÜĞÜNE / BAŞHEKİMLİĞİNE]`, bilgi: "657 sayılı Kanun md. 21 gereği şikâyet amir sırasıyla yapılır. Dilekçeni evrak kaydına sokup sayı al ve Süreçler'e başvuru olarak ekle." },
  { k: "isveren", sek: "ozel", ad: "İşverene yazılı bildirim", makam: (p) => `${p.kurum ? p.kurum.toLocaleUpperCase("tr") + " " : "[ŞİRKET UNVANI] "}İNSAN KAYNAKLARI MÜDÜRLÜĞÜNE`, bilgi: "Bildirimi e-posta, KEP ya da noter aracılığıyla gönderirsen tarihi ispat edilebilir olur. Bir kopyasını sakla." },
  { k: "cimer", ad: "CİMER başvuru metni", makam: () => "CUMHURBAŞKANLIĞI İLETİŞİM MERKEZİ (CİMER)", bilgi: "CİMER başvurusu cimer.gov.tr üzerinden e-Devlet ile yapılır. Metni oradaki açıklama alanına yapıştırabilirsin." },
  { k: "kdk", sek: "kamu", ad: "Kamu Denetçiliği Kurumu başvurusu", makam: () => "KAMU DENETÇİLİĞİ KURUMU BAŞKANLIĞINA", bilgi: "KDK'ya başvurmadan önce idareye başvurmuş olman gerekir (6328 s.K. md. 17). Başvuru ücretsizdir ve gizli tutulması istenebilir." },
  { k: "bilgi", ad: "Bilgi edinme başvurusu (belge talebi)", olaylar: false, makam: (p) => `${p.kurum ? p.kurum.toLocaleUpperCase("tr") + " " : ""}[BİLGİ EDİNME BİRİMİNE]`, bilgi: "Görevlendirme yazıları, nöbet listeleri gibi belgeleri isteyebilirsin. Kurum 15 iş günü içinde cevap verir (4982 s.K. md. 11)." }
];
function dilekceMetni(d){
  const t = d.tur, p = data.profil, all = kayitSirali(aktifKayitlar());
  let R = all; if(d.secim === "agir") R = R.filter((r) => (r.siddet || 0) >= 3); if(d.secim === "son5") R = R.slice(-5);
  const ad = profilAd(), unvan = p.unvan || "[Unvan]", birim = p.birim || "[Birim]", kurum = p.kurum || "[Kurum]";
  const kisiler = [...new Set(R.map((r) => r.kisi + (r.rol ? ` (${r.rol})` : "")))].join(", ") || "[ilgili kişi]";
  const ilk = all.length ? trDate(all[0].olayZamani) : "[tarih]", son = all.length ? trDate(all[all.length - 1].olayZamani) : "[tarih]";
  const satirlar = R.map((r) => `- ${noStr(r.no)} · ${trDate(r.olayZamani)} ${r.olayZamani.slice(11, 16)} · ${r.kisi}: ${r.davranis}. ${shorten(r.ne, 160)}${r.soz ? ` Söylenen söz: "${shorten(r.soz, 120)}"` : ""}${r.tanikAd ? ` (Tanık: ${r.tanikAd})` : ""}`).join("\n");
  const ekSay = all.reduce((a, r) => a + belgeSay(r), 0), tarih = new Date().toLocaleDateString("tr-TR");
  const imza = `${ad}\n${unvan}${p.sicil ? "\nSicil No: " + p.sicil : ""}\n${birim} / ${kurum}\nİmza:`;
  const ek = `EK: Kronolojik olay dosyası (${all.length} kayıt${ekSay ? ", " + ekSay + " belge" : ""})`;
  const makam = d.makam.trim();
  if(t === "kurum") return `${tarih}\n\n${makam}\n\nKonu: İşyerinde psikolojik taciz (mobbing) şikâyeti hk.\n\n${kurum} ${birim} biriminde ${unvan} olarak görev yapmaktayım. ${ilk} – ${son} tarihleri arasında, aşağıda özetlenen ve kayıt altına aldığım ${all.length} ayrı olayda ${kisiler} tarafından sistematik biçimde psikolojik tacize (mobbing) maruz kaldığımı düşünmekteyim.\n\nOlayların özeti:\n${satirlar}\n\nTüm olayların tarih sırasıyla ayrıntılı dökümü ve ilgili belgeler ekte sunulmuştur.\n\n2025/3 sayılı Cumhurbaşkanlığı Genelgesi ve 657 sayılı Devlet Memurları Kanunu'nun 21. maddesi çerçevesinde;\n1. Şikâyetimin incelenerek gerekli idari ve disiplin soruşturmasının başlatılmasını,\n2. İnceleme sürecinde gizliliğin korunmasını ve bu başvurum nedeniyle aleyhime herhangi bir işlem yapılmamasını,\n3. Psikolojik tacizin sona erdirilmesi için gerekli önlemlerin alınmasını,\n4. Başvurumla ilgili sonucun tarafıma yazılı olarak bildirilmesini\n\nsaygılarımla arz ederim.\n\n${imza}\n\n${ek}`;
  if(t === "isveren") return `${tarih}\n\n${makam}\n\nKonu: İşyerinde psikolojik taciz (mobbing) bildirimi ve önlem alınması talebi\n\nŞirketinizde ${birim} biriminde ${unvan} olarak çalışmaktayım. ${ilk} – ${son} tarihleri arasında, aşağıda özetlenen ${all.length} ayrı olayda ${kisiler} tarafından sistematik biçimde psikolojik tacize (mobbing) maruz kalmaktayım.\n\nOlayların özeti:\n${satirlar}\n\nTürk Borçlar Kanunu'nun 417. maddesi uyarınca işveren, işçilerin psikolojik tacize uğramamaları ve uğrayanların daha fazla zarar görmemeleri için gerekli önlemleri almakla yükümlüdür.\n\nBu nedenle;\n1. Bildirimimin incelenmesini,\n2. Psikolojik tacizin sona erdirilmesi için gerekli önlemlerin derhal alınmasını,\n3. Bu bildirimim nedeniyle aleyhime herhangi bir işlem yapılmamasını,\n4. Alınan önlemlerin tarafıma yazılı olarak bildirilmesini\n\ntalep eder, tüm yasal haklarımı saklı tuttuğumu bildiririm.\n\n${imza}\n\n${ek}`;
  if(t === "cimer") return `${kurum} ${birim} biriminde ${unvan} olarak görev yapmaktayım. ${ilk} – ${son} tarihleri arasında ${kisiler} tarafından ${all.length} ayrı olayda sistematik olarak psikolojik tacize (mobbing) maruz kaldım. Başlıca olaylar:\n${satirlar}\n\n2025/3 sayılı Cumhurbaşkanlığı Genelgesi kapsamında şikâyetimin incelenmesini, gerekli idari tedbirlerin alınmasını ve başvurumun gizli tutulmasını talep ederim. Olayların ayrıntılı kronolojik dökümü ve belgeler talep hâlinde sunulabilir.\n\n${ad}`;
  if(t === "bilgi") return `${tarih}\n\n${makam}\n\nKonu: 4982 sayılı Bilgi Edinme Hakkı Kanunu kapsamında belge talebi\n\n${kurum} ${birim} biriminde ${unvan} olarak görev yapmaktayım. 4982 sayılı Bilgi Edinme Hakkı Kanunu uyarınca, aşağıda belirtilen ve tarafımı ilgilendiren belgelerin onaylı birer örneğinin tarafıma verilmesini talep ederim:\n\n1. [tarih aralığı] dönemine ait birim çalışma / nöbet listelerinin tüm sürümleri,\n2. Hakkımda düzenlenen görevlendirme yazıları ve onaylarının tarih ve sayıları,\n3. [diğer belge]\n\nBilgilerin tarafıma [e-posta / posta / elden] yoluyla iletilmesini saygılarımla arz ederim.\n\n${imza}`;
  const idari = data.basvurular.filter((a) => ["sikayet", "dilekce"].includes(a.tur)).sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
  const idariMetin = idari ? `Bu konuda idareye ${trDate(idari.tarih)} tarihli${idari.sayi ? " ve " + idari.sayi + " sayılı" : ""} dilekçemle başvurdum. ${basvuruDurum(idari).t === "Cevap bekleniyor" ? "Başvuruma bugüne kadar cevap verilmemiştir." : "Başvuruma verilen cevap: [cevabı özetle]."}` : "Bu konuda idareye [tarih] tarihli ve [sayı] sayılı dilekçemle başvurdum. [Cevap verilmedi / verilen cevap].";
  return `${tarih}\n\n${makam}\n\nKonu: İşyerinde psikolojik taciz (mobbing) hakkında şikâyet\n\n${kurum} ${birim} biriminde ${unvan} olarak görev yapmaktayım. ${ilk} – ${son} tarihleri arasında ${kisiler} tarafından ${all.length} ayrı olayda sistematik olarak psikolojik tacize (mobbing) maruz kaldım.\n\nOlayların özeti:\n${satirlar}\n\n${idariMetin}\n\n6328 sayılı Kamu Denetçiliği Kurumu Kanunu uyarınca idarenin işlem ve eylemlerinin incelenmesini, gerekli tavsiye kararının verilmesini ve 17. madde uyarınca kimlik bilgilerimin gizli tutulmasını saygılarımla arz ederim.\n\n${imza}\n\n${ek}`;
}
