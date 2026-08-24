# Proje Hafızası — İslami Yoldaş

Projeye dair kalıcı bilgiler ve mevcut durum. Çalışma kuralları için `instruction.md`'ye bak.

---

## Proje
- **İslami Yoldaş** — İslami mobil uygulama (iOS + Android).
- **appId:** `com.islamiyoldas.app`
- **Durum:** Test aşaması, **henüz yayında değil**.

## Teknik Stack
- **Capacitor 8** + **React 19** + **Vite 7**, npm, ESM.
- Alias: `@` → `src`.
- **i18next** — 6 dil: `tr, en, ar, az, de, ru` (fallback: `en`).
  - Locale dosyaları: `public/locales/{lang}/common.json`
  - `tr` ve `en` referans/kaynak dildir; diğerleri bunlarla parite olmalı.
- **RevenueCat** — `@revenuecat/purchases-capacitor` v13 (abonelik/paywall).
- **Amplitude** — analitik (`@amplitude/analytics-browser`). Analiz = Amplitude, Firebase Analytics DEĞİL.
- **Firebase Crashlytics** — çökme takibi (`@capacitor-firebase/crashlytics`).
- **iOS Live Activity** — ActivityKit/WidgetKit. Dosya: `ios/App/IslamiWidgets/OfferLiveActivity.swift` ("Son Teklif" geri sayımı, Dynamic Island + kilit ekranı, deep link `islamiyoldas://premium?offer=true`).
- **Custom Capacitor plugin** — iOS kilit ekranı medya kontrolleri.
- UI: TailwindCSS, framer-motion, lucide-react, sweetalert2, radix-slot.

