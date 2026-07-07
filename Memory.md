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

## Kararlar
- **Reklam yerleşimi:** Banner bottombar üstünde kalacak (`BOTTOM_CENTER, margin:75`). İçeriğe gömülü/in-feed reklam YAPILMAYACAK — plugin banner'ı WebView üstünde yüzen native view, DOM akışına giremez; scroll-sync custom plugin emeğe değmez; native ad asset'ini HTML'de render etmek AdMob politika ihlali (ban riski). (Karar: 2026-07-07)

## Bekleyen / Yapılacaklar
- Entegre paywall cihaz testi: X → sheet → "Tüm planları gör" → banner+indirimli kart; aylık satın alma; sandbox'ta TEST toast ürün id (`offer.499` / variant_b `offer.399`); süre dolumu dönüşü.
- Canlıya çıkmadan release temizliği (bkz. `instruction.md` checklist — `appTestDayOffset` sıfırlama eklendi).
- App Store Connect'te `offer.499` / `offer.399` ürün doğrulaması.
- Gerçek satın alma testi (Android Internal Testing + iOS TestFlight).
- (Öneri) Çökme takibi için Sentry değerlendirilebilir (mevcut: Crashlytics).
