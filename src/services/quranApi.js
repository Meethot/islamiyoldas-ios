const BASE_URL = 'https://api.quran.com/api/v4';
const CDN_BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions';

// FAWAZ AHMED EDITION IDENTIFIERS
const EDITIONS = {
    arabic: 'ara-quranuthmanihaf',
    transliteration: 'tur-latinalphabet',
    translation_tr: 'tur-diyanetisleri', // Diyanet İşleri
    translation_en: 'en-sahih' // Sahih International
};

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
 * Fetch verses for a specific chapter from CDN
 * @param {number} surahId - Chapter ID (1-114)
 * @param {number} page - Page number (legacy support, CDN serves full chapters)
 * @param {string} language - Language code (tr, en, de)
 */
export async function fetchSurahContent(surahId, page = 1, language = 'tr') {
    let translationEdition = EDITIONS.translation_tr;
    if (language === 'en') translationEdition = EDITIONS.translation_en;
    if (language === 'de') translationEdition = EDITIONS.translation_de;

    try {
        // Fetch 3 sources in parallel
        const [arabicRes, translitRes, translationRes] = await Promise.all([
            fetch(`${CDN_BASE_URL}/${EDITIONS.arabic}/${surahId}.json`),
            fetch(`${CDN_BASE_URL}/${EDITIONS.transliteration}/${surahId}.json`),
            fetch(`${CDN_BASE_URL}/${translationEdition}/${surahId}.json`)
        ]);

        if (!arabicRes.ok || !translitRes.ok || !translationRes.ok) {
            throw new Error('Ayet verileri çekilemedi');
        }

        const [arabicData, translitData, translationData] = await Promise.all([
            arabicRes.json(),
            translitRes.json(),
            translationRes.json()
        ]);

        // Merge sources by verse index
        // Fawaz Ahmed API structure: { chapter: [{ chapter: 1, verse: 1, text: "..." }, ...] }
        const mergedVerses = arabicData.chapter.map((item, index) => {
            return {
                id: `${surahId}:${item.verse}`,
                verseKey: `${surahId}:${item.verse}`,
                verseNumber: item.verse,
                arabic: item.text,
                transliteration: translitData.chapter[index]?.text || '',
                translation: translationData.chapter[index]?.text || ''
            };
        });

        // Handle client-side pagination since CDN serves full chapters
        const perPage = 50;
        const totalVerses = mergedVerses.length;
        const totalPages = Math.ceil(totalVerses / perPage);
        const startIndex = (page - 1) * perPage;
        const paginatedVerses = mergedVerses.slice(startIndex, startIndex + perPage);

        return {
            verses: paginatedVerses,
            pagination: {
                next_page: page < totalPages ? page + 1 : null,
                total_pages: totalPages,
                total_verses: totalVerses
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
