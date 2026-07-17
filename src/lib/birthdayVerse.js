/**
 * Doğum tarihi → Kuran ayeti eşleştirmesi (deterministik).
 * Kural: surah = gün (1-31), verse = ay (1-12). Sadece gün=1 (Fatiha, 7 ayet)
 * ve ay 8-12 taşarsa verse son ayete clamp edilir; surah her zaman = gün.
 */

// Hafs ayet sayıları — index 1..114 (index 0 kullanılmaz).
export const AYAH_COUNTS = [
    0,
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
    123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
    34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
    60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
    14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
    28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
    11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
    5, 4, 5, 6
];

/**
 * @param {number} day - Doğum günü (1-31)
 * @param {number} month - Doğum ayı (1-12)
 * @returns {{surah:number, verse:number, day:number, month:number, clamped:boolean}|null}
 */
export function birthdayToVerseRef(day, month) {
    if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    const surah = day;
    const max = AYAH_COUNTS[surah];
    let verse = month;
    let clamped = false;
    if (verse > max) {
        verse = max;
        clamped = true;
    }
    return { surah, verse, day, month, clamped };
}

/**
 * Uzunluğa göre Arapça ayet font boyutu (auto-fit). Uzun ayetler (Ayetel Kürsi
 * gibi) taşmasın diye kademeli küçülür. `base` = o bağlamdaki en büyük boyut (px).
 * @returns {number} px
 */
export function arabicFontPx(text, base) {
    const n = (text || '').length;
    let f = 1;
    if (n > 260) f = 0.42;
    else if (n > 160) f = 0.55;
    else if (n > 90) f = 0.72;
    else if (n > 40) f = 0.9;
    return Math.round(base * f);
}

/**
 * Uzunluğa göre meal (çeviri) font boyutu (auto-fit).
 * @returns {number} px
 */
export function translationFontPx(text, base) {
    const n = (text || '').length;
    let f = 1;
    if (n > 320) f = 0.6;
    else if (n > 200) f = 0.74;
    else if (n > 110) f = 0.86;
    return Math.round(base * f);
}
