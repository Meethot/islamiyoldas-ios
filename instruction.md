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
- **Araçları proaktif kullan (sorma, yap):** Bir görev için işe yarayacak bir skill veya MCP varsa, kullanıcı söylemeden kendin seç ve çalıştır. Örnekler:
  - Kod tabanını/mimariyi anlamak, dosya ilişkilerini haritalamak → **graphify** (`/graphify .`).
  - Yerel web app'i (React/Vite) test etmek, UI doğrulamak, ekran görüntüsü almak → **webapp-testing** / **playwright** MCP.
  - Kod sembolü arama/düzenleme → **Serena** MCP (kodlamadan önce `initial_instructions`).
  - Güncel kütüphane dokümanı → **context7** MCP.
  - Ödeme/ürün/offering işleri → **RevenueCat** MCP. Analitik → **Amplitude** MCP (önce `get_amplitude_context`).
  - MCP server yazmak → **mcp-builder**, yeni skill → **skill-creator**, changelog → **changelog-generator**.
  - Uygun araç yoksa normal ilerle. Kritik/geri-alınamaz aksiyonlarda (para, native, dış servise gönderim) yine de önce doğrula.

## İş bitince: kendi kendine denetim (SORMA, YAP)
> Kullanıcı dedi: "sen her seferinde işin tamamen bittikten sonra aynı bu şekilde kontrol et,
> ben bir şey demeden." Sebep: **canlıda 1000+ aktif kullanıcı var**, sessiz regresyonun
> maliyeti yüksek. "Bitti" demeden ÖNCE aşağıdakilerin hepsini çalıştır.

1. **`npm run build`** — geçmeden hiçbir şey bitmiş sayılmaz.
2. **Backend'e dokunduysan** `node --check functions/index.js` + modülü yükleyip
   export'ları listele (deploy etmeden hataları yakalar).
3. **Lint'i SADECE dokunduğun dosyalarda** koştur, hata sayısını raporla. Repoda zaten
   çok uyarı var; "benim değişikliğim 0 hata" ile "repoda 47 hata" ayrımını açıkça yaz.
4. **Locale değiştiyse** 6 dil paritesi + format (4 boşluk, `ensure_ascii=False`,
   dosya sonunda yeni satır YOK) doğrula.
5. **Ölü referans taraması** — sildiğin helper/import/state adını `grep`'le, kalıntı arama.
6. **Önemsiz olmayan mantığı birim testiyle doğrula.** Fonksiyonun izole kopyasını
   scratchpad'e yaz, uç durumlarla (NaN, boş, çevrimdışı, bozuk veri) sına. Repoya ekleme.
7. **Diff'i hunk hunk oku.** Aranan şey: sessiz davranış değişikliği. Örnek yakalananlar:
   `|| 0` yedeği eski kodun "şimdi" yedeğiyle aynı değildi; `times`/keyframe uzunluğu
   uyuşmuyordu; premium gate özelliği tamamen kapatıyordu.
8. **Koddan çıkarılamayan ortam varsayımlarını CLI ile doğrula** (bölge, sürüm, mağaza
   durumu, offering). Örnek: Firestore `eur3`'te olduğu için tetikleyici `us-central1`'de
   deploy olmuyordu — sadece kodu okuyarak asla görülemezdi.
9. **Doğrulayamadığını açıkça söyle.** "Cihazda test edilmeli", "Firestore kuralları
   görünmüyor" gibi. Sessizce "tamam" deme.
10. Yanlış çıkan önceki iddianı **düzelt ve söyle** (etkisini abartmışsam onu da).

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
> **Kur'an dinleme denemesi (60 sn):** `src/lib/quranTrial.js` kalıcı özelliktir, test bayrağı YOK.
> Kasıtlı: bayrak unutulursa herkes sınırsız dinlerdi. Cihazda tekrar test etmek için uygulamayı
> silip kur ya da `quran_listen_trial_at` anahtarını sil. Deneme SADECE dinlemeyi açar —
> `isPremium()`'a dokunulmaz, kaydetme/paylaşım temaları premium kalır.

- [ ] **`src/lib/hints.js` → `HINT_TEST_MODE = true` → `false` YAP** (ipuçları cihaz testi için her seferinde açılıyor; false olunca her ipucu kullanıcı başına bir kez çıkar. Tek bayrak: hem İbadetlerim sekmeleri hem sure içi ipuçları buradan)
- [ ] `PremiumPaywall.jsx`'teki gizli test-premium jesti (ilk özellik satırına 3 sn basılı tutma → `setPremium(true)`, `window._testPremiumTimer`) — canlıya çıkmadan KALDIR

## Effort / Ultracode notu
- `high/xhigh` = düşünme derinliği (hız değil). Kritik iş → yüksek.
- `ultracode` (multi-agent workflow) pahalıdır; sadece kullanıcı açıkça isterse çalıştır.
