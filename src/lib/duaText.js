/**
 * Dua duvarı metin hijyeni.
 *
 * Sorun: kullanıcılar CAPSLOCK açıp duanın tamamını büyük harfle yazıyor.
 * Büyük harf bağırmak gibi algılanıyor, duvarı da çirkinleştiriyor.
 *
 * Burada iki şey var:
 *  • `getCapsRatio` — gönderim formunun uyarı/engel kararı (yazarken).
 *  • `toCalmCase` / `normalizeShouting` — GÖSTERİM tarafı. Firestore'daki metne
 *    dokunulmaz; eski sürümlerden (APKPure'daki 1.1.x) gelen bağıran dualar da
 *    duvarda sakin görünsün diye çizim anında düzeltilir.
 */

export const CAPS_WARN_RATIO = 0.6;
export const CAPS_BLOCK_RATIO = 0.8;
// Dua en az 10 karakter; 8 harf "YARDIM EDİN" gibi kısa bağırmayı da yakalar.
export const CAPS_MIN_LETTERS = 8;

/** Azerice küçük/büyük harf kuralları Türkçe ile aynı (ı/İ); 'az' desteklenmezse 'tr'ye düşer. */
function localeOf(lang) {
    const base = typeof lang === 'string' ? lang.split('-')[0] : 'tr';
    if (base === 'az') return ['az', 'tr'];
    return base || 'tr';
}

const isLetter = (ch) => /\p{L}/u.test(ch);

/**
 * Büyük harf oranı. Sadece BÜYÜK/küçük ayrımı olan harfler sayılır —
 * rakam, noktalama, emoji ve Arapça harfler hesaba girmez (Arapça'da caps yok,
 * o yüzden Arapça dua asla uyarı almaz).
 */
export function getCapsRatio(text) {
    if (typeof text !== 'string') return 0;
    let letters = 0;
    let upper = 0;
    for (const ch of text) {
        const lower = ch.toLocaleLowerCase('tr');
        const upperCh = ch.toLocaleUpperCase('tr');
        if (lower === upperCh) continue; // harf değil ya da caps'siz alfabe
        letters++;
        if (ch === upperCh) upper++;
    }
    if (letters < CAPS_MIN_LETTERS) return 0; // kısa metinde oran yanıltıcı
    return upper / letters;
}

export const isShouting = (text) => getCapsRatio(text) >= CAPS_BLOCK_RATIO;

/**
 * Küçültme sonrası tekrar büyütülecek özel adlar (dil bazlı, hepsi küçük harfle).
 * Girdi ya düz metin ('allah' → ilk harf büyütülür) ya da [eşleşen, yazılışı]
 * çifti olur. Çift gerekiyor çünkü Türkçe'de CAPSLOCK'la yazılmış "ISLAM"
 * küçülünce noktasız "ıslam" olur; ilk harfi büyütmek "Islam" verir, doğrusu "İslam".
 * Amaç: "ALLAH'IM BANA YARDIM ET" → "allah'ım bana yardım et" DEĞİL,
 * "Allah'ım bana yardım et". Liste dar tutuldu; emin olunmayan kelime eklenmez.
 */
const NAME_PREFIXES = {
    tr: ['allah', 'rabb', "kur'an", 'kurân', 'islam', ['ıslam', 'İslam'], 'ramazan', 'mekke', 'medine', ['medıne', 'Medine'], 'kabe', 'kâbe', 'muhammed', 'peygamber'],
    az: ['allah', 'rəbb', 'rebb', 'quran', 'islam', ['ıslam', 'İslam'], 'ramazan', 'məkkə', 'mədinə', 'muhamməd', 'peyğəmbər'],
    en: ['allah', 'god', 'quran', "qur'an", 'islam', 'ramadan', 'muhammad', 'prophet', 'lord'],
    de: ['allah', 'gott', 'koran', 'islam', 'ramadan', 'mohammed', 'prophet'],
    ru: ['аллах', 'коран', 'ислам', 'рамадан', 'мухаммад', 'господ', 'пророк'],
    ar: []
};
// Tek başına "rab" (rabıta gibi kelimeler bozulmasın diye prefix değil, tam kelime).
// Tam kelime eşleşmesi: prefix olarak yazılsa başka kelimeleri bozardı
// ("rab" → rabıta, "бог" → богатство).
const WHOLE_WORDS = {
    tr: ['rab'],
    az: ['rəb', 'reb'],
    en: ['i'],
    de: [],
    ru: ['бог', 'бога', 'богу', 'богом', 'боже'],
    ar: []
};

function capitalizeNames(text, lang, loc) {
    const base = typeof lang === 'string' ? lang.split('-')[0] : 'tr';
    const prefixes = NAME_PREFIXES[base] || NAME_PREFIXES.tr;
    const words = WHOLE_WORDS[base] || [];
    let out = text;
    for (const entry of prefixes) {
        const [needle, written] = Array.isArray(entry) ? entry : [entry, null];
        const re = new RegExp(`(^|[^\\p{L}])(${escapeRe(needle)})(\\p{L}*)`, 'giu');
        out = out.replace(re, (_m, pre, hit, rest) =>
            pre + (written || hit.charAt(0).toLocaleUpperCase(loc) + hit.slice(1)) + rest);
    }
    for (const w of words) {
        const re = new RegExp(`(^|[^\\p{L}])(${escapeRe(w)})(?![\\p{L}])`, 'giu');
        out = out.replace(re, (_m, pre, hit) => pre + (
            hit.length === 1
                ? hit.toLocaleUpperCase(loc)                                  // İngilizce "i" → "I"
                : hit.charAt(0).toLocaleUpperCase(loc) + hit.slice(1)         // "бог" → "Бог"
        ));
    }
    return out;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Metni sakin yazıma çevirir: her şeyi küçült, cümle başlarını ve özel adları büyüt.
 * Bozuk girdide ya da beklenmedik hatada orijinal metin döner (asla veri kaybı yok).
 */
export function toCalmCase(text, lang = 'tr') {
    if (typeof text !== 'string' || !text.trim()) return typeof text === 'string' ? text : '';
    try {
        const loc = localeOf(lang);
        // Sıra önemli: özel adlar CÜMLE BAŞLARINDAN ÖNCE düzeltilir. Aksi halde
        // "ISLAM" küçülüp "ıslam" olur, cümle başı onu "Islam" yapar ve artık
        // 'ıslam' kalıbıyla eşleşmez (Unicode katlaması I↔ı değil I↔i).
        const lower = capitalizeNames(text.toLocaleLowerCase(loc), lang, loc);
        let out = '';
        let capNext = true;
        for (const ch of lower) {
            if (capNext && isLetter(ch)) {
                out += ch.toLocaleUpperCase(loc);
                capNext = false;
            } else {
                out += ch;
                if (/[.!?…\n]/.test(ch)) capNext = true;
            }
        }
        return out;
    } catch {
        return text;
    }
}

/** Sadece BAĞIRAN metni sakinleştirir; normal yazılmış duaya dokunmaz. */
export function normalizeShouting(text, lang = 'tr') {
    if (typeof text !== 'string') return '';
    return isShouting(text) ? toCalmCase(text, lang) : text;
}
