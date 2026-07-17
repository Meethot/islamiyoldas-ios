# Doğum Günü Ayeti Kartı — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcı doğum tarihini (gün/ay) verince gün:ay → surah:ayet eşleşmesiyle o ayeti gösteren, dua/zikir/şifa İÇERMEYEN, paylaşılabilir özel kart — AiMentor içinde.

**Architecture:** Deterministik gün:ay → surah:ayet hesabı saf client modülünde (`birthdayVerse.js`). Ayet metni + ses mevcut `VerseLookupService` / alquran.cloud ile çekilir, yeni `BirthdayVerseCard` render eder. İki giriş: hoş geldin ekranındaki chip → inline tarih seçici (AI'sIZ, kotasız) ve serbest yazı → backend `birthday_verse` tipiyle sadece gün+ay ayıklar (kotasız). Paylaşım `DuaKosesi` kalıbı (Capacitor Share, metin).

**Tech Stack:** React 19 + Vite 7, i18next (6 dil), Capacitor Share v8, Firebase Functions v2 (Gemini), alquran.cloud API.

**Spec:** `docs/superpowers/specs/2026-07-17-birthday-verse-design.md`

## Global Constraints

- **Test framework YOK.** Doğrulama: saf fonksiyon için `node --input-type=module` smoke, backend `node --check`, client `npm run build`, cihaz el testi (kullanıcı).
- **Commit YAPMA** — proje kuralı: kullanıcı istemeden commit/push yok. Değişiklikler working tree'de kalır; sonda haber ver.
- Locale JSON: `ensure_ascii=False`, 4 boşluk indent, **dosya sonunda trailing newline YOK**. Düzenleme python scriptiyle (elle Edit ile JSON bozma).
- Yeni her locale key'i **6 dilde parite**: `tr, en, ar, az, de, ru`.
- i18next `{{...}}` placeholder'ları tüm dillerde birebir aynı kalır.
- Backend deploy (`firebase deploy --only functions`) plana dahil DEĞİL — kullanıcı yapar (serbest-yazı yolu için gerekir; chip yolu deploy'suz çalışır). Sonda hatırlat.
- Eşleştirme: **surah = gün, verse = ay**; `verse > AYAH_COUNTS[surah]` ise (yalnız gün=1 & ay 8–12) verse ayet sayısına clamp; surah hep = gün.
- App yayında değil — eski client/backend uyumluluğu gerekmez.

---

### Task 1: Deterministik eşleştirme modülü (`birthdayVerse.js`)

**Files:**
- Create: `src/lib/birthdayVerse.js`

**Interfaces:**
- Consumes: —
- Produces: `AYAH_COUNTS` (dizi, index 1..114), `birthdayToVerseRef(day, month)` → `{ surah, verse, day, month, clamped }` veya geçersiz girdide `null`. Task 2 ve Task 4 bunu kullanır.

- [ ] **Step 1: Modülü oluştur**

`src/lib/birthdayVerse.js`:

```js
/**
 * Doğum tarihi → Kuran ayeti eşleştirmesi (deterministik).
 * Kural: surah = gün (1-31), verse = ay (1-12). Sadece gün=1 (Fatiha, 7 ayet)
 * ve ay 8-12 taşarsa verse son ayete clamp edilir; surah her zaman = gün.
 */

// Hafs ayet sayıları — index 1..114 (index 0 kullanılmaz).
export const AYAH_COUNTS = [
    0,
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
    123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
    34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
    60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
    14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
    28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
    11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
    5, 4, 5, 6
];

/**
 * @param {number} day - Doğum günü (1-31)
 * @param {number} month - Doğum ayı (1-12)
 * @returns {{surah:number, verse:number, day:number, month:number, clamped:boolean}|null}
 */
export function birthdayToVerseRef(day, month) {
    if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    const surah = day;
    const max = AYAH_COUNTS[surah];
    let verse = month;
    let clamped = false;
    if (verse > max) {
        verse = max;
        clamped = true;
    }
    return { surah, verse, day, month, clamped };
}
```

- [ ] **Step 2: Smoke test (saf fonksiyon)**

Run:
```bash
node --input-type=module -e "
import('./src/lib/birthdayVerse.js').then(({ birthdayToVerseRef, AYAH_COUNTS }) => {
  const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) { console.error('FAIL', m, a); process.exit(1); } };
  eq(AYAH_COUNTS.length, 115, 'table length');
  eq(birthdayToVerseRef(14, 2), { surah:14, verse:2, day:14, month:2, clamped:false }, '14/2');
  eq(birthdayToVerseRef(1, 12), { surah:1, verse:7, day:1, month:12, clamped:true }, '1/12 clamp');
  eq(birthdayToVerseRef(31, 1), { surah:31, verse:1, day:31, month:1, clamped:false }, '31/1');
  eq(birthdayToVerseRef(29, 2), { surah:29, verse:2, day:29, month:2, clamped:false }, '29/2');
  eq(birthdayToVerseRef(0, 5), null, 'day 0');
  eq(birthdayToVerseRef(32, 1), null, 'day 32');
  eq(birthdayToVerseRef(15, 13), null, 'month 13');
  eq(birthdayToVerseRef(1.5, 2), null, 'non-integer');
  console.log('ALL PASS');
});
"
```
Expected: `ALL PASS`.

---

### Task 2: Doğum ayeti kartı (`BirthdayVerseCard.jsx`)

**Files:**
- Create: `src/components/BirthdayVerseCard.jsx`

**Interfaces:**
- Consumes: `birthdayToVerseRef` (Task 1); `getVerifiedVerse({surah, verse}, lang)` (mevcut `@/services/VerseLookupService`); `t('prescription.listen')` / `t('prescription.pause')` (mevcut); `t('birthdayCard.heading'|'share'|'shareText')` (Task 5).
- Produces: `default` export `BirthdayVerseCard({ day, month })`. Task 4 render eder.

- [ ] **Step 1: Bileşeni oluştur**

`src/components/BirthdayVerseCard.jsx`:

```jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Cake, Volume2, Pause, Loader2, Share2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { getVerifiedVerse } from '@/services/VerseLookupService';
import { birthdayToVerseRef } from '@/lib/birthdayVerse';

// Fetch recitation audio (Mishary Alafasy) — same pattern as AiPrescriptionCard.
async function fetchVerseAudio(surah, verse) {
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/ar.alafasy`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data?.audio || null;
    } catch {
        return null;
    }
}

