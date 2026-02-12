/**
 * i18n Helper — use translations outside React components (contexts, services, utils)
 * 
 * Usage:
 *   import i18n from '@/i18n';
 *   i18n.t('common:errors.permissionDenied')
 * 
 * This file re-exports the i18n instance for convenience and 
 * provides locale-aware formatting utilities.
 */
import i18n from '@/i18n';

/**
 * Get current locale code (e.g. 'tr', 'en', 'de')
 */
export const getCurrentLang = () => i18n.language || localStorage.getItem('i18nextLng') || 'tr';

/**
 * Get locale string for Intl APIs (e.g. 'tr-TR', 'en-US', 'de-DE')
 */
const LOCALE_MAP = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    ar: 'ar-SA',
    az: 'az-AZ',
    nl: 'nl-NL',
    fr: 'fr-FR',
    es: 'es-ES',
    ru: 'ru-RU',
    id: 'id-ID'
};

export const getIntlLocale = () => LOCALE_MAP[getCurrentLang()] || 'tr-TR';

/**
 * Translate outside React — uses i18n instance directly
 * @param {string} key - Translation key with namespace, e.g. 'common:errors.permissionDenied'
 * @param {object} options - Interpolation options
 */
export const t = (key, options) => i18n.t(key, options);

export default { getCurrentLang, getIntlLocale, t };
