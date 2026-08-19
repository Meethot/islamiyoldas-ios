import { Preferences } from '@capacitor/preferences';
import { MANUAL_SURAH_DATA } from '@/data/manualSurahData';

const BASE_URL = 'https://api.quran.com/api/v4';
const CDN_BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions';

// FAWAZ AHMED EDITION IDENTIFIERS
const EDITIONS = {
    arabic: 'ara-quranuthmanihaf',
    transliteration: 'tur-latinalphabet1',
    translation_tr: 'tur-diyanetvakfi', // Diyanet Vakfı (1:1 mapping instead of grouped)
    translation_en: 'eng-ummmuhammad', // Sahih International (Umm Muhammad)
    translation_de: 'deu-aburidamuhammad', // Abu Rida Muhammad ibn Ahmad ibn Rassoul
    translation_ru: 'rus-abuadel' // Abu Adel (concise, mobile-friendly)
};

// Caching helper
const CACHE_KEY_PREFIX = 'surah_content_v6_';

async function getCachedSurah(surahId, language) {
    const { value } = await Preferences.get({ key: `${CACHE_KEY_PREFIX}${surahId}_${language}` });
    return value ? JSON.parse(value) : null;
}

async function setCachedSurah(surahId, language, data) {
    await Preferences.set({
        key: `${CACHE_KEY_PREFIX}${surahId}_${language}`,
        value: JSON.stringify(data)
    });
}

/**
 * Fetch all chapters (surahs) metadata
 */
export async function fetchChapters(language = 'tr') {
    const response = await fetch(`${BASE_URL}/chapters?language=${language}`);

    if (!response.ok) {
        throw new Error('Failed to load surahs');
    }

    const data = await response.json();
    return data.chapters.map(ch => ({
        id: ch.id,
        name: ch.name_simple,
        nameArabic: ch.name_arabic,
        translatedName: ch.translated_name?.name || ch.name_simple,
        ayahCount: ch.verses_count,
        revelationPlace: ch.revelation_place,
        revelationOrder: ch.revelation_order
    }));
}

/**
 * Fetch verses for a specific chapter from CDN with local caching
 * @param {number} surahId - Chapter ID (1-114)
 * @param {number} page - Page number (legacy support, CDN serves full chapters)
 * @param {string} language - Language code (tr, en, de)
 */
export async function fetchSurahContent(surahId, page = 1, language = 'tr') {
    const perPage = 50;

    // 1. Try Cache First
    const cached = await getCachedSurah(surahId, language);
    if (cached && page === 1) {
        // Return first page from cache immediately
        return {
            verses: cached.slice(0, perPage),
            pagination: {
                next_page: cached.length > perPage ? 2 : null,
                total_pages: Math.ceil(cached.length / perPage),
                total_verses: cached.length
            }
        };
    } else if (cached) {
        // Return specific page from cache
        const startIndex = (page - 1) * perPage;
        const paginatedVerses = cached.slice(startIndex, startIndex + perPage);
        return {
            verses: paginatedVerses,
            pagination: {
                next_page: startIndex + perPage < cached.length ? page + 1 : null,
                total_pages: Math.ceil(cached.length / perPage),
                total_verses: cached.length
            }
        };
    }

    let translationEdition = EDITIONS.translation_tr;
    if (language === 'en') translationEdition = EDITIONS.translation_en;
    if (language === 'de') translationEdition = EDITIONS.translation_de;
    if (language === 'ru') translationEdition = EDITIONS.translation_ru;

    try {
        // Fetch 3 sources in parallel
        const [arabicRes, translitRes, translationRes] = await Promise.all([
            fetch(`${CDN_BASE_URL}/${EDITIONS.arabic}/${surahId}.json`),
            fetch(`${CDN_BASE_URL}/${EDITIONS.transliteration}/${surahId}.json`),
            fetch(`${CDN_BASE_URL}/${translationEdition}/${surahId}.json`)
        ]);

        if (!arabicRes.ok || !translitRes.ok || !translationRes.ok) {
            throw new Error('Failed to fetch verse data');
        }

        const [arabicData, translitData, translationData] = await Promise.all([
            arabicRes.json(),
            translitRes.json(),
            translationRes.json()
        ]);

        const combinedData = arabicData.chapter.map((verse, index) => {
            // Manual override only for Turkish (data is hardcoded in Turkish)
            const manualVerse = language === 'tr'
                ? MANUAL_SURAH_DATA[surahId]?.verses.find(v => v.verse_number === verse.verse)
                : null;

            return {
                id: `${surahId}:${verse.verse}`,
                verseKey: `${surahId}:${verse.verse}`,
                verseNumber: verse.verse,
                arabic: verse.text,
                transliteration: manualVerse ? manualVerse.transliteration : formatTransliteration(translitData.chapter[index]?.text || ''),
                translation: manualVerse ? manualVerse.translation : (translationData.chapter[index]?.text || ''),
            };
        });

        // 2. Save to Cache
        await setCachedSurah(surahId, language, combinedData);

        // Handle client-side pagination
        const startIndex = (page - 1) * perPage;
        const totalPages = Math.ceil(combinedData.length / perPage);
        const paginatedVerses = combinedData.slice(startIndex, startIndex + perPage);

        return {
            verses: paginatedVerses,
            pagination: {
                next_page: page < totalPages ? page + 1 : null,
                total_pages: totalPages,
                total_verses: combinedData.length
            }
        };
    } catch (error) {
        console.error('Quran API Error:', error);
        throw error;
    }
}

