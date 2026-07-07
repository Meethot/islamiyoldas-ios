# Conventions

- Bileşenler: fonksiyonel + hooks. Dosyalar `.jsx` (bileşen) / `.js` (servis/util/hook). Default export sayfa/bileşen başına.
- Importlar `@/` alias ile (`@/services/...`, `@/hooks/...`).
- Stil: Tailwind utility sınıfları inline; karmaşık/dinamik durumlar için inline `style={{}}`. `cn()` ile koşullu sınıf birleştirme.
- Animasyon: framer-motion (`motion.*`, `AnimatePresence`). Global keyframe'ler bileşen içi `const css = \`...\`` string'inde tanımlı (ör. PremiumPaywall `pw-*` keyframe'leri) veya `src/index.css`.
- Renk paleti sabit: zümrüt yeşili zeminler + altın (#D4AF37 kısık, #FFD700 parlak) vurgular.
- Android performansı: `blur`/`backdrop-blur` pahalı → `isAndroid` (`Capacitor.getPlatform() === 'android'`) ile radial-gradient'e düş. Bu desen PremiumPaywall'da yaygın; yeni ağır efektlerde uygula.
- Sayaç/rakam gösterimi: `font-mono` + `font-black` KULLANMA (monospace 900 yok → faux-bold glyph çakışması). Bunun yerine `tabular-nums` + normal font.
- Metinler her zaman i18n (`t('...')`), sabit string gömme. TR + EN'e ekle (diğer diller EN'e fallback yapar).
- Yorumlar Türkçe yazılıyor (mevcut stile uy).