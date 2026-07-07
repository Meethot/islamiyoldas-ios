# Subscriptions / Premium / İndirim Sistemi

Ana dosya: `src/services/purchaseService.js` (RevenueCat v13). UI: `src/pages/PremiumPaywall.jsx`. Entitlement ID: `'İslami Yoldas Pro'`.

## Premium koruma invariantları (ASLA zayıflatma)
Premium ancak `updatePremiumStatus(false)` ile düşürülür; tüm çağrı yolları korumalı:
- **Migration safety** (`initializePurchases`): SDK ilk init'te RC "premium değil" dese bile mevcut premium iptal edilmez.
- **Offline safety** (`verifySubscription`): `!navigator.onLine && current && !isPremium` → premium korunur.
- **Error safety**: doğrulama hatasında cache silinmez.
- `checkEntitlements`: spesifik entitlement yoksa aktif HERHANGİ birine düşer (cömert; premium ekler, asla almaz).
Bu katmanlar ~1000 mevcut aboneyi güncellemede korur.

## Android satın alma — kritik
- Satın alma HER ZAMAN `Purchases.purchasePackage({aPackage})` ile (rcPackage), çıplak product-ID ile `purchaseStoreProduct` DEĞİL (Android abonelik offer token'ı gerekir → "invalid arguments").
- `purchaseProduct` içinde taze paket SADECE ürünün kendi `offeringId`'sinden çekilir. TÜM vitrinlerde `identifier` ile arama YANLIŞ (`$rc_annual`/`$rc_monthly` id'leri vitrinler arası ortak → yanlış vitrin paketi → DEVELOPER_ERROR). Bu bir kez Gemini tarafından bozuldu, düzeltildi.
- IAP testi debug-imzalı build'de ÇALIŞMAZ ("Please ensure the app is signed correctly" / DEVELOPER_ERROR). Internal Testing track'ten Play Store ile kurulmalı + License Tester hesabı. Kod hatası değildir.
- RC hata detayı JS'de `err.data.readableErrorCode` + `err.data.underlyingErrorMessage`'ta gelir (asıl Google Play sebebi orada).

## Ürün ID / vitrin yapısı
- `PRODUCT_IDS`: MONTHLY `com.islamiyoldas.app.monthly`, YEARLY `...yearly`, YEARLY_OFFER_499 `...yearly.offer.499`, YEARLY_OFFER_399 `...yearly.offer.399`.
- A/B: ana vitrin → `limited_offer_a` (₺499) exit teklifi; `test_variant_b` (₺499) → `limited_offer_b` (₺399).

## İndirim (downsell) akışı
- Hook `src/hooks/useDiscountOffer.js`: 5dk teklif + 3 saat cooldown, `storageService` key'leri `islamiyoldas_discount_offer_end` / `islamiyoldas_discount_cooldown_end`. `startOffer(force)` aktif teklifi ASLA yeniden başlatmaz (offerEnd>now ise erken döner).
- PremiumPaywall: paywall kapatılınca (`handleClose`) exit-intent indirim popup'ı (`showExitPopup`) tetiklenir; cooldown'daysa standart popup (`showStandardExitPopup`).
- `?offer=true` URL'i teklifi zorlar (header sayaç butonu + Profile test butonu buraya gider). forced-start `forcedStartHandledRef` ile SADECE bir kez çalışmalı, yoksa süre bitince restart bug'ı olur.
- Header (AppLayout) teklif aktifken "Premium" butonunu canlı geri sayımlı "Son Teklif"e çevirir.

## Test aşaması geçici kod (YAYIN ÖNCESİ TEMİZLE)
- purchaseService `setLogLevel` şu an koşulsuz DEBUG (→ `if(import.meta.env.DEV)`'e geri al).
- PremiumPaywall hata toast'larında ham hata (`TEST •` / `TEST-OFFER •`) gösteriliyor (→ kullanıcı-dostu mesaja geri al).
- Profile.jsx'te geçici geliştirici test butonları (paywall aç / indirim aç / cooldown sıfırla).