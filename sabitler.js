"use strict";
/* =====================================================================
   MKD · Sabitler: davranış grupları, başvuru türleri, süre kuralları, tatiller.
   Süreler Kasım 2026 itibarıyla mevzuattan derlenmiştir. Hukuki danışmanlık değildir.
   ===================================================================== */

// Heinz Leymann'ın 5 grubu. (*) işaretliler Leymann listesinde yoktur;
// Türkiye'deki uygulamada sık görüldüğü için eklenmiştir.
const KATEGORILER = [
  { k: "k1", kisa: "İletişim", ad: "Kendini gösterme ve iletişim olanaklarının kısıtlanması", dav: [
    "Kendini ifade etmesinin engellenmesi", "Sözünün sürekli kesilmesi", "Bağırılması / yüksek sesle azarlanması",
    "Yaptığı işin sürekli eleştirilmesi", "Özel hayatının eleştirilmesi", "Telefonla ya da mesajla rahatsız edilmesi",
    "Sözlü tehdit", "Yazılı tehdit", "Jest ve bakışlarla küçümsenmesi", "İmalı konuşmalar"] },
  { k: "k2", kisa: "Sosyal dışlama", ad: "Sosyal ilişkilere saldırı", dav: [
    "Kimsenin onunla konuşmaması", "Kendisiyle konuşulmasına izin verilmemesi", "Diğerlerinden yalıtılmış bir yerde çalıştırılması",
    "İş arkadaşlarının onunla konuşmasının yasaklanması", "Yokmuş gibi davranılması", "Toplantı ve bilgi akışından dışlanması (*)"] },
  { k: "k3", kisa: "İtibar", ad: "Sosyal itibara saldırı", dav: [
    "Arkasından kötü konuşulması", "Asılsız söylenti yayılması", "Gülünç duruma düşürülmesi", "Akıl sağlığının sorgulanması",
    "Bir rahatsızlığı ya da engeliyle alay edilmesi", "Görüşü, inancı ya da kökeniyle alay edilmesi", "Özel hayatıyla alay edilmesi",
    "Küçük düşürücü lakap takılması", "Kararlarının sürekli sorgulanması", "Başkalarının önünde aşağılanması", "Cinsel imalar"] },
  { k: "k4", kisa: "Mesleki durum", ad: "Yaşam kalitesi ve mesleki duruma saldırı", dav: [
    "Hiç görev verilmemesi", "Elindeki işlerin alınması", "Anlamsız işler verilmesi", "Yeteneklerinin altında işler verilmesi",
    "Sürekli yeni ve yetişemeyeceği işler verilmesi", "Onur kırıcı işler verilmesi", "Unvan / görev tanımı dışı görevlendirme (*)",
    "Çalışma ya da nöbet düzeninin cezalandırıcı şekilde değiştirilmesi (*)", "Haksız iş yükü ya da kota (*)", "Haksız soruşturma ya da disiplin işlemi (*)",
    "İzin ve haklarının engellenmesi (*)"] },
  { k: "k5", kisa: "Sağlık", ad: "Sağlığa doğrudan saldırı", dav: [
    "Sağlığına zarar verecek ağır işlere zorlanması", "Fiziksel şiddet tehdidi", "Gözdağı amaçlı hafif şiddet",
    "Fiziksel zarar verilmesi", "Cinsel taciz"] }
];
const KAT0 = { k: "k0", kisa: "Sınıflandırılmamış", ad: "Sınıflandırılmamış", dav: [] };
const katBul = (k) => KATEGORILER.find((c) => c.k === k) || KAT0;

const SEV_AD = ["Belirtilmedi", "Hafif", "Orta", "Ciddi", "Ağır", "Çok ağır"];

/* ---------- Başvuru türleri ----------
   sure: cevap/karar için takip edilen süre. isg: iş günü mü. yasal: süre kanundan mı geliyor.
   zimni: kamu idaresine yapılan başvurularda İYUK md. 10 zımni ret, dava ve KDK süreleri de hesaplanır. */
