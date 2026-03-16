/**
 * Language-based fake prayer pools for the Dua Kardeşliği feed.
 * Each language has its own set of sample prayers that feel natural
 * and culturally appropriate for that language's audience.
 *
 * Supported languages: tr, az, en, de, ar, ru
 * Fallback: en (English)
 */

import { fakePrayersTR } from './fakePrayersTR';
import { fakePrayersAZ } from './fakePrayersAZ';
import { fakePrayersEN } from './fakePrayersEN';
import { fakePrayersDE } from './fakePrayersDE';
import { fakePrayersAR } from './fakePrayersAR';
import { fakePrayersRU } from './fakePrayersRU';

const FAKE_PRAYERS = {
    tr: fakePrayersTR,
    az: fakePrayersAZ,
    en: fakePrayersEN,
    de: fakePrayersDE,
    ar: fakePrayersAR,
    ru: fakePrayersRU,
};

/**
 * Returns fake prayers for a given language.
 * Falls back to English if the language is not supported.
 */
export function getFakePrayersByLang(lang) {
    const normalizedLang = lang?.split('-')[0] || 'en';
    return FAKE_PRAYERS[normalizedLang] || FAKE_PRAYERS.en;
}

/**
 * Normalizes the i18n language code to a base language code.
 * e.g., 'en-US' → 'en', 'tr' → 'tr'
 */
export function normalizeLang(lang) {
    const base = lang?.split('-')[0] || 'en';
    const supported = Object.keys(FAKE_PRAYERS);
    return supported.includes(base) ? base : 'en';
}

export default FAKE_PRAYERS;
