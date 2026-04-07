import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const supportedLngs = ['tr', 'en', 'de', 'ar', 'az', 'ru'];

export const dir = (lang) => (lang === 'ar' ? 'rtl' : 'ltr');

export const handleLanguageChange = (langCode) => {
    localStorage.setItem('i18nextLng', langCode);
    document.documentElement.dir = dir(langCode);
    document.documentElement.lang = langCode;
    // Sync language to iOS widget before reload
    import('./services/widgetService.js').then(m => m.syncLanguageToWidget(langCode)).catch(() => {});
    window.location.reload();
};

// Set initial dir/lang from saved preference (if any)
const savedLng = localStorage.getItem('i18nextLng');
if (savedLng) {
    document.documentElement.dir = dir(savedLng);
    document.documentElement.lang = savedLng;
}

i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // No `lng` here — let LanguageDetector handle detection
        fallbackLng: 'en',
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
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },

        react: {
            useSuspense: true
        }
    });

// Reactively update document direction & lang when language changes
i18n.on('languageChanged', (lng) => {
    const baseLang = lng?.split('-')[0] || 'en';
    document.documentElement.dir = dir(baseLang);
    document.documentElement.lang = baseLang;
    // Always sync current language to iOS widget
    import('./services/widgetService.js').then(m => m.syncLanguageToWidget(baseLang)).catch(() => {});
});

export default i18n;
