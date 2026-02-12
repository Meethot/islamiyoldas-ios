/**
 * Verse Lookup Service
 * Fetches verified verse text from Alquran.cloud API.
 * Supports Turkish (Diyanet) and English (Sahih International) translations.
 */

const FALLBACK_VERSE_TR = {
    surahId: 94,
    verseNumber: 5,
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "Elbette zorluğun yanında bir kolaylık vardır.",
    source: "İnşirah Suresi, 5. Ayet"
};

const FALLBACK_VERSE_EN = {
    surahId: 94,
    verseNumber: 5,
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "For indeed, with hardship comes ease.",
    source: "Surah Al-Inshirah, Verse 5"
};

// Turkish surah names lookup
const SURAH_NAMES_TR = {
    1: 'Fatiha', 2: 'Bakara', 3: 'Âl-i İmrân', 4: 'Nisâ', 5: 'Mâide',
    6: 'En\'âm', 7: 'A\'râf', 8: 'Enfâl', 9: 'Tevbe', 10: 'Yûnus',
    11: 'Hûd', 12: 'Yûsuf', 13: 'Ra\'d', 14: 'İbrâhîm', 15: 'Hicr',
    16: 'Nahl', 17: 'İsrâ', 18: 'Kehf', 19: 'Meryem', 20: 'Tâ-Hâ',
    21: 'Enbiyâ', 22: 'Hac', 23: 'Mü\'minûn', 24: 'Nûr', 25: 'Furkân',
    26: 'Şuarâ', 27: 'Neml', 28: 'Kasas', 29: 'Ankebût', 30: 'Rûm',
    31: 'Lokmân', 32: 'Secde', 33: 'Ahzâb', 34: 'Sebe', 35: 'Fâtır',
    36: 'Yâsîn', 37: 'Sâffât', 38: 'Sâd', 39: 'Zümer', 40: 'Mü\'min',
    41: 'Fussilet', 42: 'Şûrâ', 43: 'Zuhruf', 44: 'Duhân', 45: 'Câsiye',
    46: 'Ahkâf', 47: 'Muhammed', 48: 'Fetih', 49: 'Hucurât', 50: 'Kâf',
    51: 'Zâriyât', 52: 'Tûr', 53: 'Necm', 54: 'Kamer', 55: 'Rahmân',
    56: 'Vâkıa', 57: 'Hadîd', 58: 'Mücâdele', 59: 'Haşr', 60: 'Mümtehine',
    61: 'Saff', 62: 'Cum\'a', 63: 'Münâfikûn', 64: 'Teğâbün', 65: 'Talâk',
    66: 'Tahrîm', 67: 'Mülk', 68: 'Kalem', 69: 'Hâkka', 70: 'Meâric',
    71: 'Nûh', 72: 'Cin', 73: 'Müzzemmil', 74: 'Müddessir', 75: 'Kıyâmet',
    76: 'İnsan', 77: 'Mürselât', 78: 'Nebe', 79: 'Nâziât', 80: 'Abese',
    81: 'Tekvîr', 82: 'İnfitâr', 83: 'Mutaffifîn', 84: 'İnşikâk', 85: 'Bürûc',
    86: 'Târık', 87: 'A\'lâ', 88: 'Gâşiye', 89: 'Fecr', 90: 'Beled',
    91: 'Şems', 92: 'Leyl', 93: 'Duhâ', 94: 'İnşirâh', 95: 'Tîn',
    96: 'Alak', 97: 'Kadir', 98: 'Beyyine', 99: 'Zilzâl', 100: 'Âdiyât',
    101: 'Kâria', 102: 'Tekâsür', 103: 'Asr', 104: 'Hümeze', 105: 'Fîl',
    106: 'Kureyş', 107: 'Mâûn', 108: 'Kevser', 109: 'Kâfirûn', 110: 'Nasr',
    111: 'Tebbet', 112: 'İhlâs', 113: 'Felâk', 114: 'Nâs'
};