## Önemli Dosyalar
- `src/pages/PremiumPaywall.jsx` — paywall + indirim ekranı (i18next `premium.*` key'leri).
- `src/layouts/AppLayout.jsx` — `debugShowPaywall` burada (release'de kaldırılacak).
- `src/pages/Profile.jsx` — test butonları burada (🔧🔥⏱👁, release'de kaldırılacak).
- `src/hooks/useDiscountOffer.js` — indirim teklifi mantığı.
- `public/locales/{lang}/common.json` — çeviriler; `premium` bölümünde **88 key** (tüm diller pariteli).

## Kurulu MCP Sunucuları
- **RevenueCat** — ürün/offering/paywall/abonelik yönetimi.
- **Amplitude** — analitik (önce `get_amplitude_context`).
- **Serena** — kod sembol arama/düzenleme (kodlamadan önce `initial_instructions`).
- **context7** — güncel kütüphane dokümantasyonu.
- **playwright**, **shadcn**.

## Tamamlanan İşler
- ✅ RevenueCat indirim teklifleri + paywall UI + locale desteği (commit `f238a0f`).
- ✅ iOS Live Activity ("Son Teklif") — kilit ekranı & Dynamic Island geri sayım.
- ✅ İndirim/paywall metinlerinin **23 key'i 4 dile** (ar/az/de/ru) çevrildi — tüm diller `premium`'da 88 key ile pariteli.
- ✅ **iOS widget'ları Android'e taşındı** (5 yeni, tek medium boyut): Günün Ayeti, Saatlik Ayet, Günün Motivasyonu, Günün Esması, Saatlik Esma. Veri `WidgetData.java` (Swift Entry dosyalarından script ile üretildi, iOS ile aynı gün/saat indeks formülleri), ortak çizim `WidgetUiHelper.java` (dekor bitmap: geometrik desen + mihrap kemeri + glow), layout'lar `widget_verse.xml` / `widget_esma.xml`. Saatlik widget'lar saat başı AlarmManager (inexact) + 30 dk updatePeriodMillis ile yenilenir. Dil: `widget_language_bridge` (CapacitorStorage) — `syncLanguageToWidget` artık Android'de de çalışıyor. Not: Android widget'larında premium kilidi YOK (mevcut Android widget'larıyla tutarlı; iOS'ta var).
- ✅ **Tuba Ağacı widget'ı yeniden tasarlandı** (`WeeklyStreakWidget`, `src/components/HomeComponents.jsx`): Apple HIG düzeni + glassy doku (kullanıcı isteği: cam kart + ambient glow, düz beyaz kart DEĞİL). Tek vurgu rengi (light=islamic-green, dark=islamic-gold; 40+ gün "Mübarek Tuba"da iki temada da altın devralır), takvim tarzı gün şeridi (2 harfli gün adı + ayın günü), progress bar yerine glow haleli ilerleme halkası (ağaç sembolünün tek evi — header'da ikon yok, bilgi "?" butonu başlığın yanında), renkli glow gölgeli buton. Partikül/shimmer kaldırıldı; haptic'ler ve storage mantığı aynen korundu. `home.json → tuba` 6 dilde **18 key** pariteli (az'nin yanlış Pazar-bazlı gün sırası da düzeltildi). Tık sesi lokale alındı: `public/sounds/tuba-water.mp3` (eskiden mixkit.co URL). Premium kilidi butonda artık açık: taç ikonu + "Premium ile Devam Et" (`tuba.btnPremium`).

- ✅ **Ezan vakti doğruluk paketi** (kullanıcı raporu: "gece ezan okunurken app'te geçmiş görünüyordu"). Canlı API ölçümleriyle doğrulanan düzeltmeler:
  - **Diyanet arama doğrulaması** (`PrayerTimesContext.jsx → resolveDiyanetLocationId`): API alanları `region`/`city` (eski kod var olmayan `district`'e bakıyordu), trim (API'de "LONDON " gibi sondaki boşluklar var), ülke filtresi + il (province) doğrulaması, region-öncelikli eşleşme ("Istanbul" artık Arnavutköy değil 9541 merkez kaydını buluyor), belirsizlikte null → Aladhan. Aynı isimli ilçeler (Ereğli: Konya/Zonguldak, Kemer) artık il ile ayrışıyor. Yurt dışı manuel şehirde ülke `Intl.DisplayNames('tr')` ile Diyanet adına çevrilir (Berlin→ALMANYA ✓, London→eşleşmez→Aladhan; eski kod London'a Kanada/ABD saati veriyordu!).
  - **Diyanet aylık cache** (`diyanet_month_cache`): proxy 31 günlük liste döndürüyor, artık localStorage'da — ay boyu offline çalışır, Aladhan fallback'i nadirleşti. Not: `prayertimes.api.abdus.dev` resmi değil, kişisel proxy (bilinen risk).
  - **Dünya geneli method**: auto modda TR dışına `method` parametresi GÖNDERİLMİYOR — Aladhan yerel otoriteyi seçiyor (ölçüldü: Riyad'da eski sabit MWL Yatsı'yı 7 dk erken veriyordu, Kahire Fajr 10 dk).
  - **Gece yarısını aşan vakitler** (yüksek enlem, ör. Oslo Yatsı 00:10): yeni `src/lib/prayerTimeUtils.js` (`parsePrayerTimeString` + sıra-bilinçli `buildPrayerSchedule`) — findNextPrayer, usePrayers sayacı, HomeComponents isPastPrayer, usePrayerFocus penceresi (dün-bazlı takvim de bakılır), bildirim + ön-hatırlatma planlayıcıları hepsi bunu kullanıyor.
  - **TR ezan payları** (`normalizeTimings`, kullanıcının Urla gerçek ezan/Google gözlemiyle doğrulandı): **SADECE Öğle +2** (HEM Diyanet HEM Aladhan yoluna — `_source` gate'siz; Diyanet öğleyi zevalden ~2 dk sonraya alır, proxy+Aladhan ham zeval veriyor: Urla 13:23→13:25). **Diğer tüm vakitler 0.** İkindi/Akşam ~2 dk geç görünmesinin sebebi buffer değil **yanlış Diyanet ilçe eşleşmesiydi**: "Istanbul" → alfabetik ilk ilçe Arnavutköy (20:48), doğrusu İstanbul MERKEZ 9541 (20:46=Google); Urla'da da app Aladhan+eski(+2 İkindi) payına düşüp 17:19 gösteriyordu (ham 17:17=Google). Region-öncelikli match + Öğle hariç pay=0 ikisini çözdü. Not: bir ara tüm payları 0 yaptım, Öğle'yi de yanlışlıkla sıfırlamıştım — geri koydum. Bildirim takvimindeki Diyanet verisine `_source:'diyanet_raw'` eklendi.
  - **Ana ekranda ilçe gösterimi**: GPS modunda `cityName` artık ilçeyi (cached_district, ör. "Urla") önce gösteriyor, il ("İzmir") yerine — vakitler ilçe-bazlı olduğu için daha doğru. Manuel seçimde seçilen şehir gösterilir.
  - **İstanbul son-çare fallback'i kaldırıldı** (doğu illerinde 20+ dk yanlıştı; koordinatlı Aladhan ±1 dk).
  - **Manuel şehir / GPS önceliği netleşti** (`LocationContext`): `manual_location_active` flag'i; manuel aktifken reverse-geocode `cached_address/district`'i EZEMEZ, `cityName` manuel şehri gösterir; otomatik konum açılınca `disableManualLocation()` ile GPS devralır. TR tespiti artık bbox değil öncelikle geocode `country_code` / manuel ülke (eski bbox Erivan-Halep-Rodos'u TR sayıyordu).
  - Cache versiyonu `v6_diyanet_guard` (eski `diyanet_loc_*` anahtarlarını temizler). `usePrayers`'ta `nextPrayerInfo.date` artık lokal tarih (UTC toISOString gece yarısı kayması giderildi).
- ✅ **Prayer widget çok günlük senkron** (bayat veri sorunu çözüldü). JS: `fetchCalendarData()` (PrayerTimesContext) — 10 günlük pencere (`CALENDAR_WINDOW_DAYS`), Diyanet ay cache + Aladhan gap-fill, session-cache'li; bildirim planlayıcı ve widget sync aynı fonksiyonu paylaşıyor. Payload'a `days: [{date:'yyyy-MM-dd', prayers:[...]}]` eklendi (`widgetService.js`; eski `prayers` alanı geriye dönük uyumluluk için duruyor — köprü/AppDelegate değişmedi, JSON'u aynen kopyalıyor). **iOS** `PrayerTimesProvider.swift`: her timeline girdisi kendi gününün vakitlerini `days`'ten seçiyor (eskiden build anına göre parse ediyordu — gece yarısından sonra dünkü saatler), sıra-bilinçli parse (JS `buildPrayerSchedule` aynısı — gece yarısını aşan Yatsı), sonraki vakit yarının GERÇEK İmsak'ı, pencere dışında son gün yaklaşımı, eski payload'la uyumlu (`days` optional). **Android** `PrayerTimesWidgetProvider.java` (Memory'de yok sanılıyordu, varmış): `selectPrayersForToday` ile aynı gün seçimi + `findNextPrayerFromTimes` sıra-bilinçli yapıldı (30 dk updatePeriodMillis ile süresiz doğru kalır). Doğrulama: `npm run build` ✓, `swiftc -typecheck` ✓, `gradlew :app:compileDebugJavaWithJavac` ✓.

- ✅ **Entegre paywall — indirim + plan seçimi birlikte** (kullanıcı isteği: teklif aktifken aylık/trial'lı yıllık da alınabilsin; eski sheet paywall'u kapatıyordu, tüm çıkışlar home'a gidiyordu). `PremiumPaywall.jsx`: Sheet'e "Tüm planları gör" linki (`see_all_plans`) — sadece sheet'i kapatır, alttaki paywall açılır; sonrasında X direkt çıkar (`offerSheetDismissed` state). Teklif aktifken paywall'da: **sticky** countdown banner (solid koyu zemin — backdrop-blur yok Android perf, son 60 sn kırmızı pulse), yıllık kart teklife döner (üstü çizili normal fiyat `white/60` + altın teklif fiyatı), CTA `use_offer`, disclaimer `disclaimer_offer` (trial'sız), trial rozeti yerine `offer_applied`. Güvenlik: tek flag `offerOnYearly = isOfferActive && !!offerProduct` — gösterilen fiyat ile çekilen ürün ayrışamaz; `handleSubscribe` yıllıkta `handleOfferSubscribe('paywall_card')`'a delege (analytics: `yearly_offer_card` vs sheet `yearly_offer`; link tıkı `offer_see_all_plans`). offerProduct yüklenemezse kart normal kalır, normal ürün satılır. Süre dolunca banner/kart normale döner; açık sheet kendini kapatır (`!isOfferActive && !canShowOffer()` effect'i). Plain `/premium` girişinde sheet artık otomatik AÇILMAZ — sadece X dismiss-intent + `?offer=true|force`. **Yüzde aylık-bazlı**: `offerDisplayPercent` = 12×aylık vs teklif (~%67, variant_b ~%73; fallback: yıllık-bazlı `offerPercent`) — kart rozeti `badge_savings_pct` (yeni key), `offer_applied` satırı ve sheet mührü (`discount_pct_short`) hepsi aynı sayı (eski yıllık-bazlı −%32, badge'deki %51'den küçük göründüğü için değiştirildi). Yeni locale key'leri 6 dil pariteli (premium=**92** key): `see_all_plans`, `disclaimer_offer`, `offer_applied`, `badge_savings_pct`. `useDiscountOffer`/`purchaseService` değişmedi. `npm run build` ✓; cihaz testi kullanıcıda (`?offer=force` akışı + sandbox ürün id kontrolü).

- ✅ **Header başlığı — native iOS stili** (`AppLayout.jsx`; kullanıcı: "düz font sıkıcı, premium dursun"). İlk deneme Playfair Display serif + altın gradyan + 8 köşeli yıldız + hicri tarihti — kullanıcı ÜÇÜNÜ DE beğenmedi ("font tarzı, renk/gradyan, yıldız" + "hicri takvimi kaldır"), hepsi geri alındı (Playfair import'u ve `.wordmark` CSS silindi). Seçilen yön: **native iOS premium** — tailwind `font-display` token'ı = sistem font stack'i (`-apple-system...` iOS'ta SF Pro, Android'de Roboto; Arapça/Kiril sistem fontuyla sorunsuz), h1: `font-display text-[26px] font-bold tracking-tight` düz `text-islamic-green dark:text-islamic-gold` (eski 22px Inter extrabold'dan büyük, süs yok). Eyebrow rafinesi kaldı: `tracking-[0.14em]`, light `text-stone-500/90`, `truncate` + sol kolon `min-w-0 mr-2`. Ders: kullanıcı süslü/dekoratif değil sade-native estetik istiyor. Locale dosyaları değişmedi. `npm run build` ✓; cihaz görsel kontrolü kullanıcıda.

- ✅ **AdMob banner crash düzeltmesi** (Play Console'da en sık crash: `BannerExecutor.lambda$hideBanner$1` NPE). Kök neden `adService.js`'teki 4x agresif hide retry'ıydı: removeBanner banner'ı silince sonraki hideBanner native'de null `mAdView.pause()` çağırıyordu. Çözüm (`src/services/adService.js`): `enqueueBannerOp` promise kuyruğu (tüm show/hide serileşir), `bannerActive` flag'i (silinmiş banner'a hide gitmez), retry'lar kaldırıldı, remove sonrası 100ms settle. İkinci crash `AdViewIdHelper.assignIdToAdView` (eşzamanlı çift showBanner) da kuyrukla çözüldü. Plugin 8.0.0 = son sürüm, upstream fix yok; patch-package gerekmedi. Kalan Play crash'leri (Mali/Adreno GPU, Chromium `J.N.VZZ`, `TouchDevice`) cihaz/WebView driver kaynaklı — app tarafından çözülemez. `npm run build` ✓.

- ✅ **Release temizliği yapıldı** (2026-07-08, checklist `instruction.md`): RevenueCat `setLogLevel(DEBUG)` → `import.meta.env.DEV` koşulunda (`purchaseService.js`); PremiumPaywall'daki 4 TEST toast'u `getErrorMessage()` ile kullanıcı-dostu mesaja çevrildi (ham hata analytics'e gitmeye devam ediyor — `purchaseService` error detayı korundu); Profile test butonları (🔧🔥⏱👁) + `toggleDebugPaywall` silindi; `AppLayout`/`Profile` `debugShowPaywall` tamamen kaldırıldı, header premium butonu sadece `!hasPremium`; `testDate.js getTestDayOffset` prod'da her zaman 0 döner (DEV gate) + `main.jsx` açılışta `appTestDayOffset` ve `debug_show_paywall` localStorage kalıntılarını siler. `DebugMenu` zaten `DEBUG_MODE=false` ile kapalı (bırakıldı). `?offer=force` paramı kodda duruyor (cihaz testi için gerekli) — dışarıdan deep link ile tetiklenebilir ama sadece indirim gösterir, düşük risk. RevenueCat MCP ile doğrulandı: `offer.499`/`offer.399` iOS ürünleri App Store Connect'te **APPROVED** (₺499,99/₺399,99, tüm bölgeler, review screenshot + privacy URL tamam); offering'ler doğru bağlı (`limited_offer_a`=499, `limited_offer_b`=399, iOS+Android). `npm run build` ✓.

- ✅ **Ödeme akışı derin denetimi** (2026-07-08, release öncesi; bağımsız reviewer + canlı RevenueCat doğrulaması). Bulunan ve düzeltilen bug'lar:
  - **Init race** (`purchaseService.js`): 6 public fonksiyonda `!isInitialized && !isConfiguring` guard'ı init sürerken beklemeden native SDK'ya gidiyordu (Live Activity deep link ile soğuk açılışta paywall boş fiyat / "not configured" hatası). Artık `!isInitialized` → in-flight `initPromise` bekleniyor. Deadlock yok: init içindeki `verifySubscription` çağrısı `isInitialized=true` set edildikten sonra.
  - **Yanlış vitrin fallback'i** (`purchaseProduct`): taze paket araması `offerings.all[id] || offerings.current` idi — teklif vitrini bulunamazsa current'ın `$rc_annual`'ı (tam fiyat!) eşleşiyordu. `|| current` kaldırıldı; bulunamazsa eldeki rcPackage kullanılır.
  - **Sheet'te hardcoded ₺ fallback'ler** (`PremiumPaywall` teklif sheet'i): `'₺739,99' / '₺499,99' / '₺1,37'` — yabancı kullanıcı ürün yüklenmeden TL fiyat görüyordu. Kullanıcı kararı: `'...'` DEĞİL (fiyatsız butona kimse tıklamaz), **USD fallback** — App Store Connect'ten doğrulanan gerçek tarifeler: ana vitrin normal $12.99 / teklif $9.99 / günlük $0.03, variant_b $9.99 / $6.99 / $0.02 (`offerUsdFallback` vb. sabitler, variant-bilinçli). Büyük fiyat artık `offerPriceString` memo'sunu kullanıyor (Android manuel format kuralı dahil). Satın alma her zaman mağazanın yerel fiyatıyla gerçekleşir.
  - **Satın alma timeout guard'ı**: 60 sn timeout sonrası geç gelen sonuç success ekranı + çift analytics üretiyordu. Restore'daki `timeoutFired` deseni iki purchase handler'a da eklendi (geç başarıda premium zaten purchaseService'te yazılıyor, UI `premiumStatusChanged` ile güncellenir).
  - **Analytics planId**: `setPremium(true)` default `'promo'` ile purchaseService'in yazdığı doğru ürün id'sini eziyordu — purchase'larda `setPremium(true, productId)`, restore'da redundant çağrı kaldırıldı.
  - **DebugMenu prod guard'ı**: `if (!DEBUG_MODE || !import.meta.env.DEV) return null` — bayrak yanlışlıkla true kalsa bile prod'da render olmaz. Ölü `RevenueCatUI` import'u silindi.
  - Doğrulanan (sorunsuz): entitlement `İslami Yoldas Pro`'ya 14 ürün bağlı (4 offer ürünü dahil — satın alma premium'u kesin açar); iOS offer.499/399 App Store Connect'te APPROVED; bundle'da gerçek RC key'leri (`.env` release makinesinde şart, yoksa Android placeholder'a düşer); paywall'un 62 `premium.*` key'i 6 dilde tam; AdMob gerçek ID + `isTesting:false`; `IS_TESTING=false` (ReviewPrompt); capacitor.config'de dev server yok; offer süresi dolumu satın alma sırasında güvenli. `npm run build` ✓.

- ✅ **Review popup kademeli cooldown** (`src/components/ReviewPrompt.jsx`): ilk gösterim değişmedi (girişte çıkabilir); kapatma sayısına göre bekleme — 1. kapatma 24 saat, 2. kapatma 3 gün, 3.+ hep 7 gün, puanlayana kadar (`COOLDOWN_LADDER_MS` + `getCooldownMs(dismissCount)`). Kullanıcı kararları: yıldız filtreleme (rating gating) BİLEREK kalıyor; `appOpens` sayacı ölü kod ama silinMEyecek ("kalsın"). Native dialog kotası (iOS ~3/yıl, Android ~ayda 1, ikisi de sessiz no-show) sorun değil — `reviewed=true` ilk 4-5 yıldızda yazıldığından kullanıcı başına 1 native çağrı. `npm run build` ✓.

- ✅ **Kıble ekranı doğruluk denetimi + düzeltmeler** (2026-07-08, `src/pages/Qibla.jsx`). Denetimde sağlam çıkanlar: Kâbe koordinatı, great-circle azimuth, Haversine, WMM-2025 deklinasyon (`geomagnetism` 0.2.0, 2029'a kadar geçerli), iOS `trueHeading` (deklinasyon dahili) / Android manyetik+decl ayrımı plugin kaynağından doğrulandı (çift düzeltme yok), Android display-rotation kompanzasyonu pluginde. Düzeltilenler: (1) **Sessiz İstanbul fallback kaldırıldı** — konum yoksa pusula yerine `no-location` ekranı (`locationRequired.*` + `refreshLocation` butonu); manuel şehir koordinat üretmediğinden gerçek konum şart (yurt dışında 90°+ hata veriyordu). (2) **iOS orientation kilidi** (`Info.plist`): iPhone+iPad portrait-only + `UIRequiresFullScreen` — CLHeading portrait varsayar, iPad landscape 90° / ters portrait 180° hataydı. (3) **iOS izin teşhisi**: 6 sn sensör timeout'unda okuma yoksa `Compass.checkPermissions()` ile ayrım — izin eksikse popup `sensorMissing.permission*` metinlerini gösterir ("sensör yok" yanıltmacası bitti; alt başlık gizlenir). (4) Hardcoded "Cihazı Düz Tutun / Hold Device Flat" → `t('holdFlat')`. (5) **Android kalibrasyon uyarısı**: `accuracyChange` listener (Android-only event, iOS plugin göndermiyor — doğrulandı) — accuracy 0/1'de (UNRELIABLE/LOW, 15°+ hata) pusula üstünde amber "8 çizerek kalibre et" pili (`calibrationNeeded` key), tilt uyarısından öncelikli (aynı slot, `AnimatePresence mode="wait"`). (6) **iOS tilt uyarısı canlandı**: `DeviceOrientationEvent.requestPermission` jest dışı çağrıda reddediliyordu — artık ilk `pointerdown`'da (`once:true`) isteniyor, granted ise Motion listener eklenir; `NSMotionUsageDescription` Info.plist'te zaten vardı. (7) **KARAR (kullanıcı 2026-07-08): Kıble'de tam ekran reklam ASLA** — hizalanma anındaki `showInterstitialAd` kaldırıldı (koddaki yorum da bunu söylüyor); banner zaten `/qibla` allowedPaths'te, `InterstitialAdManager` global olarak `return null` ile kapalı. (8) Temizlik: `lowPassFilter`/`Star`/`Navigation2`/`RotateCcw`/`locationError` importları + `tiltStatus` state + `status==='calculating'` silindi; `debugAligned` stale-closure düzeltildi (state→`debugAlignedRef`, `qiblaDebugToggle` artık gerçekten çalışır); `startCompass` unmount yarışına mounted check'leri (izin prompt'u sırasında çıkışta sensör açık kalmaz); mesafe formatı `'tr-TR'` sabiti → `i18n.language`. `qibla.json` 40→**48 key**, 6 dil pariteli. `npm run build` ✓. Kalan: gerçek cihaz doğrulaması (Google Qibla Finder karşılaştırma, izin akışları, kalibrasyon pili).

- ✅ **Kıble hassasiyet düzeltmesi** (2026-07-08, kullanıcı raporu: "dönünce başka yeri gösteriyor, sonra toparlıyor"). Sistematik debug ile 3 kök neden + 1 kendi bug'ım:
  - **Plugin Android heading matematiği çöptü**: `@capgo/capacitor-compass` ham ivmeölçeri gravity sanıyordu (hareket ivmesi tilt kompanzasyonunu bozuyor — dönerken yön saçmalar) + `SENSOR_DELAY_NORMAL` (~5Hz). **patch-package ile düzeltildi** (`patches/@capgo+capacitor-compass+8.1.9.patch`): `TYPE_ROTATION_VECTOR` füzyonu (gyro+accel+mag, Android'in önerdiği yol) + `SENSOR_DELAY_GAME` (~50Hz), sensör yoksa eski yola fallback (GAME hızında), >4 elemanlı rotation vector (eski Samsung) kırpılır, NaN guard'ları, throttle `maybeNotifyHeading()` helper'ına alındı. Manyetometre füzyon modunda SADECE kalibrasyon accuracy callback'i için kayıtlı kalır. Azimuth manyetik kuzey referanslı — JS'in declination eklemesi sözleşmeyle uyumlu. `gradlew :capgo-capacitor-compass:compileDebugJavaWithJavac` ✓ (JAVA_HOME=Android Studio JBR gerekir).
  - **`watchAccuracy()` çağrılmıyordu (benim bug)**: native callback sadece `watchAccuracy` PluginMethod'unda set ediliyor — önceki turda eklediğim `accuracyChange` listener'ı ölü doğmuştu. Şimdi Android'de `addListener` + `watchAccuracy()`, cleanup'ta `unwatchAccuracy()`.
  - **Çift yumuşatma gecikmesi**: sensör alpha cap 0.20 + RAF lerp 0.12 → 90° dönüşte ~2 sn gecikme ("yanlış yeri gösteriyor" hissi). Adaptif yapıldı: alpha `min(0.5, 0.1+absDiff*0.015)`, lerp `min(0.35, 0.12+|diff|*0.004)` — mikro-titreşim sönümlü kalır, gerçek dönüş hızlı izler.
  - **JS NaN guard'ı**: `Number.isFinite(data.value)` — NaN smoothing zincirine girerse kalıcı donma yapıyordu (plugin ilk-event yarışında teorik olarak üretebilir).
  - iOS heading Apple füzyonlu (CLHeading) — oradaki tek sorun lag'di, adaptif smoothing çözer. `npm run build` ✓.

- ✅ **Yakındaki Camiler — Kıble sayfası içinde** (2026-07-08). Footer'da Kâbe mesafe rozetinin yanına "Yakındaki Camiler" butonu (`latitude &&` gate — manuel şehir/null koordinatta görünmez) → **direkt native harita açar** (`openMosqueSearch` in `src/utils/mapsLauncher.js`): iOS `maps://?q=<terim>&sll=lat,lng`, Android `geo:lat,lng?q=<terim>`, web Google Maps search; arama terimi lokalize `qibla.json mosques.searchTerm` ("Cami"/"Mosque"/"مسجد"...). **İlk sürüm in-app Overpass API listesiydi (sheet) — cihazda iki Overpass endpoint'i de timeout verdi (15-20 sn sonra hata), kullanıcı "diğer uygulamalar gibi direkt harita açılsın" dedi → sheet + mosqueService SİLİNDİ, üçüncü parti API bağımlılığı sıfırlandı.** `qiblaLogic.js`'teki genel `bearingBetween`/`distanceBetweenKM` kaldı (Kâbe fonksiyonları delege, davranış aynı). Locale: `qibla.json mosques` = 2 key (trigger, searchTerm), `home.json quick_actions.qibla.label` → "Kıble/Cami" (subtitle "Yön" aynen) — 6 dil pariteli. Premium kilidi YOK, plugin/native değişiklik YOK. `npm run build` ✓. Cihazda doğrulandı, çalışıyor (kullanıcı onayı 2026-07-08).

- ✅ **Zikirmatik preset listesi genişletildi** (2026-07-10, kullanıcı geri bildirimi: "yeterli zikir yok"). 13 → 27 → **44 preset** (iki turda). 1. tur (14): Kelime-i Tevhid, Kelime-i Şehadet, Besmele, Sübhanallahi ve Bihamdihî (+ Sübhanallahil-Azîm varyantı), Bâkiyât-ı Sâlihât, Tevhid zikri (vahdehû), Seyyidü'l-İstiğfar (hedef 1), Hasbiyallah (7), Allahümme Ecirnî (7), Rabbenâ Âtinâ (10), Salât-ı Münciye/Tüncînâ, Felak, Nas. 2. tur (17): Sübhâne Rabbiyel-Azîm/A'lâ, Sübbûhun Kuddûsün, Rabbi Zidnî İlmâ, Rabbi'şrah lî Sadrî, Rabbenâ lâ Tüziğ, Yâ Hayyu Yâ Kayyûm, Yâ Erhamer-Râhimîn, Melikü'l-Hakku'l-Mübîn, uzun istiğfar (Estağfirullahe'l-Azîm ve Etûbü İleyh), af-âfiyet duası, Bismillâhillezî (3), Eûzü bi-Kelimâtillâh (3), Radîtü Billâhi (3), Adede Halkıhî (3), Salât-ı Fetih, Allahümme Ente's-Selâm (1). **4 yerde senkron güncellendi** (widget `dhikr_widget_preset_index` index-eşleşmeli, ekleme hep listenin SONUNA yapılmalı): `src/pages/Dhikr.jsx DHIKR_PRESETS`, iOS `ios/App/IslamiWidgets/DhikrEntry.swift allPresets`, Android `DhikrWidgetProvider.java PRESETS` (kısaltılmış ad/anlam stili), 6 dil `public/locales/{lang}/dhikr.json presets` (44 key pariteli; 4 listenin id sırası script ile birebir doğrulandı). Esma-ül Hüsna (99) zaten ayrı sekmede; listede olmayan her şey için "özel zikir" arama akışı da var (DhikrPickerSheet). `npm run build` ✓, `swiftc -typecheck` ✓, `gradlew :app:compileDebugJavaWithJavac` ✓.

- ✅ **Azerbaycan vakit doğruluğu + dünya geneli şehir arama** (2026-07-10, kullanıcı raporu: "imsak yanlış, o saatte ezan okuyor" + "Balakən listede yok"). Canlı API ölçümüyle bulunan 4 kök neden ve düzeltmeleri:
  - **Aladhan auto-mode AZ'ye Tehran metodu (7) atıyordu** (ölçüldü: Balakən'de Sabah 16 dk erken, İkindi 72 dk yanlış — QMİ Hanafi ikindi kullanıyor). Düzeltme (`PrayerTimesContext.jsx getAladhanMethodParams`): auto+AZ → `method=99&methodSettings=16,3.7,15&school=1&tune=0,0,1,1,0,0,0,1,0` (Fajr 16°/İşa 15° + Hanafi Asr + Məğrib güneş −3.7° Şii ihtiyatı + yuvarlama tune'u). **namazvaxti.az resmi takvimiyle doğrulandı: Bakü tüm Temmuz ±1 dk (6 vakit), Zaqatala ±4 dk** (bölge tabloları muhtemelen Bakü+düzeltme; açı bazlı hesap mevsim-güvenli). AZ tespiti: manuel `userCountryCode==='az'` veya GPS `cached_country_code==='az'` — bbox YOK (Tiflis/Kuzey İran'ı yutar). Kullanıcı elle metot seçtiyse override edilmez.
  - **`normalizeTimings` AZ branch'i: Imsak=Fajr** (QMİ'de ayrı imsak yok; Aladhan'ın Imsak alanı sabit Fajr−10 tamponu — az dilinde ana sayaç ve sahur alarmına sızıyordu). Ayrıca `findNextPrayer` artık HER durumda `timings.Fajr` gösterir (İmsak sadece tr/az ETİKETİ) — ezan bildirimi Fajr'a kurulduğundan sayaç/ezan tutarsızlığı bitti.
  - **Manuel AZ şehrinde Diyanet lookup atlanır** (auto modda; Diyanet AZ şehirlerini kendi 18° imsakıyla yayınlıyor, resmiden ~15-20 dk sapık). Açıkça Diyanet (13) seçilirse kullanılır.
  - **Şehir seçimi: countriesnow.space → gömülü GeoNames + Photon fallback** — eski API Azerbaycan'da 8 şehir veriyordu ("Zurges" gibi uydurma kayıt dahil), Balakən yoktu; Open-Meteo geocoding "Balakən"i BULAMADI → elendi. **UX (kullanıcı kararları 2026-07-10): ülke→şehir İKİ ADIMLI + şehir listesi OTOMATİK dolu** (önce tek global arama yaptım → "10 alakasız şey çıkıyor"; sonra sadece arama kutusu → "elle yazmayayım, bütün şehirler yazsın"). Ülke adımı `src/data/countryCodes.js` (statik ISO 3166, ~240 kod, isimler `Intl.DisplayNames` lokalize, yerel+İngilizce adla aranır). Şehir adımı: **`public/data/cities/{cc}.json` — GeoNames cities5000'den üretilmiş 245 dosya, 69k şehir (nüfus 5000+), 3.9MB bundle, offline, [isim, bölge, lat, lon] format** — ülke seçilince tam liste anında görünür (alfabetik, `MAX_LIST_ROWS=400` DOM cap), yazınca lokal diakritik-toleranslı filtre (`foldText`: ə→e, ı→i, ş→s...). Listede olmayan küçük yerler için Photon (photon.komoot.io, OSM) fallback: lokal 0 sonuç + ≥2 harf → limit=50 + ülke countrycode filtresi + tip filtresi + 0 sonuçta "sorgu + İngilizce ülke adı" tekrar denemesi. **Veri üretim notları**: AZ/UZ/TM'de GeoNames birincil adları Rusça transliterasyon (Belokany) — ülke alternatif-isim dosyalarından yerel ad seçildi; DİKKAT: GeoNames'te makine-importu ÇÖP dil etiketleri var (`lang=az "Belokanj"`), o yüzden sıralama yerel-karakter öncelikli (ə/ʻ/ä içeren aday > dil etiketi) + Kiril adaylar elenir. admin1 "X Province" son eki kırpıldı. Üretim scripti scratchpad'de çalıştırıldı (kaynak: geonames cities5000.zip + admin1CodesASCII.txt + alternatenames/{AZ,UZ,TM}.zip) — repo'da script YOK, gerekirse Memory'deki bu tarif yeterli. Yeni locale key GEREKMEDİ.
  - **`setManualLocation(country, city, {countryCode, latitude, longitude})`** (`LocationContext`): `userCountryCode`/`userCityCoords` localStorage; context `manualCountryCode`/`manualCoords` expose eder. TR tespiti artık countryCode ile (eski İngilizce isim karşılaştırması fallback). `getManualCountryDiyanetName` countryCode'dan türetir (legacy countriesnow cache fallback durur).
  - **Bonus bug düzeldi: manuel şehir + GPS kapalıyken `fetchCalendarData` FALLBACK İstanbul koordinatı kullanıyordu** — gün 2+ bildirimleri ve widget çok günlük takvimi yanlış şehirdi. Artık öncelik: manuel koordinat > GPS > fallback (fetchPrayerTimes'ta da aynı; koordinatlı manuel seçim `timingsByAddress` yerine koordinatla çeker, `locationSource='manual'`). Takvim cache key'ine koordinat eklendi. NOT: koordinatsız ESKİ manuel seçimler (legacy) hâlâ timingsByAddress + İstanbul-takvim yoluna düşer — kullanıcı şehri bir kez yeniden seçince düzelir.
  - **Ezan bildirimi 3→5 gün** (`MAX_PRAYER_DAYS=5`, kullanıcı isteği): 5 gün × 6 slot (5 vakit + güneş) = 30 bildirim (ID 1-30, iptal aralığı 1-35 içinde). iOS 64 bütçesi: 30 ezan + 15 ön-hatırlatma (3 gün, `MAX_PREREMINDER_DAYS=3` ayrı sabit) + 5 kalıcı (3 ayet + cuma + zikir) + 1 sahur ≈ 51 — pay var. Uygulama 5 gün açılmazsa ezan susar (eskiden 3'tü).
  - **Türkmenistan Müftülük kuralları** (2026-07-10; kullanıcı raporu "vakitler buranın saatine göre değil" — Aladhan auto TM'ye de Tehran atıyordu: İkindi ~30 dk, Yatsı ~1,5 saat yanlış). Resmi 5 vilayet Oraza-2026 tablosundan (Türkmenistanyň Müftüsiniň müdiriýeti; gorogly.com görselleri OCR ile okundu) kural seti çıkarıldı — hepsi güneş doğuş/batışından türüyor: **İmsak = doğuş − 110 dk; Öýle SABİT 13:30 (Balkan lon<56.6 → 13:40); İkindi = Akşam − 100 dk; Akşam = batış + temkin (Ahal kutusu lat<40.6 & lon 56.6-61.4 → +12, diğerleri +5); Yatsı = Akşam + 80 dk**. `getTurkmenRules(lat,lng)` (auto modda) + `normalizeTimings` 4. parametre `tmRules` — istek metodundan bağımsız, Fajr/Dhuhr/Asr/Maghrib/Isha komple değiştirilir; timingsByAddress yolunda koordinat `response.meta`'dan alınır. Diyanet lookup TM manuel şehirde de atlanır (AZ gibi). **Simülasyon: 5 vilayet × 2 tarih resmi tabloyla ±2 dk (çoğu ±1).** Not: camiler Ertir (sabah cemaati) imsak+40'ta kılar — app TR konvansiyonu gibi imsakı gösterir. Sabit Öýle/+80 Yatsı kuralları Ramazan tablosundan; yıl geneli tablo yayınlanmıyor (islam.gov.tm ölü), kural-bazlı yapı yıl boyu tutarlı varsayıldı.
  - Cache: `CACHE_VERSION='v7_az_method'` (cached_*/diyanet_*/prayers_* + `countries_data_cache` temizlenir). `npm run build` ✓. Cihaz testi bekliyor (özellikle: Balakən seçimi → vakitler + ezan bildirimi + widget).

- ✅ **AiMentor çok-modlu cevap** (2026-07-10; spec `docs/superpowers/specs/2026-07-10-aimentor-multimode-design.md`, plan `docs/superpowers/plans/2026-07-10-aimentor-multimode.md`). Tek Gemini çağrısı, model cevaba `type` koyar: `prescription` (mevcut reçete + opsiyonel `dua` {arabic, transliteration, meaning} — kartta yeni bölüm), `guide` (app kullanım sorusu; `topic` + opsiyonel `action` deep link butonu), `text` (ibadet bilgisi/genel/nazik ret; fetva yasağı korunur, mezhep farkı notu). Backend (`functions/index.js`): 6 dil promptuna ortak İngilizce `SHARED_RULES` append (tip kuralları + route whitelist + APP_GUIDE bilgi tabanı: widget kurulumu iOS 14+/kilit ekranı iOS 16+/Android, widget listesi, free 1 saat/premium süresiz); `systemInstruction` alanı + history `contents` turn'leri (`sanitizeHistory`: max 6 kayıt, 2000 char, bozuk kayıt sessiz düşer). Client: `getSpiritualAdvice(msg, lang, history)`; AiMentor.jsx `summarizeForHistory` (reçete → özet metin), localStorage geçmişi 3→6, `ROUTE_WHITELIST` (backend ROUTES aynası, çifte koruma), action buton bubble altında. **Kota (kullanıcı kararı): SADECE `guide`+`topic:'widgets'` kotadan düşmez**, gerisi düşer; gönderim öncesi remaining kontrolü aynen (kota 0'da widget sorusu da gönderilemez — abuse önleme). Hızlı sorular 3→4: `suggestion3` yeni metin (widget ekleme), `suggestion4` YENİ (uyku duaları), eski rızık sorusu silindi; welcome yeni yetenekleri sayar — misc.json 6 dil parite + `prescription.duaLabel`. Analytics: `aiResponseReceived(type, ...)` (category=cevap tipi; analyticsService imzası değişmedi). Doğrulama: `node --check` ✓, parite scripti ✓, `npm run build` ✓. **Deploy bekliyor: `firebase deploy --only functions`**; cihaz el testi senaryoları planın sonunda.

- ✅ **Doğum günü ayeti kartı** (2026-07-17; spec `docs/superpowers/specs/2026-07-17-birthday-verse-design.md`, plan `docs/superpowers/plans/2026-07-17-birthday-verse.md`). "Doğum günün hangi ayete denk geliyor" paylaşım özelliği, AiMentor içinde. Eşleştirme deterministik client-side (`src/lib/birthdayVerse.js` — `AYAH_COUNTS` 114 sure Hafs + `birthdayToVerseRef(day,month)`): **surah=gün, verse=ay** (14/02 → 14:2). Kenar durum: sadece gün=1 & ay 8-12 (Fatiha 7 ayet taşar) → verse 7'ye **clamp**, surah hep=gün; geçersiz girdi (gün>31/ay>12/non-integer) → null. Kart `src/components/BirthdayVerseCard.jsx`: `getVerifiedVerse` ile ayet + alquran.cloud sesi, 🎂 başlık (`toLocaleDateString(lang)` — ay isimleri Intl'den, locale key yok), Arapça+meal+dinle/duraklat (mevcut `prescription.listen/pause` reuse) + **Paylaş** (Capacitor Share metin, `DuaKosesi` kalıbı: platforma göre mağaza linki). **Dua/zikir/şifa ayeti YOK** — tek ayet. İki giriş: (1) hoş geldin ekranında 🎂 chip → inline gün/ay select (aya göre gün sınırı) → hesap, backend'e istek YOK, **kotasız**; (2) serbest yazı → backend `SHARED_RULES`'a 4. tip `birthday_verse` (model sadece `day`+`month` ayıklar, verse DEĞİL — client hesaplar), **kotasız** (`quotaExempt`). AiMentor: `isBirthday` mesajı reçete gibi çıplak (bubble kutusuz) render, `summarizeForHistory` sabit özet. misc.json 6 dil parite: `aiMentor.birthday{Chip,PickerTitle,Day,Month,Show}` + yeni `birthdayCard.{heading,share,shareText}` (shareText placeholder'ları `{{date}}{{translation}}{{source}}{{link}}`). Doğrulama: node smoke test (8 case) ✓, `node --check` ✓, parite scripti ✓, `npm run build` ✓. **Deploy bekliyor: `firebase deploy --only functions`** (serbest-yazı yolu için; chip yolu deploy'suz çalışır); cihaz el testi planın sonunda.
  - **Redesign + görsel paylaşım** (2026-07-17, kullanıcı: "kart çirkin, güzel yap + Instagram fotoğraf olarak paylaş + hep o tasarım"): `BirthdayStoryCard.jsx` = tek görsel kimlik (illuminated manuscript: derin yeşil gradyan + altın, mihrab kemeri ayeti çerçeveler, tepede gün/ay altın madalyonu, SVG cake ikonu — emoji html2canvas'ta bozulur). `StoryCardInner` export'u HEM sohbette (ölçekli, ResizeObserver+`useLayoutEffect` transform scale, 1080×1920→sütun genişliği) HEM gizli capture'da kullanılır — tek tasarım her yerde. Paylaş: `shareHiddenElement` (mevcut, `src/lib/share.js`) gizli 1080×1920'ı html2canvas ile görsel yapıp native share'e (Instagram/WhatsApp story + `birthdayCard.shareText` caption + mağaza linki); öncesinde `document.fonts.ready` beklenir (Arapça font boş çıkmasın). Sohbet kartı artık kompakt değil = ölçekli story + altında Dinle/Paylaş. **Auto-fit** (`birthdayVerse.js` → `arabicFontPx`/`translationFontPx`): uzun ayet (Ayetel Kürsi) Arapça 100→44px, meal 42→34px küçülür, taşmaz. **Büyük/küçük (kullanıcı vurgusu):** uppercase JS `toLocaleUpperCase(lang)` — Türkçe "nisan→NİSAN" doğru (CSS `text-transform:uppercase` "NISAN" yapardı). Yeni `birthdayCard.cta` 6 dil parite (story CTA, `\n` iki satır). RTL: Arapça meal de rtl. Önizleme artifact yapıldı (kullanıcı onayladı). `npm run build` ✓. Not: cihazda html2canvas Arapça font + emoji-free doğrulaması kullanıcıda.

- ✅ **Kur'an dinlemede ayete atlama** (2026-07-10, `SurahDetail.jsx`): ayet numaraları (3 okuma modu + kart görünümü) tıklanınca o ayetten çalar (`playFromVerse` — playlist index'i verseKey ile bulunur, oradan devam eder); sub-mode tab satırında mini ayet inputu (yaz + play: scroll + premium'da dinletme; ücretsizde sadece scroll, paywall'a atmaz). Ölü `jumpTarget` kodu canlandırıldı. Locale `quran.json jumpToVerse` 6 dil. **Kritik fix** (`quranApi.js fetchChapterAudioFiles`): quran.com `by_chapter` SAYFALI (varsayılan 10/sayfa) — eski kod her surede sadece İLK 10 AYETİ çalıyordu (Dinle 10. ayette bitiyordu, "35 yaz → 10. ayet çalıyor" bug'ının da kökü); `per_page=300` + sayfa döngüsü emniyeti (canlı API doğrulandı: Bakara 286/286).

- ✅ **Kelime-senkron okuma takibi (karaoke)** (2026-07-16/17, `SurahDetail.jsx` + `quranApi.js`; iOS+Android kopyalandı). Dinlerken çalan ayette kelimeler okundukça yanar (okunmuş=normal, o an okunan=altın, gelmeyen=soluk); blok vurgu YOK. `KaraokeVerse` bileşeni izole (sadece çalan ayet re-render → FPS korunur). Zaman kaynağı quran.com `segments` ([wordPos,wordNo,startMs,endMs], `fetchChapterAudioFiles?fields=segments`). Sync mantığı: RAF'ta `audio.currentTime` akıyorsa birebir izle, iOS WKWebView'da donarsa `performance.now()` wall-clock ile köprüle + currentTime sıçrayınca İLERİ snap (asla geri gitmez). **Okunuş 0-hata düzeltmesi**: gösterilen okunuş fawazahmed0 CDN'di (kelime sayısı segment'e uymuyor → oran → kayma). Artık Okunuş metni de **quran.com word-by-word transliteration**'dan (`fetchChapterWordTransliterations`, verses?words=true) — kelime sayısı = segment sayısı GARANTİ (aynı kaynak, canlı doğrulandı Ahzâb 35-40 dahil 0 mismatch) → `direct` 1:1 map. quran.com akademik stil `turkishizeTranslit` ile Türkçe-dostu (dh→z, th→s, sh→ş, gh→ğ, kh→h, ā→â, q→k, w→v...). Okunuş sekmesine girince bir kez yüklenir, gelene kadar CDN fallback. Arapça modu segment'le zaten birebir. **Meâl'de karaoke YOK** (TR kelime sırası Arapça okuyuşla örtüşmez — yanıltıcı olur, eski yumuşak ayet vurgusu kaldı). NOT: karaoke bir ara "vazgeçtim" denip kaldırıldı, sonra kelime-senkron olarak geri getirildi. Ölü player UI (`handleSeek`/`formatTime`/`isPlayerVisible`/`ontimeupdate` state) de bu sırada söküldü (dinlerken 4Hz tüm-sayfa re-render jank'ı gitti). Sekme sırası: Okunuş → Meâl → Arapça.

- ✅ **Kur'an sekmesi mikro-rötuşlar** (2026-07-10, `Quran.jsx`; NOT: iki kapsamlı redesign denemesi de reddedildi, orijinal kart tasarımı korundu — bkz. memory `tasarim-tercihi-sade-native`): gömülü modda (`isTrackingTab`) koyu gradyan zemin + header paneli + çift p-5 kaldırıldı (kartlar tam genişlik, doğrudan sayfa zemininde; standalone `/quran` eski görünümde). Kart bg: yarı saydam `dark:bg-islamic-gold/5` zemin kalkınca açık kaldı → SABİT `dark:bg-[#0c2a16]` (kullanıcı 3 iterasyonla bu tonu seçmişti). **GÜNCELLENDİ 2026-08-17: `#0c2a16` ARTIK KULLANILMIYOR.** Kullanıcı Sureler kartlarının Hikayeler kartlarıyla aynı görünmesini istedi → her iki kart da (sure listesi + kaydettiklerim) `StoryCard` paletine geçti: `bg-[#FFFDF6] dark:bg-white/5 border-none shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] hover:shadow-xl`. Altın çerçeve (`border-islamic-gold/10` + `hover:border-islamic-gold/30`) kaldırıldı. Zeminler ortak (`#032e18`) olduğu için sonuç Hikayeler'le birebir. Eski koyu tonu geri getirme. Sure numaraları dark'ta beyaz (light'ta yeşil kaldı — açık kutuda beyaz okunmaz). Arama: aksan/büyük-küçük/apostrof duyarsız (`normalizeSearch`: tr lowercase + NFD strip + ı→i + apostrof/tire sil — "FATIHA"→Fâtiha, "araf"→A'râf, "ali imran"→Âl-i İmrân) + X temizle butonu. Başlık truncate, özet `line-clamp-3`, premium banner metinleri lokalize (`premiumBannerTitle/Subtitle` — quran.json 38 key, 6 dil pariteli).

- ✅ **Dünya geneli metot taraması + Hanefi school düzeltmesi** (2026-07-10; kullanıcı: "her ülke için sana mı söyleyeceğim, bütün dünya için yapamaz mıyız?"). 14 riskli ülke Aladhan auto ataması ölçüldü. Bulgular ve düzeltmeler (`getAladhanMethodParams`):
  - **Aladhan auto HİÇBİR ülkeye `school` (Hanefi ikindi) vermiyor** — Güney/Orta Asya'da İkindi ~1 saat erkendi. `HANAFI_SCHOOL_COUNTRIES = pk,in,bd,af,tj,kg,kz,uz` → auto modda `school=1` eklenir (Aladhan'ın metot seçimi korunur; school parametresi metotsuz istekte de çalışıyor, ölçüldü). **Türkiye listede DEĞİL** — Diyanet standart (asr-ı evvel) yayınlar. Doğrulama: namozvaqti.uz Taşkent Asr 17:41=Hanefi ✓; Karaçi school=1 → 17:20 ✓.
  - **Özbekistan → Tehran atanıyordu** (AZ/TM hastalığı) → `uz: {method:14, school:1}` (Rusya 16°/15° açıları + Hanefi; yerel takvim ailesiyle uyumlu, Shom=sunset ✓ Xufton ±10 dk). İnce ayar istenirse namozvaqti.uz aylık tablolarıyla kalibre edilebilir.
  - Ölçülüp DOKUNULMAYANLAR: KZ/KG→method 14 (makul, sadece school eklendi), TJ/PK/IN/BD/AF→Karachi (doğru, school eklendi), Irak→Kuwait (makul), Bosna/Arnavutluk→Tunisia (şüpheli ama resmi Rijaset takvimiyle ölçülmeden dokunulmadı), Gürcistan→Tehran (küçük nüfus, kanıtsız, beklemede).
  - **Yaklaşım (kalıcı):** vakit doğruluğu = astronomi (evrensel ✓) + ülke otorite konvansiyonu (veri işi). Katmanlar: (1) Aladhan auto yerel otorite, (2) ülke-kural katmanı (TR Diyanet, AZ QMİ, TM Müftülük, UZ, Hanefi school seti), (3) kullanıcı ayarlardan elle metot seçebilir. Yeni ülke şikayeti gelirse: resmi takvimi bul → Aladhan ile ölç → kural katmanına ekle (AZ/TM örnekleri şablon).

- ✅ **Ferah tema — krem + kehribar açık tema, uygulama geneli** (2026-07-17; kullanıcı odak kartındaki "Kum" temasını beğenip onayladı, artifact önizlemesiyle karar verildi). Palet: zemin `#F6F0E1`, kart `#FFFDF6`, kontrol dolgusu `#F0E8D5`/`#E9DFC8`, çizgi `#E2D9C4`, vurgu **amber-600 `#D97706` / amber-700 `#B45309`** (Tailwind hazır sınıfları, config değişmedi), marka yeşili `#044D29` çapa olarak kaldı (CTA butonlar, vakit kartı, SurahDetail header). **Koyu tema hiç değişmedi.** Uygulama: (1) `index.css` token'ları (`--background/card/popover/muted/accent/border/input/ring`) + `glass-panel` light tarafı; (2) `AppLayout` zemin/header/nav + nav aktif = amber; (3) scratchpad `recolor.py` script'i tüm sayfa/bileşenlerde light-only nötr dönüşüm (regex `(?<!dark:)` guard — koyu sınıflara kör); (4) vurgu kararları elle: aktif sekmeler (Tracking, Quran), sure numarası çipleri, MEKKE/MEDINE eyebrow'ları, okuma modu ayet rozetleri, karaoke o-anki-kelime light rengi = amber; (5) eski fildişi hex ailesi (#FAF8F3/#F9F8F3/#F5F0E6/#EDE6D6/#F3F1EA) krem ailesine map'lendi (Dhikr/Murakabe/Tefekkur/Fasting gradyanları dahil). DOKUNULMADI: paywall'lar, ShareCard/BirthdayStoryCard (sabit görsel tasarımlar), Tuba widget yeşil kimliği, Qibla (koyu ekran), Onboarding. `npm run build` ✓, iOS+Android copy ✓. Cihaz görsel testi kullanıcıda.
  - **2. tur — "gündüz modunda yeşil sıfır" (2026-07-17, kullanıcı: "Yeşil yer kalmasın, paywallu bile... Hiçbir yer bırakma"):** Ana mekanizma: `tailwind.config.js`'te `islamic.green` artık `rgb(var(--islamic-green)/<alpha-value>)`; `index.css` `:root` → `217 119 6` (amber-600), `.dark` → `4 77 41` (marka yeşili). Böylece 30 dosyadaki TÜM `*-islamic-green` sınıfları (71 derlenmiş utility) otomatik light=amber / dark=yeşil oldu — dark tema hiç değişmedi, yeni yeşil eklerken de bu token kullanılmalı. Elle yapılanlar: (a) sabit-koyu yüzeylere `dark:` split ile gündüz koyu-amber varyant — **PremiumPaywall** (4 inline gradyan style→Tailwind arbitrary class taşındı: `bg-[linear-gradient(...)] dark:bg-[...]`; logic'e dokunulmadı), **CreditPaywallModal**, Kaza kartı (Tracking), Quran premium banner'ı, DuaKosesi üst dua kartı (`bg-[#92400e]`), Home hızlı-zikir sheet'i (radial), SurahDetail "sonraki sure" butonu, Profile+WidgetGuide altın karttaki yeşil yazı/mühürler; (b) light-side `emerald/green-N` sınıfları amber-N'e (dark: orijinal korunarak) ~20 dosyada; (c) ayar sayfalarının beyazı `bg-slate-50` çıktı → `#F6F0E1` (+ hover `#F0E8D5`); (d) rgba yeşil gölgeler (4,77,41 / 7,77,46 / 16,185,129) light tarafta amber rgba'ya, `glow-green` ve parchment dokusu dahil; (e) splash yeşil glow → amber, `index.html` light zemini `#FAF8F3`→`#F6F0E1`, DuaKosesi swal ikon rengi `#B45309`. BİLİNÇLİ YEŞİL KALANLAR: ShareCard/BirthdayStoryCard/BirthdayVerseCard kart kimliği, Qibla+SleepMode (koyu gece ekranları), Dhikr "Zümrüt" tesbih tanesi + SurahDetail "Zümrüt" odak teması (kullanıcı seçimi içerik renkleri), altın buton üstü `#021a0f/#032e18` yazılar (siyah algılanır), Onboarding/Splash koyu zemini, Android bildirim rengi (`Quran.jsx` backgroundMode `044D29`), capacitor.config `backgroundColor`. Native widget'lar (Swift/Java) bu kapsamda DEĞİL. `npm run build` ✓, cap copy iOS+Android ✓.

- ✅ **Öğren > Dualar — SIFIRDAN yeniden tasarım: "raf"** (2026-08-18). Kullanıcı önce sadece "play tuşu + kart düzeni" istedi, çıkan sonucu reddetti: *"daha kötü oldu. Bu kısmı komple 0'dan tasarla... bütün skillerini çalıştır, istediğin kadar agent."* 16 ajanlık tasarım workflow'u koşuldu (4 rakip konsept → acımasız eleştiri → 4 mercekli jüri → sentez → eksik avcısı). **Kazanan: `kutuphane`** (4 jüriden 3'ü). Spec: `docs/` değil, workflow çıktısı.
  - **Sihirbaz Dualar'dan kalktı.** 50 dua artık "adım 1/50 · ileri/geri" değil; **niyete göre 7 bölüme** ayrılmış tek liste (Günlük Hayat 10 · Sıkıntı ve Şifa 9 · Korunma 4 · Namazda Okunanlar 7 · Tövbe ve İman 9 · Salavatlar 4 · İstek ve Kabul 7). Sihirbaz **Abdest/Sureler/Namaz'da aynen duruyor** — orası gerçekten sıralı prosedür; "Maşallah" bitiş ekranı da silinmedi (Abdest ücretsiz ve 15 adım).
  - **Yeni dosyalar:** `src/data/duaTags.js` (grup + ücretsiz bayrağı + arama takma adları), `src/components/dua/{DuaLibrary,DuaRow,DuaSheet}.jsx`, `src/hooks/useHardwareBack.js`.
  - **Anahtar = Arapça metnin sadeleşmiş ilk 24 harfi**, indeks DEĞİL. Sebep: dil dosyalarında dua sayısı farklı (tr/az 50, en/de/ru/ar 49) ve sıra da farklı — indekse bağlanan grup/kota/favori dil değişince kayardı. `duaKey` `duaAudio.js`'ten İMPORT EDİLMEZ, dondurulmuş kopyadır (o fonksiyon ses için yazıldı; normalizasyonu değişirse favoriler ve premium kotası sessizce kayardı). 6 dilde 0 eşleşmeyen doğrulandı.
  - **Detay = route DEĞİL, alttan açılan tabaka** (portal). Gerekçe: `useSmartPaywall` HER route değişiminde sayaç artırıyor — birkaç dua gezen kullanıcı zorla paywall yerdi. Ayrıca `useIOSSwipeBack`'te `/learn` → `/` eşlemesi var, alt-route olsaydı kenar kaydırma listeye değil ana sayfaya atardı. Bedeli bilinçli: dua deep link'i yok.
  - **Android donanım geri tuşu** — projede hiç `backButton` dinleyicisi YOKTU; tabaka açıkken geri tuşu uygulamadan çıkarırdı. `useHardwareBack` eklendi (`onBack` ref'te tutulur, dinleyici her render'da sökülüp takılmaz).
  - **Arama tek mekanizma.** Başlık + amaç + okunuş + meal + **bölüm adı** + takma adlar taranır (`normalizeSearch`, Quran.jsx kalıbı: diakritik/apostrof/büyük-küçük duyarsız). Bölüm adı aranabilir olduğu için kalıcı filtre şeridine gerek kalmadı; çipler yalnız arama kutusuna odaklanınca beliriyor (0px kalıcı krom). Takma adlar TR+EN: "4444"→Tefriciye, "rızık"→Karınca, "ayetel kürsi"→#47, "sınav"→Rabbi Yessir, "kem göz"→Nazar.
  - **PREMIUM — dikkat, ürün kararı:** kota indeksten anahtara taşındı. Bugünkü ücretsiz 10 dua **aynen korundu** (test bunu doğruluyor: "bugün ücretsiz olup kilitlenen: YOK"), üstüne **4 dua eklendi (10→14)**: Uyanınca · Yemek Duası (Başlarken) · Sübhâneke · Salavat-ı Şerife. Sebep: yeni düzende her bölümde en az 1 ücretsiz dua olmalı, yoksa Günlük Hayat komple kilitli görünüyordu. **Geri almak tek satır**: `duaTags.js`'te o 4 kaydın `free: true` → `false`. Ayrıca kilitli duada **Arapça tam metin açık** (okunuş/meal/ses kilitli) — bulanık sahte metin YOK. Kilitli satır `/premium`'a atmaz, önce tabaka açılır. `namazlar`/`kadinNamaz` kategori kilidi ve `sureler` kotası aynen.
  - **Bug düzeltmesi:** `premiumStatusChanged` dinleniyor — eski Learn dinlemiyordu, satın alma sonrası ekran kilitli kalıyordu.
  - **Görsel dil:** iOS Ayarlar sakinliği — bölüm başına TEK kart + `divide-y` satırlar, satırda ikon yok (50 kez tekrar eden dekorasyon olurdu), `backdrop-blur` hiçbir yerde yok (50 satırda sürekli repaint), `font-serif` (Amiri) başlıkta yasak — hepsi `font-display` (sistem fontu). **Ekranda tek glow var ve durum-bazlı**: sadece ses çalarken Dinle butonunda. Tüm punto değerleri `rem` → Ayarlar'daki yazı boyutu bu ekranda artık çalışıyor.
  - **Işık temasında altın düzeltmesi:** `islamic-gold` (#D4AF37) krem zeminde 1.8:1 kontrast veriyordu — Arapça metin, taç rozeti ve madde imleri ışıkta koyu kehribara (#92400E / #B45309) alındı, koyu tema hiç değişmedi.
  - **Favoriler** `dua_favorites` (`storageService` + `CRITICAL_KEYS` → Keychain yedeği). Listede kalp GÖSTERGE, buton değil (50 satırda 50 dokunma hedefi yanlış dokunma üretir); favori kararı tabakada veriliyor.
  - **Analytics:** Learn'de daha önce TEK event yoktu. 6 event eklendi (`learn_dua_open/search/paywall_view/paywall_tap/audio_play/fav`). Ücretsiz-14 kararının doğruluğu ancak `paywall_view` + `paywall_tap` çiftiyle ölçülebilir.
  - `learn.json` 29→**56 key**, 6 dil pariteli + placeholder bütünlüğü doğrulandı. `{{count}}` yerine `{{n}}` kullanıldı (i18next çoğul mekanizmasını tetiklemesin, parite scripti sade kalsın).
  - **Doğrulama:** 30 + 24 birim testi ✓ · 6 dilde etiket/kota doğrulama scripti ✓ · **Playwright ile gerçek render**: 390×844'te 50 duanın hepsi açıldı, yatay taşma 0, konsol hatası 0; TR/DE/AR ve açık/koyu tema görsel kontrol; AR'da düzen aynalanıyor, okunuş bloğu `dir=ltr`, meal bloğu gizli (AR verisinde `meaning` gerçek meal değil). `npm run build` ✓ · lint 0 hata (Learn.jsx:1035'teki `react-hooks/refs` ÖNCEDEN vardı) · `cap copy` ios+android ✓.
  - **Liste tasarımı 4 turda oturdu — DERS: tahmin etmeyi bırakıp seçenek göster.** Kullanıcı listeyi üst üste "sıkıcı / daha kötü / yine kötü" diye reddetti. Denenenler: (1) düz `divide-y` satır listesi, (2) renkli ikon kutulu bölüm başlığı + rozet çipleri + chevron + cam kart, (3) her kartın üstünde altın **Arapça şerit** (fade maskeli) — üçü de reddedildi. Dördüncü turda kod yazmak yerine **6 gerçekten farklı yönü tek sayfada karşılaştırmalı gösteren bir artifact** yayınlandı (Amiri fontu base64 gömülü, aynı 3 dua, uygulamanın gerçek koyu/açık zemininde, 390px): İndeks · Filigran · Izgara · Mihrap · Renk sırtı · Kabartma. Kullanıcı **"indeks"i** seçti — tek turda bitti. Bir dahaki "sıkıcı" turunda ilk hamle bu olmalı.
  - **İlk seçim "indeks"ti, sonra MİHRAP'a geçildi** (kullanıcı: "Mihrap temasını yap, ben bunu beğenmedim"). Aktif kart: **mihrap** — altın çerçeve, sağ üst köşede üç iç içe mihrap kemeri (SVG, `opacity-50`), 160° gradyan zemin (koyu `#073b21→#04240f`, açık `#FFFDF6→#F4EBD8`), üstte duanın Arapça metni (tek satır, sola doğru sönen maske — üç nokta Arapça hatta çirkin duruyor), altında altından soluğa giden ayraç çizgisi, en altta başlık + amaç + premium tacı. Chevron ve sıra numarası YOK (artifact'teki 4 numaralı örneğin birebir kodu). Bölüm başlığı (renkli ikon kutusu + sayaç pili) ve "altın = sadece premium" kuralı korundu.
    - *Denenip elenen:* **"indeks" kartı** (`DuaRow.jsx`): ayrı kartlar (bölünmüş tek blok değil), solda ince/açık renkli **2 haneli sıra numarası** (1.625rem, `font-light`, tabular-nums) + dikey saç teli ayraç, sonra başlık + amaç, sağda rozetler ve chevron. **Numara bölüm içi konumdur, kimlik DEĞİL** — diller arası sıra farklı, hiçbir yerde saklanmaz. Arapça hat listede YOK, sadece açılan tabakada. Bölüm başlığı (renkli ikon kutusu + sayaç pili), rozet renk kuralı (**altın = sadece premium**, ses nötr) ve chevron 2. turdan korundu.
  - **Okuma tabakası "levha" düzenine geçti** (2026-08-18; ikinci karşılaştırma artifact'i: Mihrap sayfası · Sessiz okuma · **Levha** · Sekmeli — telefon çerçevesi içinde dikey gösterildi, kullanıcı web'de yatay bakınca anlamadığını söylemişti). Seçim: **3 numara (Levha) + 1'in altın çerçeveli ipuçları + 2'nin parlak meal metni.** Uygulanan: (a) Arapça artık düz `border-y` şerit değil, **levha** — dış kalın altın çerçeve (`p-[0.5625rem]`, `rounded-md`) + ince iç çerçeve + koyu iç zemin + dört köşede 45° döndürülmüş altın elmas (`CORNERS` dizisi); (b) İPUÇLARI dolgu kutusundan **altın çerçeveli kutuya** döndü (`border-[#B45309]/25 dark:border-islamic-gold/25`, dolgu yok); (c) ANLAMI bloğu sayfanın **en parlak metni** oldu (`text-stone-900 dark:text-white`) ve soldaki altın kenar çubuğu yerine üstten ince ayraç çizgisi aldı — meal asıl okunacak şey. Tailwind'in ürettiği CSS'te dört keyfi değer sınıfının da (`0.1875/0.5625/0.4375rem`) çıktığı doğrulandı.
  - **+20 dua eklendi (2026-08-18) → 50 oldu 70** (en/de/ru/ar 49→69, az 50→70; sayı farkı bilinen ve zararsız, eşleşme anahtar üzerinden). Hepsi sahih kaynaklı ve mevcut listede yoktu. Bölümlere dağılım: **Günlük hayat +4** (Camiden Çıkarken, Elbise Giyerken, Hilâli Görünce, Çarşıya Girerken), **Sıkıntı ve şifa +3** (Hasta Ziyaretinde, Musibet Anında, Üzüntü ve Keder), **Korunma +3** (Eûzü, Kötü Rüya Görünce, Çocuklar İçin Koruma), **Namazda okunanlar +3** (Rükû Tesbihi, Secde Tesbihi, İki Secde Arasında), **Tövbe ve iman +2** (Uzun İstiğfar, Günahtan Sonra Tövbe), **Salavatlar +1** (Salâtü'l-Fâtih), **İstek ve kabul +4** (Hayırlı Rızık, Eş ve Çocuk Duası — Furkan 74, Anne Babaya Dua — İsrâ 24, İstihare Duası). Her biri 6 dilde tam kayıt (başlık/amaç/Arapça/okunuş/meal/ipuçları) + `duaTags` girdisi (grup + arama takma adları). **Hepsi `free: false`** — ücretsiz set 14'te kaldı, kimseden hiçbir şey alınmadı, kilitli 36→56. Yeni takma adlar tek tek denendi: "istihare", "kabus", "anne baba", "market", "giyinme", "hilal", "musibet", "depresyon", "salatü fatih" hepsi doğru duayı buluyor.
    - *Uyarı:* yeni kayıtlar **çift tırnaklı** JS dizeleri (Türkçe kesme işareti yüzünden); Learn.jsx'ten dua ayıklayan her script tek VE çift tırnağı birlikte yakalamalı — scratchpad doğrulama scriptleri bir kez bu yüzden yanlış sayı verdi.
    - Bölüm başlıklarındaki sayı kaldırıldı ("Elli Dua" → "Dualar"), 6 dilde; zaten raf görünümünde gösterilmiyor ama yanıltıcıydı.
  - **Cihazda test edilmesi şart:** Android donanım geri tuşu, tabaka `h-[92vh]` + safe-area, düşük seviye Android'de liste akıcılığı, `--app-font-scale` 1.3'te satır kırılması.
  - **SESLİ OKUMA TAMAMEN KALDIRILDI (2026-08-18, kullanıcı isteği).** Bu oturumda kurulan ses özelliğinin tamamı söküldü: `src/components/DuaAudioPlayer.jsx` ve `src/data/duaAudio.js` **silindi**; DuaSheet'teki oynatıcı, DuaRow'daki kulaklık rozeti, DuaLibrary'deki `hasAudio`/`lockedAudioCount`, Learn.jsx sihirbazındaki oynatıcı, `analytics.duaAudioPlayed` ve 5 locale anahtarı (`audioListen/audioPause/audioError/audioSource/duaAudioBadge`) kaldırıldı. `duaLockSub` `{{audio}}` sayacından arındırıldı, `duaLockTitle` "Okunuş ve meal" oldu. learn.json 56→**51 key**, 6 dil pariteli. Ölü referans taraması 10 terimde 0 sonuç. NOT: Hikayeler ve Uyku ekranlarındaki `audioError` anahtarları AYRI namespace, dokunulmadı.
    - *Kaldırılmadan önceki durum (geri istenirse):* 50 duanın 36'sında ses vardı — 15'i `verses.quran.com/Alafasy` (Kur'an bölümüyle aynı hafız, recitationId 7), 21'i `hisnmuslim.com/audio/ar/{id}.mp3`. Alafasy Kur'an okuduğu için hadis dualarında kaydı yoktu (resmi sitesi alafasy.me HTTP 410); kullanıcı "hepsi aynı ses olsun" isteyip sonuçtan memnun kalmayınca özelliği tamamen kaldırmayı seçti. Eşleştirme tarifi bu dosyanın git geçmişinde (`duaAudio.js`) duruyor.
  - **Cihazda test edilmesi şart:** Android donanım geri tuşu, tabaka `h-[92vh]` + safe-area, düşük seviye Android'de liste akıcılığı, `--app-font-scale` 1.3'te satır kırılması.
  - **Okuyucu birleştirildi (kullanıcı: "Kur'an'daki sesli okuyan kişinin aynısı duaları okusun")**: Kur'an ayeti olan **15 dua** artık `verses.quran.com/Alafasy` — uygulamanın Kur'an bölümüyle AYNI hafız (`quranApi.js` recitationId 7, ayar yok, sabit). 6 dua hisnmuslim'den Alafasy'ye çevrildi: Rabbena Âtina (2:201), Hasbünallah (3:173), Hz. Yunus (21:87), Yolculuk (43:13), Âmenerrasulü (2:286), Âyetel Kürsî (2:255). **Kalan 21 dua hâlâ Hisnü'l-Müslim okuyucusunda** — Alafasy Kur'an okur, hadis kaynaklı dualarda (yemek, uyku, istiğfar, salavat, Sübhâneke/Ettehiyyatü, cenaze) ondan ücretsiz+güvenilir kayıt YOK; resmi sitesi alafasy.me kapandı (HTTP 410), archive.org'da temiz per-dua kaydı bulunamadı. **Tek sese inmek istenirse** hisnmuslim kayıtlarını silmek yeter — o zaman sesli dua 36'dan 15'e düşer (kullanıcıya soruldu, karar bekliyor). Bilinen takas: ayet dualarında ses TAM ayeti okur, kartta gösterilen metin bazen ayetin sadece dua kısmıdır (Hasbünallah = Âl-i İmrân 173'ün sonu) — okuyuş birkaç kelime önce başlar. 40 benzersiz adresin hepsi yeniden doğrulandı, 0 kırık.
  - **Bu turdan önceki iş (dua sesleri) korundu:** `duaAudio.js` 36/50 duada gerçek insan sesi (hisnmuslim + quran.com Alafasy), `DuaAudioPlayer` tabakada kullanılıyor. Sesi olmayan 14 duada buton hiç çıkmaz.

- ✅ **Dua listesi "raf" düzenine geçti** (2026-08-18, kullanıcı: "kişiler sürekli kategorileri görsün"). Karar yine **karşılaştırma artifact'iyle** verildi: 5 gezinme yönü (Kapı ızgarası · sabit çip Şeridi · filtre Sekmeleri · Katlanır akordeon · yatay Raf) telefon çerçevesinde canlı gösterildi, kullanıcı **05 Raf**'ı seçti. *Ders (tekrar):* ilk artifact ekranları JavaScript ile çiziyordu ve **artifact'ta JS çalışmadı — hepsi boş yeşil çıktı**; sayfa statik HTML + saf CSS (radio/checkbox) ile yeniden yazılınca düzeldi. Artifact maketlerinde JS'e bel bağlama.
  - **Yeni düzen** (`DuaLibrary.jsx`): her bölüm bir raf — başlıkta renkli ikon + ad + **"Tümü"** butonu, altında yatay kayan dua kartları (`snap-x`, kart genişliği `13.75rem`). Bölüm adları dikey kaydırma boyunca ekranda kalır. "Tümü" o bölümün **dikey listesini** açar (route DEĞİL, in-page state — `useSmartPaywall` sayacı korunsun diye; donanım geri tuşu `useHardwareBack` ile bağlı, tabaka açıkken önceliği DuaSheet alır). Arama modunda raf yok, eski dikey gruplu sonuç listesi aynen kalır.
  - **Odağa-gelince-beliren çipler KALDIRILDI** — bölüm adları artık zaten sürekli görünüyor (`chipsHeld`, `pickGroup`, framer-motion importu da gitti).
  - **iOS kenardan-geri hatası düzeltildi** (`useIOSSwipeBack.js`): sol 80px'den başlayan sağa kaydırma `/learn` → `/` navigasyonu tetikliyordu; rafı sağa kaydırmak uygulamayı ana sayfaya atardı. Artık `[data-hscroll]` işaretli kaplarda jest yok sayılıyor. Aynı işaret Learn'ün kategori şeridine de kondu (orada da vardı, fark edilmemişti).
  - `DuaRow` yeni `compact` prop'u: dar kartta amaç satırı gizli, kart `h-full` (aynı raftaki kartlar eşit boy). **Mihrap kemeri küçültüldü ve Arapça hatta kendi şeridi verildi** (`ps-11` dar, `ps-14` geniş) — kullanıcı "iç içe giriyor" dedi, hat kemerin içinden başlıyordu.
  - **Bölüm başlıklarındaki ikon kutuları KALDIRILDI** (kullanıcı: "bu emojiler ai slop, her şey aynı"). Lucide güneş/kalkan/ay/kalp simgeleri gitti (`GROUP_ICON` haritası ve importlar da); yerine tipografik başlık: bölüm adı + küçük altın sayı + **dua kartındaki altın ayraç çizgisinin aynısı** (`GoldRule`, `flex-1`) + "Tümü". Uygulamada başka hazır ikon eklerken bunu hatırla: kullanıcı jenerik ikon setinden hoşlanmıyor.
  - **Raf ölçüleri — kullanıcı kararı, deneyip geri alındı:** kart genişliği `13.75rem` SABİT kalacak, raf tam-genişlik (`-mx-5 ... px-5`) ve kaydırınca kartın sol kenara yapışması **sorun değil** ("kartları küçültme, köşeye yapışık olsun"). Denenip geri alınanlar: `scroll-ps/pe` ile snap durağını içeri alma, kartı `%44`e daraltıp 3. kartın kenarını gösterme (kullanıcı: "çok ortaya aldın" / "kartları küçültme"). Kalıcı olanlar: bölüm başlığı ile kartlar aynı hizada (başlıktan `px-1` kalktı), bölümden geri dönünce raf listesi bırakılan yere döner (`shelfScrollRef` + çift rAF), `Learn.jsx` dua dalına `pb-32` (son raf bottom bar altında kalıyordu).
  - **Öğren kategori şeridi eski segment paneline döndürüldü** (kullanıcı 2026-08-18: "zaten öyleydi, geri getir"): `glass-panel grid grid-cols-5 rounded-3xl p-2`, sekme = üstte ikon + altta BÜYÜK HARF etiket, aktif altın dolgu, kilitli kategoride taç rozeti — Hikayeler ve İbadetlerim sekmeleriyle birebir aynı. Bu tur içinde denenen yatay kaydırmalı yuvarlak çip şeridi (Almanca/Rusça etiketler 5 sütunda sıkışmasın diye yapılmıştı) kaldırıldı; aktif çipi görünür alana kaydıran ref/effect de ölü kalınca silindi.
  - Yeni analytics: `learn_dua_group_open`. learn.json 51→**53 key** (`duaSeeAll`, `duaBack`), 6 dil pariteli. `npm run build` ✓, lint 0 yeni hata, `cap copy` ios+android ✓. Cihazda bakılacak: rafın kaydırma akıcılığı, kenardan geri jesti, `--app-font-scale` 1.3'te kart yüksekliği.

- ✅ **Ezber modu — Öğren > Sureler** (2026-08-18, kullanıcı seçimi; önerilenler arasından "ezber olsun"). Gerekçe: okuma/dinleme işini Kur'an sekmesi zaten daha iyi yapıyordu, Öğren'deki Sureler onun küçük kopyasıydı. Artık orası "okunan yer" değil **ezberlenen yer**.
  - **Mekanik:** sure kartının altında "Ezberle" butonu → alttan açılan tabaka (route DEĞİL, portal — `useSmartPaywall` sayacı). Üç seviye: kelimelerin **%30 / %60 / %100'ü gizli**. Gizli kelimeye dokunmak onu açar (ceza yok, açılan sayısı gösterilir). Seviye bitince "Bitirdim", üçü bitince "Ezberledin" ekranı + "Baştan dene". Butonda ilerleme rozeti (`2/3` ya da ✓). Okunuş isteğe bağlı açılır.
  - **Yeni dosyalar:** `src/lib/memorize.js` (anahtar, ayet/kelime bölme, tohumlu maske, ilerleme), `src/components/memorize/MemorizeSheet.jsx`.
  - **Maske tohumlu** (`mulberry32` + FNV): aynı (sure, seviye, deneme) hep aynı kelimeleri gizler — yeniden çizimde kelimeler yer değiştirmez. "Baştan dene" deneme sayacını artırıp yeni dağılım verir.
  - **ANAHTAR — iki tuzak yakalandı, ikisi de testte:** (1) sure sırası **dil dosyalarına göre farklı** (ru/ar/az'de İhlâs sonda), indeks tabanlı ilerleme dil değişince başka sureye yazardı; (2) dualardaki "ilk 24 harf" yöntemi burada **Felak ile Nâs'ı aynı anahtara** düşürüyordu (ikisi de besmele + "kul eûzü birabbi" ile başlıyor) — biri ezberlenince öteki de tamamlanmış görünürdü. Çözüm: **sadeleşmiş metnin TAMAMININ karması + harf sayısı**. 12 surede benzersiz, 6 dilde aynı sure = aynı anahtar (script ile doğrulandı).
  - İlerleme `sure_memorize_v1`, `CRITICAL_KEYS`'e eklendi (Keychain yedeği — haftalarca emek). Kayıtlı seviye asla düşmez; "baştan dene" seviyeyi sıfırlar ama ✓ rozetini korur.
  - **Premium:** yeni kapı YOK. Sureler'de zaten ilk sure ücretsiz (`FREE_SURE_COUNT=1`), kilitli sureye ulaşılamadığı için ezber de doğal olarak aynı kapının arkasında.
  - **Yan düzeltme:** açık tabakada (dua + ezber) iOS kenardan-geri jesti artık yok sayılıyor (`[data-sheet]`, `useIOSSwipeBack`) — sol kenardan kaydırınca okunan/ezberlenen yer kaybolup ana sayfaya atıyordu.
  - Analytics: `learn_memorize_start` / `_level_done` (level + açılan kelime sayısı) / `_complete`. learn.json 53→**72 key**, 6 dil pariteli.
  - **Doğrulama:** 30 birim testi ✓ (bölme, anahtar, maske dağılımı, ilerleme kuralları, bozuk girdi), 12 sure üzerinde simülasyon ✓, 6 dil anahtar eşleşmesi ✓, `npm run build` ✓, lint 0 yeni hata, `cap copy` ios+android ✓. **Cihazda bakılacak:** gizli kelime genişliği (buton `font: inherit` ile düzeltildi), Ayetel Kürsi (tek blok, 50 kelime), Android geri tuşu, `--app-font-scale` 1.3.

- ✅ **Ezber modu "PERDE" — Öğren > Sureler** (2026-08-18). **Birinci deneme (Arapça kelime gizleme) kullanıcı tarafından reddedildi:** *"Arapça'yı millet nasıl ezberleyecek bunu."* Hedef kitle Arapça HARF OKUYAMIYOR; kısa sureler Latin okunuştan ve kulaktan ezberleniyor. Tasarım 13 ajanlık workflow ile sıfırdan kuruldu (keşif → 4 rakip konsept → acımasız eleştiri → sentez), sonra 3 varyant web'de gösterildi, kullanıcı **A / Perde**'yi seçti.
  - **İLKE:** metin ya tamamen açık ya tamamen kapalı — **asla yarısı**. Kısmi gizleme (baş harf ipucu dahil) reddedilen tasarımın iskeletidir; "eksik kelimeyi tamamla" ezber değil bulmaca üretir. Bir daha kelime/harf gizleme önerme.
  - **Döngü:** DUY (ses çalar, okunuş açık) → BERABER (aynı ses, sesle birlikte söyle) → SEN SÖYLE (perde iner: okunuş VE meal komple kaybolur, Arapça levha çapa olarak kalır) → DOĞRUSU ("Söyledim"e basınca perde açılır **ve aynı anda ses çalar**) → ZİNCİR (her yeni satır bir öncekilerle baştan bağlanır — Osmanlı usulü kümülatif bağlama). Oturum en fazla **3 yeni satır** (Cowan: odak kapasitesi ~4 birim).
  - **Yeni dosyalar:** `src/lib/ezber.js` (satırlama, ses eşleme, ilerleme, SRS), `src/lib/ezberNotify.js` (tarihli tekil bildirim), `src/components/ezber/EzberSheet.jsx` (portal tabaka). **Silinenler:** `src/lib/memorize.js`, `src/components/memorize/MemorizeSheet.jsx`, 18 `memorize*` locale key'i, 3 analytics event.
  - **SATIR = ezber birimi.** Arapça `۝` ile bölünür. **Ayetel Kürsi tek ayet olduğu için elle 8 anlam öbeğine bölünür** (çapa kelimeler `KURSI_ANCHORS`; birleşimi orijinal metne eşit — testle sabit). Okunuş `transcription`'dan cümle bölmeyle çıkar; **iki istisna 6 dilde de aynı yerde: Nasr son iki cümle tek ayet, Tebbet 5+6 tek ayet** (`MERGE_RULES`). Okunuş satır sayısı Arapça satır sayısını tutmazsa okunuş TAMAMEN düşürülür — yanlış eşleşmiş okunuş okunuşsuzdan kötüdür (AR dosyasında `transcription` zaten `'Bismillahir-rahmanir-rahim...'` kısaltması, orada okunuş hiç gösterilmez).
  - **Ses bedava geliyor:** quran.com ayet ayet Alafasy mp3. Sure numarası metindeki ayırt edici öbekten bulunur (`CHAPTER_ANCHORS` — karma değil, okunabilir ve sessizce yanlış sureye bağlanmaz). Besmele eşlemesi: Fâtiha'da besmele zaten 1. ayettir, diğerlerinde 0. satır `1:1`'den çalınır. Ayetel Kürsi tek ayet (2:255) → satır **kelime zamanlamasından kesilir** (`fetchAyahAudioWithSegments`, yeni). **Canlı doğrulandı: 73 satırın hepsinin sesi var, süreler 2–12 sn.**
  - **KARAR — ezber sesi premium kotasından MUAF.** `quranTrial` yalnız Kur'an sekmesinde uygulanıyor, Öğren ayrı yüzey. Geri almak tek satır: `EzberSheet.jsx` → `AUDIO_IS_FREE = false`. Kullanıcıya öneri olarak sunuldu, itiraz gelmedi.
  - **Tekrar takvimi:** 1 → 3 → 7 → 14 → 30 gün (`SRS_INTERVALS`). Sure "bitti" diye kapanmaz. Bildirim **tarihli ve TEKİL** (`every: 'day'` DEĞİL — tekrar günü olmayan günde bildirim güveni bitirir), ID 5100-5107, akşam 20:00, aynı güne düşenler tek bildirimde toplanır. Sihirbazın üstünde "Bugün {{title}} tekrarı var" tek satırı (kutu yok).
  - İlerleme `sure_ezber_v1` (CRITICAL_KEYS'te, Keychain yedekli). Premium: yeni kapı YOK, Sureler'in mevcut `FREE_SURE_COUNT=1` kapısı geçerli.
  - Analytics: `learn_ezber_start` (mode: learn/review) · `_line_done` · `_stumble` · `_session_done`. learn.json 72→**97 key**, 6 dil pariteli.
  - **KAZA VE KURTARMA:** helper taşırken `Learn.jsx`'te commit'siz bir blok sildim (`guide`, `step`, `next`, `prev`, `handleSwipe`, `ActiveIcon`, `isRtl`). Build hata VERMEDİ (Vite tip denetlemiyor) — lint'in `no-undef` uyarıları yakaladı. Kurtarma: son `cap copy` ile **iOS'a kopyalanmış derlenmiş paketten** (`ios/App/App/public/assets/Learn-*.js`) minified kod okunup birebir geri yazıldı. Ders: bu repoda commit'siz iş çok; büyük blok taşımadan önce dosyayı yedekle, taşıma sonrası mutlaka `eslint` koştur (build yetmez).
  - **Sureler sihirbazı KALDIRILDI (2026-08-18, kullanıcı: "hala sureler kısmı duruyor, bunu yeni yaptığımızla değiştirecektik").** Ezber ilk turda eski okuma sihirbazının (adım 1/12, ileri/geri kart) altına buton olarak eklenmişti — kullanıcı butonu görmedi bile, kart uzun. Artık Sureler dalı `SureList.jsx`: 12 sure kartı (dua kartlarıyla aynı mihrap dili — altın çerçeve, kemer, sönen Arapça şerit), karta dokun → Perde tabakası. Kart rozetleri: ✓ ezberde · "Tekrar" pili · `3/5` + ince ilerleme çubuğu (yalnız başlanmışta) · taç (kilitli). Üstte tek satır özet + bugünkü tekrar satırı. Premium kapısı sihirbazın "next"inden listeye taşındı (ilk sure ücretsiz, `FREE_SURE_COUNT`). Sihirbaz Abdest/Namaz'da aynen duruyor; `GuideStepCard`'ın `ezber` prop'u, `isSurelerGated`/`showCrownOnNext` silindi (`navPremium` key'i artık kullanılmıyor, parite için duruyor). **Okuma kaybolmasın diye** EzberSheet girişine katlanır "Metnin tamamı" eklendi (okunuş + meal + ipuçları; `translitLabel`/`meaningLabel`/`tipsTitle` yeniden kullanıldı). learn.json 97→**102 key** (`ezberBadgeMemorized/Due/ProgressLabel`, `ezberListSummary`, `ezberRead`), 6 dil pariteli. 5 dilde 12 surede anahtar benzersizliği + snippet doğrulandı, build ✓, lint 0 yeni hata, cap copy ✓.
  - **Kelime takibi + tüm sure tek oturumda** (2026-08-18, kullanıcı: "beraber kısmında sarıyla takip ettir Kur'an'daki gibi" + "3 satırda bitmesin, bütün İhlâs'ı ezberlettir"). (a) `LINES_PER_SESSION = 3` → **`Infinity`**: oturum surenin sonuna kadar sürer, son satır kabul edilince zincir baştan sona okunur ve biter (İhlâs 5/5). Eski 3'lük sınır Cowan gerekçeliydi, sureler kısa olduğu için kalktı. (b) Çalan satırda **kelime-senkron vurgu** — `KaraokeText` (EzberSheet içi, SurahDetail'deki sync stratejisinin aynısı: `audio.currentTime` + iOS WKWebView için duvar saati köprüsü). Arapça levhada **1:1 birebir** eşleme: yeni `splitArabicWords` (ezber.js) vokatif `يا`'yı sonraki kelimeyle BİRLEŞTİRİR (Uthmani yazımda bitişik; ayırınca Kâfirûn 1. satırı 4 kelime / 3 segment veriyordu) — canlı ölçümle **73/73 satır tutuyor**. Okunuş satırında kelime sayısı tutmaz (uygulamanın kendi okunuşu birleştiriyor: "Bismillâhirrahmânirrahîm" tek parça, 51-56/73 uyuşmuyor) → segment içi **kesirli** ilerleme. **Karar: uygulamanın kendi okunuş metni korundu**, quran.com word-by-word okunuşuna GEÇİLMEDİ — o metin ("kul huva l-lahu ahadun") ezberlenen yazımdan farklı, DOĞRUSU adımıyla çelişirdi; takip birkaç kelimede yaklaşık olabilir, kabul edildi. Vurgu yalnız drill adımlarında (DUY/BERABER/DOĞRUSU); zincirde satırlar birleştiği için yok. Yeni locale key GEREKMEDİ.
  - **Ses bekçisi (watchdog)** — denetimde bulundu: "Devam" butonu klip çalarken `disabled`, ses takılırsa (yavaş ağ, CDN, WebView kodek) kullanıcı adımda MAHSUR kalıyordu; tek çıkış tabakayı kapatmaktı. `playLine`'a zamanlayıcı eklendi: klip başlamazsa 9 sn, başladıysa klip süresi + 4 sn sonra akış serbest bırakılır (`clearWatchdog`, stopAudio/unmount'ta temizlenir). Playwright ile doğrulandı — headless Chromium mp3 çalamadığı için her klip takıldı, bekçi her seferinde açtı ve İhlâs 5/5 tamamlandı (`sure_ezber_v1` → done 5, box 1, due ertesi gün). Ayrıca ölü locale key'leri silindi (`navPremium`, `ezberCta*`) → learn.json **97 key**, 6 dil pariteli.
  - **Tekrar dinle + görev metni öne çıktı** (2026-08-18, kullanıcı): DUY ve BERABER adımlarına "Tekrar dinle" butonu (`ezberReplay`, aynı klibi baştan çalar), zincirde perde açıldıktan sonra da var. Görev cümlesi ("Baştan buraya kadar kesintisiz söyle" vb.) alt bardaki soluk gri satırdan alınıp adım şeridinin ALTINA taşındı: kalın, 1.0625rem, tam kontrast — kullanıcı "arka planda kalmış" demişti. Bitiş ekranı başlığı `learned > 0` ile seçiliyor: `isReview` bitişte zaten TRUE oluyordu (satırlar tamamlandığı için), ilk kez ezberleyene "Tekrar tamam!" diyordu. Tarih artık `toLocaleDateString` ile ("19 Ağustos"), ham ISO değil.
  - **Bitiş ekranı = EZBER KUBBESİ** (2026-08-18, kullanıcı: "aşırı sıkıcı, dopaminlerle dolu olsun"). Karar zinciri web önizlemeleriyle verildi (4 konsept + jüri → kubbe seçildi → 4 renk yönü → **altın** → 5 yıldız motifi → **kesme yıldız (E)** → 4 boş-yuva adayı → **aynı yıldızın boş konturu (A)**). Yeni dosyalar: `src/lib/ezberDome.js` (geometri + yerleşim), `src/components/ezber/DomeCelebration.jsx`, `src/components/ezber/HoldButton.jsx`.
    - **Yerleşim kurallı, elle değil**: `buildDomeSlots(n)` sure sayısından üretir (bugün 12, **30 sure planlanıyor**); sıra sayısı ve aralık otomatik (n≤12→40, ≤20→36, ≤30→34, ≤42→30 birim), taş sayısı 60'a kadar kubbe yayının içinde kalıyor ve çakışmıyor (birim testle doğrulandı).
    - **Etkileşim**: ödül kendiliğinden belirmez. Yuva boş ve nabız gibi atar; `HoldButton` basılı tutuldukça dolar, **dolunca kendi kendine bırakır** (kullanıcı isteği — parmak kalkmasını beklemez), sonra yıldız dönerek iner, hâle + patlama halkası açılır, kubbe aydınlanır, sayaç bir artar ve buton "Bitir"e döner. Erken bırakma iptal. Dolum boyunca 3 hafif titreşim + tamamlanınca success haptiği.
    - **Yıldız geometrisi**: sekiz köşeli Selçuklu karosu; oyuklar **ters sarımlı alt yolla** (nonzero) açılır. DİKKAT: üste ikinci şekil boyamak SVG'de delik açmaz, parlak leke yapar — ajanların ürettiği 5 motifin 3'ünde bu hata vardı, düzeltildi.
    - **TEKRARLAYAN TUZAK (iki kez düştüm)**: SVG'de konum `transform="translate(...)"` ile animasyonun `transform`'u AYNI elemana konursa CSS translate'i ezer ve taşlar 0,0'a yığılır. Kural: konum dış `<g>`'de, animasyon iç `<g>`'de.
    - Tekrar oturumunda (yeni satır öğrenilmediyse) basılı-tut adımı yok, ekran doğrudan Bitir'e düşer. learn.json **104 key**, 6 dil pariteli (`ezberDomeEyebrow`, `ezberHoldCta`, `ezberHoldHint`, `ezberDoneNextLabel` eklendi; `ezberDoneNext` silindi). Eski kutlama ekranı (madalya + kıvılcım) ve `SPARKS` kaldırıldı. Build ✓, lint 0 yeni hata, birim testler ✓, cap copy ✓. **Cihaz testi kullanıcıda.**
    - **Rötuşlar (2026-08-18):** "Perde tamamlandı" eyebrow'u SİLİNDİ (kullanıcı: "ne alaka" — "perde" iç adlandırma, kullanıcıya bir şey demiyor); aynı sebeple `ezberCurtain` "Perde kapalı" → "Metin gizli". Bitiş ekranında sol üstteki sure adı kaldırıldı (ortada zaten büyük yazıyor), diğer adımlarda punto/kontrast artırıldı. Sayaç uzun büyük-harf şeridinden büyük altın rakam + altında küçük etikete döndü; levha içi ortalandı (etiket üstte, tarih altta). Tabaka `max-w-[30rem] mx-auto`, kubbe `max-w-[22rem] max-h-[34vh]` — geniş ekranda taşlar dev boyuta çıkıyordu. **Her surenin kubbede SABİT yeri var**: `mask` (sure listesiyle aynı sıradaki ezber durumu) + `slotIndex` Learn'den geçiyor, taşlar sayıya göre değil kimliğe göre doluyor. HoldButton: hareket-azaltma artık jesti atlamıyor (dolum çubuğu süs değil geri bildirim), erken bırakınca çubuk sıfıra zıplamıyor 180 ms'de geri çekiliyor, `aria-label` eklendi. Yeni analytics: `learn_ezber_star_placed` (basılı tutmayı kaç kişi tamamlıyor). DEV kısayolu "sona atla" artık bitiş ekranında da görünüyor — basılı tutmayı tekrar denemek için (prod pakette YOK, doğrulandı).
  - **+18 sure eklendi (2026-08-18) → 12 oldu 30.** Kullanıcı: "18 tane daha, çok meşhurlardan, derin araştır, hata istemiyorum." Seçim rastgele değil: mevcut liste (Fâtiha + Ayetel Kürsi + Fil'den Nâs'a) üstüne **87-104 arası kesintisiz** eklendi — A'lâ, Ğâşiye, Fecr, Beled, Şems, Leyl, Duhâ, İnşirah, Tîn, Alak, Kadir, Beyyine, Zilzâl, Âdiyât, Kâria, Tekâsür, Asr, Hümeze. Sonuç: Cüz Amme'nin namazda okunan bölümü tamamlandı, 30 sure / 258 satır / 240 ayet. Liste sırası zorluk artışına göre (Asr 4 satır → Fecr 31 satır).
    - **Hiçbir dini metin elle yazılmadı** — hepsi kaynaktan çekilip ölçüldü. Arapça: quran.com `text_imlaei` (duraklama işaretleri ۖۚ temizlendi; besmele uygulamanın kendi dizesi). Okunuş TR: fawazahmed0 `tur-latinalphabet1` — **Kur'an sekmesinin zaten gösterdiği okunuşun aynısı**, waqf parantezleri "(asri)" atıldı (pausal biçim kalır, app stiline uyar). Meal: TR `tur-diyanetvakfi`, EN Sahih Intl, DE Bubenheim (27), RU Kuliev (45), AZ Musayev; AR = harekesiz ayet metni. **DE ve RU quran.com API'sinden alındı, CDN'den DEĞİL** — CDN'deki Abu Adel/Abu Rida sürümleri parantez/köşeli parantez dolu ve bir yerde kapanmamış köşeli parantez vardı.
    - **Ayet birleştirme kuralı**: her ayet cümle olarak kapatılır (sondaki virgül noktaya döner, ! ? korunur, ilk harf büyütülür) — yoksa "Beim Zeitalter!." gibi çıkıyordu.
    - **AZ okunuşu** kaynak bulunamadığı için (fawazahmed0'da Azerbaycanca transliterasyon YOK) türkçe okunuştan çevrildi; **240/240 ayet samit-iskelet testinden geçti** (`verify_az.py`: ünlü, g/ğ, k/q, h/x ve ünlüden sonraki uzatma y'si serbest; harf eksiltme/ekleme/sıra değişikliği hata). Ajanların bir kısmı API 529 ile düştü, 7 sure elle yazıldı — hepsi aynı testten geçti.
    - **Ses ve karaoke canlı doğrulandı**: 240/240 ayette Alafasy kaydı var; `splitArabicWords` kelime sayısı = segment sayısı **240/240** → yeni surelerde de birebir (`direct`) takip, kesirli moda düşmüyor.
    - **`CHAPTER_ANCHORS` +18** (`ezber.js`): çapalar surenin ilk kelimelerinden üretildi ve hem birbirine hem **eski 12 surenin tam metnine** karşı benzersizlik testinden geçirildi. İhlâs "lem yekün" içerdiği için Beyyine'nin çapası **"lem yekünillezîne"** olmak zorunda kaldı — kısa hali sessizce İhlâs'a bağlanırdı. Yeni sure eklenirse bu ölçüm tekrarlanmalı (eşleşme listede ilk bulunandır).
    - **`LINES_PER_SESSION` Infinity → 8** (`EzberSheet.jsx`). Fecr 31 satır, tek oturumda imkânsız. 8 = eski listenin en uzun suresi (Fâtiha/Kürsi) → **mevcut 12 surede davranış birebir aynı** (simülasyonla doğrulandı: hepsi hâlâ tek oturum), uzun sureler bölünüp `doneCount`'tan devam ediyor. Bilinen kozmetik: 9-10 satırlık surelerde ikinci oturum 1-2 satır kalıyor.
    - **Bildirim kotası düzeltildi** (`ezberNotify.js`): `slice(0, 8)` sureye uygulanıyordu, artık **güne**. Aynı güne düşen 8 sure bütün kotayı yiyip sonraki günlerin hatırlatmasını sildiriyordu — 12 surede zor, 30 surede olağan.
    - **Ücretsiz sure sayısı 1'de bırakıldı** (`FREE_SURE_COUNT`, İhlâs). Artık 30'un 29'u kilitli görünüyor; değiştirmek tek satır.
    - **Doğrulama:** 6 dilde 30 sure entegrasyon testi ✓ (anahtar benzersizliği, diller arası anahtar eşleşmesi, okunuş-ayet hizası, sure numarası + ses planı) · oturum simülasyonu 30 sure ✓ · AZ iskelet 240/240 ✓ · kubbe 30 taşta taşma/çakışma yok ✓ · `npm run build` ✓ · lint 0 yeni hata (Learn.jsx `react-hooks/refs` ÖNCEDEN vardı) · `cap copy` ios+android ✓. Locale dosyaları değişmedi (yeni UI metni yok).
  - **+2 parça: Âmenerrasûlü ve Haşr son 3 ayet (2026-08-18) → 32 kayıt.** Kullanıcı "hepsi popülerlerden olsun" deyince popülerlik araştırması yapıldı (İHL resmi ezber listesi, Erbakan İlahiyat müfredatı, Diyanet Yaz Kur'an Kursu, islamveihsan, iki ezber uygulaması): 18'in 12'si çekirdek "Duhâ–Nâs" bloğu, 5'i orta (A'lâ, Ğâşiye, Şems, Leyl, Fecr), **Beled (90) tek zayıf halka** — kullanıcı çıkarmadı, 87-104 bloğu bozulmasın diye kaldı. Listede olmayan iki popüler parça eklendi (ikisi de İHL 9. sınıf, Ayetel Kürsi ile aynı seviyede). Nebe/Mülk **eklenmedi** (kullanıcı seçmedi; 40 ve 30 ayet).
    - **`ezber.js` genelleştirildi: `PASSAGES` tablosu.** Ayetel Kürsi'nin özel kodu (`isKursi`/`KURSI_ANCHORS`/`KURSI_WORDS`/`splitKursi`) kaldırıldı; yerine "sure değil PARÇA" tablosu geldi — üç kayıt: Kürsi (2:255, 8 öbek), Âmenerrasûlü (2:285-286, 10 öbek), Haşr (59:22-24, 6 öbek). Her öbek `{verse, anchor, words}`: `anchor` öbeğin son kelimesi (metni bölmek için), `words` kelime sayısı (sesi kelime zamanlamasından kesmek için). Parçalarda 0. satır BESMELE DEĞİLDİR ve ayet numarası sure başından gitmez — `audioPlanFor` artık bunu tablodan okuyor. **Refactor davranışı değiştirmedi: 30 surenin ses planı çıktısı byte-byte aynı (öncesi/sonrası karşılaştırıldı).**
    - Öbek sınırları kelime İNDEKSİYLE verildi, çapa metni koddan üretildi (elle yazılan çapa harekede tek harf şaşarsa bölme sessizce çöker). Sınırlar cümle sonlarına denk getirildi ki okunuşta asimilasyon bozulmasın (59:23 tek parça "mütekebbir"e kadar gidiyor).
    - **TR meal kaynağı uyarısı:** CDN `tur-diyanetvakfi` edisyonunda **Bakara 286 KESİK** ("Bizi bağışla"dan sonrası yok). Âmenerrasûlü'nün TR meali bu yüzden quran.com Diyanet (77) kaynaklı; diğer 30 kayıt eskisi gibi Vakfı. Aynı ayette en/az/de/ru tam.
    - Haşr 22 ile 23 aynı başladığı için `SIMILAR` uyarısı eklendi (`ezberSimilarHashr`) — learn.json 103→**104 key**, 6 dil pariteli.
    - **Denetim araçları** (`scratchpad/sure18/audit_text.py`, `audit_audio.py`): metin denetimi Arapçayı BAĞIMSIZ ikinci kaynakla (fawazahmed0 uthmani hafs) zayıf-harfsiz iskelet düzeyinde karşılaştırır (imlâî/Uthmani yazım farkı sahte hata üretmesin), okunuşu quran.com kelime okunuşuyla samit düzeyinde eşler (bir ayet kayması patlar). Ses denetimi uygulamanın KENDİ `audioPlanFor` çıktısını kullanır: doğru ayet, kayıt+segment var mı, mp3 canlı mı, kelime=segment mi, parçalarda kelime aralıkları ayeti boşluksuz kapsıyor mu.
    - **Sonuç: 32 kayıt, 347 satır — metin denetimi 0 gerçek hata, ses denetimi TEMİZ (301 mp3'ün hepsi HTTP 200, kelime=segment 347/347).** Kalan 3 uyarı aracın normalizasyon artığı; bir de karşılaştırılan Uthmani edisyonun **Kadir 1. ayetine besmele kuyruğu yapıştırdığı** tespit edildi (bizdeki doğru).
  - **+1: Ahzâb 35 (33. surenin 35. ayeti) → 33 kayıt** (2026-08-18, kullanıcı isteği: "33 tane olsun, 33. surenin 35. ayeti"). Kadın ve erkeği aynı on vasıfta yan yana sayan meşhur ayet. `PASSAGES` tablosuna 4. kayıt olarak eklendi (33:35, 6 öbek), listenin SONUNA.
    - **Önemli bulgu — `words` alanı METİN kelimesi değil SES SEGMENTİ sayar.** `EzberSheet.loadPlan` `file.segments[wordFrom..wordTo]` diye kesiyor. Kürsi'de ikisi eşit olduğu için fark hiç görünmemişti; Ahzâb 35'te **30 kelime / 29 segment** (kāri "ves sâimîne ves sâimâti"yi tek nefeste okumuş, segment 15 iki kelimeyi kapsıyor). Öbek sınırları segment sınırlarına oturtuldu — birleşik segmentin ortasından kesilseydi ses yanlış yerden başlardı. Tablo yorumu bu yüzden güncellendi. Bilinen ve kabul edilen sonuç: 4. satırda karaoke birebir değil kesirli modda (4 kelime / 3 segment).
    - Ahzâb 35'in dört satırı da aynı kalıpta ("vel X-îne vel X-âti") olduğu için `SIMILAR` uyarısı eklendi (`ezberSimilarAhzab`, sırayı hatırlatır). learn.json 104→**105 key**, 6 dil pariteli.
    - **Doğrulama (33 kayıt, 353 satır):** metin denetimi ✓ (Ahzâb dahil 0 gerçek fark) · ses denetimi TEMİZ (302 mp3'ün hepsi HTTP 200; parça metinlerde kelime aralıkları ayeti boşluksuz kapsıyor) · oturum simülasyonu ✓ (Ahzâb 1 oturum) · build ✓ · lint 0 yeni hata · locale parite 105×6 ✓ · cap copy ✓.
  - **Dayanıklılık turu (2026-08-18, kullanıcı: "hatayla karşılaşsın istemiyorum kimse").** Veri değil ÇALIŞMA ANI denendi; 209 kontrollük `robust.mjs` (bozuk girdi, sınır indeks, bozuk localStorage, artık yıl, 33 taşlık kubbe, aynı güne düşen 20 tekrar). Üç gerçek açık bulundu ve kapatıldı:
    - **Ağ takılınca ekran kilitleniyordu.** `fetchAyahAudioWithSegments`'ta zaman aşımı YOKTU ve `playLine` bekçiyi ancak istek döndükten SONRA kuruyordu; kopuk/captive-portal bağlantıda "Devam" butonu (`playing` durumu `loading`'i de kapsıyor) dakikalarca kapalı kalıyordu. Çözüm: quranApi'de `AbortController` + 8 sn zaman aşımı; `playLine`'da bekçi istek beklenmeden kurulur ve akış `released` bayrağıyla EN FAZLA bir kez bırakılır (bekçi ile normal bitiş yarışıp satır atlamasın).
    - **`audioPlanFor` sınır kontrolsüzdü**: satır sayısının dışındaki indekste var olmayan ayet üretiyordu (`112:99`), negatifte `112:-1`. Bugün ulaşılamıyordu ama bir sonraki akış değişikliğinde sessizce "ses hatası" olurdu. Artık `splitAyahs` uzunluğuna göre null döner.
    - **Parça metinlerde hiza koruması**: metin beklenenden farklı olup `splitPassage` bölemezse öbek planı satırlarla hizasız kalırdı (yanlış yerden ses). Artık satır sayısı öbek sayısına eşit değilse parça yolu kullanılmaz.
    - Regresyon: ilk 30 kaydın ses planı çıktısı bu değişikliklerden SONRA da byte-byte aynı (plan_before/plan_final karşılaştırması).
  - **Ses artık DURDURULABİLİR** (2026-08-18). Uzun sureler gelince ortaya çıkan gerçek sorun: zincir adımı satırları baştan çalıyor, Fecr'in son zincirinde bu **31 klip / ~4 dakika** ediyordu ve "Devam" butonu o süre boyunca `disabled`'dı — kullanıcının tek çıkışı tabakayı kapatmaktı. Artık ses çalarken (ve yüklenirken) buton kapanmıyor, **"Durdur"a** dönüyor (`ezberStop`); basınca akış serbest kalıyor. Aynı davranış talim adımlarında da var (Beyyine/Âmenerrasûlü klipleri 25 sn'ye çıkabiliyor). Ölü kalan `ezberPlaying` anahtarı silindi → learn.json **105 key**, 6 dil pariteli.
    - **`playTokenRef` jetonu**: "yükleniyor" anında Durdur'a basılırsa istek sonradan dönüp sesi yine de başlatırdı. Her `playLine` bir jeton alır, `stopAudio` jetonu ilerletir; istek dönünce ve `play()` çözülünce jeton kontrol edilir. Bekçi ile normal bitişin yarışması da `released` bayrağıyla kapalı (akış en fazla bir kez bırakılır).
    - `stopAudio` artık `audioState`'i de `idle` yapıyor — eskiden "Dinleniyor" etiketi ekranda takılı kalabiliyordu.
    - **Ders:** JSX'te `) : (` dalının içine `{/* yorum */}` koymak parse hatası veriyor (iki kardeş çocuk); `npm run build` bunu YAKALADI ama hata yığını uzun olduğu için gözden kaçabiliyordu — lint net söyledi. Yorum satır yorumu (`//`) olarak yazıldı.
    - Yeniden doğrulama: 209 dayanıklılık kontrolü ✓ · 6 dil × 33 kayıt entegrasyon ✓ · oturum simülasyonu ✓ · ses denetimi TEMİZ (302 mp3) · metin denetimi 0 gerçek hata · ilk 30 kaydın ses planı hâlâ byte-byte aynı · build ✓ · lint 0 hata · cap copy ✓.
  - **Kesme hatası düzeltildi + KOPYA özelliği** (2026-08-18, kullanıcı raporu: "sonda fazladan vel dedi, yazan öyle değildi").
    - **Kök neden:** kelime aralığından kesilen satırlarda ses `timeupdate` olayıyla durduruluyordu; o olay ~250 ms'de bir tetikleniyor. Ahzâb 35'in 1. satırı 7040 ms'de bitiyor, sonraki kelime 7050'de başlıyor → 250 ms gecikmede sonraki kelimenin başı ("vel") duyuluyordu. **Bu hata Ayetel Kürsi'nin 8 öbeğinde de vardı**, kimse bildirmemişti. Çözüm: kesme noktası artık `requestAnimationFrame` ile kare kare denetleniyor (~16 ms hata); `timeupdate` yedek olarak duruyor (arka planda rAF durur, olay durmaz). Kesme noktası olmayan tam ayet kliplerinde döngü hiç başlamaz.
    - **KOPYA (`ezberPeek`)** — kullanıcı: "tümünü göstermek yerine kopyaya basa basa adım adım açılsın". Eski "Takıldım, göster" (tek dokunuşta her şeyi açıyordu) kaldırıldı. Yeni davranış: her dokunuşta BİR birim açılır. **Talimde birim kelime, zincirde satır** (zincirde 30 satırlık metni kelime kelime açtırmak saçma; orada eksik olan hangi satırın geldiği). Açılmamış birimler harf yerine **çubukla** temsil edilir — kaç kelime kaldığı ve uzunlukları görünür, harfler görünmez; çubuk `em` ile ölçeklendiği için satır puntosu değişince bozulmaz. Sayaç butonda (`2/7`). İlk dokunuş eski `ezberStumbled` metriğini tetikler (ölçüm sürekliliği korundu).
    - Okunuşu olmayan dilde (AR) kopya hiç görünmez — orada gizlenen metin yok, Arapça levha zaten açık.
    - İpucu turu güncellendi: `learn:ezberStuck` → `learn:ezberPeek` (kimlik değişti, davranış değiştiği için ipucu bir kez yeniden gösterilecek). learn.json **105 key**, 6 dil pariteli; `ezberStuck` ve `tour.ezberStuck` silindi, ölü anahtar taraması 0.
  - **Aynı sınıftan ikinci hata: iOS'ta arama (seek) düşüyordu** (2026-08-18, "başka böyle hata var mı" taraması). Tarama sonucu: sesi kelime aralığından kesen TEK yer ezber (Kur'an/Uyku/Hikayeler sekmelerinde kesme yok, sadece kullanıcı sürüklemesi). Ama aynı kod yolunda ikinci tuzak vardı: `el.src` yeni atandıktan hemen sonra `el.currentTime` yazılıyordu — **WKWebView metadata gelmeden bu atamayı sessizce yok sayar**, satır kendi yerinden değil AYETİN BAŞINDAN çalardı. **23 satır bu risk altındaydı** (Ayetel Kürsi 7, Âmenerrasûlü 8, Haşr 3, Ahzâb 5): oturuma ayetin ortasındaki bir satırdan devam edildiğinde (yani her ikinci oturumda) tetikleniyordu. Çözüm: yeni kaynakta ve `start > 0` ise `loadedmetadata` beklenir (4 sn zaman aşımı, jeton kontrollü), ayrıca `play()` sonrası konum 0,5 sn'den fazla saparsa yeniden aranır. Kur'an sekmesi zaten `loadedmetadata` bekliyordu — emsal oradaydı.
    - Ek doğrulama: 5 `SIMILAR` uyarısının hepsi TAM BİR kayıtla eşleşiyor (sessizce hiç eşleşmeme ya da yanlış sureye takılma yok), 5 ipucu hedefinin (`data-tour`) hepsi DOM'da mevcut — eşleşmeyen hedef ipucunu sessizce iptal ettirirdi.
  - **"6/5. satır" hatası düzeltildi** (2026-08-18, kullanıcı ekran görüntüsü: bitmiş İhlâs'a girince başlıkta `6/5. satır`). Kök neden: `lineIndex` ham `doneCount` ile başlatılıyordu; sure bitince doneCount = satır sayısı olur (5) ve başlık `n+1` yazınca 6 çıkıyordu. İki katmanlı düzeltme: (1) yeni `startIndex = min(doneCount, lines.length - 1)` — indeks son satırı asla aşmaz (aynı kırpma `oneMore`'da zaten vardı, tutarlılık sağlandı); (2) satır sayacı artık YALNIZ talim adımında gösteriliyor — zincirde üstteki şerit zaten "Baştan bağla · ilk N satır" diyor, sayaç orada hem gereksiz hem yanıltıcıydı. `ezberStepChain` eyebrow'u `isReview ? lines.length : lineIndex+1` kullandığı için doğruydu, dokunulmadı. Regresyon koruması `robust.mjs`'e eklendi (kaynak taraması: `useState(doneCount)` / `setLineIndex(doneCount)` kalıntısı + 33 kayıt × 4 ilerleme durumu) → **475 kontrol**.
  - **Doğrulama:** 419 birim testi ✓ (satırlama, anahtar, ses planı, SRS kutu/tarih, artık yıl, bozuk girdi) · 6 dil × 12 sure gerçek veriyle satır sayısı ✓ · canlı API ile 73 satır sesi ✓ · build ✓ · lint 0 yeni hata · locale parite 97×6 ✓ · `cap copy` ios+android ✓. **Cihazda test şart:** WKWebView'da ayet sesi çalması, perde geçişleri, Android geri tuşu, bildirim izni akışı, `--app-font-scale` 1.3.

- ✅ **Abdest → "Abdest ve Temizlik" merkezi** (2026-08-19; spec `docs/superpowers/specs/2026-08-19-abdest-temizlik-design.md`). Kategori artık 15 kartlık tek sihirbaz değil, 5 konulu merkez: **Bozar mı? · Abdest nasıl alınır · Mesh (mest ve sargı) · Gusül · Teyemmüm**. Kart dili dua kartının aynısı (mihrap kemeri + Arapça şerit + altın ayraç). Tasarım kararları web artifact'leriyle verildi; kullanıcı ilk turu "daha iyi tasarla" diye reddetti, ikinci turda etkileşim modeli baştan kuruldu.
  - **Kurucu gözlem:** abdest alırken eller ıslak, kimse musluk başında telefon kaydırmıyor. 15 kartlık kaydırmalı sihirbaz tam kullanılacağı anda kullanılamıyordu. Cevabı **"Eller ıslakken beraber al"** (`HandsFree.jsx`): telefon tezgâhta, büyük görsel + büyük başlık, adımlar kendi ilerler (9 sn, tekrarlı adımda 15 sn), her geçişte titreşim, duraklat hep açık. **Ses YOK** (TTS yok, 6 dilde kayıt bütçeyi ikiye katlar). **Yeni native plugin GEREKMEDİ**: tasarımda `@capacitor-community/keep-awake` öngörülmüştü, yerine `navigator.wakeLock` kullanıldı (iOS 16.4+ / modern Android WebView; desteklemeyende mod yine çalışır, ekran kararabilir).
  - **"Bozar mı?" bölümün kalbi** (`wuduBreakers.js` + `BreakerSheet.jsx`): liste değil ALET. **41 durum** (11 bozar · 10 duruma göre · 20 bozmaz), **357 takma ad**, üç cevap durumu. İkili ayrım yalan söylerdi: uyku, kusma ve kanamanın hepsi şarta bağlı. Renk kuralı korunur (gündüz yeşil yok): Bozar = kehribar dolgu, Bozmaz = koyu nötr, Duruma göre = kesikli çerçeve; metin tek başına da yeterli. İçerik **iki bağımsız araştırmadan** birleştirildi (41 + 39 madde, hepsi eşleşti, hiçbiri kaybolmadı).
  - **Hakem kararları:** kadınlarda beyaz akıntı → **bozmaz** (Kurul'un konuya özel fetvası, İlmihal'in genel listesine karşı özel+yeni metin esas); kan verme → **bozar**; diyaliz → **bozar** (ikisinde de taslaklar "duruma göre" demişti, Diyanet fetvaları net). Uyku ve kusma üçe bölünmüş hâlden tek "duruma göre" maddesine indirildi.
  - **Araştırma iki varsayımı düzeltti:** (1) teyemmümde "vakit daralması" Hanefî'de geçerli sebep DEĞİL (cenaze ve bayram namazı istisna); (2) mestte **"deri olma şartı" YOK** — Diyanet işlevsel ölçü veriyor (bağsız durabilme, ~5 km yürüyüş, suyu geçirmeme, aşık kemiğini örtme), bu yüzden şartları taşıyan kalın çorap mest sayılıyor.
  - **Mest sayacı** (`mestMesh.js` + `mestNotify.js`): mukim 24 sa / misafir 72 sa, **süre mest giyilince değil abdestin İLK BOZULDUĞU anda başlar** (buton metni de öyle: "Abdestim bozuldu — süreyi başlat"). Geçiş kuralları modellendi: süre dolmadan yolculuk 72'ye uzatır, dolduktan sonra uzatmaz (`switchedAt` alanı bunu taşır); seferiyken mukim olan 24'ü aştıysa hak düşer. 2 bildirim (1 saat kala + bitince), **ID 5200-5201**. Sargı meshinin süresi YOK, sayaç yalnız mestte. `CRITICAL_KEYS`'e eklenmedi (en fazla 72 saatlik veri).
  - **Adım metadata'sı `id` ile bağlandı, indeksle değil** (`wuduSteps.js`, 26 adım tek tablo). Tasarımda içerik karması vardı; gusül/teyemmüm adımlarının çoğunda Arapça metin olmadığı için orada çalışmıyordu. `id`'ler 6 dil dosyasına tek seferlik script ile yazıldı (sıra hizası önce doğrulandı). `rank: null` → bilgi adımı, rozet çıkmaz. `short` rank'tan TÜRETİLMEZ (niyet sünnet ama kısa modda durur).
  - **Sihirbazda 4 değişiklik:** görsel kartın en başında (4:3, dosya yoksa `onError` gizler — kart bozulmaz); Farz/Sünnet/Müstehap rozeti (36 başlıktaki "(Farz)" ekleri 6 dilde silindi); **Kısa (7 adım) / Tam (15 adım)** anahtarı (sadece filtre, yeni metin yok, `abdest_mode` ile hatırlanır, varsayılan KISA); dua ve ipuçları kısa modda katlanır.
  - **Görseller kullanıcıda:** `public/images/abdest/` altına 16 dosya (liste ve kurallar plan artifact'inde). Gelmeden de her şey çalışır, slot boş kalır.
  - **Premium kapısı YOK** — beş konu da ücretsiz.
  - **Locale: 305 anahtar × 6 dil pariteli** (159 yeni). Bozanlar metinleri locale'de, veri dosyasında yalnız id/hüküm/takma ad.
  - **Denetimde yakalananlar (hiçbiri kullanıcı raporu değil):** `guide.title` korumasızdı ve bu değişiklik onu kırılgan yaptı (merkez ekranında `guide` artık null olabiliyor) · MeshSheet refactor'ünde bir effect kapsam dışı `open`'ı okuyup global `window.open`'a düşüyordu (hep truthy) · HandsFree'de yan etki state updater'ının içindeydi, **StrictMode açık** olduğu için adım çift atlıyordu · sayaç başlamadan Mukim/Misafir'e dokununca `learn_mest_expire` sahte tetikleniyordu · aramadan adıma atlarken mod "Tam"a geçiyor ama depoya yazılmıyordu · HandsFree açıkken Android geri tuşu iki dinleyiciyi birden tetikliyordu (Capacitor dinleyicileri biriktiriyor) · "kan" araması 41 maddenin 18'ini getirip büyük cevap kartına dizi sırasındaki ilk maddeyi oturtuyordu → `scoreMatch` + `byRelevance` (puan eşitse KISA başlık kazanır: "Kanama" > "Kan verme") · 25 takma ad iki maddede birden vardı, sahiplik netleştirildi.
  - **İkinci denetim turu (kullanıcı "bir kaç hata daha var gibi hissediyorum" dedi, haklıydı):** `useHaptics` her render'da YENİ fonksiyon kimliği döndürüyor (`light`/`success` `useCallback` DEĞİL) — HandsFree'nin interval'i `goNext`'e bağlıydı, her render'da sökülüp kuruluyordu; üst bileşen sık render ederse geri sayım hiç ilerlemezdi (ref'e alındı) · `wakeLock` isteği beklerken bileşen sökülürse kilit sayfa kapanana kadar sızıyordu · tekrar sayısı sabit 3 yazılıydı, artık yerelleştirilmiş metinden okunuyor · `activeGuides` her render yeni nesne üretiyordu, hub'ın arama indeksi useMemo'su hiç önbelleğe girmiyordu · adım indeksi kırpılmıyordu (Kısa mod 15→7 düşürüyor; ezberdeki "6/5" hatasının aynı sınıfı) · **mest bildirimi `/learn`'e düşüyordu ve Öğren varsayılan sekmesi Dualar** — "mesh süren bitiyor" bildirimine dokunan kullanıcı dua listesi görüyordu, artık `/learn?abdest=mesh` ile doğrudan mesh ekranı açılıyor · görsel dosyası yokken kart 4:3 yer ayırıp siliyordu (her adımda zıplama), artık yüklenmeden yer ayrılmıyor · sayaç başlamadan Mukim/Misafir'e dokununca depoya `{"startedAt":0}` çöpü yazılıyordu. **Bildirim ID çakışması fiilen tarandı** (kullanımda 1-35, 100-114, 1001-1003, 2000, 3000, 4000-4001, 5100-5107; 5200-5201 boş).
  - **Doğrulama:** 199 (6 dil × 3 rehber id/Arapça hizası) + 40 (sayaç geçişleri, saat geriye alınması, bozuk kayıt) + 619 (357 takma adın her biri kendi maddesini buluyor + sıralama) + 217 (kullanılan her `t()` anahtarı) + 36 (merkez araması + regresyon koruması) + 7740 (6 dil × 7 kategori yapısal bütünlük) = **8863 kontrol** ✓ · `npm run build` ✓ · lint 0 yeni hata (Learn.jsx `react-hooks/refs` ÖNCEDEN vardı) · locale parite 305×6, placeholder farkı 0, format korundu · `cap copy` ios+android ✓.
  - **Cihazda test edilmesi şart:** Android geri tuşu (3 katman), iOS'ta `navigator.wakeLock` gerçekten tutuyor mu, mest bildirimlerinin gerçek zamanda düşmesi, `--app-font-scale` 1.3'te kart taşması, görseller konduğunda 4:3 ve 1:1 kırpım.
  - **Dil ve kalite turu (2026-08-19, kullanıcı: "bütün yazım kurallarına anlamlarına bak").** Altı dil paralel denetlendi (her dil için ayrı ajan; TR'yi ben okudum). **Bir CRITICAL:** RU `dis-eti-kanamasi` hükmü kaymıştı — TR "tükürüğün YARISI kadar veya fazlaysa bozar", RU "aynısı kadar veya fazlaysa" yazıyordu; %60 kanamada Rus kullanıcı diğer beş dilin tersi cevabı görüyordu. Diğer beş dilde 41 madde × hüküm + 18 `safii` notu birebir doğru çıktı.
    - **TR imlâ birliği:** `Şafii` → **`Şâfiî`** (learn.json'da 28 yer; rehberlerde zaten `Şâfiî` idi, `Hanefî/Mâlikî/Hanbelî` ile de uyumlu), `Hanefiler*` → `Hanefîler*`, `bir hal` → `bir hâl`, `dünyevi` → `dünyevî`, "İmam Şafiî" → "İmam Şâfiî".
    - **Tırnak işareti kuralı:** yeni `breakerEmptyTitle` düz `"` kullanıyordu; uygulamanın kendi `duaEmptyTitle` kuralı zaten dile göre tipografik tırnak (**tr/en/az `“ ”` · de `„ “` · ru/ar `« »`**). `completionQuote` ve 3 `tour` metni dahil 6 dilde düzeltildi. Yeni metin eklerken bu kurala uy.
    - **EN:** `verdict.bozmaz` "Does not break it" → "Does not break" (satırda başlığı kırpıyordu), 14 gövde/başlık üslup düzeltmesi. **`guidesEN.js`'teki abdest rehberi "ablution" diyordu, yeni bölüm "wudu"** — aynı ekranda iki terim; 9 yerde `wudu`ya çekildi.
    - **DE:** iki gramer hatası (`"Bricht Wudu"` artikelsiz, `"die Wudu"` yanlış cins), `topicBreakersSub`'ta özne/nesne yer değiştirdiği için anlam bozulmuştu. Ayrıca 12 dize telefonda taşıyordu (Almanca uzun): `abdestModeFull`, `mesh.residentLabel/travelerLabel`, 6 madde başlığı ve rozetler kısaltıldı.
    - **AZ:** anatomik terim hatası — "aşıq **(daban)** sümükləri"; AZ'de *daban*=topuk, *topuq*=aşık. Şart aşık kemiğini örtmek. Ayrıca 6 türkçe sızması (`ayrıca`, `hökmən`, `hüquq`, `yeriş`, `bilik`, `Nümunə`) ve rakam ekleri (`12.00-da` → `12.00-də`).
    - **RU:** 12 yerde "siz"e kaçmış (uygulama "sen" der), `handsFreeDone`'da abdest için üçüncü bir terim ("Вуду") kullanılmıştı, "три пальца" ölçüsü bir yerde el bir yerde ayak parmağı demekti.
    - **AR:** `handsFreeRepeat` "3 مرة" (sayı-isim uyumu), `badgeHours/badgeMinutes` 2-10 aralığında yanlış, mest 5. şartındaki olumsuzluk kapsamı ("her mestte yok" → "iki mestin hiçbirinde"), `النزف` → `النزيف` (kullanıcı bunu arıyor). NOT: `guidesAR.js`'te 144 yerde Latin `transcription` var — ajan kaldırmayı önerdi, **kaldırılmadı**: dosyanın kendi kuralı bu.
    - **ARAMA — asıl işlevsel bulgu.** Takma adlar YALNIZ Türkçe tutuluyordu; diğer beş dilde arama sadece yerelleştirilmiş başlık+gövdede çalışıyordu. Sonuç: EN'de "blood" yazan kullanıcı büyük cevap kartında **"Blood donation"** görüyordu ("Bleeding" değil) — TR'de düzelttiğimiz hatanın birebir aynısı, beş dilde açıkta duruyordu. `wuduBreakers.js`'e **en/de/ru/az/ar takma adları eklendi (41 madde, toplam 1429 ad)**. Yeni test `aliases.mjs` (2859 kontrol) her takma adın KENDİ maddesini ilk sıraya koyduğunu ve aynı kelimenin iki maddede olmadığını ölçüyor; 22 çakışma bulundu ve sahiplik netleştirildi (ikisi zaten TR'de vardı: "diş", "karşı cins"). **Yeni takma ad eklerken bu testi koştur.**
    - **Kod tarafı:** `role="listitem"` arama sonuçlarında BUTONUN kendisine konmuştu — buton rolünü ezip ekran okuyucuya "tıklanabilir" demesini engelliyordu (DuaLibrary'deki doğru kalıp: saran div taşır). Üç tabakaya `role="dialog" aria-modal="true"` + `aria-label`, üç arama kutusuna `enterKeyHint="search"` eklendi. `Learn.jsx`'te **repoda önceden duran tek lint hatası düzeltildi** (`totalStepsRef` render sırasında yazılıyordu): ref tamamen kaldırıldı — `useHaptics` her render'da yeni kimlik döndürdüğü için zaten hiçbir şey kazandırmıyordu; yan etki de `setCurrentStep` updater'ının içinden çıkarıldı (StrictMode iki kez çalıştırıyor). `mestState` React state'i kaldırıldı (tek yazan MeshSheet, tek okuyan rozet; kopya tutmak iki kaynağı senkron tutmayı gerektiriyordu) — bu da bir `set-state-in-effect` hatasını kapattı. MeshSheet'in saniyelik sayacı artık yalnız süre işlerken dönüyor. Analytics `hukum` → `verdict` (diğer alanlar İngilizce).
    - **Doğrulama:** 11.723 kontrol (2859 alias + 7740 rehber + 617 bozanlar + 220 anahtar + 199 adım + 48 merkez + 40 mest) ✓ · `npm run build` ✓ · **lint 0 hata** (tur başındaki 1 hata da düzeldi) · locale parite 305×6, placeholder 0 fark, `\n` yapısı 0 fark, format korundu · `cap copy` ios+android ✓.
    - **Cihazda bakılacak (ölçüldü değil, hesaplandı):** DE `verdict.bozar` uzadı ("Bricht den Wudu"), AR `badgeHours/badgeMinutes` dilbilgisi uğruna uzun ("الساعات المتبقية: {{n}}") — dar ekranda konu kartının alt satırını sıkıştırabilir; `--app-font-scale` 1.3'te tekrar bak.
  - **İkinci iyileştirme turu (2026-08-19).** Ölçümle bulunan boşluklar:
    - **Mesh'in 9 fıkıh metni arama indeksinde YOKTU.** Bölümün en yoğun içeriği orasıydı ve `alçı · bandaj · kırık · yara bandı · seferi · misafir · yolculuk · 24 saat · mest süresi · topuk` sorgularının hepsi **sıfır sonuç** veriyordu — cevapları yalnız o metinlerde yazmasına rağmen. Bölümler indekse alındı; sonuca dokununca mesh tabakası **o bölüm açık** gelir ve oraya kayar (`Section` `highlight` prop'u). Bölüm listesi `abdestTopics.js → MESH_SECTIONS`'a taşındı: MeshSheet çizer, AbdestHub arar — iki ayrı liste tutulsaydı yeni bölüm aranamaz kalırdı. `hub.mjs` 48→78 kontrol, bu 10 sorguyu kalıcı olarak koruyor. "yolculuk" hâlâ tutmuyordu (metinde "yolculuğa" var, ek yüzünden eşleşmiyor) → TR metninde `Seferilik (yolculuk hâli) nedir?` — jargon da açılmış oldu.
    - **Islak el modu gusül ve teyemmümde de çıkıyordu**, ama bitiş metni abdeste özgü ("Kelime-i şehadet ve ABDEST DUASINI okumayı unutma") ve AZ'de butonun nesnesi açıkça "dəstəmaz al". Artık yalnız `abdestTopic === 'abdest'`. Mod zaten "eller ıslakken" içgörüsünden doğdu; teyemmüm kuru ve dört adım.
    - **Mesh tabakasında fetva-değildir uyarısı yoktu** (Bozar mı?'da vardı). Aynı `breakerDisclaimer` eklendi — orası da hüküm veriyor.
    - **UYGULAMA GENELİ — düz tırnak temizliği.** 8 namespace × 6 dilde 160 düz `"` dile göre tipografik tırnağa çevrildi (tr/en/az `“ ”` · de `„ “` · ru/ar `« »`). **HTML etiketlerinin içine dokunulmadı**: `class="text-[#D4AF37]"` gibi öznitelikler düz tırnak olmak zorunda — dönüştürücü metni etiketlere göre parçalayıp yalnız etiket dışını çeviriyor (`dua.paywallEarnHint` ikisini bir arada taşıyor). Eşleşmeyen tek tırnak varsa dokunulmuyor.
    - **CANLI HATA — kodda t('anahtar', 'Türkçe varsayılan') ile çağrılan 17 anahtar HİÇBİR locale dosyasında yoktu**, yani beş dilde de ekranda Türkçe metin çıkıyordu: `Profile` puanlama diyaloğu + hesap silme onayı (8), `DuaKosesi` şikayet akışı (6), `WidgetGuide` geri butonu, `LocationSettings` "Hesaplama Yöntemi". 6 dile eklendi; TR değerleri koddaki metnin AYNISI (Türk kullanıcı için görünüm değişmedi).
    - **`ReviewPrompt`'un 8 anahtarı ar/az/de/ru'da eksikti** (`askTitle/askDescription/askLater/thankYou*/feedback*/closeUnderstand`) — herkese gösterilen diyalog o dillerde İngilizce'ye ya da koddaki Türkçe varsayılana düşüyordu. Dördü de çevrildi.
    - **Sonuç: 18 namespace × 6 dil TAM parite** — eksik/fazla anahtar 0, placeholder farkı 0, kodda karşılıksız anahtar 0. (İlk kez app geneli ölçüldü; önceki turlar yalnız `learn`'e bakıyordu.)
    - **FORMAT UYARISI:** `profile.json` ve `settings.json` altı dilde de **2 boşluk** girintili, diğer 18 namespace 4 boşluk. Kendi içinde tutarlı, bilerek bırakıldı — toplu "düzeltme" scripti yazarken bu iki dosyayı 4'e çevirme, dev bir gürültü diff'i olur.
    - **Doğrulama:** 11.753 kontrol ✓ (hub 48→78, keys 220→222) · `npm run build` ✓ · dokunulan dosyalarda lint 0 hata · 18 ns × 6 dil parite + placeholder + format ✓ · `cap copy` ios+android ✓.
    - **Dokunulmadı (bilinçli):** `ReviewPrompt.jsx`'te önceden duran 2 lint hatası (`set-state-in-effect`, `only-export-components`). `navCountSession` gerçekten kullanılıyor (3 gezinti sonrası tetikleyici); ref'e çevirmek popup'ın cooldown mantığını yeniden kurmayı gerektirir ve o mantık kullanıcı tarafından elle ayarlandı.

## "Bozar mı?" ekranı — hüküm rengi (2026-08-20)

Kullanıcı: *"Bu ekran aşırı sıkıcı ve sadece kalmış... odağı kaçırmayalım ama bu kadar da sıkıcı olmasın."* Yine **tahmin edilmedi, seçenek gösterildi** (memory: `yapi-once-gorunum-sonra`): 5 gerçekten farklı yön telefon çerçevesinde tek sayfada verildi (A Hüküm rengi · B Mihrap başlığı · C Kart ızgarası · D Her zaman bir cevap · E Renk bölgesi). Kullanıcı **A**'yı seçti, tek turda bitti.

**Teşhis (sıkıcılığın sebebi süssüzlük değildi):** hüküm sağda %40 opaklıkla duruyordu, ekranda okunmuyordu bile — liste "41 isim" gibi görünüyordu, "41 cevap" gibi değil; büyük cevap kartı yalnız aramadan sonra çıktığı için ekran boş açılıyordu; üç bölüm de aynı ritimdeydi.

**Uygulanan (`BreakerSheet.jsx`):** `DOT` / `PILL` / `BAND` sabitleri. Her satırın solunda 8px hüküm noktası (bozar = dolu kehribar/altın, duruma göre = halka, bozmaz = nötr) — soldan aşağı renk ritmi bu. Bölüm başlığı artık `Band` bileşeni: hükmün renginde, sayı sağda `tabular-nums` ile. Eski `{hüküm} · {sayı}` gri satırı gitti.

**İnce karar — pili yalnız ARAMA sonuçlarında** (`Row` `pill` prop'u, gruplu listede `false`): gruplu listede üstteki bant zaten hükmü söylüyor, aynı kelimeyi 20 satır tekrar etmek hem gürültü hem Almanca ("BRICHT DEN WUDU" ~124px) başlığı kırpıyordu. Pili gizlenince hüküm `sr-only` ile ekran okuyucuya verilir — **renk asla tek taşıyıcı değil** (renk körlüğü + gündüz temasında yeşil yasağı; gündüz kehribar `#B45309`, gece `islamic-gold`).

**Rötuş turu (aynı gün):** hüküm görsel dili `src/lib/verdictStyle.js`'e taşındı (`VERDICT_DOT` / `VERDICT_PILL` / `VERDICT_BAND`) — iki ekran okuyor: "Bozar mı?" tabakası ve **Öğren > Abdest merkezinin arama sonuçları** (orada bozan maddeler artık aynı noktayı taşıyor, hükmün adı alt satırda zaten yazılıydı). Ayrı tutulsaydı iki ekran aynı hükmü farklı renkte gösterirdi. `BreakerSheet` yerel sabitleri bıraktı, ölü `active={false}` prop'u silindi, `AbdestHub`'daki çift `abdestTopics` import'u birleştirildi. **duruma-göre noktası** `border-2` → `border-[1.5px]`: 8px kutuda 2px kenarlık deliği kapatıp dolu noktaya benziyordu. Açık temada nötr nokta `black/25` → `black/30`.

**Yanlış alarm, kayda geçsin:** `usePrayerFocus.js` Android'e `sound: 'beep.wav'` gönderiyor, `HomeComponents` ise `'beep'` — sessiz bildirim şüphesiyle bakıldı, **sorun yok**: Capacitor `AssetUtil.getResourceBaseName()` uzantıyı kırpıyor. Kaynaktan doğrulandı, kod değiştirilmedi.

**TEST TUZAĞI — tekrar etmesin:** `hub.mjs` sonundaki `process.exit(fail?1:0)`'ten SONRA yeni kontrol eklendiği için 20+ kontrol hiç çalışmadı ve test yine de "HEPSİ GEÇTİ" yazdı. Bu dosyalara kontrol eklerken **özet satırının ÖNÜNE** ekle. Diğer 6 test dosyası tarandı, aynı hata yok. Ayrıca `verdictStyle.js` `@/` alias'ı kullandığı için Node'dan `import` edilemiyor — test onu **metin olarak** tarıyor. Hub testi 78 → **183 kontrol**.

Yeni locale anahtarı GEREKMEDİ (mevcut `verdict.*` kullanıldı). Build ✓ · lint 0 hata · 11.753 kontrol ✓ · Tailwind'in ürettiği CSS'te yeni keyfi değerler doğrulandı (`padding:.1875rem`, `letter-spacing:.06em`) · cap copy ✓. **Cihazda bakılacak:** `--app-font-scale` 1.3'te pilin başlığı ne kadar kırptığı, açık temada nokta kontrastı.

## Paket temizliği (2026-08-20)

Release öncesi, kullanıcı: "uygulamayı App Store'a yüklerken mb arttıran png falan varsa sil".

**Uygulama paketinden çıkanlar** (hepsi "kullanılıyor mu" diye tek tek doğrulandı):
- `public/pwa-192x192.png` (54K), `public/favicon.ico` (3K), `public/assets/beep.wav` (88K) — **bunlar commit `3e03bc3`'te git'ten silinmişti ama diskte kalmıştı**; `public/` altındaki her şey Vite tarafından kopyalandığı için üç dosya da hâlâ iOS ve Android paketine giriyordu. Sessiz sızıntı.
- `ios/.../Assets.xcassets/Splash.imageset` (292K, 6 PNG) — LaunchScreen storyboard `SplashLogo`'yu kullanıyor, Capacitor splash eklentisi de storyboard'u açıyor (`SplashScreen.swift`: `UILaunchStoryboardName`). `Splash` adına hiçbir referans yok. **DİKKAT: `npx capacitor-assets generate` çalıştırılırsa geri gelir.**
- Kazanç: iOS ~437K, Android ~145K.

**Bilerek DURANLAR** (hepsi kullanımda, silinemez): `AppIcon-512@2x.png` 684K (App Store zorunlu) · `kabe-premium.png` 572K (Qibla) · `pwa-512x512.png` 328K + `apple-touch-icon.png` 48K (**MediaSession kilit ekranı görseli** — Quran.jsx/SurahDetail.jsx; PWA ikonu sanılıp silinmemeli) · `LockScreenLogo` 328K (NowPlayingPlugin) · `SplashLogo` 240K (LaunchScreen) · `logo.png` 216K (SplashScreen) · 15 hikaye JPG 848K (id 1-15, hepsi eşleşiyor) · `res/raw/ezan.mp3` 5.3M (Android'in en büyük varlığı) · `beep.wav`/`beep.caf` native kopyaları (bildirim sesi res/raw'dan çözülür, web kopyası gereksizdi).

**Diskten silinenler (uygulamaya girmiyordu):** kök ekran görüntüleri `dua-light.png`/`stories-hint.png`/`stories-light.png` (536K), `.DS_Store`, `.playwright-mcp/` (3.1M), `dist/` (11M), `android/app/build/` (418M). Toplam ~433M.

**Kullanıcı kararıyla DOKUNULMADI:** `android/app/release/` (92M; 18M bayat `.aab` + 74M açılmış hâli, 755 dosya git'te) ve kökteki 26 tek-seferlik `.py` scripti (148K) — ikisi de uygulamaya girmiyor. Not: oradaki `.aab` bu oturumlardaki işlerden ÖNCE alınmış, yani bayat; release'de onu yükleme.

**Sonraki adım istenirse:** kalan PNG'ler sıkıştırılmamış (~2.4M'lik grup). pngquant/oxipng ile görsel kayıp olmadan ~1.5M kazanılabilir; makinede araç kurulu değil, kurulum + görsel kontrol gerekir.

**Doğrulanmadı:** Xcode derlemesi çalıştırılmadı (imzalama gerekiyor). `Splash.imageset` referanssızlığı kaynak taramasıyla kanıtlandı, cihazda açılış ekranı bir kez görülmeli.

## Uygulama geneli hata avı (2026-08-20)

Kullanıcı: *"Tekrardan hataları kontrol et hiç hata olsun istemiyorum."* Abdest turu temizdi
(11.845 kontrol ✓), o yüzden tarama **uygulama geneline** açıldı. Bulunanların hiçbiri
kullanıcı raporu değil — hepsi ölçümle çıktı.

**1. `Profile.jsx`'te gerçek çalışma-anı çökmesi.** Paylaş butonunda
`const success = await shareProgress(...)` haptic `success` fonksiyonunu **gölgeliyordu**;
sonraki satır `if (success) success()` yani `true()` çağırıyordu → her BAŞARILI paylaşımda
`TypeError`. async onClick içinde olduğu için ErrorBoundary yakalamıyor, sessizce
Crashlytics'e düşüyordu. Yerel değişken `shared` oldu. Aynı gölgeleme deseni
`Profile.jsx:647` ve `Home.jsx:655`'te de var ama oralarda `heavy()`/`selection()`
çağrılıyor — zararsız, dokunulmadı.

**2. İsim alanı Latin'e kilitliydi.** `/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]*$/` — Arapça, Kiril,
Azerice `ə`, Almanca `ä`/`ß` yazılamıyordu: tuşa basınca **hiçbir şey olmuyordu**
(6 dilin 4'ünde kendi adını yazamama). Artık `/^[\p{L}\p{M}\s'’-]*$/u`. 11 vakalık
birim testi ✓ (Əli, Мурат, محمد, Jörg Müller, 名前 geçer; "Ali 123", "<script>" geçmez).

**3. Koşullu hook — React çökmesi bekliyordu.** `ReligiousCalendarWidget`
(`HomeComponents.jsx`) `if (!nextEvent) return null;` **satırından SONRA** `useEffect`
çağırıyordu. Yaklaşan dinî gün listesi tükendiğinde hook sayısı düşüp React
"Rendered fewer hooks than expected" ile ana ekranı patlatırdı. Hook erken return'ün
üstüne alındı. (`react-hooks/rules-of-hooks` lint hatası buydu.)

**4. `MihrabDecoration` render içinde tanımlıydı** (`VerseOfDayCard`): her render'da yeni
bileşen kimliği → SVG alt ağacı komple sökülüp yeniden kuruluyordu. Modül kapsamına alındı
(hiçbir şeyi closure'lamıyordu).

**5. 16 locale anahtarı HİÇBİR dilde yoktu** — `t('anahtar', { defaultValue: 'Türkçe' })`
deseniyle maskelenmişti, yani 5 dilde de ekranda Türkçe çıkıyordu. 15'i Zikirmatik'in
hızlı ayarlar panelinde (`dhikr`: `settings`, `quickSettings`, `setTotalCount(+Desc)`,
`fullscreenTap`, `fullScreenTapDesc`, `fullScreenTap.enabled/disabled`,
`volumeButtonsLabel/Desc`, `vibration.offShort/targetOnlyShort/everyClickShort`,
`customDhikrDesc`, `searchResults`). **`profile:invalid_name` daha kötüydü**: kod
`t('invalid_name') || 'Lütfen…'` yazıyordu ama i18next eksik anahtarda anahtarın KENDİSİNİ
döndürür (truthy) → `||` hiç çalışmıyor, kullanıcı **ham "invalid_name"** yazısı görüyordu,
Türkçe dahil. Hepsi 6 dile eklendi. (Aynı sınıf bir önceki turda 17 anahtarla yakalanmıştı;
o tur pozisyonel varsayılana bakıyordu, bu tur `defaultValue:` ve `|| fallback` desenleri de
tarandı.)

**6. Sabit Türkçe UI metinleri lokalize edildi.** Profil isim modali (başlık, etiket,
placeholder, ipucu, İptal, Kaydet), alt bilgideki "TÜM HAKLARI SAKLIDIR", paylaş butonu;
Home'daki Esma sayacı sıfırlama onayı (soru, İptal, Sıfırla), sıfırla ve titreşim
tooltip'leri. Yeni anahtar: `profile.name_modal.{title,label,placeholder,hint}`,
`profile.rights_reserved`, `profile.share.button`, `home.reset_confirm`; İptal/Kaydet için
zaten var olan `common:common.cancel/save` kullanıldı.

**Bakılıp DOKUNULMAYANLAR (kayda geçsin, tekrar araştırma):**
- `MoodSelector` (`HomeComponents.jsx`) sabit Türkçe ama **hiçbir yerden çağrılmıyor** — ölü export.
- `Quran.jsx`'teki "💡 Ayet içeriği API'den yüklenecek" kartı **ulaşılamaz**: `showSurahList`
  hiç `false` yapılmıyor, `setSelectedSurah` yalnız `null` ile çağrılıyor. Ölü dal.
- `ErrorBoundary` içindeki Türkçe `FALLBACKS` kasıtlı (i18n'in kendisi çökerse devreye girer).
- `MurakabeTab.jsx:107` `react-hooks/immutability` hatası **yanlış alarm**: `calculateStreak`
  effect'ten çağrılıyor, effect mount'tan sonra koştuğu için TDZ oluşmuyor.
- Konfeti partiküllerindeki `Math.random()` (purity hataları) dekoratif, kasıtlı.
- 6 `set-state-in-effect` hatasının hepsi koşullu ve döngü yapmıyor; `ReviewPrompt`'unki
  kullanıcı tarafından elle ayarlanmış mantık.
- `InterstitialAdManager`'daki 5 `no-unreachable` reklamların kapalı olmasından (kasıtlı).

**Doğrulama:** `npm run build` ✓ · **repo lint 46 → 44 hata** (düşen ikisi bu turda
düzeltilen gerçek hatalar; dokunulan dosyalarda 0) · 108 locale dosyası, 18 namespace × 6 dil
**tam parite**, placeholder farkı 0, format (4/2 boşluk + trailing newline yok) korundu ·
kodda karşılıksız `t()` anahtarı **0/1090** · `returnObjects` kullanan 6 anahtarın hepsi
6 dilde aynı uzunlukta ✓ · locale dosyalarında tekrar eden anahtar 0 · abdest testleri
11.845 kontrol ✓ · `cap copy` ios+android ✓.

**Kalıcı ders — tarama deseni:** eksik locale anahtarı üç şekilde maskeleniyor:
`t('k', 'Türkçe')` · `t('k', { defaultValue: 'Türkçe' })` · `t('k') || 'Türkçe'`
(sonuncusu HİÇ çalışmaz). Yeni metin eklerken üçünü de kullanma; tarama yaparken üçünü de ara.

## İkinci tur — native köprü ve veri katmanı hataları (2026-08-21)

Kullanıcı "devam" dedi; tarama lokalizasyondan **Capacitor köprüsüne, depolamaya ve
bildirim boru hattına** kaydı. Dördü de sessiz hatalardı, hiçbiri kullanıcı raporu değil.

**1. `removeAllListeners('resume')` @capacitor/app'in TÜM dinleyicilerini siliyordu.**
`PrayerTimesContext`'in resume effect'i temizlikte bunu çağırıyordu. Capacitor imzası
**`removeAllListeners(): Promise<void>` — olay adı ALMAZ** (kaynaktan doğrulandı:
`node_modules/@capacitor/app/dist/esm/definitions.d.ts:267`), string sessizce yok sayılıyor
ve plugin'in bütün dinleyicileri gidiyor: `App.jsx`'teki **`appUrlOpen` (deep link)**,
`appStateChange` ve `useHardwareBack`'in **`backButton`**'ı. Effect `fetchPrayerTimes`'a
bağlı, yani **konum/ayar her değiştiğinde** Android donanım geri tuşu ve deep link'ler
uygulama ortasında ölüyordu. Artık dinleyici handle'ı tutulup yalnız o kaldırılıyor
(unmount yarışı için `cancelled` bayrağı — `useHardwareBack`'teki doğru kalıp).
*Qibla'daki `Motion/Compass.removeAllListeners()` sorun değil: o iki plugin'in tek tüketicisi
Qibla (doğrulandı).*

**2. Bildirim analytics'i ÇİFT sayıyordu.** `localNotificationReceived` ve
`localNotificationActionPerformed` **hem `App.jsx`'te hem `PrayerTimesContext`'te**
kayıtlıydı — her bildirim iki olay üretiyor, üstelik **farklı taksonomiyle** (biri
`friday`, öteki `dhikr_reminder` diyordu). Ayrıca App.jsx'in ID tahmini **2000'i
`dhikr_reminder` sanıyordu — 2000 CUMA, zikir 3000**; ve iki harita da sahur (4000),
ezber (5100-5107), mest (5200-5201) bildirimlerini `other`'a atıyordu. Tek kaynak:
yeni **`src/lib/notificationTypes.js` → `notificationTypeOf(id, extraType)`**
(`extra.type` varsa o kazanır). PrayerTimesContext'teki kopya dinleyiciler kaldırıldı
(App.jsx'teki deep link'i de işlediği için o kaldı); ölü `analytics` importu silindi.
27 vakalık birim testi ✓. **Amplitude uyarısı: bildirim metrikleri bu düzeltmeden ÖNCE
~2× şişik ve iki isim şemasına bölünmüş — eski veriyle karşılaştırma yaparken dikkat.**

**3. Tuba Ağacı ilerlemesi Keychain'e ULAŞMIYORDU.** `tubaAgaci_data` `CRITICAL_KEYS`'te
ama sulama yazımı (`HomeComponents.jsx`) **ham `localStorage.setItem`**'di. Keychain yedeği
yalnız açılıştan 2 sn sonra bir kez alınıyor; ayrıca `initialize()`'daki senkron yalnız
`localValue && !prefValue` yönünde çalışıyor, yani ilk senkrondan sonra ham yazımlar
Preferences'a **hiç** geçmiyor. Sonuç: o oturumda sulanan gün bir sonraki açılışa kadar
korumasız, uygulama silinip kurulunca kayıp. **Kaza sayaçlarında düzeltilen hatanın
aynısı.** Artık `storageService.setItem` (3 katman). Kalan ham yazımlar bilinçli bırakıldı:
`cached_address/district/country_code` (GPS'ten yeniden üretilir), `app_data_version`
(iç sürüm damgası), `tubaAgaci_completedDays/weekId` (haftalık sıfırlanıyor), DebugMenu.

**4. Ezber tekrar bildirimi yanlış sekmeye düşüyordu.** `extra.route: '/learn'` →
Öğren varsayılan sekmesi **Dualar**; "Bugün İhlâs tekrarı var" bildirimine dokunan kullanıcı
dua listesi görüyordu. Mest bildiriminde düzeltilen hata ezberde kalmıştı. Artık
`/learn?ezber=1` ve Learn açılış kategorisi `sureler`. (17 maddelik `ROUTE_WHITELIST`
ile backend `ROUTES` listesi karşılaştırıldı — birebir aynı ve hepsi `App.jsx`'te gerçek
route, sorun yok.)

**Yanlış alarmlar (kayda geçsin, tekrar araştırma):**
- "18 temizlenmeyen `setInterval`" — tarama hatasıydı; regex `const timer = setInterval`
  kalıbını atlıyordu. Doğru taramada **temizlenmeyen 0**.
- Ön-hatırlatma bildirimleri `Math.floor(Math.random() * 2147483647)` ile ID üretiyor;
  ~50 sabit ID ile çakışma olasılığı 2e-8, pratikte sorun değil.
- Locale dosyalarında tekrar eden JSON anahtarı 0; JS nesne literallerinde tekrar eden
  anahtar 0; analytics'te 76 olay adı, tekrar 0, adlandırma kuralı dışı 0.

**Doğrulama:** `npm run build` ✓ · repo lint **44 hata** (tur başındakiyle aynı; dokunulan
5 dosyada 0 yeni) · 18 ns × 6 dil parite + placeholder + format ✓ · karşılıksız `t()`
anahtarı 0/1090 · abdest testleri 11.845 kontrol ✓ · `notificationTypeOf` 27 vaka ✓ ·
`cap copy` ios+android ✓.

**Cihazda doğrulanmalı:** dua/ezber/abdest tabakası açıkken konum ayarını değiştir, sonra
Android geri tuşuna bas (1. hata tam bu senaryoda tetikleniyordu) · Live Activity deep
link'i (`islamiyoldas://premium?offer=true`) konum değişiminden sonra · ezber tekrar
bildirimine dokununca Sureler listesi açılıyor mu.

## Üçüncü tur — kurulum, yama ve native kaynaklar (2026-08-23)

Kullanıcı "iyi kontrol et başka hata olmasın" dedi. Tarama JS'ten **paket kurulumu,
patch-package ve native kaynak dosyalarına** taşındı. Üçü de release'i doğrudan
etkileyen, hiçbiri uygulama çalışırken görünmeyen hatalar.

**1. RELEASE ENGELİ — temiz `npm ci` / `npm install` HİÇ ÇALIŞMIYORDU.**
`@odion-cloud/capacitor-volume-control@2.0.1` peer olarak `@capacitor/core@^5` istiyor,
proje Capacitor 8'de → ERESOLVE ile durur. Bu makinede node_modules zaten kurulu olduğu
için hiç görünmemişti; **yeni klonda, CI'da veya `rm -rf node_modules` sonrası kurulum
bitmez**. Yeni `.npmrc` → `legacy-peer-deps=true` (gerekçesi dosyada yazılı).
`npm ci --dry-run` artık geçiyor. Eklenti yalnızca AudioManager sarmalayıcısı, peer
aralığını geçmek güvenli. *Yan bulgu: `package-lock.json` sürümü 1.1.8'de kalmıştı,
`package.json` 1.2.0 — npm kendisi düzeltti.*

**2. İki patch-package yaması yanlışlıkla Gradle çıktısını yakalamış.**
Biri bozuktu, ikisi de devasa:
- `@odion-cloud+capacitor-volume-control` — **397K, 252 diff** ve **uygulanmıyordu**
  (`postinstall` hata veriyordu). Gerçek içerik TEK dosya: `OdionCloudCapacitorVolumeControl.podspec`.
  Gerisi `android/build/**` (.dex, .jar, .bin, kotlin cache, lint modelleri) + Eclipse
  IDE dosyaları. **Podspec kritik**: `ios/App/Podfile:30` bu ada göre pod çekiyor,
  olmadan iOS pod kurulumu kırılır.
- `@capgo+capacitor-compass` — **331K, 103 diff**; gerçek içerik yine TEK dosya
  (`CapgoCompass.java`, pusula füzyon düzeltmesi). Bu yama uygulanıyordu ama aynı çöpü
  taşıyordu; node_modules'te bir kez daha Gradle çalıştırılsa o da bozulurdu.

Her ikisi de `node_modules`'teki `android/build` + IDE dosyaları silinip yeniden üretildi:
**397K → 979B** ve **331K → 7.6K**. Doğrulama: node_modules sıfırdan kuruldu
(`npm install --legacy-peer-deps`), 4 yamanın hepsi ✔ uygulandı ve hem podspec hem
`CapgoCompass.java` eski haliyle **byte-byte aynı** çıktı; `npm run build` çıktısı da
aynı hash'leri verdi. **Ders: `npx patch-package <paket>` çalıştırmadan önce o paketin
`android/build` klasörünü sil.**

**3. iOS izin diyaloğu 6 dilde de Türkçe çıkıyordu.** Altı `InfoPlist.strings` dosyası da
**`NSPrivacyTrackingUsageDescription`** yazıyordu — böyle bir anahtar yok, ATT diyaloğunun
anahtarı **`NSUserTrackingUsageDescription`** (Info.plist'te doğru yazılı). Sonuç: her iOS
kullanıcısına ilk açılışta gösterilen izleme izni diyaloğu, çeviriler hazır olmasına rağmen
Türkçe metni gösteriyordu. Apple incelemesi bu diyaloğa ayrıca bakıyor. 6 dilde anahtar adı
düzeltildi, `plutil -lint` ✓. Diğer 6 usage description anahtarı doğruydu.

**4. Android widget seçicisindeki açıklamalar her dilde Türkçe'ydi.** `res/` altında yalnız
`values/` vardı. 5 widget açıklaması için `values-en/de/ar/ru/az` eklendi — **metinler yeni
çevrilmedi, iOS widget'ının kendi `Localizable.strings` çevirilerinden alındı**, iki platform
aynı cümleyi göstersin diye. `gradlew :app:processDebugResources` ✓.

**Bakılıp temiz çıkanlar:** `functions/index.js` sözdizimi + 2 export ✓ · zikirmatik 44 preset
**4 yerde de indeks-eşleşmeli** (Dhikr.jsx / DhikrEntry.swift / DhikrWidgetProvider.java /
6 locale) ✓ · dua kütüphanesi 70 kayıt, 6 dilde anahtar eşleşmesi, 14 ücretsiz, her bölümde
en az 1 ücretsiz ✓ · esma 99 × 5 dil alanı tam ✓ · sure özeti 114 × 6 dil tam ✓ · hikaye
id/görsel eşleşmesi, sahipsiz görsel yok ✓ · widget `Localizable.strings` 20 anahtar × 6 dil
pariteli ✓ · Android izinleri ve iOS usage description'ları eksiksiz ✓ · `ROUTE_WHITELIST`
17 madde, hepsi gerçek route ✓.

**Not (hata değil, içerik boşluğu):** `spiritualData` yalnız tr/ar/de/ru için var;
`STORIES_MAP`'te **en ve az yok**, yani İngilizce ve Azerice kullanıcılar hikayeleri
**Türkçe** okuyor (Stories.jsx:85'teki yorum bunu bilinçli sayıyor). Karaoke takibi de
sadece bu dillerde açık. Çevrilecekse 15 hikaye × 2 dil.

**Yeni test dosyaları** (scratchpad, repoya girmez): `kontrol/dua.mjs` (1019 kontrol),
`kontrol/veri.mjs` (467). Node ESM uzantısız import çözemediği için `src/data/*.js`
kopyaları `kontrol/data/` altına `.js` uzantılı importlarla yazılıyor.
`sure18/robust.mjs` (475) yeniden çalışır hale getirildi — `ezber_copy.mjs`/`dome.mjs`
kopyaları güncel kaynaktan üretiliyor.

**Doğrulama:** `npm run build` ✓ · repo lint **44 hata** (tur başıyla aynı, yeni 0) ·
**13.821 kontrol** ✓ (11.845 abdest + 475 ezber + 1019 dua + 467 veri + 15 preset) ·
4 patch-package yaması sıfırdan ✔ · `npm ci --dry-run` ✓ · `plutil -lint` 12 dosya ✓ ·
`gradlew :app:processDebugResources` ✓ · `cap copy` ios+android ✓.

**Cihazda/Xcode'da doğrulanmalı:** ATT diyaloğunu İngilizce cihazda gör (uygulamayı silip
kur, ilk açılış) · Android widget seçicisini Almanca cihazda aç · iOS'ta `pod install`
(podspec yaması yeniden üretildi).

## Abdest sihirbazı yeniden tasarlandı — yön "ADIM" (2026-08-23)

Kullanıcı: *"erkek abdesti kısmını tasarlayalım... bütün skilleri ve ajanları çalıştırarak."*
15 ajanlık tasarım workflow'u koşuldu (2 keşif → 4 rakip konsept → 4 acımasız eleştiri →
4 mercekli jüri → sentez), 4 yön telefon çerçevesinde web'de gösterildi, kullanıcı
**01 · ADIM**'ı seçti: bugünkü tek-kart sihirbazı kalıyor, denetimin bulduğu kusurlar
kapatılıyor.

**Jüri sonuçları (kayda geçsin):** fıkıh AKIŞ (7) · maliyet AKIŞ (7) · görsel ŞERİT (7) ·
yeni başlayan ŞERİT (7). Kullanıcı ikisini de değil, en muhafazakâr yönü seçti.

**ELENEN VE BİR DAHA ÖNERİLMEYECEK İKİ MODEL:**
- **Beden haritası** (mihrap kemerinin içine 4 bölge, bölgeye dokun-aç): okuma sırası
  BAŞ'tan başlıyor, gerçek abdest sırasıyla çelişiyor; serbest gezinme Şâfiî'de farz olan
  **tertibi** bozup geçersiz abdest öğretebilir. Fıkıh hakemi 3/10.
- **Dokunarak sayma** (tesbih modeli): ıslak elle 17-31 dokunuş; hayalet dokunuş adımı
  sessizce atlatır (atlanan farz); saydırmak vesveseyi ürünleştirir. Tek iyi fikri alındı:
  güvence satırı.
- **Tekrarı çubuğa segment olarak kodlamak**: grafik "üç yıkamanın da farz" olduğunu
  öğretiyordu. Ayrıca **`step.repeat` sayı DEĞİL, 6 dilde çevrilmiş dize** (`'3x tekrar'`,
  `'3 مرات'`) — ritmi görselleştiren her fikir yeni sayısal alan ister.

**Uygulanan değişiklikler:**
1. **Kart** (`GuideStepCard`): `font-serif` başlık → `font-display` 1.5rem (projenin kendi
   kuralı "başlıkta serif yasak"tı, burası çiğniyordu) · adım ikonu kutusu KALDIRILDI (aynı
   damla ikonu bu ekranda üç yerdeydi — Dua bölümünde sildirilen kalıbın aynısı) · Arapça
   düz şeritten **levhaya** taşındı (yeni `src/components/ui/levha.jsx`, dua/ezber
   ekranlarıyla aynı dil) · meal artık sayfanın **en parlak** metni · ipuçları kutusu dolgu
   yerine **altın çerçeve** · farz adımda kart çerçevesi 1.5px (hüküm için ikinci kanal).
2. **Işık teması kontrast düzeltmesi:** tekrar pili, Arapça metin ve ipucu madde imi
   `islamic-gold` (#D4AF37) idi — krem zeminde 1.8:1. Işıkta `#B45309`/`#92400E`'ye alındı,
   koyu tema değişmedi.
3. **Üçlü sayaç tekrarı bitti:** ilerleme çubuğu + "Adım 1/15" + kart içi "01/15" vardı.
   Artık sayaç YALNIZ kartın künyesinde; çubuk kaldı ama metni `aria-label`'a indi;
   rehber başlığı da iki kez yazılıyordu (geri satırı + eyebrow), eyebrow bloğu silindi.
4. **Mod değişimi ilerlemeyi SİLMİYOR.** Eskiden `setCurrentStep(0)`: 12. adımdaki kullanıcı
   "Kısa"ya bakıp dönünce baştan başlıyordu. Eşleme **indeksle değil `id` ile** (listeler
   15 ↔ 7). Adım yeni listede yoksa **ÖNCEKİ** en yakın adıma düşülür — ileri atlamak
   görülmemiş bir farzı geçmiş göstermek olurdu. 83 birim testi (`scratchpad/kontrol/mod.mjs`).
5. **Hub aramasından gelince mod artık DEPOYA YAZILMIYOR.** Kullanıcının tercihi arka planda
   kalıcı değişiyordu; şimdi geçici geçiş + `restoreModeRef` ile çıkışta geri yükleme.
6. **Islak el modu artık metronom değil:** `instruction` metni HİÇ gösterilmiyordu, görsel de
   olmadığı için kullanıcı 9 sn boyunca bir başlığa ve sayaca bakıyordu. Şimdi 1.0625rem ile
   gösteriliyor, kap `overflow-y-auto` (fıkhî metin kırpılamaz, taşma kaydırmayla çözülür).
   Bitiş metni Kısa modda var olmayan kapanış duasını istiyordu → `handsFreeDoneSubNoDua`.
7. **Farz güvence satırı:** "Bir kez yıkamak farzdır · üç kez yıkamak sünnettir." Yalnız
   TEKRARLI farz adımlarında (baş meshi farz ama tekrarsız). Ceza dili yok, sayaç yok.
8. **Bitiş ekranı sakinleşti:** iki sonsuz pulse halkası + sonsuz nefes alan glow kaldırıldı,
   `font-serif` → `font-display`. Günde beş kez görülen ekranda bitmeyen repaint yoktu.
   Learn.jsx'te artık `repeat: Infinity` YOK.
9. **Sihirbaz ölçülüyor:** hiç event yoktu. `learn_abdest_complete`,
   `learn_abdest_handsfree_start`, `learn_abdest_handsfree_done` eklendi — ekranın kurucu
   özelliğinin kullanılıp kullanılmadığı ilk kez görülecek.

**DİKKAT — kabuk paylaşımlı:** sihirbazı gusül, teyemmüm, namazlar ve kadınNamaz da
kullanıyor. Güvence satırı `assurance` prop'uyla YALNIZ abdeste veriliyor; kartın geri kalanı
beş rehberde de değişti (hepsi aynı kusurları taşıyordu).

**Test tuzağı (tekrar):** `hub.mjs`'teki regresyon bekçisi eski davranışı (`arama modu depoya
yazılır`) koruyordu ve doğru biçimde patladı — bekçi yeni sözleşmeye göre güncellendi.
Ayrıca iki kontrolüm yanlış alarm verdi: `font-serif` yorum içinde eşleşti, `stepProgress`
`aria-label` olarak yaşıyordu. Regex'ler `className="..."` ve görünür-metin biçimine daraltıldı.
`keys.mjs`'e **üçlü koşullu `t(kosul ? 'a' : 'b')`** kalıbı eklendi — `handsFreeDoneSubNoDua`
bu yüzden hiç doğrulanmıyordu (215 anahtar, eskiden 207).

**Doğrulama:** `npm run build` ✓ · repo lint **44 hata** (tur başıyla aynı, yeni 0) ·
**13.915 kontrol** ✓ · learn.json **307 anahtar × 6 dil** pariteli, format korundu ·
karşılıksız `t()` 0/1090 · `cap copy` ios+android ✓.

**Cihazda bakılacak:** Kısa ⇄ Tam geçişinde kalınan adım · ıslak el modunda talimatın
okunabilirliği (telefon tezgâhta, kol boyu) · `--app-font-scale` 1.3'te kart ve ıslak el
kaydırması · aramadan bir adıma gidip çıkınca mod tercihinin korunması.

**Hâlâ eksik:** `public/images/abdest/` boş. 16 görsel gelince farz adımlarına 4:3 olarak
girer, kart zaten `onLoad`/`onError` ile yer ayırmıyor.

- ✅ **Dua Kardeşliği — CAPSLOCK kalkanı** (2026-08-23). Kullanıcı: "capslock açıp bütün duayı büyük yazmasın, gerekirse reddedelim". Mantık ortak dosyada: `src/lib/duaText.js`.
  - **Ölçüm `getCapsRatio`**: yalnız büyük/küçük ayrımı OLAN harfler sayılır — rakam, noktalama, emoji ve **Arapça** hesaba girmez (Arapça dua asla uyarı almaz). Türkçe I/İ için `toLocale*Case('tr')`. **≥%60 sarı uyarı, ≥%80 kırmızı + gönder butonu kilitli.** Alt sınır **8 harf** (12'den indirildi; "YARDIM EDİN" gibi kısa bağırma da yakalanıyor, dua zaten min 10 karakter).
  - **Reddetmek yerine düzeltme**: uyarı kutusunda **"Normal yazıma çevir"** butonu (`formCapsFix`, 6 dil) — `toCalmCase` metni küçültür, cümle başlarını büyütür, özel adları geri getirir (`Allah, Rabbim, Kur'an, İslam, Mekke...`; en `God/Quran/I`, de `Gott/Koran`, ru `Господь/Бог/Коран`; ar listesi boş).
  - **SIRA ÖNEMLİ**: özel ad düzeltmesi cümle-başı büyütmesinden ÖNCE koşar. Sebep: "ISLAM" küçülünce noktasız "ıslam" olur, cümle başı onu "Islam" yapar ve `ıslam` kalıbıyla bir daha eşleşmez (Unicode katlaması I↔i, I↔ı DEĞİL). Bu yüzden tr/az listesinde `['ıslam','İslam']` gibi **çift** girdiler var.
  - **Gösterim tarafı** (`formatDuaText(text, lang)`): ≥%80 caps olan dualar duvarda, geçmişte ve **paylaşım metninde** sakin yazımla çizilir. Firestore'daki metne DOKUNULMAZ; amaç eski sürümlerden (APKPure 1.1.x) gelmiş, zaten onaylanmış bağıran duaları temizlemek. Dil `dua.lang` alanından gelir.
  - **Son savunma**: `prayerService.addPrayer` + `updatePrayer` `isShouting` ile reddeder (UI atlanırsa). Dualar `status:'pending'` ile gidip elle onaylanıyor; bu kalkan moderasyon yükünü azaltır.
  - Analytics: `dua_caps_blocked` / `dua_caps_fixed` (caps yüzdesi + metin uzunluğu) — eşik ancak bu ikisinin oranıyla ayarlanabilir. Form açılışı başına tek blocked event.
  - **Bilinen sınır**: Almanca'da normalize edilen metinde isim büyük harfleri kaybolur ("Gesundheit" → "gesundheit"); sözlüksüz çözülemez, bağırmaya göre yine de daha iyi. Ayrıca tr'de "kuran" (fiil) çakışması yüzünden listede sadece "kur'an" var.
  - Doğrulama: 2 birim test dosyası (eşikler, idempotanlık, bozuk girdi, 6 dil, tr I/İ, Arapça+Latin karışık) ✓ · dua.json **99 key** 6 dil pariteli + placeholder kontrolü ✓ · `npm run build` ✓ · lint 0 hata (6 uyarı önceden vardı) · `cap copy` ios+android ✓. Cihazda bakılacak: uyarı kutusu + buton `--app-font-scale` 1.3'te satır kırılması.

## Abdest — iyileştirme turu (2026-08-23, ADIM sonrası)

Kullanıcı: *"İyileştirmeler yap birsürü."* Tarama görünümden **içeriğe** kaydı ve
üç gerçek fıkhî boşluk çıktı. Hiçbiri kullanıcı raporu değil; hepsi ölçümle bulundu.

**1. FIKHÎ İÇERİK KAYBI — "başın en az dörtte biri" cümlesi 4 dilde YOKTU.**
`wudu-bas-mesh` FARZ adımı. TR ve EN: *"Başın en az dörtte birini mesh etmek farzdır,
tamamını mesh etmek sünnettir."* **AR, AZ, DE, RU'da bu cümle hiç yoktu** — altı dilin
dördünde kullanıcı bir farzın ÖLÇÜSÜNÜ öğrenmiyordu. Dördüne de kendi kaydında eklendi
(DE "Streichen"/du-formu, RU "протирание"/вы-formu — dosya geneli вы, AZ "məsh"/sən,
AR eril tekil emir). Aynı turda iki detay daha eklendi: `wudu-yuz`'de kaş/göz çukuru/
sakal altı cümlesi (DE, RU, AR) ve `wudu-misvak`'ta üst-alt/sağ-sol (DE, RU, AZ, AR).

**2. KOD KENDİ YORUMUNDA YALAN SÖYLÜYORDU.** `wuduSteps.js`: *"niyet Hanefi'de sünnet,
Şafii'de farzdır… fark adımın kendi ipuçlarında belirtilir."* **Hiçbir dilde
belirtilmiyordu.** Rozet Hanefî'ye göre "Sünnet" yazıyor; Şâfiî kullanıcı niyeti atlarsa
abdesti geçersiz. Gusül ve teyemmümde bu not altı dilde de vardı — abdestte yazılmayı
unutulmuş. Altı dile eklendi, yorum da düzeltildi.

**3. Kalıcı bekçi: `scratchpad/kontrol/parite.mjs` (965 kontrol).** Anahtar paritesi
ölçülüyordu ama ADIM METİNLERİ hiç ölçülmemişti. Yeni test: adım sayısı/id sırası, alan
varlığı (title/instruction/arabic/transcription/meaning), ipucu sayısı, tekrar alanı,
**talimat uzunluk oranı** (tr'nin %62'sinin altı = detay düşmüş olabilir), ve **fıkhî
çapalar** — "dörtte bir", "dirsek", "topuk", "bilek", "yeni su", mezhep notu — her dilde
o dilin GERÇEKTE kullandığı kelimeyle aranıyor.
*İki yanlış alarm buradan çıktı ve düzeltildi:* Arapça bilek için `رسغ` değil **`معصم`**
kullanıyor; ve **JS'te `\w` Kiril harf eşlemez** (`[A-Za-z0-9_]`), `/свеж\w* вод/` sahte
bulgu üretti. Çapa yazarken hedef dilin kendi kelimesini doğrula.

**4. "Adıma git" — ADIM yönünün kabul edilen tek zayıflığı kapatıldı.**
"Boynumu meshettim mi" cevabı 12. karttaydı, 11 kaydırma uzaktaydı. Künye ("07 / 15")
artık dokunulabilir: alttan `StepJumpSheet` açılıyor, tüm adımlar sıra + başlık + tekrar +
hüküm adı + hüküm noktasıyla listeleniyor, dokunulan adıma atlıyor. **Model değişmedi**,
O(n) gezinme O(1) seçime indi. Portal (route değil), `useHardwareBack` bağlı, `data-sheet`
ile iOS kenardan-geri jesti yok sayılıyor, hüküm asla yalnız renkle taşınmıyor.
Sihirbaz kabuğunu paylaşan gusül/teyemmüm/namaz rehberleri de kazandı.

**5. Islak el modunda HIZ seçimi.** Sabit 9 sn (tekrarlı adımda 15 sn) kullanıcının gerçek
hızını varsayıyordu; yavaş yıkayan geride kalıyor ve **elleri ıslakken yakalayamıyordu** —
ekrana dokunmak bu modun tüm varlık sebebine aykırı. Yavaş 1.6× / Normal 1× / Hızlı 0.7×,
seçim `abdest_handsfree_speed`'de hatırlanıyor.

**6. EN terim birliği:** gövde 36 kez "wudu" diyordu, başlık "Ablution Guide" ve bir adım
"Post-Ablution Supplication" — aynı ekranda iki terim. İkisi de "Wudu"ya çekildi.

**7. Yeni analytics:** `learn_abdest_step_jump`.

**Doğrulama:** `npm run build` ✓ · repo lint **44 hata** (tur başıyla aynı, yeni 0) ·
**14.889 kontrol** ✓ (hub 194→202, yeni parite 965) · learn.json **311 anahtar × 6 dil**
pariteli, format korundu · `cap copy` ios+android ✓.

**Denetim turu (aynı gün, kullanıcı "genel kontrol et"):** üç kendi hatam bulundu ve
düzeltildi. (a) `learn_abdest_step_jump` TÜM rehberlerden tetikleniyordu — kabuğu
namazlar/kadınNamaz/gusül/teyemmüm de kullanıyor, olay "abdest" adı altında karışık veri
üretecekti; artık `topic` yazılıyor (bildirim tipi hatasının aynı sınıfı). (b) Sihirbaz
navigasyonundaki oklar RTL'de aynalanmıyordu ve ikon boşluğu fiziksel `ml-`'di — HandsFree'de
doğru yapılmış, kabukta unutulmuştu; `rtl:rotate-180` + mantıksal `ms-`. (c) **`memo`
regresyonu:** karta geçirdiğim `onJump`, `useHaptics`'in kararsız kimliği yüzünden her
render'da değişiyor ve `GuideStepCard`'ın `memo`'sunu boşa düşürüyordu — haptic ref'e
alındı (reponun kendi kalıbı: `HandsFree`'deki `goNextRef`), ref yazımı effect içinde.

**Temiz çıkanlar:** t() anahtarı 1179 tarandı/0 eksik · tekrar eden JSON anahtarı 0 ·
`removeAllListeners` yalnız Qibla'da (Motion/Compass'ın tek tüketicisi) · `if(X) X()`
gölgelemesi 0 · dinleyici dengesi (nowPlaying ve adService temizleyici döndürüyor, catch'te
de çağırıyor — sayım heuristiğim yanlış alarmdı) · abdest bileşenlerinde fiziksel yön sınıfı
0 · z-index katmanı sağlam (tabakalar 100, adıma-git 105, ıslak el 110, paywall/ipucu 200+) ·
eklenen dini metinler 6 dilde bozulmadan render oluyor (tırnak/kaçış hatası yok).

**Paralel çalışma (bana ait değil, dokunulmadı):** `src/lib/duaText.js` + `DuaKosesi.jsx` +
`prayerService.js` — CAPSLOCK kalkanı. Export'lar kullanılıyor, import'lar çözülüyor, build
geçiyor; `prayerService`'teki Türkçe `throw` mesajı kullanıcıya GÖSTERİLMİYOR (son çare
sunucu kontrolü), sorun değil.

**Cihazda bakılacak:** künyeye dokunup adıma atlama (özellikle Android geri tuşu sırası:
tabaka → sihirbaz → merkez) · ıslak el modunda hız şeridi ve `overflow-y-auto` ile
kaydırma · yeni eklenen cümlelerin DE/RU'da satır taşırıp taşırmadığı (`--app-font-scale` 1.3).

**Bilinçli bırakılan:** `guidesRU.js` dosya genelinde **вы** (resmî), `learn.json` ise
**ты** kullanıyor. Eklediğim cümleler dosyanın kendi kaydına uydu; 26 talimatı toptan
çevirmek ayrı bir içerik kararı.

## Namaz rehberleri — 6 dilde içerik denetimi (2026-08-23)

Kullanıcı: *"namazları açıklamaları her dilde doğru mu, hata yanlış bir anlatım istemiyorum."*
`namazlar` (13 adım) ve `kadinNamaz` (13 adım) altı dilde adım adım okundu. **On bulgu**,
biri ciddi. Türkçe kaynak alındı; uygulama Hanefî'yi esas alıyor.

**1. CİDDİ — erkek rehberinde KADIN duruşu.** `namazlar` #9 (İkinci Rekat):
ar/az/de **"eller GÖĞSE bağlanır"** diyordu — Şâfiî duruşu ve kadın rehberinden
kopyalanmış. Aynı rehberin #2 adımı "göbek altında" diyor: **rehber kendi içinde
çelişiyordu.** Üçü de "ayaklar bitişik" diyordu; #1 adımı ise "dört parmak boşluk" diyor —
ikinci çelişki. ru "eller" deyip yeri hiç söylemiyordu. Dördü de göbek altı + secde yerine
bakış olarak düzeltildi. **Kadın rehberine dokunulmadı** (orada göğüs üstü ve bitişik ayak
DOĞRU) — düzeltme `namazlar` bloğuna kapsamlandı, çünkü az/de'de iki metin birebir aynıydı.

**2. Kavmede ne söyleneceği ar/de/ru'da HİÇ yazmıyordu.** "Rabbenâ lekel hamd" yoktu.
Karşılığında o üç dilde olup tr/en/az'de olmayan "eller yanlara salınır" detayı da eklendi.

**3. Erkek secdesinin iki ayırt edici kuralı ar/de/ru'da yoktu:** "dirsekler havada
(yere değmez)" ve "karın uyluktan uzak". İkisi de kadın secdesinin tam tersi — düşünce
erkek-kadın ayrımı kayboluyordu. "Ayaklar dik, parmaklar kıbleye" ise tr/en/az'de yoktu.

**4. Rükûda "parmaklar açık"** ar/de/ru'da yoktu (kadınlarda bitişik — yine ayrım).
**5. Celsede "sağ ayak parmakları kıbleye"** ar/az/de/ru'da yoktu.

**6. AZ `namazlar` #11'de iki hata:** parmağın kaldırılma ANI yanlıştı ("Əşhədü" derken
deniyordu; doğrusu "Lâ ilâhe" derken kaldırılır, "illallâh" denince indirilir) ve 2. ipucu
("gözlər qucağa baxır") **kadın rehberinden kopyalanmıştı**; Merac notu düşmüştü.

**7. `kadinNamaz` #3 — İDDİA ÇATIŞMASI.** ar/de/ru *"tek fark duruşta, KIRAATTE DEĞİL"*
diyordu; tr/en ise kadının sesini yalnız kendi duyacağı kadar çıkardığını (gizli okuma)
söylüyor. Hanefî'de kıraat farkı gerçektir; üç dil de tr'ye hizalandı (+ zamm-ı sure ölçüsü).

**8. `kadinNamaz` #5 ve #7'de VACİPLİK hükmü ar/az/de/ru'da düşmüştü** (kavme ve celse
vaciptir). Hüküm bildiren cümle atlanacak bir detay değil.

**9. `kadinNamaz` #11 — Türkçe kendi içinde çelişiyordu:** 1. ipucu "şehadet parmağı
kaldırılmaz" diye KESİN konuşuyor, 3. ipucu "farklı görüşler vardır" diyor. Hanefî
kaynaklarının çoğu kadınların da işaret ettiğini söyler; kesin dil yanlıştı. Diğer beş dilde
1 ve 3 zaten birbirinin kopyasıydı. Altı dil de iki ipucuna indirildi.

**10. Küçükler:** `namazlar` #8'de "alın ve burun yerde sabitlenir" ipucu ar/az/de/ru'da VE
her dilin kadın rehberinde varken yalnız tr/en'in ERKEK rehberinde yoktu · `kadinNamaz` #1'de
"parmaklar bitişik" dört dilde yoktu · `kadinNamaz` #4 (RU) kadın rükûsunun tarifini
(sırt dümdüz değil, dizler bükük, eller kavramaz) kaybetmişti · AZ `kadinNamaz` #6 "yere
yakın" diyordu, tr "yapıştırılır".

**Kalıcı bekçi:** `parite.mjs` **2071 kontrol**. Yapısal paritenin üstüne **10 namaz çapası**
(erkek: göbek altı · rükûda açık parmak · Rabbenâ lekel hamd · dirsek havada · karın uzak;
kadın: göğüs üstü · omuz hizası · kollar yere yapışık · teverrük · gizli kıraat) ve
**"erkek rehberinde kadın duruşu anlatılmasın"** kontrolü. Her çapa o dilin GERÇEKTE
kullandığı kelimeyle aranıyor.

**Doğrulama:** `npm run build` ✓ · repo lint **44 hata** (tur başıyla aynı, yeni 0) ·
**15.955 kontrol** ✓ · locale parite bozulmadı · `cap copy` ios+android ✓.

**Not:** Bu tur METİN denetimidir; mezhep tercihi (Hanefî) ve mevcut fıkhî duruşlar
değiştirilmedi, yalnız diller arasındaki kayıp/çelişki giderildi. İçeriğin kendisini bir
kez de bilen birine okutman iyi olur.

- ✅ **Yayın öncesi denetim** (2026-08-24). Bulunanlar ve yapılanlar:
  - **ŞİKAYET ÖZELLİĞİ ÖLÜYDÜ.** `reportPrayer` `reports` koleksiyonuna yazıyor ama `firestore.rules`'da o koleksiyonun kuralı YOKTU → varsayılan deny. Canlı REST probe ile doğrulandı: `403 PERMISSION_DENIED`. Hata `catch` içinde yutulduğu için kullanıcıya "Geri bildiriminiz için teşekkürler" deniyor, kayıt hiç oluşmuyordu. Muhtemelen 2026-08-17 kural deploy'uyla başladı (öncesi konsoldaki izinli kurallardı). Kural dosyasına `/reports` **create-only** eklendi (alanlar `prayerId/reason/timestamp/status`, ≤64 karakter, `status=='pending_review'`; read/update/delete kapalı). **Deploy kullanıcıda:** `firebase deploy --only firestore:rules`. Ayrıca `reportPrayer` başarısızlığı artık Amplitude'a düşüyor (`dua_report_failed`) — bir daha sessizce kaybolmasın.
  - **Âmin kuralı sıkıldı**: `['aminCount','amins']` serbestken artık yalnız `aminCount` ve **tam olarak +1** (`resource.data.get('aminCount', 0) + 1` — alanı olmayan eski kayıtlar kırılmasın). `amins` alanı kodda hiç kullanılmamış (git geçmişinde de yok).
  - **AndroidManifest `usesCleartextTraffic` true → false.** Uygulama kaynağında tek bir `http://` yok, Capacitor 8 varsayılan `androidScheme=https` (CapConfig.java'dan doğrulandı). **Android cihazda bir kez açılış testi şart.**
  - **ProGuard**: topluluk eklentileri keep listesine eklendi (`app.capgo.*`, `com.revenuecat.purchases.*`, `com.aparajita.*`, `io.capawesome.*`, `com.ryltsov.*`, `com.yourcompany.*`). Capacitor bunları `capacitor.plugins.json`'daki adla `Class.forName` ile yüklüyor; R8 çağrıyı göremediği için release'de kırpılabilirdi. `:app:minifyReleaseWithR8` ✓, `usage.txt`te kırpılmamış.
  - **Backend zaten canlı** — "deploy bekliyor" notu ESKİ. Canlı fonksiyona sorularak doğrulandı: `birthday_verse` (`{"type":"birthday_verse","day":14,"month":2}`) ve `guide` çalışıyor.
  - **Temiz çıkanlar**: `HINT_TEST_MODE=false`, DebugMenu `DEBUG_MODE=false` + DEV gate, Profile test butonları yok, `testDate` prod'da 0, ReviewPrompt `IS_TESTING=false`, AdMob `isTesting:false` + gerçek ID, capacitor.config'de dev server yok, `.env` 8 anahtar dolu, pakette gerçek RC anahtarı (placeholder yok), ezber DEV "sona atla" prod paketinde yok, `debugger`/`alert`/TODO yok.
  - **AÇIK RİSKLER (bilgi, dokunulmadı)**: (1) `App.entitlements` → `aps-environment = development`; App Store yüklemesinde Apple production'a çevirir ama Xcode Release entitlement'ini doğrula. (2) **AdMob UMP/GDPR onay formu YOK** — `GoogleUserMessagingPlatform` pod'u var ama `requestConsentInfo/showConsentForm` hiç çağrılmıyor; EEA'da reklam sınırlanır + politika riski. (3) `prayers` kuralları kimliksiz: herkes bekleyen duayı silebilir/metnini değiştirebilir, onaylı duayı `delete_requested` yapabilir — auth veya App Check olmadan kapanmaz. (4) iOS bildirim bütçesi ~59/64 dolu (30 ezan + 15 ön-hatırlatma + 8 ezber + ~6 sabit); yeni bildirim eklenirse taşar. (5) `USE_EXACT_ALARM` Play politikasında alarm/takvim dışı uygulamalarda reddedilebiliyor. (6) 65 `console.log` prod'da açık. (7) `?offer=force` kodda duruyor.
  - **Sıklıklar kullanıcı kararıyla DEĞİŞTİRİLMEDİ** (2026-08-24): smart paywall her 4 geçişte / oturumda 3 / **günde 8**, interstitial 3. günden sonra **günde 10** (ilki 30 sn cooldown, sonra 1-2-3 dk), indirim teklifi 5 dk sürer **3 saat** cooldown. Şikayet gelirse önce paywall günlük kotası kısılmalı.
  - Sürüm hâlâ **1.2.0 / versionCode 21 / MARKETING_VERSION 1.2.0** — yeni yayın için bump gerekiyor.

## Kararlar
- **Reklam yerleşimi:** Banner bottombar üstünde kalacak (`BOTTOM_CENTER, margin:75`). İçeriğe gömülü/in-feed reklam YAPILMAYACAK — plugin banner'ı WebView üstünde yüzen native view, DOM akışına giremez; scroll-sync custom plugin emeğe değmez; native ad asset'ini HTML'de render etmek AdMob politika ihlali (ban riski). (Karar: 2026-07-07)

## Bekleyen / Yapılacaklar

### 2026-08-17 denetimi — durum

**✅ Yapıldı**
- **Firestore kuralları sıkılaştırıldı ve canlıya alındı.** `userDemographics` eskiden `allow write: if true` idi (kimlik yok, boyut yok → 1 MiB'lık dokümanlarla fatura şişirilebilirdi). Artık yalnız `create`, 7 bilinen alan, her alan ≤64 karakter; `read/update/delete` kapalı. Kurallar artık repoda: `firestore.rules` + `firebase.json`'a `firestore` bölümü eklendi → düz `firebase deploy` kuralları da gönderir, sadece fonksiyon için `--only functions` kullan. Canlıya karşı 7 testle doğrulandı. ⚠️ **Yeni onboarding adımı eklersen anahtarını `firestore.rules`'daki listeye EKLE** — yoksa yazma sessizce başarısız olur (`Onboarding.jsx` `.catch(()=>{})` ile yutuyor). Detay + gerçek kural metni: `docs/firestore-rules-review.md`.
- **Kaza sayaçları korumaya alındı.** `qadaCounts`/`qadaGoal` → `CRITICAL_KEYS`'e eklendi VE `Tracking.jsx`'teki 3 yazma `storageService.setItem`'e çevrildi (sadece listeye eklemek yetmezdi: yedek açılıştan 2 sn sonra alınıyor, o oturumda girilen kayıt kaybolurdu). Artık uygulama silinip kurulunca Keychain'den geri geliyor.
- **`app-ads.txt` zaten VARMIŞ ve doğru** — `https://www.islamiyoldas.com/app-ads.txt`, `google.com, pub-3345957146167395, DIRECT, f08c47fec0942fa0`. 4 alan adı varyantında da HTTP 200 + `text/plain`, publisher ID uygulamadaki AdMob birimleriyle eşleşiyor, mediation yok → tek satır yeterli. Önceki "YOK" bulgusu yanlıştı (repodaki `public/`'e bakılmıştı; dosya web sunucusunda durur). **Yapacak bir şey yok**, sadece Play Console/ASC'deki geliştirici sitesi alanının `islamiyoldas.com` olduğunu teyit et.

**⏸️ Kullanıcı kararıyla ERTELENDİ / YAPILMAYACAK**
- **App Check — şimdilik YAPILMIYOR (karar 2026-08-17).** Sebep: açma anı riskli; eski sürümler belge göndermediği için "zorunlu" moda erken geçilirse mevcut 1000 kullanıcının yapay zekâsı kırılır, APKPure'daki eski sürümler kalıcı kaybeder. Aylara yayılan geçiş gerektirir. Modeller ucuz (`flash-lite`, istek başına ~1500 token ≈ 0,1 kuruş): tek IP'li sıradan suistimal ~40-50 $/gün, proxy havuzlu ciddi saldırı binlerce $/gün. **Yerine önerilen ucuz alternatifler (henüz yapılmadı):** Google Cloud'da Gemini API'sine günlük istek kotası + faturaya bütçe alarmı. Uygulamaya dokunmadan, 5 dakikada, riskin çoğunu kapatır. App Check'i şu durumlarda tekrar gündeme al: faturada açıklanamayan sıçrama, AI kullanımının ciddi maliyete çıkması, veya zaten büyük bir sürüm güncellemesi yayınlanacaksa.
- **Fiyat A/B testi durdurulmayacak** (kullanıcı kararı). Bulgu kayıt için duruyor: `Standart Yıllık - Ucuz Yıllık` (exp8bebb7ca8c) 47 günde kontrol lehine sonuçlandı — ucuz vitrin müşteri başına net tahsilatı %2, MRR'yi %18 düşürüyor; tek kazanan ₺399 çıkış teklifi (+%85). Yıllık talep inelastik (0,45) → ileride fiyat ARTIŞI testi denenebilir.
- **Dua ret sebebi + onay/ret push bildirimi** — yapılmayacak (kullanıcı kararı).
- **Küçükler yapılmayacak** (kullanıcı kararı): dil filtresini Firestore sorgusuna taşıma, "Yenile" butonunu bağlama, `approvedAt` backfill script'i.
- **Diğer kullanıcı verisi** (`prayerStreak`, `fasting_v3`, `mizan_data`, `murakabe_best_streak`, `dhikr_*`) hâlâ korumasız — kullanıcı sadece kaza sayaçlarını istedi.

**🔲 Hâlâ açık**
- **Zorunlu güncelleme (minimum sürüm) kapısı — YOK.** APKPure eski sürümleri (1.1.5, 1.1.9) sonsuza kadar barındırıyor; oradan kuran kullanıcı düzeltilmiş bug'ları yaşayıp 1 yıldız veriyor. Play kullanıcıları da aylarca güncellemiyor. Gelecekteki *her* kritik hata için acil durum düğmesi olur — tek bug'ı değil, bug sınıfını çözer.

> Not: AppBrain gibi **listeleme** siteleri zararsız ve engellenemez (Play'in kamuya açık verisi). APKPure gibi **APK aynaları** imzayı koruduğu için gelir/reklam kaybı yaratmıyor; tek gerçek kayıp sürüm kontrolü.

### Diğer
- Entegre paywall cihaz testi: X → sheet → "Tüm planları gör" → banner+indirimli kart; aylık satın alma; süre dolumu dönüşü. (Not: TEST toast'lar kaldırıldı — hata detayını artık Amplitude `premiumPurchaseFailed` event'inden oku.)
- Gerçek satın alma testi (Android Internal Testing + iOS TestFlight).
- Release build al: `npm run build` + `npx cap sync` sonrası Android AAB + iOS archive.
- (Opsiyonel) Canlıya çıkmadan `?offer=force` paramı kaldırılabilir (şu an cihaz testi için duruyor).
- (Öneri) Çökme takibi için Sentry değerlendirilebilir (mevcut: Crashlytics).
- (İleride) Orantılı UI ölçekleme: `html { font-size: clamp(...) }` (Tailwind rem tabanı) + `@capacitor/text-zoom` kilidi + px arbitrary değerleri (`text-[26px]` vb.) rem'e çevirme. Amaç: her ekranda aynı görünüm, yazı taşması yok. Kullanıcı erteledi (2026-07-08) — istemeden başlama.
