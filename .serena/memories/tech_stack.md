# Tech Stack

- Dil: JavaScript + JSX (TypeScript DEĞİL; `.jsx`/`.js`). React 19.
- Build: Vite 7. Paket yöneticisi: **npm** (package-lock.json). ESM (`"type": "module"`).
- Mobil: Capacitor 8 (iOS + Android). `capacitor.config.json`.
- Yönlendirme: react-router-dom v7. State/data: @tanstack/react-query v5, React Context.
- UI: TailwindCSS 3 + `tailwindcss-animate`, framer-motion v12, lucide-react ikonlar, class-variance-authority + clsx + tailwind-merge (`cn` util `src/lib/utils.js`).
- i18n: i18next + react-i18next + http-backend + languagedetector. Namespace'ler; `common.json` çoğu metin.
- Ödeme: @revenuecat/purchases-capacitor v13 (+ purchases-capacitor-ui). Reklam: @capacitor-community/admob. Analytics: Amplitude + Firebase Crashlytics.
- Diğer Capacitor eklentileri: local-notifications, geolocation, filesystem, secure-storage (@aparajita), compass (@capgo), in-app-review (@capgo), volume-control.
- `patch-package` postinstall aktif (node_modules yamaları `patches/`).
- Alias: `@` → `src` (vite + jsconfig).

Sürüm: package.json `version` app sürümüdür (şu an 1.1.8 civarı); native sürümlerle elle senkronlanır.