# AiMentor Çok-Modlu Cevap — Tasarım

**Tarih:** 2026-07-10
**Durum:** Onaylandı (kullanıcı, sohbet içinde)

## Amaç

AiMentor şu an her soruya zorunlu "Manevi Reçete" (zikir + ayet) döndürüyor; uygulama
kullanım sorularını ("ana ekrana widget nasıl eklerim?") ya reddediyor ya alakasız
reçete üretiyor. Hedef: tek Gemini çağrısıyla intent'e göre üç cevap tipi — manevi
reçete (+ opsiyonel dua), uygulama rehberi (+ deep link), düz bilgi metni — ve
konuşma hafızası.

## Kapsam (kullanıcı onaylı)

1. Uygulama rehberi + deep link (widget kurulumu, bildirimler, ayarlar, özellikler)
2. Pratik ibadet bilgisi (fetvasız how-to; mezhep farkı varsa not düşülür)
3. Durum bazlı dua önerisi (reçete kartına opsiyonel bölüm)
4. Konuşma hafızası (son mesajlar backend'e gider, takip soruları çalışır)

**Kota kararı:** SADECE widget kurulum sorusu kotadan düşmez
(`type === 'guide' && topic === 'widgets'`). Diğer her cevap (rehberin geri kalanı
dahil) mevcut günlük kotadan düşer (free 1 / premium 30).

## Mimari: Tek çok-modlu prompt

Tek Gemini çağrısı; model intent'i kendisi sınıflandırıp cevap JSON'una `type`
alanı ekler. Ayrı intent-router çağrısı veya function calling YOK (yavaş/pahalı/
gereksiz). App yayında değil — eski client uyumluluğu gerekmez, format serbestçe
değişir.

## Backend — `functions/index.js`

### Cevap şeması

Ortak alan: `type` (`"prescription" | "guide" | "text"`). Model seçer.

**`prescription`** — dert/manevi sıkıntı (mevcut davranış + dua):
```json
{
  "type": "prescription",
  "advice": "2-3 cümle şefkatli metin",
  "recommendedZikr": { "name": "...", "meaning": "...", "count": 308 },
  "quranRef": { "surah": 65, "verse": 3, "reason": "..." },
  "dua": { "arabic": "...", "transliteration": "...", "meaning": "..." }
}
```
`dua` opsiyonel — model duruma uygun kısa bir dua biliyorsa ekler (sıkıntı,
yolculuk, sınav vb.). Mevcut zikir/ayet eşleştirme tabloları aynen korunur.

**`guide`** — uygulama kullanım sorusu:
```json
{
  "type": "guide",
  "text": "Adım adım anlatım (platforma göre iOS/Android ayrımı yapabilir)",
  "topic": "widgets",
  "action": { "route": "/widget-rehberi", "label": "Widget Rehberini Aç" }
}
```
- `topic` sabit küme: `widgets | notifications | location | language | prayer |
  qibla | dhikr | quran | premium | tuba | fasting | other`. Kota muafiyeti
  sadece `widgets` için.
- `action` opsiyonel; `route` prompt'taki whitelist'ten seçilir, `label` cevap
  dilinde kısa buton metni.

**`text`** — ibadet bilgisi, genel İslami soru, nazik ret:
```json
{ "type": "text", "text": "..." }
```
- Fetva yasağı (haram/helal hükmü yok) aynen korunur.
- İbadet pratiği mezhebe göre değişiyorsa (rekat, abdest detayı) cevaba kısa
  "mezheplere göre farklılık gösterebilir" notu eklenir.
- Konu dışı (siyaset, spor, borsa...) sorularda mevcut nazik ret bu tiple döner.

### Route whitelist (prompt'ta sabit; App.jsx'ten doğrulandı)

`/` `/dhikr` `/quran` `/qibla` `/dua` `/tefekkur` `/uyku` `/oruc-takibi`
`/tracking` `/learn` `/stories` `/profile` `/premium` `/widget-rehberi`
`/settings/notifications` `/settings/location` `/settings/language`

Model whitelist dışı route üretemez (prompt kuralı); client ayrıca filtreler
(çifte koruma).

### APP_GUIDE bilgi tabanı

Tek İngilizce blok, 6 dil system prompt'unun hepsine eklenir (mevcut "cevabı X
dilinde yaz" kuralı çeviriyi halleder; 6 kopya bakım yükü olmaz). İçerik:

- **Widget kurulumu** — iOS: ana ekranda boş alana uzun bas → sol üst "+" →
  "İslami Yoldaş" ara → boyut seç → Ekle. Android: ana ekranda boş alana uzun
  bas → "Widget'lar" → İslami Yoldaş → sürükle-bırak. Uygulama içi
  `/widget-rehberi` sayfası da var — action olarak öner.
- **Widget listesi** — Namaz Vakitleri, Günün Ayeti, Saatlik Ayet, Günün
  Motivasyonu, Günün Esması, Saatlik Esma, Zikir; iOS'ta bazıları premium.
- **Bildirimler** — ezan vakti + ön hatırlatma ayarları `/settings/notifications`.
- **Konum** — GPS veya manuel şehir seçimi `/settings/location`; vakitler
  ilçe bazlı.
- **Dil** — 6 dil, `/settings/language`.
- **Diğer özellikler** — kıble pusulası + yakın cami araması (`/qibla`),
  zikirmatik (`/dhikr`), Kuran okuma + sesli dinleme (`/quran`), dua köşesi
  (`/dua`), oruç takibi (`/oruc-takibi`), Tuba ağacı serisi (ana ekran),
  uyku modu (`/uyku`), tefekkür (`/tefekkur`), premium abonelik (`/premium`).

Kesin metin implementation'da yazılır; yanlış bilgi vermemesi için her madde
koddaki gerçek davranışla karşılaştırılır.

### Konuşma hafızası

- Request body: `data.history = [{ role: "user"|"assistant", text: "..." }]`
  — en fazla 6 kayıt, her `text` en fazla 2000 karakter. Server doğrular:
  fazlası kırpılır, bozuk kayıt atlanır (hata değil).
- Gemini `contents` dizisine sırayla `user` / `model` turn olarak eklenir;
  reçete cevapları history'de kısa özet metin olarak temsil edilir (client
  üretir: ör. "Tavsiye: <advice> — Zikir: <name>"), ham JSON gönderilmez.