const BASVURU_TURLERI = [
  { k: "dilekce", ad: "İdareye dilekçe / talep", sek: "kamu", sure: 30, yasal: true, zimni: true,
    kaynak: "3071 s.K. md. 7 · İYUK md. 10", bilgi: "Dilekçelere 30 gün içinde cevap verilir. Cevap verilmezse istek reddedilmiş sayılır ve dava süresi işlemeye başlar." },
  { k: "sikayet", ad: "Kurum içi şikâyet (amire)", sek: "kamu", sure: 30, yasal: true, zimni: true,
    kaynak: "657 s.K. md. 21 · Şikâyet ve Müracaatlar Yönetmeliği", bilgi: "Şikâyet hakkında 30 gün içinde karar verilir. Karara karşı tebliğden itibaren 10 gün içinde üst makama itiraz edilebilir." },
  { k: "bilgi", ad: "Bilgi edinme başvurusu", sek: "hepsi", sure: 15, isg: true, yasal: true,
    kaynak: "4982 s.K. md. 11", bilgi: "Kurum 15 iş günü içinde cevap verir; başka birimden bilgi gerekiyorsa gerekçesini bildirerek 30 iş gününe uzatabilir." },
  { k: "itiraz", ad: "Disiplin cezasına itiraz", sek: "kamu", sure: 30, yasal: true,
    kaynak: "657 s.K. md. 135", bilgi: "İtiraz mercii 30 gün içinde karar verir." },
  { k: "cimer", ad: "CİMER", sek: "hepsi", sure: 30, yasal: true,
    kaynak: "3071 s.K. md. 7", bilgi: "Dilekçelere 30 gün içinde cevap verilmesi gerekir." },
  { k: "kdk", ad: "Kamu Denetçiliği Kurumu", sek: "kamu", sure: 180, yasal: false,
    kaynak: "6328 s.K.", bilgi: "Takip için 6 ay varsayıldı. Başvuru, dava açma süresi içinde yapıldıysa işlemeye başlamış dava süresini durdurur (md. 17)." },
  { k: "etik", ad: "Kamu Görevlileri Etik Kurulu", sek: "kamu", sure: 90, yasal: true,
    kaynak: "5176 s.K. md. 5", bilgi: "Etik Kurul incelemesini 3 ay içinde tamamlar." },
  { k: "isveren", ad: "İşverene / insan kaynaklarına bildirim", sek: "ozel", sure: 30, yasal: false,
    kaynak: "TBK md. 417", bilgi: "Kesin bir yasal cevap süresi yoktur; takip için 30 gün varsayıldı." },
  { k: "alo170", ad: "ALO 170 / Çalışma Bakanlığı", sek: "hepsi", sure: 30, yasal: false, kaynak: "", bilgi: "Takip için 30 gün varsayıldı." },
  { k: "tihek", ad: "TİHEK", sek: "hepsi", sure: 60, yasal: false, kaynak: "6701 s.K.", bilgi: "Takip için 60 gün varsayıldı." },
  { k: "arabulucu", ad: "Arabuluculuk bürosu", sek: "ozel", sure: 21, yasal: true,
    kaynak: "7036 s.K. md. 3", bilgi: "Arabulucu başvuruyu 3 hafta içinde sonuçlandırır; zorunlu hâllerde en fazla 1 hafta uzatılabilir." },
  { k: "savcilik", ad: "Cumhuriyet Başsavcılığı", sek: "hepsi", sure: 60, yasal: false, kaynak: "", bilgi: "Takip için 60 gün varsayıldı." },
  { k: "tbmm", ad: "TBMM Dilekçe Komisyonu", sek: "hepsi", sure: 60, yasal: false, kaynak: "", bilgi: "Takip için 60 gün varsayıldı." },
  { k: "sendika", ad: "Sendika", sek: "hepsi", sure: 15, yasal: false, kaynak: "", bilgi: "Takip için 15 gün varsayıldı." },
  { k: "avukat", ad: "Avukat / baro", sek: "hepsi", sure: 15, yasal: false, kaynak: "", bilgi: "Takip için 15 gün varsayıldı." },
  { k: "diger", ad: "Diğer", sek: "hepsi", sure: 30, yasal: false, kaynak: "", bilgi: "Takip süresini kendin belirle." }
];
const turBul = (k) => BASVURU_TURLERI.find((x) => x.k === k) || BASVURU_TURLERI[BASVURU_TURLERI.length - 1];

