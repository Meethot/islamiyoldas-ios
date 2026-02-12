import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const supportedLngs = ['tr', 'en', 'de', 'ar', 'az', 'nl', 'fr', 'es', 'ru', 'id'];

export const dir = (lang) => (lang === 'ar' ? 'rtl' : 'ltr');

export const handleLanguageChange = (langCode) => {
    localStorage.setItem('i18nextLng', langCode);
    document.documentElement.dir = dir(langCode);
    document.documentElement.lang = langCode;
    window.location.reload();
};

const currentLng = localStorage.getItem('i18nextLng') || 'tr';

document.documentElement.dir = dir(currentLng);
document.documentElement.lang = currentLng;

i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: currentLng,
        fallbackLng: 'tr',
        supportedLngs,
        debug: false,
        ns: ['common', 'home', 'profile', 'onboarding', 'settings', 'tracking', 'dhikr', 'stories', 'qibla', 'fasting', 'learn', 'misc', 'sleep', 'tefekkur', 'murakabe', 'goals', 'dua', 'quran'],
        defaultNS: 'common',

        interpolation: {
            escapeValue: false,
        },

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },

        detection: {
            order: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },

        react: {
            useSuspense: true
        }
    });

export default i18n;
