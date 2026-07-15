# AiMentor Çok-Modlu Cevap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AiMentor tek Gemini çağrısıyla üç cevap tipi üretir (manevi reçete + opsiyonel dua, uygulama rehberi + deep link, düz bilgi metni) ve konuşma hafızası kazanır.

**Architecture:** Backend'de (Firebase Cloud Function) mevcut 6 dil-spesifik system prompt'a ortak İngilizce `SHARED_RULES` bloğu eklenir — cevap tipi kuralları, route whitelist ve APP_GUIDE bilgi tabanı. Model intent'i kendisi sınıflandırıp JSON'a `type` alanı koyar. Client cevabı `type`'a göre render eder; `guide`+`topic:"widgets"` cevapları günlük kotadan düşmez. Son 6 mesaj history olarak backend'e gider.

**Tech Stack:** Firebase Functions v2 (Node, CommonJS), Gemini generateContent API (v1beta), React 19 + Vite 7, i18next (6 dil), localStorage kota/geçmiş.

**Spec:** `docs/superpowers/specs/2026-07-10-aimentor-multimode-design.md`

## Global Constraints

- **Test framework YOK** (package.json scripts: dev/build/lint/preview). Doğrulama: `node --check` (backend), `npm run build` (client), cihaz el testi (kullanıcı).
- **Commit YAPMA** — proje kuralı: kullanıcı istemeden commit/push yok. Tüm task'lar working tree'de kalır; en sonda kullanıcıya haber ver.
- Locale JSON formatı: `ensure_ascii=False`, 4 boşluk indent, **dosya sonunda trailing newline YOK** (dosya `}` ile biter). Düzenlemeleri Task 5'teki python scriptiyle yap — elle Edit ile JSON bozma riski alma.
- Yeni her locale key'i **6 dilde parite**: `tr, en, ar, az, de, ru`.
- i18next `{{...}}` placeholder'larına dokunma.
- Backend deploy (`firebase deploy --only functions`) plana dahil DEĞİL — kullanıcı yapar; sonda hatırlat.
- App yayında değil — eski client/backend uyumluluğu gerekmez.

---

### Task 1: Backend — çok-modlu prompt + history (`functions/index.js`)

**Files:**
- Modify: `functions/index.js` (SYSTEM_PROMPTS kapanışı ~satır 421, handler ~satır 424-489, `callGeminiWithFallback` ~satır 491-553)

**Interfaces:**
- Consumes: mevcut `SYSTEM_PROMPTS`, `FALLBACK_MODELS`, rate limit — hiçbiri değişmez.
- Produces: request body `data.history: [{role: "user"|"assistant", text: string}]` kabul eder (opsiyonel, max 6, her text max 2000 karakter). Cevap JSON'unda `type: "prescription"|"guide"|"text"` alanı (model üretir; şema aşağıda). Client Task 2-3 bunlara dayanır.

- [ ] **Step 1: `SHARED_RULES` + `sanitizeHistory` ekle**

