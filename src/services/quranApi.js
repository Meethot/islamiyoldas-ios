/**
 * Quran.com API v4 Service
 * Fetches Quran content on-demand to keep app size minimal
 */

const BASE_URL = 'https://api.quran.com/api/v4';

const TRANSLATION_IDS = {
    tr: 77, // Diyanet İşleri
    en: 20, // Sahih International
    de: 140, // Montada Islamic Foundation (German)
    ar: null // Arabic only (no translation needed, or tafsir)
};
const TRANSLITERATION_ID = 57; // Latin Transliteration

/**
 * Fetch all chapters (surahs) metadata
 */
export async function fetchChapters(language = 'tr') {
    const response = await fetch(`${BASE_URL}/chapters?language=${language}`);

    if (!response.ok) {
        throw new Error('Sureler yüklenemedi');
    }

    const data = await response.json();
    return data.chapters.map(ch => ({
        id: ch.id,
        name: ch.name_simple,
        nameArabic: ch.name_arabic,
        nameTurkish: ch.translated_name?.name || ch.name_simple,
        ayahCount: ch.verses_count,
        revelation: ch.revelation_place === 'makkah' ? 'Mekke' : 'Medine',
        revelationOrder: ch.revelation_order
    }));
}

/**
 * Fetch verses for a specific chapter
 * @param {number} surahId - Chapter ID (1-114)
 * @param {number} page - Page number for pagination
 * @param {string} language - Language code (tr, en, etc.)
 */
export async function fetchSurahContent(surahId, page = 1, language = 'tr') {
    const translationId = TRANSLATION_IDS[language] || TRANSLATION_IDS.tr;
    // If language is arabic, we might not need translation id, but let's keep it simple for now

    const params = new URLSearchParams({
        language: language,
        words: 'false',
        translations: `${translationId},${TRANSLITERATION_ID}`,
        fields: 'text_uthmani',
        per_page: '50',
        page: page.toString()
    });

    const response = await fetch(
        `${BASE_URL}/verses/by_chapter/${surahId}?${params}`
    );

    if (!response.ok) {
        throw new Error('Ayetler yüklenemedi');
    }

    const data = await response.json();

    return {
        verses: data.verses.map(verse => {
            // Find Translation (dynamic ID)
            const translation = verse.translations?.find(t => t.resource_id === translationId);
            // Find Latin transliteration (ID 57)
            const latinTransliteration = verse.translations?.find(t => t.resource_id === TRANSLITERATION_ID);

            return {
                id: verse.id,
                verseKey: verse.verse_key,
                verseNumber: verse.verse_number,
                arabic: verse.text_uthmani,
                transliteration: latinTransliteration?.text || '',
                translation: translation?.text || '',
            };
        }),
        pagination: data.pagination
    };
}

/**
 * Fetch chapter info (for header details)
 */
export async function fetchChapterInfo(surahId, language = 'tr') {
    const response = await fetch(`${BASE_URL}/chapters/${surahId}?language=${language}`);

    if (!response.ok) {
        throw new Error('Sure bilgisi yüklenemedi');
    }

    const data = await response.json();
    const ch = data.chapter;

    return {
        id: ch.id,
        name: ch.name_simple,
        nameArabic: ch.name_arabic,
        nameTurkish: ch.translated_name?.name || ch.name_simple,
        ayahCount: ch.verses_count,
        revelation: ch.revelation_place === 'makkah' ? 'Mekke' : 'Medine',
        revelationOrder: ch.revelation_order
    };
}
