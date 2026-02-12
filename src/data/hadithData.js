/**
 * Prayer Hadiths & Duas Database
 * 
 * Purpose: Spiritual content shown after prayer completion to encourage and motivate.
 * Sources: Authentic hadith collections (Bukhari, Muslim, Tirmidhi, etc.)
 * Language: Trilingual (Turkish, English & German)
 * Tone: Gentle, encouraging, non-judgmental
 */

import { HADITH_DE, DUA_DE } from './hadithDE';

const _hadiths = [
    // Virtue of Prayer
    {
        id: 1,
        text: "Namaz dinin direğidir. Kim namazı korursa dinini korumuş, kim terk ederse dinini yıkmış olur.",
        textEn: "Prayer is the pillar of religion. Whoever upholds it has upheld religion, and whoever abandons it has destroyed religion.",
        source: "Beyhaki",
        sourceEn: "Bayhaqi",
        category: "virtue"
    },
    {
        id: 2,
        text: "Kul ile şirk ve küfür arasındaki fark namazın terk edilmesidir.",
        textEn: "The difference between a servant and disbelief is the abandonment of prayer.",
        source: "Müslim",
        sourceEn: "Muslim",
        category: "virtue"
    },
    {
        id: 3,
        text: "Namaz, mü'minin miracıdır.",
        textEn: "Prayer is the ascension (Mi'raj) of the believer.",
        source: "Hadis-i Şerif",
        sourceEn: "Hadith",
        category: "virtue"
    },
    {
        id: 4,
        text: "Namazın sevabı ancak Allah'ın katında bilinir.",
        textEn: "The reward of prayer is known only to Allah.",
        source: "Buhari",
        sourceEn: "Bukhari",
        category: "virtue"
    },
    {
        id: 5,
        text: "Beş vakit namaz, aralarındaki günahların kefaretidir.",
        textEn: "The five daily prayers are an expiation for the sins committed between them.",
        source: "Müslim",
        sourceEn: "Muslim",
        category: "forgiveness"
    },

    // Rewards & Blessings
    {
        id: 6,
        text: "Kulun Rabbi ile en yakın olduğu an, secde halindeyken olan andır.",
        textEn: "The closest a servant is to his Lord is when he is in prostration.",
        source: "Müslim",
        sourceEn: "Muslim",
        category: "rewards"
    },
    {
        id: 7,
        text: "Kim sabah namazını kılarsa, Allah'ın himayesindedir.",
        textEn: "Whoever prays the Fajr prayer is under the protection of Allah.",
        source: "Müslim",
        sourceEn: "Muslim",
        category: "rewards"
    },
    {
        id: 8,
        text: "İki karanlıkta namaz kılan kimseyi cehennem ateşi yakamaz.",
        textEn: "The fire of Hell shall not touch the one who prays in the two darknesses (Fajr and Isha).",
        source: "Tirmizi",
        sourceEn: "Tirmidhi",
        category: "rewards"
    },
    {
        id: 9,
        text: "Cemaatle kılınan namaz, tek başına kılınan namazdan yirmi yedi derece üstündür.",
        textEn: "Prayer performed in congregation is twenty-seven degrees superior to prayer performed individually.",
        source: "Buhari",
        sourceEn: "Bukhari",
        category: "rewards"
    },
    {
        id: 10,
        text: "Namazını vaktinde kılan kişi için cennet kapıları açılır.",
        textEn: "The gates of Paradise are opened for the one who prays on time.",
        source: "Tirmizi",
        sourceEn: "Tirmidhi",
        category: "rewards"
    },

    // Consistency & Regularity
    {
        id: 11,
        text: "Allah'a en sevimli amel, az da olsa devamlı olanıdır.",
        textEn: "The most beloved deed to Allah is the most consistent, even if it is small.",
        source: "Buhari",
        sourceEn: "Bukhari",
        category: "consistency"
    },
    {
        id: 12,
        text: "Namazı vaktinde kılmak, Allah'ın en çok sevdiği ameldir.",
        textEn: "Praying on time is the deed most beloved to Allah.",
        source: "Buhari ve Müslim",
        sourceEn: "Bukhari & Muslim",
        category: "consistency"
    },
    {
        id: 13,
        text: "Beş vakit namazı kılan kimse, aralarındaki küçük günahlardan arınmış olur.",
        textEn: "Whoever performs the five daily prayers is cleansed of the minor sins committed between them.",
        source: "Müslim",
        sourceEn: "Muslim",
        category: "consistency"
    },
    {
        id: 14,
        text: "Kim kırk gün boyuncu ilk tekbirle namaza devam ederse, iki müjde verilir: Cehennemden azade ve nifaktan kurtuluş.",
        textEn: "Whoever attends the opening takbir of prayer for forty consecutive days is granted two glad tidings: freedom from Hell and freedom from hypocrisy.",
        source: "Tirmizi",
        sourceEn: "Tirmidhi",
        category: "consistency"
    },
    {
        id: 15,
        text: "Namazlarını tembellik etmeden kılan kimseye kıyamet günü büyük bir nur verilir.",
        textEn: "On the Day of Judgment, a great light will be given to the one who performs prayers without laziness.",
        source: "Taberani",
        sourceEn: "Tabarani",
        category: "consistency"
    },

    // Quality & Consciousness
    {
        id: 16,
        text: "Namaz, kalbin huzuru ve gözün aydınlığıdır.",
        textEn: "Prayer is the tranquility of the heart and the light of the eyes.",
        source: "Ahmed ibn Hanbel",
        sourceEn: "Ahmad ibn Hanbal",
        category: "quality"
    },
    {
        id: 17,
        text: "Kişinin namazından, namazda okuduğunu anladığı kadarı ona yazılır.",
        textEn: "A person is rewarded from their prayer only as much as they understood of what they recited.",
        source: "Ebu Davud",
        sourceEn: "Abu Dawud",
        category: "quality"
    },
    {
        id: 18,
        text: "Namazınızda kalplerinizi Allah'a çevirin; çünkü namaz, Allah ile kul arasında gizli bir konuşmadır.",
        textEn: "Turn your hearts to Allah in prayer, for prayer is a private conversation between the servant and Allah.",
        source: "İmam Gazali",
        sourceEn: "Imam Al-Ghazali",
        category: "quality"
    },
    {
        id: 19,
        text: "Namazda olan kimse, Rabbi ile fısıldaşır.",
        textEn: "The one who is in prayer whispers to his Lord.",
        source: "Buhari",
        sourceEn: "Bukhari",
        category: "quality"
    },
    {
        id: 20,
        text: "Allah, namazda ayakta durduğunuz sürece size bakar.",
        textEn: "Allah looks at you as long as you are standing in prayer.",
        source: "Tirmizi",
        sourceEn: "Tirmidhi",
        category: "quality"
    },

    // Encouragement
    {
        id: 21,
        text: "Şeytan, namazdan başka hiçbir şeye namaza düşman olduğu kadar düşman değildir.",
        textEn: "Satan is not an enemy to anything as much as he is an enemy to prayer.",
        source: "Tirmizi",
        sourceEn: "Tirmidhi",
        category: "encouragement"
    },
    {
        id: 22,
        text: "Gözün nuru namazda, kalbin selametı zikirledir.",
        textEn: "The light of the eye is in prayer, and the peace of the heart is in remembrance of Allah.",
        source: "Hadis-i Şerif",
        sourceEn: "Hadith",
        category: "encouragement"
    },
    {
        id: 23,
        text: "Namazı ihmal eden, Allah'tan başka her şeyi ihmal etmiş olur.",
        textEn: "Whoever neglects prayer has neglected everything except Allah.",
        source: "İmam Şafii",
        sourceEn: "Imam Ash-Shafi'i",
        category: "encouragement"
    },
    {
        id: 24,
        text: "Namaz, günün yorgunluğunu atar, ruha ferahlık verir.",
        textEn: "Prayer relieves the weariness of the day and brings comfort to the soul.",
        source: "Hadis-i Şerif",
        sourceEn: "Hadith",
        category: "encouragement"
    },
    {
        id: 25,
        text: "Sabah namazı kılan kimse, o gün şeytanın şerrinden korunmuş olur.",
        textEn: "Whoever prays the Fajr prayer is protected from the evil of Satan on that day.",
        source: "Tirmizi",
        sourceEn: "Tirmidhi",
        category: "encouragement"
    }
];