// English surah names lookup
const SURAH_NAMES_EN = {
    1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Ali Imran', 4: 'An-Nisa', 5: 'Al-Ma\'idah',
    6: 'Al-An\'am', 7: 'Al-A\'raf', 8: 'Al-Anfal', 9: 'At-Tawbah', 10: 'Yunus',
    11: 'Hud', 12: 'Yusuf', 13: 'Ar-Ra\'d', 14: 'Ibrahim', 15: 'Al-Hijr',
    16: 'An-Nahl', 17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
    21: 'Al-Anbiya', 22: 'Al-Hajj', 23: 'Al-Mu\'minun', 24: 'An-Nur', 25: 'Al-Furqan',
    26: 'Ash-Shu\'ara', 27: 'An-Naml', 28: 'Al-Qasas', 29: 'Al-Ankabut', 30: 'Ar-Rum',
    31: 'Luqman', 32: 'As-Sajdah', 33: 'Al-Ahzab', 34: 'Saba', 35: 'Fatir',
    36: 'Ya-Sin', 37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir',
    41: 'Fussilat', 42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan', 45: 'Al-Jathiyah',
    46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath', 49: 'Al-Hujurat', 50: 'Qaf',
    51: 'Adh-Dhariyat', 52: 'At-Tur', 53: 'An-Najm', 54: 'Al-Qamar', 55: 'Ar-Rahman',
    56: 'Al-Waqi\'ah', 57: 'Al-Hadid', 58: 'Al-Mujadila', 59: 'Al-Hashr', 60: 'Al-Mumtahanah',
    61: 'As-Saff', 62: 'Al-Jumu\'ah', 63: 'Al-Munafiqun', 64: 'At-Taghabun', 65: 'At-Talaq',
    66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam', 69: 'Al-Haqqah', 70: 'Al-Ma\'arij',
    71: 'Nuh', 72: 'Al-Jinn', 73: 'Al-Muzzammil', 74: 'Al-Muddaththir', 75: 'Al-Qiyamah',
    76: 'Al-Insan', 77: 'Al-Mursalat', 78: 'An-Naba', 79: 'An-Nazi\'at', 80: 'Abasa',
    81: 'At-Takwir', 82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq', 85: 'Al-Buruj',
    86: 'At-Tariq', 87: 'Al-A\'la', 88: 'Al-Ghashiyah', 89: 'Al-Fajr', 90: 'Al-Balad',
    91: 'Ash-Shams', 92: 'Al-Layl', 93: 'Ad-Duha', 94: 'Al-Inshirah', 95: 'At-Tin',
    96: 'Al-Alaq', 97: 'Al-Qadr', 98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: 'Al-Adiyat',
    101: 'Al-Qari\'ah', 102: 'At-Takathur', 103: 'Al-Asr', 104: 'Al-Humazah', 105: 'Al-Fil',
    106: 'Quraysh', 107: 'Al-Ma\'un', 108: 'Al-Kawthar', 109: 'Al-Kafirun', 110: 'An-Nasr',
    111: 'Al-Masad', 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas'
};

/**
 * Fetches verse Arabic text + translation from Alquran.cloud API.
 * @param {Object} quranRef - { surah, verse } from AI
 * @param {string} language - 'en' or 'tr'
 */
export async function getVerifiedVerse(quranRef, language = 'tr') {
    // Language-indexed maps for API editions and surah name sets
    const EDITION_MAP = { tr: 'tr.diyanet', en: 'en.sahih' };
    const NAMES_MAP = { tr: SURAH_NAMES_TR, en: SURAH_NAMES_EN };
    const FALLBACK_MAP = { tr: FALLBACK_VERSE_TR, en: FALLBACK_VERSE_EN };

    // Use exact language or fall back to English
    const edition = EDITION_MAP[language] || 'en.sahih';
    const surahNames = NAMES_MAP[language] || SURAH_NAMES_EN;
    const fallback = FALLBACK_MAP[language] || FALLBACK_VERSE_EN;

    if (!quranRef || !quranRef.surah || !quranRef.verse) {
        return fallback;
    }

    const surah = parseInt(quranRef.surah);
    const verse = parseInt(quranRef.verse);

    if (isNaN(surah) || isNaN(verse) || surah < 1 || surah > 114) {
        return fallback;
    }

    try {
        const [arabicRes, translationRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}`),
            fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/${edition}`)
        ]);

        if (!arabicRes.ok || !translationRes.ok) {
            return fallback;
        }

        const [arabicData, translationData] = await Promise.all([
            arabicRes.json(),
            translationRes.json()
        ]);

        const arabicText = arabicData.data?.text;
        const translationText = translationData.data?.text;

        if (!arabicText || !translationText) {
            return fallback;
        }

        const surahName = surahNames[surah] || `Surah ${surah}`;

        // Source format per language
        const SOURCE_FORMAT = {
            tr: `${surahName} Suresi, ${verse}. Ayet`,
            en: `Surah ${surahName}, Verse ${verse}`
        };

        return {
            surahId: surah,
            verseNumber: verse,
            arabic: arabicText,
            translation: translationText,
            source: SOURCE_FORMAT[language] || SOURCE_FORMAT.en
        };
    } catch (error) {
        console.error("Verse Lookup Error:", error);
        return fallback;
    }
}