- System prompt mevcut `SYSTEM: ...` birleştirme yerine ayrı ilk turn olarak
  kalabilir — implementation detayı, davranış aynı.

### Değişmeyenler

Rate limit (10/dk/IP), model fallback zinciri, secret yönetimi, 2000 karakter
mesaj sınırı, JSON temizleme (markdown fence sıyırma) aynen kalır.

## Client

### `src/services/AiMentorService.js`
- `getSpiritualAdvice(message, language, history)` — history parametresi
  eklenir, body'ye `data.history` olarak girer.

### `src/pages/AiMentor.jsx`
- **History gönderimi:** son mesajlardan history dizisi kurulur (max 6;
  reçete mesajları özet metne çevrilir). localStorage saklama limiti 3 → 6
  mesaja çıkar (takip sorusu bağlamı yeniden açılışta da yaşasın).
- **Koşullu kota:** cevap geldikten sonra `type === 'guide' &&
  topic === 'widgets'` ise `incrementUsed()` ÇAĞRILMAZ; diğer tüm başarılı
  cevaplar kotadan düşer. Kota kontrolü gönderim ÖNCESİ mevcut haliyle kalır
  (remaining 0 iken widget sorusu da gönderilemez — kabul edilen basitleştirme;
  aksi halde free kullanıcı kota bittikten sonra sınırsız istek atabilirdi).
