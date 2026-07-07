# Core — İslami Yoldaş (mobil)

Capacitor + React (Vite) İslami mobil uygulama. iOS + Android. `appId` `com.islamiyoldas.app`, `appName` "İslami Yoldaş". package.json `name` = "mobi".

## Kaynak haritası (`@/` → `src/`)
- `src/App.jsx` — router (react-router-dom v7), tüm sayfalar `React.lazy`. Rotalar `/premium` vb.
- `src/pages/` — sayfalar (Profile, PremiumPaywall, Quran, Dhikr, Stories, Qibla, ...)
- `src/layouts/AppLayout.jsx` — alt nav + üst header (premium butonu burada)
- `src/context/` — Prayer/Theme/User/Location/FontSize context'leri
- `src/services/` — `storageService`, `purchaseService`, `creditService`, `analyticsService`, `adService`
- `src/hooks/`, `src/components/`, `src/data/` (dil bazlı statik içerik: hadith/esma/guides/surah + TR/EN/AR/AZ/DE/RU son ekleri)
- `public/locales/<lang>/common.json` — i18n; 6 dil: tr, en, ar, az, de, ru. `fallbackLng: 'en'`.

## Proje geneli invariantlar
- Kalıcılık HER ZAMAN `storageService` üzerinden — ham `localStorage` değil (senkron kaymaları için). Detay: `mem:storage`.
- Premium/abonelik mantığı hassas; koruma katmanlarına dokunma. Detay: `mem:subscriptions`.
- Tüm görsel UI koyu zümrüt (#021a0f / #073822) + altın (#D4AF37 / #FFD700) dilinde. Android'de pahalı `backdrop-blur`/`blur` yerine radial-gradient kullan (perf).
- ⚠️ Şu an TEST aşaması; koda geçici debug/test kodları eklendi. Yayın öncesi kaldırılacaklar: `mem:release_checklist`.

## Alt konular
- Teknoloji: `mem:tech_stack`
- Komutlar: `mem:suggested_commands`
- Kod stili/konvansiyon: `mem:conventions`
- Görev tamamlama kontrolleri: `mem:task_completion`
- Abonelik/paywall/indirim sistemi: `mem:subscriptions`
- RevenueCat dashboard/fiyat gerçekleri (MCP): `mem:revenuecat_dashboard`
- 3 katmanlı depolama: `mem:storage`
- Yayın öncesi temizlik listesi: `mem:release_checklist`