`SYSTEM_PROMPTS` objesinin kapanışından (`};` — az prompt'unun bitişi, ~satır 421) hemen sonra ekle:

```js
// Shared multi-mode rules + app knowledge base, appended to every language prompt.
// English on purpose: single copy to maintain; each language prompt already
// forces the response language.
const SHARED_RULES = `
---
RESPONSE TYPE SYSTEM (overrides and extends the rules above):

Every response MUST be a single valid JSON object with a "type" field.
The "always create a Spiritual Prescription" rule above applies ONLY when you
choose type "prescription". Choose the type by the user's intent:

1. type "prescription" — the user shares a personal or spiritual problem,
   emotion, or asks for a dhikr/dua for their own situation.
   Use EXACTLY the prescription JSON format described above (advice +
   recommendedZikr + quranRef, following the dhikr and verse mapping tables),
   PLUS add "type": "prescription".
   OPTIONAL: when a short well-known authentic supplication fits the
   situation, also add:
   "dua": { "arabic": "...", "transliteration": "...", "meaning": "..." }
   (transliteration in Latin letters; meaning in the response language.
   Omit the whole "dua" field if none fits — do not invent supplications.)

2. type "guide" — the user asks how to use THIS app: widgets, notifications,
   settings, screens, features, premium.
   Format:
   { "type": "guide", "text": "clear step-by-step answer", "topic": "...",
     "action": { "route": "...", "label": "short button label in the response language" } }
   "topic" MUST be exactly one of: widgets, notifications, location, language,
   prayer, qibla, dhikr, quran, premium, tuba, fasting, other.
   "action" is optional — include it when one screen from ROUTES below clearly
   helps; "route" MUST be copied character-for-character from ROUTES.
   Base app facts ONLY on the APP GUIDE below. If the question is about the
   app but not covered there, say you are not sure and point to the closest
   relevant screen — NEVER invent features, settings, or steps.

3. type "text" — practical worship knowledge (how to perform a prayer, wudu,
   fasting basics, meanings of names/verses), general Islamic questions, or
   the polite refusal of off-topic subjects required by the rules above.
   Format: { "type": "text", "text": "..." }
   The no-fatwa rule stays absolute: never rule halal/haram.
   If a practice differs between madhhabs (schools of fiqh), add one short
   sentence noting that it may differ.

Output raw JSON only, no markdown fences. Write every human-readable value
("text", "advice", "label", "meaning", ...) in the response language required
above.

ROUTES (the ONLY valid "action.route" values):
/ (home), /dhikr (dhikr counter), /quran (Quran reading and audio),
/qibla (qibla compass + nearby mosques), /dua (dua corner),
/tefekkur (contemplation), /uyku (sleep mode: bedtime verses and duas),
/oruc-takibi (fasting tracker), /tracking (worship tracking),
/learn (learning), /stories (stories), /profile (profile),
/premium (premium subscription), /widget-rehberi (visual widget setup guide),
/settings/notifications (adhan and reminder notifications),
/settings/location (GPS or manual city for prayer times),
/settings/language (app language selection)

APP GUIDE (facts about the İslami Yoldaş app — the ONLY source for
type "guide" answers):
- Home screen widgets on iOS (iOS 14+): long-press an empty spot on the home
  screen → tap the "+" button in the top-left corner → search "İslami Yoldaş"
  → swipe to choose a size → tap "Add Widget" → tap "Done".
- Lock screen widgets on iOS (iOS 16+): long-press the lock screen → tap
  "Customize" → choose "Lock Screen" → tap the box under the clock → pick an
  İslami Yoldaş widget → tap "Done".
- Home screen widgets on Android: long-press an empty spot on the home screen
  → tap "Widgets" → find "İslami Yoldaş" → touch and hold a widget → drag it
  onto the home screen.
- Available widgets: Prayer Times, Daily Verse, Hourly Verse, Daily
  Motivation, Daily Esma (Names of Allah), Hourly Esma, Dhikr counter.
  Widgets refresh automatically; hourly widgets change content every hour.
- Widget access: free users can try widgets actively for 1 hour; Premium
  keeps all widgets active permanently.
- The app has a visual step-by-step widget guide at /widget-rehberi —
  recommend it as the action for widget questions.
- Prayer times are district-based; location comes from GPS or a manually
  chosen city (/settings/location). Adhan-time notifications and
  pre-reminders are configured at /settings/notifications.
- Qibla screen: compass with calibration hints and a "Nearby Mosques" button
  that opens the device's map app (/qibla).
- Other features: Quran reading with translations and audio recitation
  (/quran), dhikr counter with target counts (/dhikr), dua corner (/dua),
  fasting tracker (/oruc-takibi), sleep mode with bedtime verses and duas
  (/uyku), contemplation mode (/tefekkur), and the Tuba tree on the home
  screen that grows with the user's daily worship streak.
- Premium subscription: permanent widgets, 30 AI questions per day (free
  users get 1 per day), and more (/premium).
- App language: 6 languages (Turkish, English, Arabic, Azerbaijani, German,
  Russian), changeable at /settings/language.
`;

// Validate and trim client-sent conversation history. Bad entries are
// silently dropped — history must never fail a request.
function sanitizeHistory(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter(h => h && (h.role === "user" || h.role === "assistant")
            && typeof h.text === "string" && h.text.trim().length > 0)
        .slice(-6)
        .map(h => ({ role: h.role, text: h.text.slice(0, 2000) }));
}
```

- [ ] **Step 2: Handler'da SHARED_RULES + history kullan**

`exports.generateSpiritualAdvice` içinde şu iki satırı:

```js
            // Get language-specific system prompt
            const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;

            // Call Gemini API with model fallback
            const result = await callGeminiWithFallback(apiKey, systemPrompt, userMessage, language);
```

şununla değiştir:

```js
            // Get language-specific system prompt + shared multi-mode rules
            const systemPrompt = (SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en) + SHARED_RULES;
            const history = sanitizeHistory(req.body.data?.history || req.body.history);

            // Call Gemini API with model fallback
            const result = await callGeminiWithFallback(apiKey, systemPrompt, userMessage, language, history);
```

- [ ] **Step 3: `callGeminiWithFallback` — systemInstruction + history turns**

İmzayı değiştir:

```js
async function callGeminiWithFallback(apiKey, systemPrompt, userMessage, language, history = [], modelIndex = 0, retryCount = 0) {
```

Fonksiyon içindeki İKİ recursive çağrıyı güncelle (429 retry ve 404 fallback):

```js
        return callGeminiWithFallback(apiKey, systemPrompt, userMessage, language, history, modelIndex, retryCount + 1);
```

```js
        return callGeminiWithFallback(apiKey, systemPrompt, userMessage, language, history, modelIndex + 1, 0);
```

Fetch body'sindeki mevcut `contents` bloğunu:

```js
            contents: [{
                parts: [{ text: `SYSTEM: ${systemPrompt}\n\nUSER: ${userMessage}` }]
            }],
```

şununla değiştir (systemInstruction v1beta'da tüm fallback modellerce desteklenir):

```js
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [
                ...history.map(h => ({
                    role: h.role === "assistant" ? "model" : "user",
                    parts: [{ text: h.text }]
                })),
                { role: "user", parts: [{ text: userMessage }] }
            ],
```

`generationConfig` (temperature 0.85, responseMimeType) aynen kalır.

- [ ] **Step 4: Syntax doğrula**

Run: `node --check functions/index.js`
Expected: çıktısız exit 0.

---

### Task 2: Servis — history parametresi (`AiMentorService.js`)

**Files:**
- Modify: `src/services/AiMentorService.js`

**Interfaces:**
- Consumes: Task 1'in `data.history` kabulü.
- Produces: `getSpiritualAdvice(userMessage, language = 'tr', history = [])` — Task 3 bu imzayla çağırır. Dönüş: parse edilmiş cevap objesi (`type` alanlı).

- [ ] **Step 1: İmza + body güncelle**

```js
export async function getSpiritualAdvice(userMessage, language = 'tr', history = []) {
```

Fetch body'sini güncelle:

```js
      body: JSON.stringify({
        data: {
          message: userMessage,
          language: language,
          history: Array.isArray(history) ? history.slice(-6) : []
        }
      })
```

JSDoc `@param {Array} history - Son mesajlar [{role, text}] (opsiyonel).` satırı eklenir. Başka değişiklik yok.

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: hatasız biter.

---

### Task 3: UI — history, koşullu kota, çok-modlu render, 4 öneri (`AiMentor.jsx`)

**Files:**
- Modify: `src/pages/AiMentor.jsx`

**Interfaces:**
- Consumes: Task 2 `getSpiritualAdvice(message, language, history)`; cevap objesi `{type, text?, topic?, action?, advice?, recommendedZikr?, quranRef?, dua?}`.
- Produces: assistant mesaj objesi — prescription: `{role:'assistant', text:null, data, isPrescription:true}` (AiPrescriptionCard Task 4'te `data.dua`'yı da alır); guide/text: `{role:'assistant', text, action|null, isPrescription:false}`.

- [ ] **Step 1: Import + route whitelist + history helper**

`ArrowRight`'ı lucide import'una ekle:

```js
import { Send, User, Bot, Sparkles, ChevronLeft, Crown, MessageCircle, ArrowRight } from 'lucide-react';
```

`DAILY_LIMIT_*` sabitlerinin yanına ekle:

```js
// Deep-link routes the AI may target — must mirror the backend prompt's ROUTES list.
const ROUTE_WHITELIST = new Set([
    '/', '/dhikr', '/quran', '/qibla', '/dua', '/tefekkur', '/uyku',
    '/oruc-takibi', '/tracking', '/learn', '/stories', '/profile', '/premium',
    '/widget-rehberi', '/settings/notifications', '/settings/location',
    '/settings/language'
]);

// Flatten a chat message into plain text for backend history.
function summarizeForHistory(msg) {
    if (msg.role === 'user') return msg.text || '';
    if (msg.isPrescription && msg.data) {
        const parts = [];
        if (msg.data.advice) parts.push(msg.data.advice);
        if (msg.data.recommendedZikr?.name) parts.push(`Zikir: ${msg.data.recommendedZikr.name}`);
        if (msg.data.quranRef?.surah) parts.push(`Ayet: ${msg.data.quranRef.surah}:${msg.data.quranRef.verse}`);
        return parts.join(' — ');
    }
    return msg.text || '';
}
```

- [ ] **Step 2: localStorage geçmiş limiti 3 → 6**

Persist effect'inde (`// Persist last 3 messages (excluding welcome)`):

```js
    // Persist last 6 messages (excluding welcome) — enough context for follow-ups
    useEffect(() => {
        const toSave = messages.filter(m => m.id !== 'welcome').slice(-6);
        if (toSave.length > 0) {
            try { localStorage.setItem('ai_mentor_history', JSON.stringify(toSave)); }
            catch { /* quota exceeded */ }
        }
    }, [messages]);
```

- [ ] **Step 3: sendMessage — history gönder, cevabı tipe göre işle, koşullu kota**

`sendMessage` içindeki `try` bloğunu şununla değiştir (öncesindeki kota kontrolü,
`light()`, `userMsg` ekleme, `analytics.aiQuestionAsked`, `requestStart` aynen kalır):

```js
        try {
            // Build history from messages BEFORE this send (welcome excluded).
            // userMsg is already appended to state above, so take from `messages`.
            const history = messages
                .filter(m => m.id !== 'welcome')
                .slice(-6)
                .map(m => ({ role: m.role, text: summarizeForHistory(m) }))
                .filter(h => h.text);

            const adviceData = await getSpiritualAdvice(userMsg.text, i18n.language, history);

            const type = adviceData?.type
                || (adviceData?.advice ? 'prescription' : 'text');
            const isPrescription = type === 'prescription' && !!adviceData?.advice;

            const responseTime = Math.round(performance.now() - requestStart);
            analytics.aiResponseReceived(type, premium, responseTime);

            // Widget how-to answers are quota-exempt (user decision); everything else counts.
            const quotaExempt = type === 'guide' && adviceData?.topic === 'widgets';
            if (!quotaExempt) {
                incrementUsed();
                setUsedCount(prev => prev + 1);
            }

            // Deep-link button only for whitelisted routes (defense in depth vs. model output)
            const action = (!isPrescription
                && adviceData?.action?.route
                && ROUTE_WHITELIST.has(adviceData.action.route)
                && adviceData.action.label)
                ? { route: adviceData.action.route, label: adviceData.action.label }
                : null;

            const aiMsg = isPrescription
                ? { id: Date.now() + 1, role: 'assistant', text: null, data: adviceData, isPrescription: true }
                : { id: Date.now() + 1, role: 'assistant', text: adviceData?.text || adviceData?.advice || t('connectionError'), action, isPrescription: false };
            setMessages(prev => {
                const next = [...prev, aiMsg];
                const aiCount = next.filter(m => m.role === 'assistant' && m.id !== 'welcome').length;
                if (aiCount >= 2) {
                    setTimeout(() => triggerReviewPrompt('ai_chat'), 2000);
                }
                return next;
            });
        } catch (error) {
```

(`catch` ve `finally` blokları aynen kalır.)

- [ ] **Step 4: Bubble render — action butonu**

Mesaj bubble'ındaki mevcut bloğu:

```jsx
                            {msg.isPrescription ? (
                                <AiPrescriptionCard data={msg.data} />
                            ) : (
                                <p className="leading-relaxed text-[15px] whitespace-pre-wrap font-light tracking-wide">{msg.text}</p>
                            )}
```

şununla değiştir:

```jsx
                            {msg.isPrescription ? (
                                <AiPrescriptionCard data={msg.data} />
                            ) : (
                                <>
                                    <p className="leading-relaxed text-[15px] whitespace-pre-wrap font-light tracking-wide">{msg.text}</p>
                                    {msg.action && (
                                        <Button
                                            onClick={() => navigate(msg.action.route)}
                                            className="mt-3 w-full bg-islamic-gold hover:bg-amber-400 text-[#032e18] font-bold rounded-xl h-10 gap-2"
                                        >
                                            {msg.action.label}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </>
                            )}
```

- [ ] **Step 5: Hızlı sorular 3 → 4**

Öneri döngüsünde `[1, 2, 3].map` → `[1, 2, 3, 4].map` (başka değişiklik yok;
`t('aiMentor.suggestion4')` key'i Task 5'te eklenir).

- [ ] **Step 6: Build doğrula**

Run: `npm run build`
Expected: hatasız biter.

---

### Task 4: Reçete kartına dua bölümü (`AiPrescriptionCard.jsx`)

**Files:**
- Modify: `src/components/AiPrescriptionCard.jsx`

**Interfaces:**
- Consumes: `data.dua = { arabic, transliteration, meaning }` (opsiyonel — Task 1 modeli üretir). `t('prescription.duaLabel')` Task 5'te eklenir.
- Produces: görsel bölüm; başka bileşen tüketmez.

- [ ] **Step 1: Dua bölümünü ekle**

Destructuring satırını genişlet:

```js
    const { advice, recommendedZikr, quranRef, dua } = data;
```

Zikir bölümünün kapanışı ile `{/* 3. Şifa Ayeti (Audio Verse) */}` yorumu
arasına ekle:

```jsx
                    {/* 2b. Dua Tavsiyesi (opsiyonel — model uygun görürse) */}
                    {dua?.arabic && (
                        <div className="bg-stone-100 dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/5">
                            <p className="text-[10px] text-islamic-gold/60 uppercase tracking-widest font-bold mb-3">🤲 {t('prescription.duaLabel')}</p>
                            <p className="text-right font-arabic text-xl text-islamic-gold/90 leading-loose mb-2" dir="rtl">
                                {dua.arabic}
                            </p>
                            {dua.transliteration && (
                                <p className="text-stone-500 dark:text-white/50 text-xs italic leading-relaxed mb-2">
                                    {dua.transliteration}
                                </p>
                            )}
                            {dua.meaning && (
                                <p className="text-stone-600 dark:text-gray-300 text-sm leading-relaxed">
                                    "{dua.meaning}"
                                </p>
                            )}
                        </div>
                    )}
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: hatasız biter.

---

### Task 5: Locale — 6 dilde yeni/güncel key'ler (`misc.json` × 6)

**Files:**
- Modify: `public/locales/{tr,en,ar,az,de,ru}/misc.json`

**Interfaces:**
- Consumes: —
- Produces: `aiMentor.welcomeMessage` (güncel), `aiMentor.suggestion3` (yeni metin), `aiMentor.suggestion4` (YENİ), `prescription.duaLabel` (YENİ). Task 3-4 bu key'leri okur.

- [ ] **Step 1: Python scriptiyle 6 dosyayı güncelle**

Format kuralları (ensure_ascii=False, 4 indent, trailing newline yok) script'te
gömülü. Çalıştır:

```bash
python3 - <<'EOF'
import json

TEXTS = {
    'tr': {
        'welcome': "Selamün aleyküm güzel kardeşim. Ben senin Manevi Asistanınım. Kalbinde ne var, seni daraltan veya şükrettiren nedir? Bana anlat, sana Kur'an ve Sünnet ışığında bir reçete hazırlayayım. Ayrıca bana dua ve ibadetlerle ilgili soru sorabilir, uygulamanın özelliklerini (örneğin widget kurulumunu) danışabilirsin.",
        's3': "Ana ekrana widget nasıl eklerim?",
        's4': "Uyumadan önce hangi dualar okunur?",
        'duaLabel': "Dua"
    },
    'en': {
        'welcome': "Peace be upon you, dear friend. I am your Spiritual Mentor. What's in your heart, what troubles you or what are you grateful for? Tell me, and I'll prepare a prescription for you based on the Quran and Sunnah. You can also ask me about duas and worship, or how to use the app's features (like adding widgets).",
        's3': "How do I add a widget to my home screen?",
        's4': "Which duas should I read before sleeping?",
        'duaLabel': "Dua"
    },
    'ar': {
        'welcome': "السلام عليكم أخي الكريم. أنا مرشدك الروحاني. ما الذي في قلبك، ما الذي يقلقك أو ما الذي تحمد الله عليه؟ أخبرني وسأُعدّ لك وصفة روحانية من القرآن والسنّة. كما يمكنك سؤالي عن الأدعية والعبادات، أو عن كيفية استخدام ميزات التطبيق (مثل إضافة الودجات).",
        's3': "كيف أضيف ودجت إلى الشاشة الرئيسية؟",
        's4': "ما الأدعية التي تُقرأ قبل النوم؟",
        'duaLabel': "الدعاء"
    },
    'az': {
        'welcome': "Əssalamu ələykum, əziz qardaşım. Mən sənin Mənəvi Köməkçinəm. Qəlbində nə var, səni darıxdıran və ya şükür etdirən nədir? Mənə danış, sənə Quran və Sünnə işığında bir reçete hazırlayım. Həmçinin məndən dua və ibadətlərlə bağlı sual soruşa, tətbiqin xüsusiyyətlərini (məsələn, widget qurulumunu) öyrənə bilərsən.",
        's3': "Əsas ekrana widget necə əlavə edim?",
        's4': "Yatmazdan əvvəl hansı dualar oxunur?",
        'duaLabel': "Dua"
    },
    'de': {
        'welcome': "Friede sei mit dir, lieber Freund. Ich bin dein Spiritueller Mentor. Was liegt dir auf dem Herzen, was bedrückt dich oder wofür bist du dankbar? Erzähle es mir, und ich bereite eine Empfehlung für dich vor, basierend auf Quran und Sunnah. Du kannst mich auch zu Bittgebeten und zur Ibada befragen oder dazu, wie du die Funktionen der App nutzt (z. B. Widgets hinzufügen).",
        's3': "Wie füge ich ein Widget zum Startbildschirm hinzu?",
        's4': "Welche Bittgebete liest man vor dem Schlafen?",
        'duaLabel': "Bittgebet"
    },
    'ru': {
        'welcome': "Мир вам, дорогой друг. Я ваш Духовный Наставник. Что у вас на сердце, что беспокоит или за что вы благодарны? Расскажите мне, и я подготовлю для вас рецепт, основанный на Коране и Сунне. Вы также можете спросить меня о дуа и поклонении или о том, как пользоваться функциями приложения (например, как добавить виджет).",
        's3': "Как добавить виджет на главный экран?",
        's4': "Какие дуа читают перед сном?",
        'duaLabel': "Дуа"
    }
}

for lang, tx in TEXTS.items():
    path = f'public/locales/{lang}/misc.json'
    with open(path, encoding='utf-8') as f:
        d = json.load(f)
    d['aiMentor']['welcomeMessage'] = tx['welcome']
    d['aiMentor']['suggestion3'] = tx['s3']
    d['aiMentor']['suggestion4'] = tx['s4']
    d['prescription']['duaLabel'] = tx['duaLabel']
    with open(path, 'w', encoding='utf-8') as f:
        f.write(json.dumps(d, ensure_ascii=False, indent=4))  # no trailing newline
    print(f'{lang} OK')
EOF
```

Expected: 6 satır `<lang> OK`.

- [ ] **Step 2: Parite + format doğrula**

```bash
python3 - <<'EOF'
import json
ref = None
for lang in ['tr', 'en', 'ar', 'az', 'de', 'ru']:
    path = f'public/locales/{lang}/misc.json'
    raw = open(path, encoding='utf-8').read()
    assert not raw.endswith('\n'), f'{lang}: trailing newline!'
    d = json.loads(raw)
    keys = (sorted(d['aiMentor'].keys()), sorted(d['prescription'].keys()))
    if ref is None:
        ref = keys
    assert keys == ref, f'{lang}: key parity broken vs tr'
    assert 'suggestion4' in d['aiMentor'] and 'duaLabel' in d['prescription'], lang
print('parity OK')
EOF
```

Expected: `parity OK`.

- [ ] **Step 3: Final build**

Run: `npm run build`
Expected: hatasız biter.

---

## El Testi (kullanıcı, cihazda — plan kapsamı dışı ama teslim kriteri)

Backend deploy sonrası (`firebase deploy --only functions`):

1. "Ana ekrana widget nasıl eklerim?" → guide cevabı + "Widget Rehberi" butonu, kota DÜŞMEDİ.
2. "Bildirim sesi nasıl değişir?" → guide cevabı, kota düştü.
3. Manevi dert mesajı → reçete kartı (dua bölümü çıkabilir), kota düştü.
4. Takip sorusu ("peki onu nasıl açarım?") → önceki mesaj bağlamıyla tutarlı cevap.
5. Konu dışı soru (futbol) → nazik ret düz metin.
6. 4 hızlı soru butonu görünüyor, 6 dilde metinler doğru.
