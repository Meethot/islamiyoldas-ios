/**
 * Dua etiketleri — Öğren > Dualar rafının bilgi mimarisi.
 *
 * Her dua bir bölüme (`group`) ait ve ücretsiz mi (`free`) burada yazar.
 * Arama için Türkçe/İngilizce takma adlar (`aliases`) eklenebilir — kullanıcı
 * "4444" ya da "ayetel kürsi" yazdığında başlıkta geçmeyen duayı bulsun diye.
 *
 * ANAHTAR NEDEN ARAPÇA METİN: dil dosyalarında dua sayısı ve sırası farklı
 * (tr/az 50, en/de/ru/ar 49). İndekse bağlanan her şey (grup, kota, favori)
 * dil değişince kayardı. Arapça metin altı dilde de aynı.
 */

/**
 * Arapça metni anahtar biçimine indirger: hareke, noktalama ve harf
 * varyantları atılır, ilk 24 harf alınır. Favoriler ve premium kotası bu
 * anahtara bağlı — değiştirilirse ikisi de sessizce kayar.
 */
export function duaKey(arabic) {
    if (typeof arabic !== 'string') return '';
    return arabic
        .normalize('NFC')
        .replace(/[ً-ْٰٓ-ٕـ]/g, '')
        .replace(/[^ء-ي]/g, '')
        .replace(/[أإآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .slice(0, 24);
}

/** Bölümlerin ekrandaki sırası. `other` sadece emniyet supabı — normalde boş. */
export const DUA_GROUP_ORDER = ['daily', 'hardship', 'protect', 'prayer', 'repent', 'salawat', 'request', 'other'];

/** Bölüm adları locale'de: learn.json `groupDaily`, `groupHardship`, ... */
export const DUA_GROUP_LABEL_KEY = {
    daily: 'groupDaily',
    hardship: 'groupHardship',
    protect: 'groupProtect',
    prayer: 'groupPrayer',
    repent: 'groupRepent',
    salawat: 'groupSalawat',
    request: 'groupRequest',
    other: 'groupOther',
};

export const DUA_TAGS = {
    // ── Günlük hayat ──
    'بسماللهتوكلتعلياللهلاحول': { group: 'daily', free: false },
    'بسماللهاللهمباركلنافيمار': { group: 'daily', free: true },
    'الحمدللهالذياطعمناوسقانا': { group: 'daily', free: false },
    'الحمدللهالذياحيانابعدماا': { group: 'daily', free: true },
    'باسمكاللهماموتواحيا': { group: 'daily', free: false },
    'سبحانالذيسخرلناهذاوماكنا': { group: 'daily', free: false, aliases: { tr: ['araba', 'uçak', 'seyahat', 'yol'], en: ['travel', 'journey', 'car'] } },
    'اللهمانياسالكخيرالمولجوخ': { group: 'daily', free: false },
    'اللهمافتحليابوابرحمتك': { group: 'daily', free: false },
    'اللهمانياعوذبكمنالخبثوال': { group: 'daily', free: false },
    'اللهمكماحسنتخلقيفحسنخلقي': { group: 'daily', free: false },

    'اللهمانياسالكمنفضلك': { group: 'daily', free: false, aliases: { tr: ["camiden çıkma"], en: ["leaving mosque"] } },   // Camiden Çıkarken
    'الحمدللهالذيكسانيهذاورزق': { group: 'daily', free: false, aliases: { tr: ["giyinme", "kıyafet"], en: ["clothes", "dressing"] } },   // Elbise Giyerken
    'اللهماهلهعليناباليمنوالا': { group: 'daily', free: false, aliases: { tr: ["hilal", "yeni ay", "ayın ilk günü"], en: ["new moon", "crescent"] } },   // Hilâli Görünce
    'لاالهالااللهوحدهلاشريكله': { group: 'daily', free: false, aliases: { tr: ["market", "alışveriş", "çarşı"], en: ["market", "shopping"] } },   // Çarşıya Girerken

    // ── Sıkıntı ve şifa ──
    'اللهمانياعوذبكمنالهموالح': { group: 'hardship', free: true, aliases: { tr: ['para', 'geçim', 'kredi', 'borç'], en: ['debt', 'money', 'loan'] } },
    'حسبنااللهونعمالوكيل': { group: 'hardship', free: true },
    'لاالهالاانتسبحانكانيكنتم': { group: 'hardship', free: true },
    'اذهبالباسربالناساشفانتال': { group: 'hardship', free: false, aliases: { tr: ['hasta', 'hastalık', 'iyileşme', 'şifa'], en: ['healing', 'sick', 'illness'] } },
    'انيمسنيالضروانتارحمالراح': { group: 'hardship', free: false },
    'لاالهالااللهالعظيمالحليم': { group: 'hardship', free: false },
    'بسماللهاعوذباللهوقدرتهمن': { group: 'hardship', free: false, aliases: { tr: ['ağrı', 'acı'], en: ['pain', 'ache'] } },
    'اعوذبكلماتاللهالتاماتمنش': { group: 'hardship', free: false },
    'اللهمياربجبراييلوميكاييل': { group: 'hardship', free: false, aliases: { tr: ['rızık', 'karınca', 'bolluk', 'bereket'], en: ['rizq', 'provision', 'sustenance'] } },

    'لاباسطهورانشاءالله': { group: 'hardship', free: false, aliases: { tr: ["hasta ziyareti", "geçmiş olsun"], en: ["visiting the sick"] } },   // Hasta Ziyaretinde
    'اناللهوانااليهراجعونالله': { group: 'hardship', free: false, aliases: { tr: ["ölüm", "kayıp", "başsağlığı", "musibet"], en: ["calamity", "loss", "grief"] } },   // Musibet Anında
    'ياحيياقيومبرحمتكاستغيثاص': { group: 'hardship', free: false, aliases: { tr: ["üzüntü", "depresyon", "keder", "sıkıntı"], en: ["sadness", "distress", "anxiety"] } },   // Üzüntü ve Keder Anında

    // ── Korunma ──
    'وانيكادالذينكفرواليزلقون': { group: 'protect', free: true, aliases: { tr: ['nazar', 'göz değmesi', 'kem göz'], en: ['evil eye', 'envy'] } },
    'بسماللهالذيلايضرمعاسمهشي': { group: 'protect', free: false },
    'امنتباللهورسله': { group: 'protect', free: false, aliases: { tr: ['vesvese', 'şeytan'], en: ['whisper', 'satan'] } },
    'اللهلاالهالاهوالحيالقيوم': { group: 'protect', free: false, aliases: { tr: ['ayetel kürsi', 'ayet el kürsi', 'kürsi', 'koruma ayeti'], en: ['ayatul kursi', 'throne verse'] } },

    'اعوذباللهمنالشيطانالرجيم': { group: 'protect', free: false, aliases: { tr: ["eûzü besmele", "şeytandan sığınma"], en: ["seeking refuge", "isti adha"] } },   // Şeytandan Sığınma (Eûzü)
    'اعوذباللهمنالشيطانومنشرم': { group: 'protect', free: false, aliases: { tr: ["kabus", "kötü rüya", "uyku korkusu"], en: ["nightmare", "bad dream"] } },   // Kötü Rüya Görünce
    'اعيذكمابكلماتاللهالتامهم': { group: 'protect', free: false, aliases: { tr: ["çocuk", "bebek", "evlat koruma"], en: ["children", "protection for kids"] } },   // Çocuklar İçin Koruma

    // ── Namazda okunanlar ──
    'سبحانكاللهموبحمدكوتباركا': { group: 'prayer', free: true, aliases: { tr: ['namaz duaları', 'namazda okunan'], en: ['prayer duas', 'salah duas'] } },
    'التحياتللهوالصلواتوالطيب': { group: 'prayer', free: false, aliases: { tr: ['namaz duaları', 'tahiyyat', 'teşehhüd'], en: ['tashahhud', 'prayer duas'] } },
    'اللهمصلعليمحمدوعليالمحمد': { group: 'prayer', free: false, aliases: { tr: ['namaz duaları', 'salli barik'], en: ['salli', 'prayer duas'] } },
    'اللهمباركعليمحمدوعليالمح': { group: 'prayer', free: false, aliases: { tr: ['namaz duaları', 'salli barik'], en: ['barik', 'prayer duas'] } },
    'ربنالاتواخذنااننسينااواخ': { group: 'prayer', free: false, aliases: { tr: ['amenerrasulü', 'bakara 286'], en: ['amanar rasulu'] } },
    'اللهمانانستعينكونستغفركو': { group: 'prayer', free: false, aliases: { tr: ['vitir', 'vitr', 'kunut'], en: ['witr', 'qunut'] } },
    'اللهماغفرلحيناوميتناوشاه': { group: 'prayer', free: false, aliases: { tr: ['ölüm', 'vefat', 'defin', 'taziye'], en: ['funeral', 'death', 'janazah'] } },

    'سبحانربيالعظيم': { group: 'prayer', free: false, aliases: { tr: ["rükû", "ruku tesbihi"], en: ["ruku", "bowing"] } },   // Rükû Tesbihi
    'سبحانربيالاعلي': { group: 'prayer', free: false, aliases: { tr: ["secde", "secde tesbihi"], en: ["sujood", "prostration"] } },   // Secde Tesbihi
    'رباغفرليوارحمنيواهدنيوعا': { group: 'prayer', free: false, aliases: { tr: ["celse", "iki secde arası"], en: ["between prostrations"] } },   // İki Secde Arasında

    // ── Tövbe ve iman ──
    'اللهمانكعفوتحبالعفوفاعفع': { group: 'repent', free: true, aliases: { tr: ['kandil', 'kadir gecesi', 'ramazan'], en: ['laylat al qadr'] } },
    'اللهمانتربيلاالهالاانتخل': { group: 'repent', free: true, aliases: { tr: ['tövbe', 'estağfurullah'], en: ['repentance', 'forgiveness'] } },
    'ربناظلمناانفسناوانلمتغفر': { group: 'repent', free: true },
    'ربنااغفرليولوالديوللمومن': { group: 'repent', free: false, aliases: { tr: ['anne baba', 'ana baba'], en: ['parents'] } },
    'استغفراللهالعظيمواتوبالي': { group: 'repent', free: false, aliases: { tr: ['istiğfar', 'estağfurullah'], en: ['istighfar'] } },
    'ربنالاتزغقلوبنابعداذهديت': { group: 'repent', free: false },
    'اللهمانتالسلامومنكالسلام': { group: 'repent', free: false },
    'اشهدانلاالهالااللهواشهدا': { group: 'repent', free: false, aliases: { tr: ['kelime-i şehadet', 'şehadet'], en: ['shahada'] } },
    'لاالهالااللهمحمدرسولالله': { group: 'repent', free: false, aliases: { tr: ['kelime-i tevhid', 'tevhid'], en: ['tawhid'] } },

    'استغفراللهالذيلاالهالاهو': { group: 'repent', free: false, aliases: { tr: ["uzun istiğfar", "tevbe"], en: ["long istighfar"] } },   // Uzun İstiğfar
    'اللهماغفرليذنبيكلهدقهوجل': { group: 'repent', free: false, aliases: { tr: ["günah", "tövbe", "af dileme"], en: ["sin", "repentance"] } },   // Günahtan Sonra Tövbe

    // ── Salavatlar ──
    'اللهمصلعليسيدنامحمدوعليا': { group: 'salawat', free: true, aliases: { tr: ['salavat'], en: ['salawat', 'durood'] } },
    'اللهمصلصلاهكاملهوسلمسلام': { group: 'salawat', free: false, aliases: { tr: ['4444', 'tefriciye', 'nariye'], en: ['4444', 'tafrijiyya', 'nariyah'] } },
    'اللهمصلعليسيدنامحمدصلاهت': { group: 'salawat', free: false, aliases: { tr: ['münciye', 'tüncina'], en: ['munjiya'] } },
    'اللهمصلوسلمعليسيدنامحمدو': { group: 'salawat', free: false, aliases: { tr: ['cuma'], en: ['friday'] } },

    'اللهمصلعليسيدنامحمدالفات': { group: 'salawat', free: false, aliases: { tr: ["salatü fatih", "fatih salavatı"], en: ["salat al fatih"] } },   // Salâtü'l-Fâtih

    // ── İstek ve kabul ──
    'ربنااتنافيالدنياحسنهوفيا': { group: 'request', free: true },
    'ربيسرولاتعسرربتممبالخير': { group: 'request', free: true, aliases: { tr: ['sınav', 'imtihan', 'kolaylık', 'iş kolaylığı'], en: ['exam', 'test', 'ease'] } },
    'رباشرحليصدريويسرليامريوا': { group: 'request', free: true, aliases: { tr: ['heyecan', 'konuşma', 'sunum'], en: ['speech', 'anxiety'] } },
    'ربزدنيعلماوفهما': { group: 'request', free: false, aliases: { tr: ['ilim', 'ders', 'okul', 'öğrenci'], en: ['knowledge', 'study'] } },
    'اللهملاسهلالاماجعلتهسهلا': { group: 'request', free: false, aliases: { tr: ['zor', 'mülakat', 'iş görüşmesi'], en: ['difficult', 'interview'] } },
    'ربناتقبلمناانكانتالسميعا': { group: 'request', free: false },
    'سبحانربكربالعزهعمايصفونو': { group: 'request', free: false, aliases: { tr: ['hatim', 'bitiş'], en: ['closing'] } },
    'اللهمانياسالكعلمانافعاور': { group: 'request', free: false, aliases: { tr: ["rızık", "helal kazanç", "iş bulma", "bereket"], en: ["provision", "rizq", "livelihood"] } },   // Hayırlı Rızık Duası
    'ربناهبلنامنازواجناوذريات': { group: 'request', free: false, aliases: { tr: ["evlilik", "aile", "çocuk"], en: ["spouse", "marriage", "family"] } },   // Eş ve Çocuk Duası
    'ربارحمهماكماربيانيصغيرا': { group: 'request', free: false, aliases: { tr: ["anne", "baba", "ebeveyn", "ana baba"], en: ["parents", "mother", "father"] } },   // Anne Babaya Dua
    'اللهمانياستخيركبعلمكواست': { group: 'request', free: false, aliases: { tr: ["istihare", "karar", "hayırlısı", "seçim"], en: ["istikhara", "decision", "guidance"] } },   // İstihare Duası
    // ── 2026-08-24 eklenen 20 dua ──
    // Hepsi `free: false`: ücretsiz set 14'te bırakıldı, kimseden bir şey alınmadı.
    // Takma adlar mevcut 214 adla ÇAKIŞMAYACAK şekilde seçildi; yeni ad eklerken
    // scratchpad'deki alias testini koştur (her ad kendi duasını ilk sıraya koymalı).

    // Günlük hayat
    'اشهدانلاالهالااللهوحدهلا': { group: 'daily', free: false, aliases: { tr: ['abdest', 'abdest sonrası'], en: ['wudu', 'after ablution'] } },   // Abdestten Sonra
    'اللهمربهذهالدعوهالتامهوا': { group: 'daily', free: false, aliases: { tr: ['ezan', 'vesile', 'minare'], en: ['adhan', 'call to prayer'] } },   // Ezan Duası
    'الحمدللهالذيسقاناعذبافرا': { group: 'daily', free: false, aliases: { tr: ['içmek', 'susuzluk'], en: ['water', 'drinking', 'thirst'] } },   // Su İçtikten Sonra
    'الحمدللهيرحمكاللهيهديكما': { group: 'daily', free: false, aliases: { tr: ['hapşırma', 'hapşırınca', 'çok yaşa'], en: ['sneeze', 'sneezing'] } },   // Aksırınca
    'اللهمصيبانافعا': { group: 'daily', free: false, aliases: { tr: ['yağmur', 'yağış'], en: ['rain'] } },   // Yağmur Yağarken
    'استودعاللهدينكوامانتكوخو': { group: 'daily', free: false, aliases: { tr: ['veda', 'uğurlama', 'havalimanı', 'otogar'], en: ['farewell', 'seeing off', 'airport'] } },   // Yolcuyu Uğurlarken

    // Sıkıntı ve şifa
    'اللهماكفنيبحلالكعنحرامكو': { group: 'hardship', free: false, aliases: { tr: ['helalden rızık', 'harama düşmemek', 'faiz'], en: ['lawful provision', 'avoid haram'] } },   // Hz. Ali'ye Öğretilen Borç Duası
    'اللهمانيعبدكابنعبدكابنام': { group: 'hardship', free: false, aliases: { tr: ['bunalım', 'ferahlık', 'daralma'], en: ['worry', 'relief', 'anguish'] } },   // İç Sıkıntısı Duası
    'اسالاللهالعظيمربالعرشالع': { group: 'hardship', free: false, aliases: { tr: ['yedi kez', 'hastane', 'ameliyat'], en: ['seven times', 'hospital', 'surgery'] } },   // Hastaya Şifa Dileği

    // Korunma
    'ماشاءاللهلاقوهالابالله': { group: 'protect', free: false, aliases: { tr: ['maşallah', 'maşaallah'], en: ['mashallah'] } },   // Mâşâallah
    'حسبياللهلاالهالاهوعليهتو': { group: 'protect', free: false, aliases: { tr: ['tevekkül', 'yedi defa', 'tevbe 129'], en: ['reliance', 'trust in allah'] } },   // Hasbiyallâh
    'سبحانالذييسبحالرعدبحمدهو': { group: 'protect', free: false, aliases: { tr: ['şimşek', 'fırtına', 'yıldırım', 'gök gürültüsü'], en: ['thunder', 'lightning', 'storm'] } },   // Gök Gürleyince

    // Namazda okunanlar
    'سمعاللهلمنحمدهربنالكالحم': { group: 'prayer', free: false, aliases: { tr: ['kavme', 'semiallahu', 'doğrulma'], en: ['sami allahu', 'rising from bowing'] } },   // Kavme
    'اللهمانياعوذبكمنعذابالقب': { group: 'prayer', free: false, aliases: { tr: ['deccal', 'kabir azabı', 'selam öncesi'], en: ['dajjal', 'grave punishment'] } },   // Selâmdan Önce Okunan Dua

    // Tövbe ve iman
    'رباوزعنياناشكرنعمتكالتيا': { group: 'repent', free: false, aliases: { tr: ['şükür', 'nimet', 'süleyman'], en: ['gratitude', 'thankful', 'sulayman'] } },   // Şükür Duası
    'ربناامنافاغفرلناوارحمناو': { group: 'repent', free: false, aliases: { tr: ['iman ettik', 'muminun 109'], en: ['we believe', 'muminun 109'] } },   // Rabbenâ Âmennâ

    // Salavatlar
    'اللهمصلعليسيدنامحمدالنبي': { group: 'salawat', free: false, aliases: { tr: ['ümmi', 'ümmiyye'], en: ['ummi', 'al ummiyya'] } },   // Salavât-ı Ümmiyye

    // İstek ve kabul
    'اللهمانياسالكالجنهواعوذب': { group: 'request', free: false, aliases: { tr: ['cennet', 'cehennem', 'ateş'], en: ['paradise', 'jannah', 'hellfire'] } },   // Cennet İsteme Duası
    'ربلاتذرنيفرداوانتخيرالوا': { group: 'request', free: false, aliases: { tr: ['kısırlık', 'evlat isteme', 'yalnızlık', 'zekeriya'], en: ['infertility', 'longing for a child', 'zakariyya'] } },   // Hz. Zekeriyyâ'nın Duası
    'رباجعلنيمقيمالصلاهومنذري': { group: 'request', free: false, aliases: { tr: ['namaza devam', 'ibrahim', 'nesil'], en: ['steadfast in prayer', 'ibrahim', 'offspring'] } },   // Namaza Devam Duası
};

/** Haritada olmayan dua kaybolmaz: "Diğer" bölümünde kilitli görünür. */
const FALLBACK = { group: 'other', free: false };

export function duaMeta(arabic) {
    return DUA_TAGS[duaKey(arabic)] || FALLBACK;
}
