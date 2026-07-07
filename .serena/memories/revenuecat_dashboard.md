# RevenueCat Dashboard Gerçekleri (MCP ile doğrulandı)

RevenueCat MCP kurulu (`revenuecat` MCP). Proje ID: `projab0da623` ("İslami Yoldas"). Dashboard'u doğrudan MCP ile oku (list-offerings/list-products/get-product-store-state/get-offering-prices), tahmin etme.
NOT: RC fiyat/mağaza verisi CANLI ama **birkaç saat cache gecikmesi** olabilir; kesin kaynak mağaza konsolu. Fiyat için kompakt `get-offering-prices` (currency+country) kullan; `get-product-store-state` çok büyük (~58KB, tüm ülkeler) → persisted dosyayı python ile TR'ye filtrele.

## Platform → app_id eşlemesi
- iOS: `appb94e20b9ca` — çıplak store_identifier (ör. `com.islamiyoldas.app.yearly`), eligibility `all`.
- Android: `app40a7caf359` — `productId:basePlanId` (ör. `...yearly:yillik-plan`), eligibility `google_sdk_ge_6`.
- Legacy: `app4ab9a34cb2` — çıplak `yearly`/`monthly`/`lifetime`. Kullanılmıyor, hâlâ default vitrine bağlı.

## Vitrinler
- `default` (ofrng1be3504ce8) — is_current: true. App'in `getProducts('current')` bunu çeker.
- `test_variant_b` (ofrngc129606836) — A/B, `...v2` ürünleri (daha ucuz varyant).
- `limited_offer_a` (ofrngae389ec1fa) — offer.499 (ana vitrin exit teklifi).
- `limited_offer_b` (ofrng8560f5f770) — offer.399 (test_variant_b exit teklifi).
- Uyarı: offering display name'leri içerikle uyumsuz (749↔499↔399); kod lookup_key kullanır.

## Fiyat pariteleri (TR) — iOS = Android olmalı. HEPSİ EŞİTLENDİ (Play Console'da düzeltildi)
- Normal Yıllık: ₺739,99 / ₺740 ✓
- İndirim Yıllık (offer.499): ₺499,99 (Android ilk ₺599,99'du → düzeltildi) ✓ (hedef ~%32 indirim, 740→499)
- Normal Aylık: ₺124,99 (Android ilk ₺149,99'du → düzeltildi) ✓
- A/B Aylık v2: ₺89,99 (Android ilk ₺109,99'du → düzeltildi) ✓
- NOT: Aylık/v2 düzeltmeleri son yapıldı; RC senkronu gecikmeli olabilir, doğrulama Play Console'daki aktif değerle.
- Yeni fiyat/offer eklerken iOS+Android TR paritesini get-offering-prices ile doğrula.

Abonelik kod mantığı: `mem:subscriptions`.