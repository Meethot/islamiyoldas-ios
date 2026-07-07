# Live Activity — "Son Teklif" Geri Sayımı (iOS 16.1+)

Kilit ekranı + Dynamic Island'da indirim geri sayımı. Sayaç `Text(timerInterval:)` + fitil `ProgressView(timerInterval:)` ile SİSTEM tarafında akar — push/backend YOK, uygulama kapalıyken çalışır. Dokununca `islamiyoldas://premium?offer=true` → indirim popup'ı.

## Dosya haritası
- `ios/App/App/OfferActivityAttributes.swift` — model: attributes(title,message) + ContentState(startDate,endDate). startDate fitil oranı için. HEM App HEM IslamiWidgetsExtension target'ında (paylaşımlı).
- `ios/App/IslamiWidgets/OfferLiveActivity.swift` — SwiftUI UI. `OfferTheme` enum: tema zümrütleri (#166B43/#115e3b/#073822 — indirim ekranı ailesi; simsiyah #021a0f KULLANILMAZ, canlı çimen yeşili de reddedildi) + altınlar. İkon: `moon.stars.fill` altın mühürde (GoldCrescentSeal) — alev bilinçli reddedildi (jenerik/slop). `safeRange()`/`fuseRange()` geçersiz aralık crash'lerini önler. AOD: `@Environment(\.isLuminanceReduced)` → saniyeli sayaç yerine `Text(endDate, style: .relative)` ("3 dk"), parlamalar/radial'lar kapalı.
- `ios/App/App/LiveActivityPlugin.swift` — Capacitor köprüsü: startOfferCountdown(endTimestamp,title,message)/endOfferCountdown/isSupported. 16.1/16.2 API dallanmaları. Kayıt: MyViewController.capacitorDidLoad.
- `src/services/liveActivityService.js` — JS sarmalayıcı; iOS dışı no-op, hatalar yutulur.

## Entegrasyon noktaları
- `useDiscountOffer.startOffer()` → startOfferLiveActivity (i18n: `common:premium.last_offer` + `discount_title`).
- `useDiscountOffer.evaluateState()` süre dolunca (cooldown set edilen tek seferlik dal) → endOfferLiveActivity.
- PremiumPaywall iki satın alma başarısında → endOfferLiveActivity.
- App.jsx appUrlOpen: `offer=true` → `/premium?offer=true`.

## Kritik yapısal notlar
- **WidgetBundle 10 öğe limiti**: IslamiWidgetsBundle → `IslamiCoreWidgets().body + IslamiActivityWidgets().body`. Core'a 11. öğe EKLEME.
- Info.plist: `NSSupportsLiveActivities=YES`. Deployment 15.0 → tüm kod `@available(iOS 16.1, *)` guard'lı.
- pbxproj değişiklikleri `xcodeproj` ruby gem ile (gem --user-install kurulu). Elle pbxproj düzenleme YAPMA.
- Bilinen sınırlamalar (kabul edilmiş): (1) süre dolunca app kapalıysa aktivite 00:00'da kalır, app açılınca temizlenir; (2) AOD'de saniye gizlenir → "3 dk" moduna geçer (bilinçli tasarım, tüm iOS böyle).
- Build doğrulama: `xcodebuild -workspace App.xcworkspace -scheme App -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` (ios/App içinden).
- `ios/App/Untitled.swift` + `Untitled 2.swift`: boş, projeye bağlı değil, silinebilir.

Abonelik akışı: `mem:subscriptions`. Bu KALICI özellik — `mem:release_checklist` temizlik listesinde değil.