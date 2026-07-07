# Storage — 3 Katmanlı Kalıcılık

`src/services/storageService.js` (singleton `storageService`). Katmanlar:
1. `localStorage` (senkron okuma) 2. Capacitor Preferences (native yedek) 3. Secure Storage/Keychain (SADECE `CRITICAL_KEYS`; uygulama silinse bile kalır).

## Invariantlar
- Yazma/silme HER ZAMAN `storageService.setItem/removeItem` ile. Ham `localStorage.removeItem` YANLIŞ: Preferences katmanı temizlenmez, `initialize()` sonraki açılışta Preferences→localStorage senkronunda silineni geri getirir. (Bu bir kez indirim-cooldown test butonunda bug oldu, düzeltildi.)
- `getItem` senkron (localStorage'dan); `setItem`/`removeItem` async (Preferences + gerekirse Keychain).
- `initialize()`: reinstall tespiti (localStorage + Preferences ikisi de boşsa) → Keychain'den restore. `storageReady` event'i restore'dan SONRA. Kritik veriler reinstall'da Keychain'den geri gelir.
- `CRITICAL_KEYS`: onboardingComplete, userData, userProfile, aminKumbara_premium, aminKumbara_credits, aminKumbara_totalAmins, tubaAgaci_data, notifications, userAvatar, userStreak, app_data_version, cached_* (address/district/country_code), selectedLanguage, darkMode, fontSize. Yeni kritik kalıcı veri eklersen bu listeye ekle.
- Premium key: `aminKumbara_premium` ('true'/'false').