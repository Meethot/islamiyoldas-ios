/**
 * Verse Lookup Service
 * Fetches verified verse text from Alquran.cloud API.
 * Uses Diyanet Turkish translation.
 */

const FALLBACK_VERSE = {
    surahId: 94,
    verseNumber: 5,
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "Elbette zorluğun yanında bir kolaylık vardır.",
    source: "İnşirah Suresi, 5. Ayet"
};

// Turkish surah names lookup
const SURAH_NAMES = {
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

/**
 * Fetches verse Arabic text + Turkish translation from Alquran.cloud API.
 * @param {Object} quranRef - { surah, verse } from AI
 */
export async function getVerifiedVerse(quranRef) {
    if (!quranRef || !quranRef.surah || !quranRef.verse) {
        return FALLBACK_VERSE;
    }

    const surah = parseInt(quranRef.surah);
    const verse = parseInt(quranRef.verse);

    if (isNaN(surah) || isNaN(verse) || surah < 1 || surah > 114) {
        return FALLBACK_VERSE;
    }

    try {
        // Fetch Arabic and Turkish translation in parallel
        const [arabicRes, trRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}`),
            fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/tr.diyanet`)
        ]);

        if (!arabicRes.ok || !trRes.ok) {
            return FALLBACK_VERSE;
        }

        const [arabicData, trData] = await Promise.all([
            arabicRes.json(),
            trRes.json()
        ]);

        const arabicText = arabicData.data?.text;
        const turkishText = trData.data?.text;

        if (!arabicText || !turkishText) {
            return FALLBACK_VERSE;
        }

        const surahName = SURAH_NAMES[surah] || `Sure ${surah}`;

        return {
            surahId: surah,
            verseNumber: verse,
            arabic: arabicText,
            translation: turkishText,
            source: `${surahName} Suresi, ${verse}. Ayet`
        };
    } catch (error) {
        console.error("Verse Lookup Error:", error);
        return FALLBACK_VERSE;
    }
}
