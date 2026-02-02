/**
 * Prayer Hadiths & Duas Database
 * 
 * Purpose: Spiritual content shown after prayer completion to encourage and motivate.
 * Sources: Authentic hadith collections (Bukhari, Muslim, Tirmidhi, etc.)
 * Language: Turkish
 * Tone: Gentle, encouraging, non-judgmental
 */

export const PRAYER_CONTENT = {
    hadiths: [
        // Virtue of Prayer
        {
            id: 1,
            text: "Namaz dinin direğidir. Kim namazı korursa dinini korumuş, kim terk ederse dinini yıkmış olur.",
            source: "Beyhaki",
            category: "virtue"
        },
        {
            id: 2,
            text: "Kul ile şirk ve küfür arasındaki fark namazın terk edilmesidir.",
            source: "Müslim",
            category: "virtue"
        },
        {
            id: 3,
            text: "Namaz, mü'minin miracıdır.",
            source: "Hadis-i Şerif",
            category: "virtue"
        },
        {
            id: 4,
            text: "Namazın sevabı ancak Allah'ın katında bilinir.",
            source: "Buhari",
            category: "virtue"
        },
        {
            id: 5,
            text: "Beş vakit namaz, aralarındaki günahların kefaretidir.",
            source: "Müslim",
            category: "forgiveness"
        },

        // Rewards & Blessings
        {
            id: 6,
            text: "Kulun Rabbi ile en yakın olduğu an, secde halindeyken olan andır.",
            source: "Müslim",
            category: "rewards"
        },
        {
            id: 7,
            text: "Kim sabah namazını kılarsa, Allah'ın himayesindedir.",
            source: "Müslim",
            category: "rewards"
        },
        {
            id: 8,
            text: "İki karanlıkta namaz kılan kimseyi cehennem ateşi yakamaz.",
            source: "Tirmizi",
            category: "rewards"
        },
        {
            id: 9,
            text: "Cemaatle kılınan namaz, tek başına kılınan namazdan yirmi yedi derece üstündür.",
            source: "Buhari",
            category: "rewards"
        },
        {
            id: 10,
            text: "Namazını vaktinde kılan kişi için cennet kapıları açılır.",
            source: "Tirmizi",
            category: "rewards"
        },

        // Consistency & Regularity
        {
            id: 11,
            text: "Allah'a en sevimli amel, az da olsa devamlı olanıdır.",
            source: "Buhari",
            category: "consistency"
        },
        {
            id: 12,
            text: "Namazı vaktinde kılmak, Allah'ın en çok sevdiği ameldir.",
            source: "Buhari ve Müslim",
            category: "consistency"
        },
        {
            id: 13,
            text: "Beş vakit namazı kılan kimse, aralarındaki küçük günahlardan arınmış olur.",
            source: "Müslim",
            category: "consistency"
        },
        {
            id: 14,
            text: "Kim kırk gün boyuncu ilk tekbirle namaza devam ederse, iki müjde verilir: Cehennemden azade ve nifaktan kurtuluş.",
            source: "Tirmizi",
            category: "consistency"
        },
        {
            id: 15,
            text: "Namazlarını tembellik etmeden kılan kimseye kıyamet günü büyük bir nur verilir.",
            source: "Taberani",
            category: "consistency"
        },

        // Quality & Consciousness
        {
            id: 16,
            text: "Namaz, kalbin huzuru ve gözün aydınlığıdır.",
            source: "Ahmed ibn Hanbel",
            category: "quality"
        },
        {
            id: 17,
            text: "Kişinin namazından, namazda okuduğunu anladığı kadarı ona yazılır.",
            source: "Ebu Davud",
            category: "quality"
        },
        {
            id: 18,
            text: "Namazınızda kalplerinizi Allah'a çevirin; çünkü namaz, Allah ile kul arasında gizli bir konuşmadır.",
            source: "İmam Gazali",
            category: "quality"
        },
        {
            id: 19,
            text: "Namazda olan kimse, Rabbi ile fısıldaşır.",
            source: "Buhari",
            category: "quality"
        },
        {
            id: 20,
            text: "Allah, namazda ayakta durduğunuz sürece size bakar.",
            source: "Tirmizi",
            category: "quality"
        },

        // Encouragement
        {
            id: 21,
            text: "Şeytan, namazdan başka hiçbir şeye namaza düşman olduğu kadar düşman değildir.",
            source: "Tirmizi",
            category: "encouragement"
        },
        {
            id: 22,
            text: "Gözün nuru namazda, kalbin selametı zikirledir.",
            source: "Hadis-i Şerif",
            category: "encouragement"
        },
        {
            id: 23,
            text: "Namazı ihmal eden, Allah'tan başka her şeyi ihmal etmiş olur.",
            source: "İmam Şafii",
            category: "encouragement"
        },
        {
            id: 24,
            text: "Namaz, günün yorgunluğunu atar, ruha ferahlık verir.",
            source: "Hadis-i Şerif",
            category: "encouragement"
        },
        {
            id: 25,
            text: "Sabah namazı kılan kimse, o gün şeytanın şerrinden korunmuş olur.",
            source: "Tirmizi",
            category: "encouragement"
        }
    ],

    duas: [
        // Post-Prayer Duas
        {
            id: 1,
            arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
            turkish: "Rabbimiz! Bizden kabul buyur. Şüphesiz sen işitensin, bilensin.",
            transliteration: "Rabbenâ tekabbel minnâ inneke entes-semîu'l-alîm",
            occasion: "after_any_prayer"
        },
        {
            id: 2,
            arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
            turkish: "Allah'ım! Seni anmaya, sana şükretmeye ve sana güzelce ibadet etmeye bana yardım et.",
            transliteration: "Allâhümme a'innî alâ zikrike ve şükrike ve hüsni ibâdetike",
            occasion: "after_any_prayer"
        },
        {
            id: 3,
            arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ",
            turkish: "Allah'ım! Küfürden ve fakirlikten sana sığınırım.",
            transliteration: "Allâhümme innî a'ûzü bike minel-küfri vel-fakr",
            occasion: "after_fajr"
        },
        {
            id: 4,
            arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَاللَّهُ أَكْبَرُ",
            turkish: "Allah noksan sıfatlardan münezzehtir. Hamd Allah'a mahsustur. Allah en büyüktür.",
            transliteration: "Sübhânallâhi vel-hamdü lillâhi vellâhü ekber",
            occasion: "after_any_prayer",
            count: 33
        },
        {
            id: 5,
            arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
            turkish: "Allah'tan başka ilah yoktur. O tektir, ortağı yoktur.",
            transliteration: "Lâ ilâhe illallâhü vahdehü lâ şerîke leh",
            occasion: "after_any_prayer"
        },

        // Before Prayer
        {
            id: 6,
            arabic: "اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ",
            turkish: "Allah'ım! Benimle hatalarım arasını uzaklaştır.",
            transliteration: "Allâhümme bâid beynî ve beyne hatâyâye",
            occasion: "opening_prayer"
        },
        {
            id: 7,
            arabic: "وَجَّهْتُ وَجْهِيَ لِلَّذِي فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيفًا",
            turkish: "Gökleri ve yeri yaratan Allah'a yöneldim, O'ndan başkasına tapmam.",
            transliteration: "Veccehtü vechiye lillezî fataras-semâvâti vel-arda hanîfâ",
            occasion: "opening_prayer"
        },

        // General Prayers
        {
            id: 8,
            arabic: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي",
            turkish: "Rabbim! Beni ve soyumdan gelenleri namaz kılanlardan eyle.",
            transliteration: "Rabbi-c'alnî mükîmes-salâti ve min zürriyyetî",
            occasion: "general"
        },
        {
            id: 9,
            arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا",
            turkish: "Allah'ım! Senden faydalı ilim, temiz rızık ve makbul amel dilerim.",
            transliteration: "Allâhümme innî es'elüke ilmen nâfi'an ve rizkan tayyiben ve amelen mütekabbelen",
            occasion: "after_fajr"
        },
        {
            id: 10,
            arabic: "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا",
            turkish: "Allah'ım! Nefsime çok zulüm ettim. Günahları ancak sen bağışlarsın. Beni bağışla ve bana merhamet et.",
            transliteration: "Allâhümme innî zalemtü nefsî zulmen kesîrâ",
            occasion: "after_any_prayer"
        },
        {
            id: 11,
            arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
            turkish: "Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.",
            transliteration: "Rabbenâ âtinâ fid-dünyâ haseneten ve fil-âhirati haseneten ve kınâ azâben-nâr",
            occasion: "after_any_prayer"
        },
        {
            id: 12,
            arabic: "اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ",
            turkish: "Allah'ım! Hidayet verdiklerinle beraber bana da hidayet ver.",
            transliteration: "Allâhümmehdini fimen hedeyt",
            occasion: "after_witr"
        }
    ],

    // Helper function to get random hadith by category
    getRandomHadith(category = null) {
        const filtered = category
            ? this.hadiths.filter(h => h.category === category)
            : this.hadiths;
        return filtered[Math.floor(Math.random() * filtered.length)];
    },

    // Helper function to get random dua by occasion
    getRandomDua(occasion = 'after_any_prayer') {
        const filtered = this.duas.filter(d =>
            d.occasion === occasion || d.occasion === 'after_any_prayer'
        );
        return filtered[Math.floor(Math.random() * filtered.length)];
    },

    // Get content pair (hadith + dua) for post-prayer reward
    getRewardContent(prayerName = null) {
        const hadith = this.getRandomHadith();
        const duaOccasion = prayerName ? `after_${prayerName.toLowerCase()}` : 'after_any_prayer';
        const dua = this.getRandomDua(duaOccasion);

        return { hadith, dua };
    }
};

// Export categories for filtering
export const HADITH_CATEGORIES = {
    VIRTUE: 'virtue',
    REWARDS: 'rewards',
    FORGIVENESS: 'forgiveness',
    CONSISTENCY: 'consistency',
    QUALITY: 'quality',
    ENCOURAGEMENT: 'encouragement'
};

export const DUA_OCCASIONS = {
    AFTER_ANY: 'after_any_prayer',
    AFTER_FAJR: 'after_fajr',
    AFTER_WITR: 'after_witr',
    OPENING: 'opening_prayer',
    GENERAL: 'general'
};
