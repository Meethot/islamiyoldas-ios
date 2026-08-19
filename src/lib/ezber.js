import { storageService } from '@/services/storageService';

/**
 * Ezber ("Perde") çekirdeği — satır bölme, ses eşleme, ilerleme ve tekrar takvimi.
 *
 * SATIR: ezberin birimi. Kural olarak bir ayet; Ayetel Kürsi tek ayet olduğu için
 * elle 8 parçaya bölünür (51 saniyelik tek blok ezber birimi olamaz).
 */

const STORAGE_KEY = 'sure_ezber_v1';
const AYAH_MARK = '۝';

/* ------------------------------------------------------------------ kimlik */

/** Harekesiz, yalnız harf — karşılaştırma ve anahtar üretimi için. */
function lettersOnly(arabic) {
    return String(arabic || '').normalize('NFC')
        .replace(/[ً-ْٰٓ-ٕـ]/g, '')
        .replace(/[^ء-ي]/g, '')
        .replace(/[أإآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي');
}

function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/**
 * Sure kimliği: sadeleşmiş metnin TAMAMININ karması + harf sayısı.
 *
 * İndeks değil (sure sırası dil dosyalarına göre farklı), ilk N harf de değil
 * (Felak ile Nâs "besmele + kul eûzü birabbi" ile başlıyor, ilk 24 harfleri aynı).
 */
export function sureKey(arabic) {
    const letters = lettersOnly(arabic);
    if (!letters) return '';
    return `${letters.length.toString(36)}${hashString(letters).toString(36)}`;
}

/* -------------------------------------------------------------- satırlama */

/**
 * PARÇA metinler: sure değil, sure içinden alınmış bölümler.
 *
 * Ortak yanları: besmeleyle başlamazlar (ayet numarası sure başından gitmez) ve
 * ayetleri tek blokta ezberlenemeyecek kadar uzundur — anlam öbeklerine bölünür.
 * `anchor` öbeğin SON kelimesi (metni bölmek için), `words` öbeğin SEGMENT
 * sayısı (sesi kesmek için). SEGMENT, metin kelimesi DEĞİL: kāri iki kelimeyi
 * tek nefeste okuduğunda segment sayısı azalır — bkz. Ahzâb 35 (30 kelime /
 * 29 segment). Öbekler birleşince metnin aslını vermezse bölme yapılmaz;
 * yarım metin göstermektense ayet bütün kalsın.
 */
const PASSAGES = [
    {   // Ayetel Kürsi (Bakara 255) — tek ayet, 8 anlam öbeği
        match: 'اللهلاالهالاهوالحيالقيوم',
        chunks: [
            { verse: '2:255', anchor: 'الْقَيُّومُ', words: 7 },
            { verse: '2:255', anchor: 'نَوْمٌ', words: 5 },
            { verse: '2:255', anchor: 'الْأَرْضِ', words: 7 },
            { verse: '2:255', anchor: 'بِإِذْنِهِ', words: 7 },
            { verse: '2:255', anchor: 'خَلْفَهُمْ', words: 6 },
            { verse: '2:255', anchor: 'شَاءَ', words: 8 },
            { verse: '2:255', anchor: 'وَالْأَرْضَ', words: 4 },
            { verse: '2:255', anchor: 'الْعَظِيمُ', words: 6 },
        ],
    },
    {   // Âmenerrasûlü (Bakara 285-286)
        match: 'امنالرسولبماانزلاليه',
        chunks: [
            { verse: '2:285', anchor: 'وَالْمُؤْمِنُونَ', words: 8 },
            { verse: '2:285', anchor: 'وَرُسُلِهِ', words: 6 },
            { verse: '2:285', anchor: 'رُّسُلِهِ', words: 6 },
            { verse: '2:285', anchor: 'الْمَصِيرُ', words: 7 },
            { verse: '2:286', anchor: 'وُسْعَهَا', words: 6 },
            { verse: '2:286', anchor: 'اكْتَسَبَتْ', words: 6 },
            { verse: '2:286', anchor: 'أَخْطَأْنَا', words: 7 },
            { verse: '2:286', anchor: 'قَبْلِنَا', words: 11 },
            { verse: '2:286', anchor: 'بِهِ', words: 8 },
            { verse: '2:286', anchor: 'الْكَافِرِينَ', words: 11 },
        ],
    },
    {   // Haşr suresinin son üç ayeti (59:22-24)
        match: 'عالمالغيبوالشهاده',
        chunks: [
            { verse: '59:22', anchor: 'وَالشَّهَادَةِ', words: 10 },
            { verse: '59:22', anchor: 'الرَّحِيمُ', words: 3 },
            { verse: '59:23', anchor: 'الْمُتَكَبِّرُ', words: 15 },
            { verse: '59:23', anchor: 'يُشْرِكُونَ', words: 4 },
            { verse: '59:24', anchor: 'الْحُسْنَىٰ', words: 8 },
            { verse: '59:24', anchor: 'الْحَكِيمُ', words: 9 },
        ],
    },
    {   // Ahzâb 35 — kadın ve erkeği aynı on vasıfta sayan ayet.
        // `words` SEGMENT sayar, metin kelimesini değil: bu ayette 30 kelime /
        // 29 segment var (kāri "ves sâimîne ves sâimâti"yi tek nefeste okumuş),
        // öbek sınırları o yüzden segment sınırına oturtuldu.
        match: 'انالمسلمينوالمسلمات',
        chunks: [
            { verse: '33:35', anchor: 'وَالْمُؤْمِنَاتِ', words: 5 },
            { verse: '33:35', anchor: 'وَالصَّادِقَاتِ', words: 4 },
            { verse: '33:35', anchor: 'وَالْخَاشِعَاتِ', words: 4 },
            { verse: '33:35', anchor: 'وَالصَّائِمَاتِ', words: 3 },
            { verse: '33:35', anchor: 'وَالذَّاكِرَاتِ', words: 7 },
            { verse: '33:35', anchor: 'عَظِيمًا', words: 6 },
        ],
    },
];

const findPassage = (arabic) => {
    const letters = lettersOnly(arabic);
    return PASSAGES.find(p => letters.includes(p.match)) || null;
};

function splitPassage(arabic, passage) {
    const out = [];
    let rest = String(arabic).split(AYAH_MARK).join(' ').replace(/\s+/g, ' ').trim();
    for (const chunk of passage.chunks) {
        const at = rest.indexOf(chunk.anchor);
        if (at < 0) return null;              // metin beklenenden farklıysa bölme
        out.push(rest.slice(0, at + chunk.anchor.length).trim());
        rest = rest.slice(at + chunk.anchor.length).trim();
    }
    return rest ? null : out;                  // artan varsa güvenme
}

/** Arapça metni ezber satırlarına böler. */
export function splitAyahs(arabic) {
    if (typeof arabic !== 'string') return [];
    const raw = arabic;
    if (!raw.trim()) return [];
    const passage = findPassage(raw);
    if (passage) {
        const parts = splitPassage(raw, passage);
        if (parts) return parts;
    }
    return raw.split(AYAH_MARK).map(s => s.trim()).filter(Boolean);
}

/**
 * Okunuş metnini cümlelere böler.
 *
 * `transcription` alanı sureyi tek parça tutuyor; cümle noktası ayet sınırıdır —
 * İKİ İSTİSNA dışında (ölçüldü: 6 dilin hepsinde aynı yerde):
 *   Nasr    → son iki cümle tek ayettir (Fesebbih… + İnnehû…)
 *   Tebbet  → 5. ve 6. cümle tek ayettir (Vemraetüh + Hammâletelhatab)
 * Bu yüzden birleştirme kuralı dilden bağımsız, indeksle verilir.
 */
const MERGE_RULES = [
    { match: 'نصرالله', mergeAt: 3 },   // Nasr: 3. indeksten sonrakini kendine kat
    { match: 'تبتيدا', mergeAt: 4 },    // Tebbet
];

export function splitTranscription(text, arabic) {
    if (typeof text !== 'string') return [];
    const raw = text.trim();
    if (!raw) return [];
    let parts = raw.split(/(?<=[.!?])\s+/).map(s => s.trim().replace(/\.$/, '').trim()).filter(Boolean);
    const letters = lettersOnly(arabic);
    for (const rule of MERGE_RULES) {
        if (letters.includes(rule.match) && parts.length > rule.mergeAt + 1) {
            parts = [
                ...parts.slice(0, rule.mergeAt),
                `${parts[rule.mergeAt]}. ${parts[rule.mergeAt + 1]}`,
                ...parts.slice(rule.mergeAt + 2),
            ];
        }
    }
    return parts;
}

/**
 * Ezber satırları: `[{ ar, lat }]`.
 *
 * Okunuş satır sayısı Arapça satır sayısını tutmazsa okunuş TAMAMEN düşürülür
 * (yanlış eşleşmiş okunuş, okunuşsuz ekrandan kötüdür — kullanıcı başka ayetin
 * okunuşunu ezberler). Perde akışı Arapça + sesle çalışmaya devam eder.
 */
export function buildLines(step) {
    const ayahs = splitAyahs(step?.arabic);
    if (!ayahs.length) return [];
    const lat = splitTranscription(step?.transcription, step?.arabic);
    const aligned = lat.length === ayahs.length;
    return ayahs.map((ar, i) => ({ ar, lat: aligned ? lat[i] : '' }));
}

/**
 * Arapça satırı kelimelere böler — kelime-senkron takip için.
 *
 * Vokatif "يا" sonraki kelimeyle BİRLEŞİR: Uthmani yazımda bitişiktir
 * (يَٰٓأَيُّهَا) ve quran.com onu tek kelime sayar. Ayırırsak Kâfirûn'un ilk
 * satırında kelime sayısı segment sayısını aşar, vurgu bir kelime kayar.
 * Bu kuralla 12 surenin 73 satırının hepsinde sayı birebir tutuyor.
 */
export function splitArabicWords(text) {
    const out = [];
    for (const w of String(text || '').trim().split(/\s+/)) {
        if (!w) continue;
        if (out.length && /^يَ?ا$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + w;
        else out.push(w);
    }
    return out;
}

/* ------------------------------------------------------------------- ses */

/**
 * Sure → quran.com sure numarası. Anahtar olarak karma değil, metnin içinde
 * geçen ayırt edici bir öbek kullanılır: okunması kolay ve veri değişse bile
 * sessizce yanlış sureye bağlanmaz.
 */
const CHAPTER_ANCHORS = [
    { chapter: 1, anchor: 'الحمدللهربالعالمين' },
    { chapter: 105, anchor: 'اصحابالفيل' },
    { chapter: 106, anchor: 'لايلافقريش' },
    { chapter: 107, anchor: 'يكذببالدين' },
    { chapter: 108, anchor: 'اعطيناكالكوثر' },
    { chapter: 109, anchor: 'ياايهاالكافرون' },
    { chapter: 110, anchor: 'نصرالله' },
    { chapter: 111, anchor: 'تبتيدا' },
    { chapter: 112, anchor: 'قلهواللهاحد' },
    { chapter: 113, anchor: 'بربالفلق' },
    { chapter: 114, anchor: 'بربالناس' },
    // Cüz Amme (87-104). Çapa, surenin İLK kelimelerinden üretildi ve hem
    // birbirine hem de yukarıdaki surelerin TAM metnine karşı benzersiz doğrulandı
    // (İhlâs "lem yekün" içerdiği için 98'in çapası "lem yekünillezîne" olmak zorunda).
    // Yeni sure eklerken bu benzersizliği yeniden ölçmek şart — eşleşme sırayla ilk bulunandır.
    { chapter: 87, anchor: 'سبحاسم' },
    { chapter: 88, anchor: 'هلاتاك' },
    { chapter: 89, anchor: 'والفجروليال' },
    { chapter: 90, anchor: 'لااقسم' },
    { chapter: 91, anchor: 'والشمسوضحاها' },
    { chapter: 92, anchor: 'والليلاذايغشي' },
    { chapter: 93, anchor: 'والضحيوالليل' },
    { chapter: 94, anchor: 'المنشرح' },
    { chapter: 95, anchor: 'والتينوالزيتون' },
    { chapter: 96, anchor: 'اقراباسم' },
    { chapter: 97, anchor: 'اناانزلناه' },
    { chapter: 98, anchor: 'لميكنالذين' },
    { chapter: 99, anchor: 'اذازلزلت' },
    { chapter: 100, anchor: 'والعادياتضبحا' },
    { chapter: 101, anchor: 'القارعهما' },
    { chapter: 102, anchor: 'الهاكمالتكاثر' },
    { chapter: 103, anchor: 'والعصران' },
    { chapter: 104, anchor: 'ويللكل' },
];

/** Sure numarası; bulunamazsa null (ses kapalı, akış yazıyla devam eder). */
export function chapterOf(arabic) {
    const passage = findPassage(arabic);
    if (passage) return Number(passage.chunks[0].verse.split(':')[0]);
    const letters = lettersOnly(arabic);
    const hit = CHAPTER_ANCHORS.find(c => letters.includes(c.anchor));
    return hit ? hit.chapter : null;
}

/**
 * Bir satırın sesi: hangi ayet, gerekiyorsa ayetin hangi milisaniye aralığı.
 *
 * - Fâtiha'da besmele zaten 1. ayettir → satır i = ayet i+1.
 * - Diğer surelerde 0. satır besmeledir → 1:1 kaydından çalınır.
 * - Parça metinler (Ayetel Kürsi, Âmenerrasûlü, Haşr sonu) PASSAGES tablosundan
 *   gider: besmele satırı yoktur, uzun ayet kelime aralığından kesilir.
 */
export function audioPlanFor(arabic, lineIndex) {
    // Satır sayısının dışına çıkılırsa var olmayan ayet numarası üretilirdi
    // (ör. 112:99): istek boşa gider, kullanıcı "ses hatası" görür.
    const lineCount = splitAyahs(arabic).length;
    if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= lineCount) return null;
    const passage = findPassage(arabic);
    // Metin beklenenden farklıysa `splitAyahs` öbeklemeye GİRMEZ; o durumda öbek
    // planı satırlarla hizasız olur ve yanlış yerden ses çalar. Sessiz kalmak
    // yanlış ayeti okumaktan iyidir.
    if (passage && lineCount === passage.chunks.length) {
        const chunk = passage.chunks[lineIndex];
        if (!chunk) return null;
        const same = passage.chunks.filter(c => c.verse === chunk.verse);
        // Öbek ayetin tamamıysa kayıt olduğu gibi çalınır; parçaysa kelime aralığından kesilir
        if (same.length === 1) return { verseKey: chunk.verse };
        const from = same.slice(0, same.indexOf(chunk)).reduce((a, c) => a + c.words, 0);
        return { verseKey: chunk.verse, wordFrom: from, wordTo: from + chunk.words };
    }
    const chapter = chapterOf(arabic);
    if (!chapter) return null;
    if (chapter === 1) return { verseKey: `1:${lineIndex + 1}` };
    if (lineIndex === 0) return { verseKey: '1:1' };
    return { verseKey: `${chapter}:${lineIndex}` };
}

/* -------------------------------------------------------------- ilerleme */

/** Genişleyen tekrar aralıkları (gün). Cepeda 2008: hedef uzadıkça aralık uzar. */
export const SRS_INTERVALS = [1, 3, 7, 14, 30];

/** Yerel tarih — `toISOString` UTC'ye kaydığı için gece yarısı hatası yapar. */
export function todayStr(d = new Date()) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(dateStr, days) {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    dt.setDate(dt.getDate() + days);
    return todayStr(dt);
}

export function readProgress() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
        const out = {};
        for (const [k, v] of Object.entries(raw)) {
            if (!v || typeof v !== 'object') continue;
            out[k] = {
                lines: Number.isFinite(v.lines) ? Math.max(0, Math.floor(v.lines)) : 0,
                done: Number.isFinite(v.done) ? Math.max(0, Math.floor(v.done)) : 0,
                box: Number.isFinite(v.box) ? Math.min(SRS_INTERVALS.length, Math.max(0, Math.floor(v.box))) : 0,
                due: typeof v.due === 'string' ? v.due : null,
                lastAt: typeof v.lastAt === 'string' ? v.lastAt : null,
            };
        }
        return out;
    } catch {
        return {};
    }
}

