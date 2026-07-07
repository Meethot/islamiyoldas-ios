# Yayın Öncesi Temizlik Listesi (TEST kodları)

İndirim/paywall test aşamasında eklenen GEÇİCİ kodlar. **Canlıya (production) çıkmadan HEPSİ kaldırılacak/geri alınacak.** Kullanıcı bunları bilerek ekletti; unutulmamalı.

## 1. `src/services/purchaseService.js`
- `Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })` şu an KOŞULSUZ çalışıyor → tekrar `if (import.meta.env.DEV)` koşuluna al.
- `purchaseProduct` catch bloğunda hataya eklenen ham detay (`readableErrorCode` + `underlyingErrorMessage`, `[...]` içinde) → test tanısıydı; kullanıcıya ham Google Play mesajı göstermek istenmiyorsa sadeleştir.

## 2. `src/pages/PremiumPaywall.jsx`
- `handleSubscribe` ve `handleOfferSubscribe` hata dallarındaki `TEST •` / `TEST-OFFER •` ham hata toast'ları → `getErrorMessage()` / `t('premium.iap_error_generic')` ile kullanıcı-dostu mesaja geri döndür.

## 3. `src/pages/Profile.jsx`
- "Developer Test Buttons" bloğu (opacity-50): 🔧 Paywall'ı Aç, 🔥 İndirim Popup Aç, ⏱ Sayaç Cooldown Sıfırla, 👁 Header Premium butonu toggle → tümü kaldırılacak.
- Bunlara bağlı `debugShowPaywall` state + `toggleDebugPaywall` fonksiyonu.

## 4. `src/layouts/AppLayout.jsx`
- `debugShowPaywall` state + `debugPaywallChanged`/`storage` event listener → kaldır.
- Header premium buton koşulu `(!hasPremium || debugShowPaywall)` → tekrar `!hasPremium` yap.

## 5. localStorage
- `debug_show_paywall` anahtarı (kod kaldırılınca işlevsiz kalır; temizlik şart değil).

## Ayrıca yayın öncesi (kod değil, iş)
- iOS Internal/TestFlight'ta gerçek satın alma denemesi yapılmış olmalı (Android da Internal Testing'de).
- Fiyat pariteleri teyidi: `mem:revenuecat_dashboard`.