const _duas = [
    { id: 1, arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ", turkish: "Rabbimiz! Bizden kabul buyur. Şüphesiz sen işitensin, bilensin.", english: "Our Lord! Accept from us. Indeed, You are the All-Hearing, the All-Knowing.", transliteration: "Rabbenâ tekabbel minnâ inneke entes-semîu'l-alîm", occasion: "after_any_prayer" },
    { id: 2, arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", turkish: "Allah'ım! Seni anmaya, sana şükretmeye ve sana güzelce ibadet etmeye bana yardım et.", english: "O Allah! Help me to remember You, to be grateful to You, and to worship You in the best way.", transliteration: "Allâhümme a'innî alâ zikrike ve şükrike ve hüsni ibâdetike", occasion: "after_any_prayer" },
    { id: 3, arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ", turkish: "Allah'ım! Küfürden ve fakirlikten sana sığınırım.", english: "O Allah! I seek refuge in You from disbelief and poverty.", transliteration: "Allâhümme innî a'ûzü bike minel-küfri vel-fakr", occasion: "after_fajr" },
    { id: 4, arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَاللَّهُ أَكْبَرُ", turkish: "Allah noksan sıfatlardan münezzehtir. Hamd Allah'a mahsustur. Allah en büyüktür.", english: "Glory be to Allah. All praise is due to Allah. Allah is the Greatest.", transliteration: "Sübhânallâhi vel-hamdü lillâhi vellâhü ekber", occasion: "after_any_prayer", count: 33 },
    { id: 5, arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ", turkish: "Allah'tan başka ilah yoktur. O tektir, ortağı yoktur.", english: "There is no god but Allah, alone, without any partner.", transliteration: "Lâ ilâhe illallâhü vahdehü lâ şerîke leh", occasion: "after_any_prayer" },
    { id: 6, arabic: "اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ", turkish: "Allah'ım! Benimle hatalarım arasını uzaklaştır.", english: "O Allah! Distance me from my sins.", transliteration: "Allâhümme bâid beynî ve beyne hatâyâye", occasion: "opening_prayer" },
    { id: 7, arabic: "وَجَّهْتُ وَجْهِيَ لِلَّذِي فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيفًا", turkish: "Gökleri ve yeri yaratan Allah'a yöneldim, O'ndan başkasına tapmam.", english: "I have turned my face to the One who created the heavens and the earth, and I worship none other than Him.", transliteration: "Veccehtü vechiye lillezî fataras-semâvâti vel-arda hanîfâ", occasion: "opening_prayer" },
    { id: 8, arabic: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي", turkish: "Rabbim! Beni ve soyumdan gelenleri namaz kılanlardan eyle.", english: "My Lord! Make me and my descendants those who establish prayer.", transliteration: "Rabbi-c'alnî mükîmes-salâti ve min zürriyyetî", occasion: "general" },
    { id: 9, arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا", turkish: "Allah'ım! Senden faydalı ilim, temiz rızık ve makbul amel dilerim.", english: "O Allah! I ask You for beneficial knowledge, wholesome provision, and accepted deeds.", transliteration: "Allâhümme innî es'elüke ilmen nâfi'an ve rizkan tayyiben ve amelen mütekabbelen", occasion: "after_fajr" },
    { id: 10, arabic: "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا", turkish: "Allah'ım! Nefsime çok zulüm ettim. Günahları ancak sen bağışlarsın. Beni bağışla ve bana merhamet et.", english: "O Allah! I have greatly wronged myself. None forgives sins except You. Forgive me and have mercy on me.", transliteration: "Allâhümme innî zalemtü nefsî zulmen kesîrâ", occasion: "after_any_prayer" },
    { id: 11, arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", turkish: "Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.", english: "Our Lord! Grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.", transliteration: "Rabbenâ âtinâ fid-dünyâ haseneten ve fil-âhirati haseneten ve kınâ azâben-nâr", occasion: "after_any_prayer" },
    { id: 12, arabic: "اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ", turkish: "Allah'ım! Hidayet verdiklerinle beraber bana da hidayet ver.", english: "O Allah! Guide me among those whom You have guided.", transliteration: "Allâhümmehdini fimen hedeyt", occasion: "after_witr" },
];

// Merge German translations
const mergedHadiths = _hadiths.map(h => ({ ...h, ...(HADITH_DE[h.id] || {}) }));
const mergedDuas = _duas.map(d => ({ ...d, ...(DUA_DE[d.id] || {}) }));

export const PRAYER_CONTENT = {
    hadiths: mergedHadiths,
    duas: mergedDuas,
    getRandomHadith(category = null) {
        const filtered = category ? this.hadiths.filter(h => h.category === category) : this.hadiths;
        return filtered[Math.floor(Math.random() * filtered.length)];
    },
    getRandomDua(occasion = 'after_any_prayer') {
        const filtered = this.duas.filter(d => d.occasion === occasion || d.occasion === 'after_any_prayer');
        return filtered[Math.floor(Math.random() * filtered.length)];
    },
    getRewardContent(prayerName = null) {
        const hadith = this.getRandomHadith();
        const duaOccasion = prayerName ? `after_${prayerName.toLowerCase()}` : 'after_any_prayer';
        const dua = this.getRandomDua(duaOccasion);
        return { hadith, dua };
    }
};

export const HADITH_CATEGORIES = { VIRTUE: 'virtue', REWARDS: 'rewards', FORGIVENESS: 'forgiveness', CONSISTENCY: 'consistency', QUALITY: 'quality', ENCOURAGEMENT: 'encouragement' };
export const DUA_OCCASIONS = { AFTER_ANY: 'after_any_prayer', AFTER_FAJR: 'after_fajr', AFTER_WITR: 'after_witr', OPENING: 'opening_prayer', GENERAL: 'general' };