function write(next) {
    storageService.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

/** Bir satırın perdesi geçildi. İlerleme geri gitmez. */
export function markLineDone(progress, key, lineIndex, totalLines) {
    if (!key) return progress;
    const prev = progress[key] || { lines: totalLines, done: 0, box: 0, due: null, lastAt: null };
    const done = Math.max(prev.done, Math.min(totalLines, lineIndex + 1));
    return write({ ...progress, [key]: { ...prev, lines: totalLines, done } });
}

/**
 * Oturum kapandı: tekrar kutusu ilerler ve bir sonraki tekrar tarihi kurulur.
 * Sure "bitti" diye kapanmaz — kutu en fazla son aralıkta kalır.
 */
export function closeSession(progress, key, { today = todayStr() } = {}) {
    if (!key || !progress[key]) return progress;
    const prev = progress[key];
    const complete = prev.lines > 0 && prev.done >= prev.lines;
    const box = complete ? Math.min(SRS_INTERVALS.length, prev.box + 1) : prev.box;
    const gap = SRS_INTERVALS[Math.max(0, box - 1)] || SRS_INTERVALS[0];
    return write({
        ...progress,
        [key]: { ...prev, box, lastAt: today, due: complete ? addDays(today, gap) : addDays(today, 1) },
    });
}

/** Durum etiketi — rafta ve kartta gösterilir. */
export function stateOf(entry, today = todayStr()) {
    if (!entry || !entry.done) return 'new';
    if (entry.done < entry.lines) return 'learning';
    if (entry.due && entry.due <= today) return 'due';
    return 'memorized';
}

/** Bugün tekrarı gelenler — en eski tarih önce. */
export function dueList(progress, today = todayStr()) {
    return Object.entries(progress)
        .filter(([, v]) => v.lines > 0 && v.done >= v.lines && v.due && v.due <= today)
        .sort((a, b) => String(a[1].due).localeCompare(String(b[1].due)))
        .map(([k]) => k);
}
