/**
 * Verse Lookup Service
 * Fetches verified verse text from Alquran.cloud API.
 * Supports Turkish (Diyanet), English (Sahih International), German (Bubenheim) and Russian (Kuliev) translations.
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

const FALLBACK_VERSE_DE = {
    surahId: 94,
    verseNumber: 5,
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "Wahrlich, mit der Schwierigkeit kommt die Erleichterung.",
    source: "Sure Al-Inshirah, Vers 5"
};

const FALLBACK_VERSE_RU = {
    surahId: 94,
    verseNumber: 5,
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "Поистине, с трудностью приходит облегчение.",
    source: "Сура Аш-Шарх, аят 5"
};

const FALLBACK_VERSE_AR = {
    surahId: 94,
    verseNumber: 5,
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "فإنّ مع العسر يسراً.",
    source: "سورة الشرح، الآية 5"
};

const FALLBACK_VERSE_AZ = {
    surahId: 94,
    verseNumber: 5,
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "Həqiqətən, hər çətinliklə birlikdə bir asanlıq vardır.",
    source: "İnşirah surəsi, 5-ci ayə"
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

// Russian surah names lookup
const SURAH_NAMES_RU = {
    1: 'Аль-Фатиха', 2: 'Аль-Бакара', 3: 'Аль Имран', 4: 'Ан-Ниса', 5: 'Аль-Маида',
    6: 'Аль-Анам', 7: 'Аль-Араф', 8: 'Аль-Анфаль', 9: 'Ат-Тауба', 10: 'Юнус',
    11: 'Худ', 12: 'Юсуф', 13: 'Ар-Раад', 14: 'Ибрахим', 15: 'Аль-Хиджр',
    16: 'Ан-Нахль', 17: 'Аль-Исра', 18: 'Аль-Кахф', 19: 'Марьям', 20: 'Та-Ха',
    21: 'Аль-Анбия', 22: 'Аль-Хадж', 23: 'Аль-Муминун', 24: 'Ан-Нур', 25: 'Аль-Фуркан',
    26: 'Аш-Шуара', 27: 'Ан-Намль', 28: 'Аль-Касас', 29: 'Аль-Анкабут', 30: 'Ар-Рум',
    31: 'Лукман', 32: 'Ас-Саджда', 33: 'Аль-Ахзаб', 34: 'Саба', 35: 'Фатыр',
    36: 'Ясин', 37: 'Ас-Саффат', 38: 'Сад', 39: 'Аз-Зумар', 40: 'Гафир',
    41: 'Фуссилат', 42: 'Аш-Шура', 43: 'Аз-Зухруф', 44: 'Ад-Духан', 45: 'Аль-Джасия',
    46: 'Аль-Ахкаф', 47: 'Мухаммад', 48: 'Аль-Фатх', 49: 'Аль-Худжурат', 50: 'Каф',
    51: 'Аз-Зарият', 52: 'Ат-Тур', 53: 'Ан-Наджм', 54: 'Аль-Камар', 55: 'Ар-Рахман',
    56: 'Аль-Вакиа', 57: 'Аль-Хадид', 58: 'Аль-Муджадала', 59: 'Аль-Хашр', 60: 'Аль-Мумтахана',
    61: 'Ас-Сафф', 62: 'Аль-Джума', 63: 'Аль-Мунафикун', 64: 'Ат-Тагабун', 65: 'Ат-Талак',
    66: 'Ат-Тахрим', 67: 'Аль-Мульк', 68: 'Аль-Калям', 69: 'Аль-Хакка', 70: 'Аль-Мааридж',
    71: 'Нух', 72: 'Аль-Джинн', 73: 'Аль-Муззаммиль', 74: 'Аль-Муддассир', 75: 'Аль-Кияма',
    76: 'Аль-Инсан', 77: 'Аль-Мурсалят', 78: 'Ан-Наба', 79: 'Ан-Назиат', 80: 'Абаса',
    81: 'Ат-Таквир', 82: 'Аль-Инфитар', 83: 'Аль-Мутаффифин', 84: 'Аль-Иншикак', 85: 'Аль-Бурудж',
    86: 'Ат-Тарик', 87: 'Аль-Аля', 88: 'Аль-Гашия', 89: 'Аль-Фаджр', 90: 'Аль-Балад',
    91: 'Аш-Шамс', 92: 'Аль-Лейль', 93: 'Ад-Духа', 94: 'Аш-Шарх', 95: 'Ат-Тин',
    96: 'Аль-Алак', 97: 'Аль-Кадр', 98: 'Аль-Баййина', 99: 'Аз-Залзала', 100: 'Аль-Адият',
    101: 'Аль-Кариа', 102: 'Ат-Такасур', 103: 'Аль-Аср', 104: 'Аль-Хумаза', 105: 'Аль-Филь',
    106: 'Курайш', 107: 'Аль-Маун', 108: 'Аль-Каусар', 109: 'Аль-Кафирун', 110: 'Ан-Наср',
    111: 'Аль-Масад', 112: 'Аль-Ихлас', 113: 'Аль-Фалак', 114: 'Ан-Нас'
};

// Arabic surah names lookup
const SURAH_NAMES_AR = {
    1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
    6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
    11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
    16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
    21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
    26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
    31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبأ', 35: 'فاطر',
    36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
    41: 'فصّلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
    46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
    51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
    56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
    61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
    66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
    71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
    76: 'الإنسان', 77: 'المرسلات', 78: 'النبأ', 79: 'النازعات', 80: 'عبس',
    81: 'التكوير', 82: 'الانفطار', 83: 'المطففين', 84: 'الانشقاق', 85: 'البروج',
    86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
    91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
    96: 'العلق', 97: 'القدر', 98: 'البيّنة', 99: 'الزلزلة', 100: 'العاديات',
    101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
    106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
    111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس'
};

// Azerbaijani surah names lookup
const SURAH_NAMES_AZ = {
    1: 'Fatihə', 2: 'Bəqərə', 3: 'Ali İmran', 4: 'Nisa', 5: 'Maidə',
    6: 'Ənam', 7: 'Əraf', 8: 'Ənfal', 9: 'Tövbə', 10: 'Yunus',
    11: 'Hud', 12: 'Yusif', 13: 'Rəd', 14: 'İbrahim', 15: 'Hicr',
    16: 'Nəhl', 17: 'İsra', 18: 'Kəhf', 19: 'Məryəm', 20: 'Taha',
    21: 'Ənbiya', 22: 'Həcc', 23: 'Möminun', 24: 'Nur', 25: 'Furqan',
    26: 'Şüəra', 27: 'Nəml', 28: 'Qəsəs', 29: 'Ənkəbut', 30: 'Rum',
    31: 'Loqman', 32: 'Səcdə', 33: 'Əhzab', 34: 'Səba', 35: 'Fatir',
    36: 'Yasin', 37: 'Saffat', 38: 'Sad', 39: 'Zumər', 40: 'Mömin',
    41: 'Fussilət', 42: 'Şura', 43: 'Zuxruf', 44: 'Duxan', 45: 'Casiyə',
    46: 'Əhqaf', 47: 'Muhəmməd', 48: 'Fəth', 49: 'Hucurat', 50: 'Qaf',
    51: 'Zariyat', 52: 'Tur', 53: 'Nəcm', 54: 'Qəmər', 55: 'Rəhman',
    56: 'Vaqiə', 57: 'Hədid', 58: 'Mücadilə', 59: 'Həşr', 60: 'Mumtəhinə',
    61: 'Saff', 62: 'Cumə', 63: 'Munafiqun', 64: 'Təğabun', 65: 'Talaq',
    66: 'Təhrim', 67: 'Mulk', 68: 'Qələm', 69: 'Haqqə', 70: 'Məaric',
    71: 'Nuh', 72: 'Cinn', 73: 'Muzzəmmil', 74: 'Muddəssir', 75: 'Qiyamə',
    76: 'İnsan', 77: 'Mursəlat', 78: 'Nəbə', 79: 'Naziat', 80: 'Əbəsə',
    81: 'Təkvir', 82: 'İnfitar', 83: 'Mutəffifin', 84: 'İnşiqaq', 85: 'Buruc',
    86: 'Tariq', 87: 'Əla', 88: 'Ğaşiyə', 89: 'Fəcr', 90: 'Bələd',
    91: 'Şəms', 92: 'Leyl', 93: 'Zuha', 94: 'İnşirah', 95: 'Tin',
    96: 'Ələq', 97: 'Qədr', 98: 'Bəyyinə', 99: 'Zəlzələ', 100: 'Adiyat',
    101: 'Qariə', 102: 'Təkasur', 103: 'Əsr', 104: 'Huməzə', 105: 'Fil',
    106: 'Qureyş', 107: 'Maun', 108: 'Kövsər', 109: 'Kafirun', 110: 'Nəsr',
    111: 'Təbbət', 112: 'İxlas', 113: 'Fələq', 114: 'Nas'
};

/**
 * Fetches verse Arabic text + translation from Alquran.cloud API.
 * @param {Object} quranRef - { surah, verse } from AI
 * @param {string} language - 'en', 'tr', 'de', or 'ru'
 */
export async function getVerifiedVerse(quranRef, language = 'tr') {
    // Language-indexed maps for API editions and surah name sets
    const EDITION_MAP = { tr: 'tr.diyanet', en: 'en.sahih', de: 'de.bubenheim', ru: 'ru.kuliev', ar: 'ar.muyassar', az: 'az.musayev' };
    const NAMES_MAP = { tr: SURAH_NAMES_TR, en: SURAH_NAMES_EN, ru: SURAH_NAMES_RU, ar: SURAH_NAMES_AR, az: SURAH_NAMES_AZ };
    const FALLBACK_MAP = { tr: FALLBACK_VERSE_TR, en: FALLBACK_VERSE_EN, de: FALLBACK_VERSE_DE, ru: FALLBACK_VERSE_RU, ar: FALLBACK_VERSE_AR, az: FALLBACK_VERSE_AZ };

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
            en: `Surah ${surahName}, Verse ${verse}`,
            de: `Sure ${surahName}, Vers ${verse}`,
            ru: `Сура ${surahName}, аят ${verse}`,
            ar: `سورة ${surahName}، الآية ${verse}`,
            az: `${surahName} surəsi, ${verse}-ci ayə`
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
