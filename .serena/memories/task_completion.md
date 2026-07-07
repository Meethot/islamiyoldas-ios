# Task Completion Checklist

Kod değişikliği sonrası:
1. `npm run build` — derleme geçmeli (en önemli kontrol; TypeScript yok, tip kontrolü build'de).
2. `npm run lint` — SADECE `error` seviyesine bak; "unused-vars" `warning`leri kod tabanında zaten yaygın, zararsız.
3. Native'e gidecekse: `npx cap sync` (veya `npx cap sync android`).

Otomatik test YOK (test runner tanımlı değil). Doğrulama = build + gerek/mümkünse cihazda manuel deneme.

Yeni i18n anahtarı eklediyse: en az `public/locales/tr/common.json` ve `public/locales/en/common.json` güncellenmeli.

Ödeme/abonelik kodu değiştiyse `mem:subscriptions` içindeki invariantları ihlal etmediğini teyit et.