export default function BirthdayVerseCard({ day, month }) {
    const { t, i18n } = useTranslation('misc');
    const ref = birthdayToVerseRef(day, month);
    const [verseData, setVerseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const audioRef = useRef(null);

    const dateLabel = new Date(2000, month - 1, day)
        .toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' });

    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!ref) { setLoading(false); return; }
            const [v, audio] = await Promise.all([
                getVerifiedVerse({ surah: ref.surah, verse: ref.verse }, i18n.language),
                fetchVerseAudio(ref.surah, ref.verse)
            ]);
            if (!mounted) return;
            setVerseData(v);
            setAudioUrl(audio);
            setLoading(false);
        }
        load();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [day, month, i18n.language]);

    useEffect(() => {
        return () => {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        };
    }, []);

    const toggleAudio = useCallback(() => {
        if (!audioUrl) return;
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }
        setAudioLoading(true);
        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.addEventListener('ended', () => setIsPlaying(false));
            audioRef.current.addEventListener('error', () => { setAudioLoading(false); setIsPlaying(false); });
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play()
            .then(() => { setIsPlaying(true); setAudioLoading(false); })
            .catch(() => setAudioLoading(false));
    }, [audioUrl, isPlaying]);

    const handleShare = useCallback(async () => {
        if (!verseData) return;
        try {
            if (audioRef.current) audioRef.current.pause();
            const { Share } = await import('@capacitor/share');
            const platform = Capacitor.getPlatform();
            let appLink = 'https://islamiyoldas.com';
            if (platform === 'ios') appLink = 'https://apps.apple.com/app/id6759666173';
            else if (platform === 'android') appLink = 'https://play.google.com/store/apps/details?id=com.islamiyoldas.app';

            const text = t('birthdayCard.shareText', {
                date: dateLabel,
                source: verseData.source,
                translation: verseData.translation,
                link: appLink
            });
            await Share.share({ text, dialogTitle: t('birthdayCard.heading', { date: dateLabel }) });
        } catch (error) {
            if (error?.name === 'AbortError') return;
            if (navigator.share) {
                try { await navigator.share({ text: `"${verseData.translation}"\n${verseData.source}` }); }
                catch { /* ignore */ }
            }
        }
    }, [verseData, dateLabel, t]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm mx-auto"
        >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-stone-100 dark:from-[#2a1e05] dark:to-[#0a4a2e] border border-islamic-gold/30 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-islamic-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="p-6 space-y-4 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-2 border-b border-islamic-gold/20 pb-3">
                        <Cake className="w-5 h-5 text-islamic-gold" />
                        <h3 className="text-islamic-green dark:text-islamic-gold font-serif font-bold text-base tracking-wide">
                            {t('birthdayCard.heading', { date: dateLabel })}
                        </h3>
                    </div>

                    {loading ? (
                        <div className="h-28 animate-pulse bg-black/5 dark:bg-white/5 rounded-xl" />
                    ) : (
                        <>
                            <p className="text-islamic-gold/50 text-xs font-bold uppercase tracking-wider">{verseData?.source}</p>
                            <p className="text-right font-arabic text-2xl text-islamic-gold/90 leading-loose" dir="rtl">{verseData?.arabic}</p>
                            <p className="text-stone-600 dark:text-gray-200 text-sm italic leading-relaxed">"{verseData?.translation}"</p>

                            <div className="flex items-center gap-2 pt-2">
                                {audioUrl && (
                                    <button
                                        onClick={toggleAudio}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${isPlaying
                                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                            : 'bg-islamic-gold/10 text-islamic-gold border border-islamic-gold/30'}`}
                                    >
                                        {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        {isPlaying ? t('prescription.pause') : t('prescription.listen')}
                                    </button>
                                )}
                                <button
                                    onClick={handleShare}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-islamic-gold text-[#032e18] active:scale-95 transition-all"
                                >
                                    <Share2 className="w-4 h-4" />
                                    {t('birthdayCard.share')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: hatasız biter. (Locale key'leri Task 5'te; eksikken key string döner, build kırılmaz.)

---

### Task 3: Backend `birthday_verse` tipi (`functions/index.js`)

**Files:**
- Modify: `functions/index.js` (`SHARED_RULES` içindeki tip listesi)

**Interfaces:**
- Consumes: mevcut `SHARED_RULES` yapısı.
- Produces: cevap JSON'unda yeni `type: "birthday_verse"` + `day` (int) + `month` (int). Task 4 client bunu tüketir.

- [ ] **Step 1: 4. tipi ekle**

`SHARED_RULES` içinde şu bloğu:

```
   If a practice differs between madhhabs (schools of fiqh), add one short
   sentence noting that it may differ.

Output raw JSON only, no markdown fences. Write every human-readable value
```

şununla değiştir:

```
   If a practice differs between madhhabs (schools of fiqh), add one short
   sentence noting that it may differ.

4. type "birthday_verse" — the user asks which Quran verse matches their
   birthday / birth date (e.g. "doğum günüm 14 şubat hangi ayet", "which verse
   is my birthday 02/14", "hangi ayete denk geliyorum"). Extract ONLY the day
   and month as integers:
   { "type": "birthday_verse", "day": 14, "month": 2 }
   Do NOT include a verse — the app computes it deterministically. If you cannot
   clearly identify both a day (1-31) and a month (1-12), do NOT use this type;
   answer as "text" or "prescription" instead.

Output raw JSON only, no markdown fences. Write every human-readable value
```

- [ ] **Step 2: Syntax doğrula**

Run: `node --check functions/index.js`
Expected: çıktısız exit 0.

---

### Task 4: AiMentor entegrasyonu (`AiMentor.jsx`)

**Files:**
- Modify: `src/pages/AiMentor.jsx`

**Interfaces:**
- Consumes: `BirthdayVerseCard` (Task 2), `birthdayToVerseRef` (Task 1), backend `birthday_verse` cevabı (Task 3), `t('aiMentor.birthday*')` (Task 5).
- Produces: `isBirthday` mesaj tipi (`{ role:'assistant', isBirthday:true, birthday:{day,month} }`) — kendi içinde tüketilir.

- [ ] **Step 1: Import ekle**

Dosya başındaki import bloğuna ekle:

```js
import BirthdayVerseCard from '@/components/BirthdayVerseCard';
import { birthdayToVerseRef } from '@/lib/birthdayVerse';
```

- [ ] **Step 2: `summarizeForHistory`'ye birthday dalı ekle**

Mevcut fonksiyondaki `if (msg.role === 'user') return msg.text || '';` satırının hemen ALTINA ekle:

```js
    if (msg.isBirthday) return 'Doğum günü ayeti gösterildi';
```

- [ ] **Step 3: State + yardımcılar ekle**

`const [consentGranted, setConsentGranted] = useState(hasAiConsent());` satırının altına:

```js
    const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
    const [birthdayDay, setBirthdayDay] = useState(1);
    const [birthdayMonth, setBirthdayMonth] = useState(1);

    const daysInMonth = (m) => [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
    const monthName = (m) => new Date(2000, m - 1, 1).toLocaleDateString(i18n.language, { month: 'long' });

    const openBirthdayVerse = (day, month) => {
        const ref = birthdayToVerseRef(day, month);
        if (!ref) return;
        light();
        const dateLabel = new Date(2000, month - 1, day)
            .toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' });
        const userMsg = { id: Date.now(), role: 'user', text: `🎂 ${dateLabel}` };
        const cardMsg = {
            id: Date.now() + 1, role: 'assistant', isBirthday: true,
            birthday: { day: ref.day, month: ref.month }, isPrescription: false
        };
        setMessages(prev => [...prev, userMsg, cardMsg]);
        setShowBirthdayPicker(false);
    };
```

- [ ] **Step 4: `sendMessage` cevap işlemeye birthday dalı ekle**

Try bloğundaki şu parçayı:

```js
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
```

şununla değiştir:

```js
            const type = adviceData?.type
                || (adviceData?.advice ? 'prescription' : 'text');
            const isPrescription = type === 'prescription' && !!adviceData?.advice;

            // Birthday verse: verse computed client-side (deterministic); AI only extracts day/month.
            const birthdayRef = type === 'birthday_verse'
                ? birthdayToVerseRef(parseInt(adviceData?.day, 10), parseInt(adviceData?.month, 10))
                : null;
            const isBirthday = !!birthdayRef;

            const responseTime = Math.round(performance.now() - requestStart);
            analytics.aiResponseReceived(type, premium, responseTime);

            // Widget how-to and birthday-verse answers are quota-exempt; everything else counts.
            const quotaExempt = (type === 'guide' && adviceData?.topic === 'widgets') || isBirthday;
            if (!quotaExempt) {
                incrementUsed();
                setUsedCount(prev => prev + 1);
            }

            // Deep-link button only for whitelisted routes (defense in depth vs. model output)
            const action = (!isPrescription && !isBirthday
                && adviceData?.action?.route
                && ROUTE_WHITELIST.has(adviceData.action.route)
                && adviceData.action.label)
                ? { route: adviceData.action.route, label: adviceData.action.label }
                : null;

            let aiMsg;
            if (isPrescription) {
                aiMsg = { id: Date.now() + 1, role: 'assistant', text: null, data: adviceData, isPrescription: true };
            } else if (isBirthday) {
                aiMsg = { id: Date.now() + 1, role: 'assistant', isBirthday: true, birthday: { day: birthdayRef.day, month: birthdayRef.month }, isPrescription: false };
            } else {
                aiMsg = { id: Date.now() + 1, role: 'assistant', text: adviceData?.text || adviceData?.advice || t('connectionError'), action, isPrescription: false };
            }
```

- [ ] **Step 5: Render — birthday kartı (çıplak, reçete gibi)**

Bubble bloğunu:

```jsx
                        {/* Bubble — prescription cards render bare (no bubble box behind them) */}
                        <div className={msg.isPrescription
                            ? 'w-full max-w-[85%]'
                            : `max-w-[85%] rounded-2xl p-4 shadow-md ${msg.role === 'user'
                                ? 'bg-islamic-green/10 dark:bg-gradient-to-br dark:from-emerald-600/30 dark:to-emerald-900/30 border border-islamic-green/20 dark:border-emerald-500/20 text-stone-800 dark:text-white rounded-tr-sm backdrop-blur-sm'
                                : 'bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-700 dark:text-gray-100 rounded-tl-sm w-full backdrop-blur-md shadow-sm'
                            }`}>
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
                        </div>
```

şununla değiştir:

```jsx
                        {/* Bubble — prescription & birthday cards render bare (no bubble box) */}
                        <div className={(msg.isPrescription || msg.isBirthday)
                            ? 'w-full max-w-[85%]'
                            : `max-w-[85%] rounded-2xl p-4 shadow-md ${msg.role === 'user'
                                ? 'bg-islamic-green/10 dark:bg-gradient-to-br dark:from-emerald-600/30 dark:to-emerald-900/30 border border-islamic-green/20 dark:border-emerald-500/20 text-stone-800 dark:text-white rounded-tr-sm backdrop-blur-sm'
                                : 'bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-700 dark:text-gray-100 rounded-tl-sm w-full backdrop-blur-md shadow-sm'
                            }`}>
                            {msg.isPrescription ? (
                                <AiPrescriptionCard data={msg.data} />
                            ) : msg.isBirthday ? (
                                <BirthdayVerseCard day={msg.birthday.day} month={msg.birthday.month} />
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
                        </div>
```

- [ ] **Step 6: Welcome ekranına chip + tarih seçici ekle**

Hızlı sorular map'inin bittiği yeri bul:

```jsx
                        {[1, 2, 3, 4].map((num) => (
                            <button
                                key={num}
                                onClick={() => sendMessage(t(`aiMentor.suggestion${num}`))}
                                className="w-full max-w-md px-5 py-3.5 rounded-[18px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-stone-200/50 dark:border-white/5 hover:border-islamic-gold/40 dark:hover:border-islamic-gold/40 hover:bg-stone-50 dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all flex items-center justify-center text-center shadow-sm hover:shadow-md text-stone-700 dark:text-stone-200 hover:text-islamic-gold dark:hover:text-islamic-gold font-medium text-[13.5px] leading-relaxed relative overflow-hidden group"
                            >
                                <span className="relative z-10">{t(`aiMentor.suggestion${num}`)}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-islamic-gold/0 via-islamic-gold/[0.03] to-islamic-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            </button>
                        ))}
                    </motion.div>
```

Kapanan `))}` ile `</motion.div>` ARASINA ekle:

```jsx
                        ))}

                        {/* Birthday verse — special discovery chip + inline date picker */}
                        {!showBirthdayPicker ? (
                            <button
                                onClick={() => { light(); setShowBirthdayPicker(true); }}
                                className="w-full max-w-md mt-1 px-5 py-3.5 rounded-[18px] bg-islamic-gold/10 border border-islamic-gold/30 hover:bg-islamic-gold/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-islamic-gold font-semibold text-[13.5px]"
                            >
                                {t('aiMentor.birthdayChip')}
                            </button>
                        ) : (
                            <div className="w-full max-w-md mt-1 p-4 rounded-[18px] bg-white/70 dark:bg-white/[0.04] border border-islamic-gold/30 flex flex-col gap-3">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-islamic-gold/70 text-center">{t('aiMentor.birthdayPickerTitle')}</p>
                                <div className="flex gap-2">
                                    <label className="flex-1 flex flex-col gap-1">
                                        <span className="text-[10px] text-stone-400 dark:text-white/40 font-medium">{t('aiMentor.birthdayDay')}</span>
                                        <select
                                            value={birthdayDay}
                                            onChange={(e) => setBirthdayDay(parseInt(e.target.value, 10))}
                                            className="rounded-xl bg-stone-100 dark:bg-black/30 border border-stone-200 dark:border-white/10 px-3 py-2 text-sm text-stone-800 dark:text-white outline-none"
                                        >
                                            {Array.from({ length: daysInMonth(birthdayMonth) }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="flex-1 flex flex-col gap-1">
                                        <span className="text-[10px] text-stone-400 dark:text-white/40 font-medium">{t('aiMentor.birthdayMonth')}</span>
                                        <select
                                            value={birthdayMonth}
                                            onChange={(e) => {
                                                const m = parseInt(e.target.value, 10);
                                                setBirthdayMonth(m);
                                                if (birthdayDay > daysInMonth(m)) setBirthdayDay(daysInMonth(m));
                                            }}
                                            className="rounded-xl bg-stone-100 dark:bg-black/30 border border-stone-200 dark:border-white/10 px-3 py-2 text-sm text-stone-800 dark:text-white outline-none"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m}>{monthName(m)}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <Button
                                    onClick={() => openBirthdayVerse(birthdayDay, birthdayMonth)}
                                    className="w-full bg-islamic-gold hover:bg-amber-400 text-[#032e18] font-bold rounded-xl h-10 gap-2"
                                >
                                    🎂 {t('aiMentor.birthdayShow')}
                                </Button>
                            </div>
                        )}
                    </motion.div>
```

- [ ] **Step 7: Build doğrula**

Run: `npm run build`
Expected: hatasız biter.

---

### Task 5: Locale — 6 dilde yeni key'ler (`misc.json` × 6)

**Files:**
- Modify: `public/locales/{tr,en,ar,az,de,ru}/misc.json`

**Interfaces:**
- Consumes: —
- Produces: `aiMentor.birthdayChip|birthdayPickerTitle|birthdayDay|birthdayMonth|birthdayShow`, yeni `birthdayCard.heading|share|shareText`. Task 2 ve Task 4 okur.

- [ ] **Step 1: Python scriptiyle 6 dosyayı güncelle**

Run:
```bash
python3 - <<'EOF'
import json

TEXTS = {
    'tr': {
        'chip': "🎂 Doğum ayetini keşfet",
        'pickerTitle': "Doğduğun günü seç",
        'day': "Gün",
        'month': "Ay",
        'show': "Ayetini Göster",
        'heading': "🎂 {{date}} doğanların ayeti",
        'share': "Paylaş",
        'shareText': "🎂 {{date}} doğanların ayeti\n\n\"{{translation}}\"\n— {{source}}\n\nSeninki hangi ayet? İslami Yoldaş ile keşfet:\n{{link}}"
    },
    'en': {
        'chip': "🎂 Discover your birthday verse",
        'pickerTitle': "Pick the day you were born",
        'day': "Day",
        'month': "Month",
        'show': "Show My Verse",
        'heading': "🎂 The verse for {{date}}",
        'share': "Share",
        'shareText': "🎂 The verse for {{date}}\n\n\"{{translation}}\"\n— {{source}}\n\nWhat's yours? Discover it with Islamic Companion:\n{{link}}"
    },
    'ar': {
        'chip': "🎂 اكتشف آية ميلادك",
        'pickerTitle': "اختر يوم ميلادك",
        'day': "اليوم",
        'month': "الشهر",
        'show': "أظهر آيتي",
        'heading': "🎂 آية مواليد {{date}}",
        'share': "مشاركة",
        'shareText': "🎂 آية مواليد {{date}}\n\n\"{{translation}}\"\n— {{source}}\n\nما هي آيتك؟ اكتشفها مع الرفيق الإسلامي:\n{{link}}"
    },
    'az': {
        'chip': "🎂 Doğum ayəni kəşf et",
        'pickerTitle': "Doğulduğun günü seç",
        'day': "Gün",
        'month': "Ay",
        'show': "Ayəmi Göstər",
        'heading': "🎂 {{date}} doğulanların ayəsi",
        'share': "Paylaş",
        'shareText': "🎂 {{date}} doğulanların ayəsi\n\n\"{{translation}}\"\n— {{source}}\n\nSəninki hansı ayədir? İslami Yoldaş ilə kəşf et:\n{{link}}"
    },
    'de': {
        'chip': "🎂 Entdecke deinen Geburtstagsvers",
        'pickerTitle': "Wähle deinen Geburtstag",
        'day': "Tag",
        'month': "Monat",
        'show': "Meinen Vers zeigen",
        'heading': "🎂 Der Vers zum {{date}}",
        'share': "Teilen",
        'shareText': "🎂 Der Vers zum {{date}}\n\n\"{{translation}}\"\n— {{source}}\n\nWelcher ist deiner? Entdecke ihn mit Islamischer Begleiter:\n{{link}}"
    },
    'ru': {
        'chip': "🎂 Узнай аят своего дня рождения",
        'pickerTitle': "Выбери день рождения",
        'day': "День",
        'month': "Месяц",
        'show': "Показать мой аят",
        'heading': "🎂 Аят для {{date}}",
        'share': "Поделиться",
        'shareText': "🎂 Аят для {{date}}\n\n\"{{translation}}\"\n— {{source}}\n\nА какой у тебя? Узнай в приложении «Исламский Спутник»:\n{{link}}"
    }
}

for lang, tx in TEXTS.items():
    path = f'public/locales/{lang}/misc.json'
    with open(path, encoding='utf-8') as f:
        d = json.load(f)
    d['aiMentor']['birthdayChip'] = tx['chip']
    d['aiMentor']['birthdayPickerTitle'] = tx['pickerTitle']
    d['aiMentor']['birthdayDay'] = tx['day']
    d['aiMentor']['birthdayMonth'] = tx['month']
    d['aiMentor']['birthdayShow'] = tx['show']
    d['birthdayCard'] = {
        'heading': tx['heading'],
        'share': tx['share'],
        'shareText': tx['shareText']
    }
    with open(path, 'w', encoding='utf-8') as f:
        f.write(json.dumps(d, ensure_ascii=False, indent=4))  # no trailing newline
    print(f'{lang} OK')
EOF
```
Expected: 6 satır `<lang> OK`.

- [ ] **Step 2: Parite + format + placeholder doğrula**

Run:
```bash
python3 - <<'EOF'
import json, re
ref_ai, ref_bc = None, None
for lang in ['tr', 'en', 'ar', 'az', 'de', 'ru']:
    path = f'public/locales/{lang}/misc.json'
    raw = open(path, encoding='utf-8').read()
    assert not raw.endswith('\n'), f'{lang}: trailing newline!'
    d = json.loads(raw)
    ai = sorted(d['aiMentor'].keys())
    bc = sorted(d['birthdayCard'].keys())
    if ref_ai is None:
        ref_ai, ref_bc = ai, bc
    assert ai == ref_ai, f'{lang}: aiMentor key parity broken'
    assert bc == ref_bc, f'{lang}: birthdayCard key parity broken'
    # heading + shareText must keep {{date}}; shareText keeps all 4 placeholders
    assert '{{date}}' in d['birthdayCard']['heading'], f'{lang}: heading date ph'
    for ph in ('{{date}}', '{{translation}}', '{{source}}', '{{link}}'):
        assert ph in d['birthdayCard']['shareText'], f'{lang}: shareText missing {ph}'
    for k in ('birthdayChip','birthdayPickerTitle','birthdayDay','birthdayMonth','birthdayShow'):
        assert k in d['aiMentor'], f'{lang}: {k}'
print('parity OK')
EOF
```
Expected: `parity OK`.

- [ ] **Step 3: Final build**

Run: `npm run build`
Expected: hatasız biter.

---

## El Testi (kullanıcı, cihazda — teslim kriteri)

Backend deploy sonrası (`firebase deploy --only functions`):

1. Hoş geldin ekranı → 🎂 chip görünüyor (4 hazır sorunun altında).
2. Chip → tarih seçici açılır → 12 Mart seç → "Ayetini Göster" → 12:3 ayeti kartı; sağ üst kota sayacı DEĞİŞMEDİ.
3. Kartda ses çalıyor, Paylaş açılıyor (metin + mağaza linki); dua/zikir/şifa ayeti YOK.
4. 1 Aralık seç → Fatiha 1:7 (clamp) kartı, çökme yok.
5. Serbest yaz: "doğum günüm 14 şubat hangi ayet" → 14:2 kartı, kota DEĞİŞMEDİ (deploy sonrası).
6. Ay değiştir (Şubat → gün max 29), geçersiz gün seçilemiyor.
7. 6 dilde chip/seçici/kart metinleri doğru; paylaşım metni placeholder'ları dolu.
