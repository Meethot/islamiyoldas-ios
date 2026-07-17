# Doğum Günü Ayeti Kartı — Tasarım

**Tarih:** 2026-07-17
**Durum:** Onaylandı (kullanıcı, sohbet içinde)

## Amaç

"Doğum günün hangi ayete denk geliyor?" tarzı popüler paylaşım içeriği. Kullanıcı
doğum tarihini (gün/ay) verince gün:ay → surah:ayet eşleşmesiyle o ayeti gösteren,
**dua/zikir/şifa ayeti İÇERMEYEN** özel bir kart. AiMentor içinde. Deterministik
(herkeste aynı sonuç — paylaşım için şart) ve paylaşım butonlu (viral amaç).

## Kapsam (kullanıcı onaylı)

1. Deterministik gün:ay → surah:ayet eşleştirme (client-side, AI'a bağlı değil).
2. Sadece ayet gösteren kart (Arapça + meal + ses + paylaş) — dua/zikir/şifa YOK.
3. Giriş 1: hoş geldin ekranında chip → inline tarih seçici (AI'sIZ, kotasız).
4. Giriş 2: serbest yazı → backend tarihi ayıklar (kotasız).
5. Paylaş butonu (Capacitor Share, metin + mağaza linki — `DuaKosesi` kalıbı).

## Eşleştirme kuralı (kritik)

`src/lib/birthdayVerse.js` (yeni):

- `AYAH_COUNTS` — 114 surenin Hafs ayet sayıları (index 1..114).
- `birthdayToVerseRef(day, month)`:
  - **surah = day** (1–31), **verse = month** (1–12). Örn 14/02 → `{surah:14, verse:2}`.
  - Kenar durum: `verse > AYAH_COUNTS[surah]` yalnızca **day=1 & month∈{8..12}** için
    olur (surah 1 = Fatiha, 7 ayet). Bu durumda **verse = AYAH_COUNTS[surah]** (7'ye
    clamp). Surah her zaman = gün kalır (sezgisel). Etkilenen: 5 tarih (1 Ağu … 1 Ara).
  - Dönüş: `{ surah, verse, day, month, clamped }`.
  - Girdi doğrulama: `day` 1–31, `month` 1–12 tamsayı değilse `null` döner (client düz
    metne düşer). Takvimsel geçerlilik (30 Şubat vb.) burada zorlanmaz — seçici gün
    aralığını aya göre kısıtlar; serbest-yazı yolunda model gerçekçi tarih üretir.

Ayet sayıları tablosu (referans, Hafs):
```
1:7 2:286 3:200 4:176 5:120 6:165 7:206 8:75 9:129 10:109 11:123 12:111 13:43
14:52 15:99 16:128 17:111 18:110 19:98 20:135 21:112 22:78 23:118 24:64 25:77
26:227 27:93 28:88 29:69 30:60 31:34 32:30 33:73 34:54 35:45 36:83 37:182 38:88
39:75 40:85 41:54 42:53 43:89 44:59 45:37 46:35 47:38 48:29 49:18 50:45 51:60
52:49 53:62 54:55 55:78 56:96 57:29 58:22 59:24 60:13 61:14 62:11 63:11 64:18
65:12 66:12 67:30 68:52 69:52 70:44 71:28 72:28 73:20 74:56 75:40 76:31 77:50
78:40 79:46 80:42 81:29 82:19 83:36 84:25 85:22 86:17 87:19 88:26 89:30 90:20
91:15 92:21 93:11 94:8 95:8 96:19 97:5 98:8 99:8 100:11 101:11 102:8 103:3
104:9 105:5 106:4 107:7 108:3 109:6 110:3 111:5 112:4 113:5 114:6
```

## Kart bileşeni

`src/components/BirthdayVerseCard.jsx` (yeni). Props: `{ day, month }`.

- İçeride `birthdayToVerseRef(day, month)` → `quranRef`.
- `getVerifiedVerse(quranRef, i18n.language)` ile ayet (Arapça + meal + `source`).
- Ses: `AiPrescriptionCard`'daki `fetchVerseAudio(surah, verse)` +
  `toggleAudio` kalıbıyla aynı (alquran.cloud `ar.alafasy`). Kod tekrarını azaltmak
  için ses mantığı kart içinde tekrarlanabilir (mevcut kart da öyle yapıyor —
  proje kalıbına uyum); ortak hook ZORUNLU değil.
- Render:
  - 🎂 Başlık: `t('birthdayCard.heading', { date })` — `date` =
    `new Date(2000, month-1, day).toLocaleDateString(i18n.language, { day:'numeric', month:'long' })`
    (ay isimleri Intl'den; locale key gerekmez).
  - Kaynak satırı: `verseData.source` (sure adı + ayet no).
  - Arapça (rtl, `font-arabic`), meal (italik).
  - Dinle/Duraklat butonu — mevcut `t('prescription.listen')` / `t('prescription.pause')`
    yeniden kullanılır (yeni key yok).
  - **Paylaş** butonu → `DuaKosesi.handleShare` kalıbı: `Share.share({ text, dialogTitle })`,
    platforma göre mağaza linki (iOS `apps.apple.com/app/id6759666173`, Android
    `play.google.com/...id=com.islamiyoldas.app`, diğer `islamiyoldas.com`). Metin:
    `t('birthdayCard.shareText', { date, source, translation })`.
- **Dua/zikir/şifa ayeti bölümü YOK.** Tek ayet.
- Stil: reçete kartından görsel olarak ayrışır (doğum günü teması) ama app diliyle
  tutarlı; reçete gibi **bubble kutusuz** (çıplak) render edilir.

## Giriş 1 — chip + inline tarih seçici (AiMentor.jsx)

- Hoş geldin ekranı (`messages.length === 1`) 4 hazır sorunun altına ayrı, farklı
  stilde bir chip: `t('aiMentor.birthdayChip')` (🎂 Doğum ayetini keşfet).
- Tıklanınca `showBirthdayPicker` state `true` → inline panel:
  - Gün select (1..N — N = seçili ayın gün sayısı; Şubat 29, 30-günlük aylar 30,
    diğerleri 31), Ay select (1..12, isimler Intl `toLocaleDateString`/`month:'long'`).
  - "Ayetini Göster" butonu (`t('aiMentor.birthdayShow')`).
- Submit: kullanıcı balonu (`🎂 <tarih>`) + `{ role:'assistant', isBirthday:true, birthday:{day,month} }`
  mesajı push edilir; `showBirthdayPicker=false`. **Backend'e istek yok, kota artmaz.**
- Chip yalnızca hoş geldin ekranında görünür (kabul edilen: sohbet başlayınca
  serbest-yazı yolu kalır).

## Giriş 2 — serbest yazı algılama (backend)

`functions/index.js` → `SHARED_RULES` içine 4. tip:

```
4. type "birthday_verse" — the user asks which Quran verse matches their
   birthday / birth date (e.g. "doğum günüm 14 şubat hangi ayet", "which verse
   is my birthday 02/14"). Extract ONLY the day and month as integers:
   { "type": "birthday_verse", "day": 14, "month": 2 }
   Do NOT include a verse — the app computes it. If you cannot clearly identify
   a day and month, do NOT use this type; answer as "text" or "prescription".
```

- Client: `type === 'birthday_verse'` gelince AI'ın olası verse'ini yok sayar,
  `day`/`month` ile `birthdayToVerseRef` çağırır, `isBirthday` mesajı çizer.
  `day`/`month` geçersizse (null) `text` fallback.
- **Kotadan düşmez** (widget gibi `quotaExempt`). Gönderim öncesi remaining kontrolü
  aynen kalır (kota 0'da yine gönderilemez — kabul edilen davranış).

## AiMentor.jsx — entegrasyon özeti

- Import: `BirthdayVerseCard`, `birthdayToVerseRef` (validasyon için).
- State: `showBirthdayPicker`, `birthdayDay`, `birthdayMonth`.
- Mesaj render: `msg.isBirthday` → `<BirthdayVerseCard day={} month={} />` (çıplak,
  reçete gibi bubble kutusuz); prescription/guide/text yolları aynen.
- `sendMessage` try-bloğu: `type==='birthday_verse'` dalı — quotaExempt, `isBirthday`
  mesajı. (Mevcut prescription/guide/text mantığı korunur.)
- `summarizeForHistory`: `isBirthday` → sabit kısa metin ("Doğum günü ayeti gösterildi").
- Yerel chip submit fonksiyonu: `openBirthdayVerse(day, month)` — validasyon + mesaj push.

## Locale — misc.json 6 dil parite

Yeni key'ler:
- `aiMentor.birthdayChip` — "🎂 Doğum ayetini keşfet"
- `aiMentor.birthdayPickerTitle` — "Doğduğun günü seç"
- `aiMentor.birthdayDay` — "Gün"
- `aiMentor.birthdayMonth` — "Ay"
- `aiMentor.birthdayShow` — "Ayetini Göster"
- `birthdayCard.heading` — "🎂 {{date}} doğanların ayeti" (yeni namespace `birthdayCard`)
- `birthdayCard.shareText` — paylaşım metni, `{{date}}`, `{{source}}`, `{{translation}}`
  placeholder'ları (birebir korunur, tüm dillerde aynı placeholder).

Ay isimleri ve tarih Intl'den (locale key yok). Format: `ensure_ascii=False`,
4 boşluk indent, **dosya sonunda trailing newline YOK**.

## Hata Yönetimi

- `birthdayToVerseRef` null → `text` fallback (serbest yazı) / picker submit iptal.
- `getVerifiedVerse` ağ hatası → mevcut fallback ayet (İnşirah 94:5) döner (kart yine
  çizilir, bozulmaz).
- Ses yüklenemezse dinle butonu no-op (mevcut kart davranışı).
- Paylaşım iptal/hata → sessiz (DuaKosesi kalıbı: AbortError yut).

## Analytics

- Doğum ayeti gösterimi: `analytics.aiResponseReceived('birthday_verse', premium, responseTime)`
  serbest-yazı yolunda (mevcut çağrı tipi genişler). Chip yolu istek yapmadığından
  ayrı bir event gerekmez (isteğe bağlı: ileride `birthday_verse_shown` eklenebilir —
  YAGNI, şimdilik yok).

## Test / Doğrulama

- `npm run build` — client derlemesi.
- `node --check functions/index.js` — backend.
- Birim mantığı (elle/konsol): `birthdayToVerseRef(14,2)` → 14:2;
  `birthdayToVerseRef(1,12)` → 1:7 (clamped); `birthdayToVerseRef(31,1)` → 31:1;
  `birthdayToVerseRef(29,2)` → 29:2; geçersiz `(0,5)`/`(32,1)`/`(15,13)` → null.
- Locale parite scripti (aiMentor + birthdayCard key'leri 6 dilde eşit, trailing
  newline yok).
- Cihaz el testi:
  1. Chip → 12 Mart seç → 12:3 ayeti kartı, kota DÜŞMEDİ, ses çalıyor, paylaş açılıyor.
  2. "doğum günüm 14 şubat hangi ayet" yaz → 14:2 kartı, kota DÜŞMEDİ (backend deploy sonrası).
  3. 1 Aralık seç → Fatiha 1:7 (clamp) kartı.
  4. Kartda dua/zikir/şifa YOK — sadece ayet.

## Deploy Notu

Serbest-yazı algılaması `firebase deploy --only functions` gerektirir. Chip yolu
deploy'suz çalışır (saf client). Client: `npm run build` + `npx cap sync`.
