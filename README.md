# MKD · Mobbing Kayıt Defteri

İşyerinde psikolojik tacize (mobbing) uğrayan çalışanların yaşadıkları olayları tarih, saat, kişi, tanık ve belgeleriyle düzenli, sistematik ve güvenilir biçimde kayıt altına almasına yardımcı olan kişisel bir telefon uygulaması (PWA). iPhone'da Safari ile açılıp **Paylaş › Ana Ekrana Ekle** ile uygulama gibi kullanılır.

**Uygulama adresi:** https://slymnaltundagg.github.io/kayit-defteri/

## Neler yapar?

- **Adım adım kayıt:** Zaman ve yer, kişi, davranış (Leymann sınıflaması) ve şiddet, anlatım ve aynen söylenen söz, tanık ve belge, etki.
- **Değiştirilemez kayıt:** Kesinleşen kayıt sıra numarası alır (MKD-0001…) ve kilitlenir. Düzeltmeler tarihli ek kayıt olarak tutulur, kayıt silinmez; yalnızca gerekçesiyle geri çekilebilir.
- **Dış kopya ve mühür:** Kayıt özetini kendine ya da güvendiği bir kişiye e-postayla gönderme; kayıtları dönemsel olarak dosya hâlinde "mühürleme".
- **Sistematiklik:** Süre, sıklık, kesintisiz seri, kişi ve davranış grubu bazında tablo; Leymann ölçütüne yakınlık.
- **Zaman çizelgesi:** Olaylar, başvurular ve gelişmeler tarih sırasıyla.
- **Süreç takibi:** Dilekçe ve başvuruların evrak numarası, belgeleri ve gelişmeleri.
- **Süre sayacı:** Cevap, itiraz, dava ve başvuru son günleri geri sayımla; resmî tatil ve adli tatil hesaba katılır; iPhone Takvim'e hatırlatmalı aktarma.
- **Tanıklar**, **rapor** (A4 olay dosyası), **dilekçe şablonları**, **rehber**.

## Kayıtların bütünlüğü

- Kesinleşmiş kayıt uygulama arayüzünden değiştirilemez ve silinemez.
- Düzeltme ve ekler asıl metni değiştirmeden, kendi tarih ve saatiyle kayda bağlanır.
- Kayıt numaraları kesintisizdir ve yeniden kullanılmaz.
- Yedekten geri yükleme mevcut kayıtların üzerine yazmaz.
- Yanlış PIN denemelerinde kayıtlar silinmez; uygulamada tüm verileri silen bir düğme bulunmaz.

**Sınırlar:** Uygulama, cihazın veri deposuna teknik araçlarla doğrudan müdahaleyi ya da cihaz saatinin değiştirilmesini tamamen engelleyemez. Kayıtların zamanına ilişkin en güçlü dayanak, uygulama dışına gönderilmiş tarihli kopyalardır (e-posta, KEP). Kayıtlar kullanıcının kendi beyanıdır; tanık ve belge gibi diğer delillerle birlikte değerlendirilmelidir. Ayrıntılı açıklama uygulama içinde **Daha › Uygulamanın işleyişi** bölümünde ve her raporun son bölümündedir.

## Gizlilik ve güvenlik

- Tüm veriler **yalnızca kullanıcının cihazında**, rastgele üretilmiş bir veri anahtarıyla **AES-256-GCM** ile şifreli tutulur. Veri anahtarı, PIN'den ve kullanıcının belirlediği kurtarma sorusunun cevabından türetilen anahtarlarla (PBKDF2-SHA256, 600.000 tur) korunur. PIN ve cevap hiçbir yere kaydedilmez.
- Uygulama hiçbir veriyi internete, geliştiriciye ya da başka bir sunucuya göndermez. İçerik güvenlik politikası (CSP) tüm dış bağlantıları engeller; reklam, analiz ya da takip kodu yoktur.
- PIN kilidi, otomatik kilit, arka planda gizlilik perdesi; yanlış denemelerde artan bekleme ve kullanıcıya bildirim.
- Fotoğraflar yeniden kodlanır; konum ve cihaz bilgileri (EXIF) silinir. Yedek dosyaları da şifrelidir.
- Bu depoda yalnızca uygulamanın kodu bulunur; hiçbir kullanıcı verisi yer almaz.

## KVKK

Uygulama, 6698 sayılı Kanun'un 28/1-a maddesi kapsamında kişisel kullanım için tasarlanmıştır. Uygulamayı yayınlayan kişi kullanıcı verilerine erişemez ve veri sorumlusu sıfatıyla herhangi bir veri işlemez. Ayrıntılı bilgilendirme uygulama içinde **Daha › KVKK bilgilendirmesi** bölümündedir.

## Önemli uyarılar

- Uygulamadaki bilgiler, süre hesapları ve dilekçe şablonları **genel bilgilendirme** amaçlıdır, **hukuki danışmanlık yerine geçmez**. Süreler hak düşürücü olabilir; hukuki bir adım atmadan önce bir avukata veya sendikanıza danışınız.
- Kullanıcılar, uygulamaya ekledikleri bilgi ve görüntülerden (özellikle üçüncü kişilere ve hastalara ait kişisel verilerden) ve bunları kimlerle paylaştıklarından kendileri sorumludur.
- Verilerin yedeklenmesi kullanıcının sorumluluğundadır. PIN ve kurtarma cevabı birlikte unutulursa veriler kurtarılamaz.

## Sorumluluk reddi

Bu yazılım **"olduğu gibi"** sunulur. Doğruluğu, eksiksizliği, kesintisiz çalışması ya da belirli bir amaca uygunluğu konusunda açık veya örtülü hiçbir garanti verilmez. Yazılımın kullanılmasından, kopyalanmasından, değiştirilmesinden veya başka bir yerde çalıştırılmasından doğabilecek doğrudan ya da dolaylı hiçbir zarardan geliştirici sorumlu tutulamaz.

## Telif hakkı

© 2026 Süleyman Altundağ. Tüm hakları saklıdır.

Bu deponun içeriği yalnızca incelenebilir. Geliştiricinin yazılı izni olmadan kopyalanamaz, değiştirilemez, çoğaltılamaz, dağıtılamaz veya başka bir yerde yayınlanamaz.