const GELISME_TURLERI = [
  { k: "olumsuz", ad: "Olumsuz cevap / ret tebliğ edildi" },
  { k: "olumlu", ad: "Olumlu cevap geldi" },
  { k: "bekletici", ad: "Ara cevap (inceleniyor)" },
  { k: "ek", ad: "Ek belge verdim" },
  { k: "not", ad: "Not" },
  { k: "sonuc", ad: "Süreç sonuçlandı" }
];
const gelismeBul = (k) => GELISME_TURLERI.find((x) => x.k === k) || GELISME_TURLERI[4];

/* ---------- Süre hesaplayıcı: "Ne oldu?" ----------
   Her olay türü, tarihine göre bir ya da birkaç son gün üretir. */
const HESAP_TURLERI = [
  { k: "basvurdum", ad: "İdareye başvurdum, cevap bekliyorum", sek: "kamu", tarihAd: "Başvuru tarihi" },
  { k: "red", ad: "İdarenin olumsuz cevabı / işlemi tebliğ edildi", sek: "kamu", tarihAd: "Tebliğ tarihi" },
  { k: "disiplin", ad: "Bana disiplin cezası tebliğ edildi", sek: "kamu", tarihAd: "Tebliğ tarihi" },
  { k: "sikayetkarar", ad: "Şikâyetimle ilgili karar tebliğ edildi", sek: "kamu", tarihAd: "Tebliğ tarihi" },
  { k: "bilgired", ad: "Bilgi edinme başvurum reddedildi", sek: "hepsi", tarihAd: "Tebliğ tarihi" },
  { k: "suc", ad: "Hakaret, tehdit gibi suç oluşturabilecek bir olay yaşadım", sek: "hepsi", tarihAd: "Olayı ve faili öğrendiğim tarih" },
  { k: "fesih", ad: "Haklı nedenle fesih düşünüyorum", sek: "ozel", tarihAd: "Son olayın tarihi" }
];

// Resmî tatiller (yarım gün arifeler 0.5). 2028 ve sonrası için listeye ekleme gerekir.
const TATIL = {
  "2026-01-01": [1, "Yılbaşı"], "2026-03-19": [0.5, "Ramazan Bayramı arifesi"], "2026-03-20": [1, "Ramazan Bayramı"], "2026-03-21": [1, "Ramazan Bayramı"], "2026-03-22": [1, "Ramazan Bayramı"],
  "2026-04-23": [1, "Ulusal Egemenlik ve Çocuk Bayramı"], "2026-05-01": [1, "Emek ve Dayanışma Günü"], "2026-05-19": [1, "Atatürk'ü Anma, Gençlik ve Spor Bayramı"],
  "2026-05-26": [0.5, "Kurban Bayramı arifesi"], "2026-05-27": [1, "Kurban Bayramı"], "2026-05-28": [1, "Kurban Bayramı"], "2026-05-29": [1, "Kurban Bayramı"], "2026-05-30": [1, "Kurban Bayramı"],
  "2026-07-15": [1, "Demokrasi ve Millî Birlik Günü"], "2026-08-30": [1, "Zafer Bayramı"], "2026-10-28": [0.5, "Cumhuriyet Bayramı arifesi"], "2026-10-29": [1, "Cumhuriyet Bayramı"],
  "2027-01-01": [1, "Yılbaşı"], "2027-03-08": [0.5, "Ramazan Bayramı arifesi"], "2027-03-09": [1, "Ramazan Bayramı"], "2027-03-10": [1, "Ramazan Bayramı"], "2027-03-11": [1, "Ramazan Bayramı"],
  "2027-04-23": [1, "Ulusal Egemenlik ve Çocuk Bayramı"], "2027-05-01": [1, "Emek ve Dayanışma Günü"], "2027-05-15": [0.5, "Kurban Bayramı arifesi"], "2027-05-16": [1, "Kurban Bayramı"], "2027-05-17": [1, "Kurban Bayramı"],
  "2027-05-18": [1, "Kurban Bayramı"], "2027-05-19": [1, "Kurban Bayramı · Gençlik ve Spor Bayramı"], "2027-07-15": [1, "Demokrasi ve Millî Birlik Günü"], "2027-08-30": [1, "Zafer Bayramı"],
  "2027-10-28": [0.5, "Cumhuriyet Bayramı arifesi"], "2027-10-29": [1, "Cumhuriyet Bayramı"]
};
const TATIL_SON_YIL = 2027;