- **Render:** `msg.data.type`'a göre — `prescription` → `AiPrescriptionCard`;
  `guide`/`text` → normal bubble (`whitespace-pre-wrap` metin) + `action`
  varsa altına buton (`navigate(action.route)`, route client whitelist'inde
  değilse buton çizilmez).
- **Hata toleransı:** `type` eksik/bilinmiyorsa: `advice` alanı varsa
  prescription gibi, yoksa `text`/`advice` fallback düz metin. Çökme yok.
- **Welcome + hızlı sorular:** welcome metni yeni yetenekleri tanıtır.
  Hızlı sorular 3 → **4 olur** (`suggestion1..4`, render döngüsü `[1,2,3,4]`):
  1. "İçim daralıyor, hangi zikir ve duayı çekeyim?" (mevcut — reçete örneği)
  2. "Ailem huzurlu olsun istiyorum, ne yapmalıyım?" (mevcut — reçete örneği)
  3. "Ana ekrana widget nasıl eklerim?" (YENİ — rehber örneği, kotasız)
  4. "Uyumadan önce hangi dualar okunur?" (YENİ — dua/ibadet bilgisi örneği;
     cevap uyku moduna `/uyku` deep link verebilir)

  Mevcut suggestion3 ("Rızık ve bereket için hangi duaları okumalıyım?")
  KALDIRILIR — suggestion1 ile aynı "hangi dua/zikir" kalıbı, yerini yeni
  yetenek vitrinine bırakır. 4 metin de 6 dilde parite.

### `src/components/AiPrescriptionCard.jsx`
- Opsiyonel **dua bölümü**: `data.dua` varsa zikir ve ayet bölümlerinin
  arasında/altında kart — Arapça (rtl), okunuş (italik), meal. Alan yoksa
  bölüm hiç render edilmez.

### Locale — `public/locales/{lang}/misc.json`
Yeni/güncellenen `aiMentor.*` ve `prescription.*` key'leri, **6 dilde parite**:
- `aiMentor.welcomeMessage` (güncellenir — yeni yetenekleri sayar)
- `aiMentor.suggestion3` (yeni metin: widget sorusu), `aiMentor.suggestion4`
  (YENİ key: uyku duaları sorusu)
- `prescription.duaLabel` (dua bölümü başlığı)
- Buton metni (`action.label`) MODEL'den gelir — locale key gerekmez.

Format kuralları: `ensure_ascii=False`, 4 boşluk indent, dosya sonunda
trailing newline YOK.

### Analytics
- `aiResponseReceived`'a cevap tipi parametresi eklenir (mevcut imza
  `analyticsService`'te genişletilir; Amplitude event property).

## Hata Yönetimi

- Backend JSON parse hatası / boş cevap: mevcut hata akışı aynen (client
  `connectionError` balonu).
- Model whitelist dışı route döndürürse: client butonu çizmez, metin yine
  gösterilir.
- History bozuksa server sessizce atlar; cevap yine üretilir.

## Test / Doğrulama

- `npm run build` — client derlemesi.
- Cihaz/emülatör el testi senaryoları:
  1. "Ana ekrana widget nasıl eklerim?" → guide cevabı + Widget Rehberi
     butonu + kota DÜŞMEDİ.
  2. "Bildirim sesi nasıl değişir?" → guide cevabı + kota düştü.
  3. Manevi dert mesajı → reçete kartı (+ dua bölümü varsa) + kota düştü.
  4. Takip sorusu ("peki onu nasıl açarım?") → history bağlamıyla tutarlı cevap.
  5. Konu dışı soru (futbol) → nazik ret, `text` tipi.
- Backend: `firebase deploy --only functions` sonrası curl ile 3 tip için
  örnek istek.

## Deploy Notu

`functions/index.js` değişikliği yayına `firebase deploy --only functions`
ile çıkar (GEMINI_API_KEY secret'ı zaten tanımlı). Client tarafı normal
build/sync akışı: `npm run build` + `npx cap sync`.
