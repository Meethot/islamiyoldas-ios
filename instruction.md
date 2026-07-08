# Çalışma Talimatları — İslami Yoldaş

Bu dosya, bu projede Claude Code / cowork'ün **nasıl çalışması gerektiğini** tanımlar.
Proje bilgileri ve mevcut durum için `Memory.md`'ye bak.

---

## Dil & İletişim
- **Bana Türkçe cevap ver.** Teknik terimler (RevenueCat, Live Activity, offering vs.) İngilizce kalabilir.
- Kısa ve net ol. Uzun anlatım yerine önce sonucu söyle, sonra gerekirse detay.
- Bir seçim yapılması gerekiyorsa önerini ver, "şunlar da var" diye liste dökme.

## Genel Çalışma Prensibi
- Elimde yeterli bilgi varsa **sor değil, yap**. Zaten kararlaştırdığımız şeyi tekrar tartışma.
- Ödeme (RevenueCat), native (iOS/Swift/Capacitor plugin) ve para/abonelik akışı → **yüksek dikkat** (high/xhigh effort). Buralarda acele etme, doğrula.
- Değişiklikten sonra mümkünse `npm run build` ile doğrula. iOS tarafı değiştiyse `npx cap sync ios` gerektiğini hatırlat.
- Test/deneme kodu eklediğinde bana **açıkça söyle** ki canlıya çıkmadan temizleyelim.

## HER ZAMAN yap
- Çok dilli metin eklerken **6 dilin hepsine** ekle: `tr, en, ar, az, de, ru` (`public/locales/{lang}/common.json`).
- i18next placeholder'larını (`{{percent}}` vb.) çeviride **birebir koru**.
- Locale JSON formatını koru: `ensure_ascii=False` (Arapça/Kiril karakterleri ham), 4 boşluk indent, **dosya sonunda yeni satır YOK** (dosya `}` ile biter).
- Yeni bir `premium` key'i eklerken tüm diller arasında **parite** olduğundan emin ol (eksik key = İngilizce'ye düşer).
- Kod yazarken çevredeki kodun stiline uy (yorum yoğunluğu, isimlendirme, idiom).

## ASLA yapma
- Firebase Analytics kurma/önerme — **analiz için Amplitude kullanıyoruz**. (Firebase yalnızca Crashlytics/FCM için.)
- `{{...}}` placeholder'larını çevirme veya silme.
- Locale dosyalarının sonuna trailing newline ekleme.
- Kullanıcı istemeden commit / push yapma.
- Bir dosyayı sadece "doğrulamak" için düzenledikten sonra tekrar okuma (Edit zaten hata verirdi).

## Canlıya çıkmadan önce (release checklist)
> Kullanıcı dedi: "unutma live'a çıkarken kaldırıcaz bunları."
- [x] RevenueCat `setLogLevel(DEBUG)` → `import.meta.env.DEV` koşuluna alındı (2026-07-08)
- [x] TEST amaçlı error toast'ları kaldırıldı — paywall artık `getErrorMessage` ile kullanıcı-dostu mesaj gösteriyor
- [x] Profile'daki test butonları (🔧 🔥 ⏱ 👁) kaldırıldı
- [x] `appTestDayOffset` — prod build offset'i yok sayar (`testDate.js` DEV gate) + `main.jsx` açılışta localStorage kalıntısını siler
- [x] `AppLayout` / `Profile` içindeki `debugShowPaywall` kaldırıldı
- [x] App Store Connect'te `offer.499` / `offer.399` doğrulandı — ikisi de APPROVED (₺499,99 / ₺399,99)
- [ ] Gerçek satın alma testi: Android Internal Testing + iOS TestFlight

## Effort / Ultracode notu
- `high/xhigh` = düşünme derinliği (hız değil). Kritik iş → yüksek.
- `ultracode` (multi-agent workflow) pahalıdır; sadece kullanıcı açıkça isterse çalıştır.