/**
 * Fetch chapter info (for header details)
 */
export async function fetchChapterInfo(surahId, language = 'tr') {
    const response = await fetch(`${BASE_URL}/chapters/${surahId}?language=${language}`);

    if (!response.ok) {
        throw new Error('Failed to load surah info');
    }

    const data = await response.json();
    const ch = data.chapter;

    return {
        id: ch.id,
        name: ch.name_simple,
        nameArabic: ch.name_arabic,
        translatedName: ch.translated_name?.name || ch.name_simple,
        ayahCount: ch.verses_count,
        revelationPlace: ch.revelation_place,
        revelationOrder: ch.revelation_order
    };
}

/**
 * Fetch surah recitation audio URL
 * @param {number} surahId 
 * @param {number} recitationId - Default to Mishary Rashid Alafasy (7)
 */
export async function fetchSurahAudio(surahId, recitationId = 7) {
    try {
        const response = await fetch(`${BASE_URL}/chapter_recitations/${recitationId}/${surahId}`);
        if (!response.ok) throw new Error('Ses dosyası alınamadı');
        const data = await response.json();
        return data.audio_file.audio_url;
    } catch (error) {
        console.error('Surah Audio Error:', error);
        // Fallback to quranicaudio.com
        return `https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/${surahId}.mp3`;
    }
}

/**
 * Fetch specific ayah recitation audio URL
 * @param {string} verseKey - Format "surahId:ayahNumber" (e.g. "1:1")
 * @param {number} recitationId - Default to Mishary Rashid Alafasy (7)
 */
export async function fetchAyahAudio(verseKey, recitationId = 7) {
    try {
        // Quran.com API uses "1:1" format
        const response = await fetch(`${BASE_URL}/recitations/${recitationId}/by_ayah/${verseKey}`);
        if (!response.ok) throw new Error('Ayet ses dosyası alınamadı');
        const data = await response.json();
        // Returns an array usually, get the first one
        const url = data.audio_files[0]?.url;
        if (url && !url.startsWith('http')) {
            return `https://verses.quran.com/${url}`;
        }
        return url;
    } catch (error) {
        console.error('Ayah Audio Error:', error);
        return null;
    }
}

/**
 * Ayet sesi + kelime zamanlamaları — ezber ekranı için.
 *
 * `fetchAyahAudio`'dan farkı: `segments` de döner. Ayetel Kürsi tek ayet olduğu
 * için ezberde parça parça çalınır; hangi milisaniyeler arasının çalınacağı
 * ancak kelime zamanlamasından bilinir.
 * @param {string} verseKey "2:255"
 * @returns {Promise<{url: string, segments: Array}|null>}
 */
