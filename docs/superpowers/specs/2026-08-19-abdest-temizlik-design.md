# Abdest ve Temizlik — tasarım

**Tarih:** 2026-08-19
**Kapsam:** Öğren sekmesi > Abdest kategorisi
**Durum:** Onaylandı (kullanıcı, artifact üzerinden)

---

## Problem

Bugünkü Abdest bir kitap bölümü: 15 kart, görsel yok, bir kez okunup kapanıyor.
Altı ayrı sorun:

1. **Islak el.** Abdest alırken eller ıslak; kimse musluk başında telefon
   kaydırmıyor. 15 kartlık kaydırmalı sihirbaz tam kullanılacağı anda
   kullanılamıyor. Bölümün şeklini bu tek gözlem belirledi.
2. **Görsel sıfır.** Fiziksel bir işlem tarifle değil görüntüyle öğrenilir.
3. **Farz belli değil.** Bilgi yalnız Türkçe başlığa `(Farz)` diye gömülü;
   diğer 5 dilde yok. "Asgari ne yapmalıyım" sorusunun cevabı yok.
4. **Dönüş sebebi yok.** Dualar kütüphane, Sureler ezber; ikisi de tekrar
   açılıyor. Abdest sekmenin en ölü dalı.
5. **Asıl soru sorulmuyor.** İnsanlar "abdest nasıl alınır"ı bir kez öğrenir,
   **"bu abdestimi bozdu mu?"** sorusunu ömür boyu arar. Uygulamada bu konu yok.
6. **Konular eksik.** Gusül, teyemmüm, mest ve sargı meshi — dördü de yok.

## Karar özeti

| Konu | Karar |
|---|---|
| Kapsam | 5 konulu merkez (hub) |
| Görsel | Adım başına foto/çizim; **kullanıcı temin edecek** |
| Premium | Kapı yok, beşi de ücretsiz |
| Mezhep | Hanefi (Diyanet) esas + ciddi farkta tek satır Şafii notu |
| Üslup | Fetva değil bilgi |
| Navigasyon | Konu kartı hub'ı; detaylar route değil tabaka |
| Yeni native | **Yok** — ekran uykusu `navigator.wakeLock` ile engellendi |

## Model

Bölüm tek bir rehber değil, üç işe hizmet eden bir merkez:

| Sıra | Kart | İş |
|---|---|---|
| 1 | **Bozar mı?** | Cevap ver (yıl boyu kullanılır) |
| 2 | Abdest nasıl alınır | Öğret |
| 3 | Mesh: mest ve sargı | Süre tut + öğret |
| 4 | Gusül | Öğret |
| 5 | Teyemmüm | Öğret |

Sıra bilinçli: en sık kullanılan en üstte.

---

## Ekranlar

### 1. Merkez (hub)

- Kategori şeridinin altında **arama kutusu** (bölümün indeksi: bozanlar,
  adımlar, konu adları hepsi taranır) + 5 mihrap kartı.
- Kart dili Dualar/Sureler'deki `DuaRow` mihrap kartının aynısı: altın çerçeve,
  üç iç içe kemer, Arapça ad sola sönen şerit, altın ayraç, başlık + amaç.
  Her konunun Arapça adı: `الوضوء`, `نواقض الوضوء`, `المسح على الخفين`,
  `الغسل`, `التيمم`.
- Mest süresi işliyorsa **kendi kartının içinde** kalan-süre rozeti. Tam
  genişlik satır DEĞİL (kullanıcıların çoğu mest giymiyor; kalıcı krom olurdu).
- Taç rozeti yok.

### 2. Bozar mı?

Bölümün kalbi. Liste değil **alet**: yaz, cevabı gör.

- **Üç cevap durumu:** `bozar` · `bozmaz` · `duruma-gore`. İkili yalan söylerdi —
  uyku, kusma ve kanamanın hepsi şarta bağlı.
- Renk: gündüz temasında yeşil yok. Bozmaz = koyu marka rengi, Bozar = kehribar
  dolgu, Duruma göre = kesikli çerçeve. Metin tek başına da yeterli (renk körü).
