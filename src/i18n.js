import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
        lng: 'tr', // Force Turkish
        fallbackLng: 'tr',
        debug: false,
        ns: ['common', 'home', 'profile', 'onboarding'],
        defaultNS: 'common',

        interpolation: {
            escapeValue: false,
        },

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },

        react: {
            useSuspense: true
        }
    });

export default i18n;