export async function fetchAyahAudioWithSegments(verseKey, recitationId = 7) {
    // Zaman aşımı şart: kopuk/captive-portal bağlantıda `fetch` dakikalarca
    // asılı kalıyor, ezber ekranı da isteği bekleyerek kilitleniyordu.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(`${BASE_URL}/recitations/${recitationId}/by_ayah/${verseKey}?fields=segments`, { signal: controller.signal });
        if (!response.ok) throw new Error('Ayet sesi alınamadı');
        const data = await response.json();
        const file = data.audio_files?.[0];
        if (!file?.url) return null;
        const url = file.url.startsWith('http') ? file.url : `https://verses.quran.com/${file.url}`;
        return { url, segments: Array.isArray(file.segments) ? file.segments : [] };
    } catch (error) {
        console.error('Ayah Audio (segments) Error:', error);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Fetch all ayah recitation audio URLs for a specific chapter
 * @param {number} chapterId 
 * @param {number} recitationId - Default to Mishary Rashid Alafasy (7)
 */
export async function fetchChapterAudioFiles(chapterId, recitationId = 7) {
    try {
        // API paginates (default 10/page) — per_page=300 covers the longest surah (286),
        // page loop is a safety net in case the server caps per_page lower.
        const files = [];
        let page = 1;
        let nextPage = 1;
        while (nextPage) {
            const response = await fetch(`${BASE_URL}/recitations/${recitationId}/by_chapter/${chapterId}?per_page=300&page=${page}&fields=segments`);
            if (!response.ok) throw new Error('Sure ses dosyaları alınamadı');
            const data = await response.json();
            files.push(...data.audio_files.map(file => ({
                verseKey: file.verse_key,
                url: file.url.startsWith('http') ? file.url : `https://verses.quran.com/${file.url}`,
                // Per-word timings [index, wordNo, startMs, endMs] — drives word-synced follow-along
                segments: Array.isArray(file.segments) ? file.segments : null
            })));
            nextPage = data.pagination?.next_page || null;
            page += 1;
        }
        return files;
    } catch (error) {
        console.error('Chapter Audio Files Error:', error);
        return [];
    }
}

// Turn quran.com's academic transliteration (dhālika, l-kitābu) into a Turkish-friendly
// reading (zâlike, l-kitâbu). Digraphs first, then single letters. Not linguistically
// perfect, but close to the app's existing style — used for the word-synced Okunuş view.
function turkishizeTranslit(s) {
    if (!s) return '';
    return s
        .replace(/dh/g, 'z').replace(/Dh/g, 'Z')
        .replace(/th/g, 's').replace(/Th/g, 'S')
        .replace(/sh/g, 'ş').replace(/Sh/g, 'Ş')
        .replace(/gh/g, 'ğ').replace(/Gh/g, 'Ğ')
        .replace(/kh/g, 'h').replace(/Kh/g, 'H')
        .replace(/ā/g, 'â').replace(/ī/g, 'î').replace(/ū/g, 'û')
        .replace(/[ṣ]/g, 's').replace(/[ḍ]/g, 'd').replace(/[ṭ]/g, 't').replace(/[ẓ]/g, 'z')
        .replace(/[ḥẖ]/g, 'h').replace(/ʿ|ʾ|['’ʼ]/g, '')
        .replace(/q/g, 'k').replace(/Q/g, 'K')
        .replace(/w/g, 'v').replace(/W/g, 'V');
}

/**
 * Word-level transliterations aligned 1:1 with the recitation segments (same quran.com
 * source, so word count === segment count). Powers zero-drift word-synced follow-along.
 * @returns {Object} map of verseKey → array of Turkish-friendly transliteration words
 */
export async function fetchChapterWordTransliterations(chapterId) {
    try {
        const out = {};
        let page = 1;
        let nextPage = 1;
        while (nextPage) {
            const res = await fetch(`${BASE_URL}/verses/by_chapter/${chapterId}?words=true&word_fields=transliteration&per_page=50&page=${page}&language=en`);
            if (!res.ok) throw new Error('Kelime okunuşları alınamadı');
            const data = await res.json();
            data.verses.forEach(v => {
                out[v.verse_key] = (v.words || [])
                    .filter(w => w.char_type_name === 'word')
                    .map(w => turkishizeTranslit(w.transliteration?.text || ''));
            });
            nextPage = data.pagination?.next_page || null;
            page += 1;
        }
        return out;
    } catch (error) {
        console.error('Word Transliteration Error:', error);
        return {};
    }
}

/**
 * Formats academic transliteration into a cleaner user-friendly version
 * @param {string} text
 */
function formatTransliteration(text) {
    if (!text) return '';

    return text
        // 1. Clear any weird formatting if present (though latinalphabet1 is clean)
        .replace(/`/g, '')
        // 2. Normalize some characters if necessary but KEEP circumflexes (â, î, û)
        .replace(/ʿ/g, '')
        // 3. Remove parentheses content if it's too technical? 
        // Some users prefer the parenthetical notes for reading rules, keeping for now unless asked.

        // 4. Capitalize first letter
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase());
}