- Arama `normalizeSearch` (DuaLibrary'deki kalıp) + madde başına takma adlar.
- Boş ekranda en çok sorulan 8 durum çip olarak durur.
- Mezhep farkı satır içinde, ayrı ekran değil.

### 3. Abdest sihirbazı

Mevcut `GuideStepCard` yapısı korunur, dört değişiklik:

1. **Görsel en üstte**, kenardan kenara, 4:3. Başlığın ve Arapça'nın üstünde.
2. **Farz / Sünnet / Müstehap rozeti.** Bilgi başlıktan rozete taşınır;
   `(Farz)` son ekleri 6 dilde silinir.
3. **Kısa / Tam anahtarı.** Kısa = niyet + 6 farz adımı = 7 kart. Tam = 15.
   Sadece filtre, yeni metin yok. Seçim hatırlanır.
4. **Dua ve ipuçları katlanır.** Kısa modda katlı (önce hareketi öğren), Tam
   modda açık. Katlanır bölüm deseni `EzberSheet`'te zaten var.

Gusül ve teyemmüm **aynı sihirbazı** kullanır; yeni bileşen yok, yalnız yeni
veri. Kısa/Tam anahtarı orada görünmez.

### 4. "Eller ıslakken beraber al" (Faz 5)

Islak el probleminin cevabı. Telefon tezgâhta: büyük görsel (1:1 kırpım), büyük
başlık, tekrar sayacı (3 nokta), adımlar kendi ilerler, her geçişte titreşim.
Duraklat her zaman açık, mod kendi kendine kapanmaz.

- **Ses yok:** TTS yok; 6 dilde insan sesi kaydı bütçeyi ikiye katlar.
- **Yeni plugin GEREKMEDİ.** Tasarımda `@capacitor-community/keep-awake`
  öngörülmüştü; uygulamada `navigator.wakeLock` (Screen Wake Lock API) kullanıldı.
  iOS 16.4+ ve modern Android WebView'da çalışıyor, native bağımlılık sıfır.
  Desteklemeyen eski sürümlerde mod yine çalışır, yalnız ekran kararabilir.
- Sekme gizlenince tarayıcı kilidi bırakır; geri dönüldüğünde yeniden alınır.

### 5. Mesh: mest ve sargı

Mest ve sargı aynı kartta (ikisi de "yıkamak yerine mesh"). Süre yalnız mestte.

- Durum: `mest_mesh_v1` = `{ startedAt, traveler }`. Mukim 24 sa / misafir 72 sa.
- Buton: **"Abdestim bozuldu — süreyi başlat"**. Fıkıhta süre mest giyildiği anda
  değil, giyildikten sonra abdestin ilk bozulduğu anda başlar. Yanlış anda
  başlatan kullanıcı kendini fazla süreli sanar — sessizce yanlış ibadet
  ettiren türden bir hata.
- Bildirim: bitmeye 1 saat kala + bittiğinde. **ID 5200-5201.**
  iOS 64 bütçesi: mevcut ~51 + 2 = 53, pay var.
- Mukim ↔ misafir geçişi yeniden hesaplanır: misafirken 30 saat geçmiş biri
  mukime dönerse süre bitmiş sayılır.
- `CRITICAL_KEYS`'e **eklenmez** — en fazla 72 saatlik veri, Keychain yedeği
  açılıştan 2 sn sonra alınıyor, kazancı yok.

---

## Veri modeli

### Adım metadata'sı açık `id`'ye bağlanır, indekse değil

Tasarımda içerik karması (`sureKey` kalıbı) öngörülmüştü. **Uygulamada
değiştirildi:** gusül ve teyemmüm adımlarının çoğunda Arapça metin yok, karma
orada üretilemiyor. Yerine her adıma **açık `id`** verildi ve altı dil
dosyasının hepsine yazıldı (tek seferlik script; sıra hizası önce doğrulandı —
Arapça metin 6 dilde de aynı indekste ve 15/15 benzersizdi).

İndeks tabanlı eşleme kullanılmadı: bir dil dosyasında sıra değişirse rozet,
görsel ve kısa mod sessizce başka adıma bağlanırdı. Dualar (`duaKey`) ve
Sureler (`sureKey`) bu tuzağa iki kez düşmüştü.

`src/data/wuduSteps.js` — abdest, gusül ve teyemmümün **26 adımı tek tabloda**:

```
'wudu-yuz': { rank: 'farz', image: 'abdest-05-yuz', short: true }
```

`rank: null` → bilgi adımı, rozet gösterilmez ("Gusül ne zaman gerekir?").
`short` rank'tan türetilmez: niyet sünnettir ama kısa modda durur.

### Bozanlar

`src/data/wuduBreakers.js` — **41 kayıt** (11 bozar · 10 duruma göre · 20 bozmaz):

```
{ id, hukum: 'bozar'|'bozmaz'|'duruma-gore', aliases: { tr: [...] } }
```

Ayrıca `scoreMatch()`: başlık ve takma ad eşleşmesi gövde eşleşmesini yener.
Sırasız hâlde "kan" araması 41 maddenin 18'ini getiriyor ve büyük cevap kartına
dizi sırasındaki ilk maddeyi oturtuyordu. 357 takma adın hiçbiri iki maddede
birden bulunmuyor — beraberlikte sırayı dizi düzeni belirlerdi.

Görünen metinler (başlık, açıklama, Şafii notu) **locale dosyalarında** durur:
`public/locales/{lang}/learn.json` → `breakers.<id>.{title,body,safii}`.
Gerekçe: 6 dil paritesi mevcut parite scriptiyle ölçülebilsin.

### Gusül / Teyemmüm

Mevcut rehber yapısına yeni anahtar olarak eklenir: `GUIDES.gusul`,
`GUIDES.teyemmum` (TR `Learn.jsx` içinde, diğer 5 dil `src/data/guides*.js`).
Aynı `GuideStepCard` ile render edilir.

---

## Dosyalar

**Yeni**
- `src/components/abdest/AbdestHub.jsx` — arama + 5 kart
- `src/components/abdest/BreakerSheet.jsx` — "Bozar mı?" tabakası
- `src/components/abdest/MeshSheet.jsx` — mest/sargı + sayaç
- `src/components/abdest/HandsFree.jsx` — ıslak el modu
- `src/data/abdestTopics.js` — 5 konu tanımı
- `src/data/wuduSteps.js` — rank + görsel eşlemesi
- `src/data/wuduBreakers.js` — bozanlar veri iskeleti
- `src/lib/mestMesh.js` — süre mantığı
- `src/lib/mestNotify.js` — 2 bildirim

**Değişen**
- `src/pages/Learn.jsx` — abdest dalı hub'a döner; `GuideStepCard`'a görsel,
  rozet, katlanır bölüm; `GUIDES.gusul` + `GUIDES.teyemmum`
- `src/data/guides{EN,DE,RU,AZ,AR}.js` — gusül + teyemmüm, `(Farz)` temizliği
- `public/locales/{6}/learn.json` — **159 yeni anahtar** (18 iskelet + 8 ıslak el + 9 mesh bölümü + 41 bozanlar × 2-3 alan)
- `src/services/analyticsService.js` — 7 yeni event
- `public/images/abdest/` — 16 görsel (kullanıcı temin edecek)

## Analytics

`learn_abdest_topic_open` · `learn_abdest_search` · `learn_abdest_mode` ·
`learn_breaker_search` · `learn_breaker_open` · `learn_mest_start` · `learn_mest_expire`

Son ikisi olmadan sayacın işe yarayıp yaramadığı ölçülemez.

## Fazlar

Her faz tek başına yayınlanabilir.

| Faz | İçerik |
|---|---|
| F1 | İskelet: hub, 5 kart, arama, rozetler, Kısa/Tam, görsel slotları |
| F2 | Bozar mı?: ~32 durum, takma adlar, üç cevap |
| F3 | Gusül + Teyemmüm rehber verisi |
| F4 | Mesh içeriği, geri sayım, iki bildirim |
| F5 | Beraber al + keep-awake (opsiyonel) |

## İçerik sırası — bağlayıcı

Önce Türkçe metinler yazılır ve **kullanıcıya okutulur**; onaydan sonra 5 dile
çevrilir. Ters sırada gidilirse aynı hata altı kere yapılır.

Dini içeriğin doğrulaması iki bağımsız taslak + karşılaştırma ile yapılır;
kaynak çizgisi Diyanet İlmihali, Din İşleri Yüksek Kurulu ve TDV İslam
Ansiklopedisi.

## Denenip elenenler

| Fikir | Karar | Gerekçe |
|---|---|---|
| İkinci sekme şeridi | elendi | İki şerit üst üste kalıcı krom; DE/RU etiketleri 5 sütuna sığmıyor |
| Tam boy mest satırı | elendi | Kullanıcıların çoğu mest giymiyor; ekran üstünü sürekli işgal ederdi |
| Özel çizim uzuv ikonları | düştü | Kullanıcı gerçek görsel temin edecek; yedek plan olarak duruyor |
| Bozanlar = kaydırmalı liste | değişti | Kafadaki şey liste değil soru; aramaya + üç durumlu cevaba çevrildi |
| Sesli anlatım | yapılmıyor | TTS yok; 6 dilde kayıt bütçeyi ikiye katlar |
| Abdest alışkanlık takibi | yapılmıyor | İbadeti puanlamak bu uygulamanın dili değil |
| Premium kapısı | yapılmıyor | Abdest temel ibadet; kapı marka zararı |
| 4 mezhep karşılaştırması | yapılmıyor | Sıradan kullanıcıyı boğar, kaynak riski yüksek |


---

## Uygulamada verilen hakem kararları

Bozanlar içeriği iki bağımsız araştırmadan birleştirildi (41 ve 39 madde; hepsi
konu konu eşleştirildi, hiçbiri kaybolmadı, 41 maddede birleşti).

| Konu | Taslak A | Taslak B | Karar | Gerekçe |
|---|---|---|---|---|
| Kadınlarda beyaz akıntı | duruma göre | bozmaz | **bozmaz** | Din İşleri Yüksek Kurulu'nun konuya özel fetvası açık; İlmihal'in genel listesindeki "kadınların akıntısı" ifadesine karşı özel ve yeni olan metin esas alındı |
| Kan verme, tahlil | duruma göre | duruma göre | **bozar** | Trombosit fetvası net: kan vücut dışına çıkıyor |
| Diyaliz | — | duruma göre | **bozar** | Periton diyalizi fetvası açık; hemodiyalizde de kan dışarı çıkıyor |
| Uyku | 3 madde | 2 madde | **tek "duruma göre"** | Ölçü tek: yere sağlam oturup oturmamak |
| Kusma | 2 madde | 2 madde | **tek "duruma göre"** | Ölçü tek: ağız dolusu olması |

Araştırma bu spec'in iki varsayımını da düzeltti:

1. **Teyemmümde "vakit daralması"** — Hanefi'de su varken sırf vakit daraldığı
   için teyemmüm caiz DEĞİL; vakit namazı kazaya kalsa da sonradan kılınır.
   İstisna cenaze ve bayram namazı (kazası yok).
2. **Mestte "deri olma şartı" yok** — Diyanet işlevsel ölçü veriyor: bağsız
   durabilme, ~5 km yürüyüşe dayanma, suyu hemen geçirmeme, aşık kemiğini örtme.
   Bu yüzden şartları taşıyan kalın çorap mest sayılıyor, sıradan çorap sayılmıyor.

## Doğrulama

| Ne | Kapsam |
|---|---|
| `wuduSteps` | 6 dil × 3 rehber: id hizası, Arapça hizası, bozuk girdi — 139 kontrol |
| `mestMesh` | mukim↔misafir geçişleri, saat geriye alınması, bozuk kayıt — 40 kontrol |
| `wuduBreakers` | 357 takma adın her biri kendi maddesini buluyor, sıralama, locale bütünlüğü — 619 kontrol |
| Locale anahtarları | kullanılan her `t()` çağrısı — 203 anahtar / 217 kontrol |

## Denetimde yakalananlar

- `guide.title` korumasızdı ve bu değişiklik onu kırılgan hâle getirdi: `guide`
  artık merkez ekranında `null` olabiliyor (eskiden her kategoride doluydu).
  `guide?.title` yapıldı.
- `MeshSheet` refactor'ünde bir effect kapsamda olmayan `open`'ı okuyup global
  `window.open`'a düşüyordu — hep truthy, analytics yanlış tetiklenecekti.
- Aramadan bir adıma atlarken mod "Tam"a geçiyor ama depoya yazılmıyordu;
  anahtar "Tam" görünürken sonraki açılışta sessizce "Kısa"ya dönerdi.
