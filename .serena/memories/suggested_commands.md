# Suggested Commands

- `npm run dev` — Vite dev server (web).
- `npm run build` — Vite production build → `dist/`. Değişiklik sonrası derleme doğrulaması için bunu çalıştır (hızlı, ~3s).
- `npm run lint` — ESLint. Not: kod tabanında bol miktarda "unused-vars" uyarısı VAR (JSX'i tam algılamayan konfig) — bunlar zararsız gürültü; sadece `error` seviyesine bak, `warning`leri görmezden gel.
- `npm run preview` — build önizleme.
- `npm run android` — `build` + `cap sync` + Android Studio aç.

Native/mobil döngü (elle):
- `npx cap sync` / `npx cap sync android` — web build'i native'e kopyala.
- `npx cap open ios` / `npx cap open android`.

Darwin (macOS) ortamı; standart unix komutları normal çalışır. Interaktif git flag'leri (`-i`) desteklenmez.