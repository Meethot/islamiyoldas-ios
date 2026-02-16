import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = 'bd839bb17a29ec811305063bc2be7b77';

let initialized = false;

export const initAnalytics = () => {
    if (initialized) return;
    amplitude.init(AMPLITUDE_API_KEY, {
        autocapture: { elementInteractions: true },
        defaultTracking: {
            sessions: true,
            pageViews: true,
            formInteractions: true,
        },
    });
    initialized = true;
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
    amplitude.track(eventName, properties);
};

// Set user properties (onboarding data etc.)
export const setUserProperties = (properties) => {
    const identify = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
        identify.set(key, value);
    });
    amplitude.identify(identify);
};

// Pre-defined event helpers
export const analytics = {
    // Onboarding
    onboardingCompleted: (answers) => trackEvent('onboarding_completed', answers),

    // Page views
    pageView: (pageName) => trackEvent('page_view', { page: pageName }),

    // Stories
    storyOpened: (title, category) => trackEvent('story_opened', { title, category }),
    storyAudioPlayed: (title) => trackEvent('story_audio_played', { title }),

    // Dua Kardeşliği
    duaPosted: () => trackEvent('dua_posted'),
    duaAminGiven: () => trackEvent('dua_amin_given'),

    // Quran
    surahOpened: (surahName) => trackEvent('surah_opened', { surah: surahName }),

    // Dhikr
    dhikrCompleted: (count) => trackEvent('dhikr_completed', { count }),

    // Prayer
    prayerMarked: (prayerName) => trackEvent('prayer_marked', { prayer: prayerName }),

    // Premium
    premiumViewed: () => trackEvent('premium_paywall_viewed'),
    premiumPurchased: () => trackEvent('premium_purchased'),

    // Language
    languageChanged: (lang) => trackEvent('language_changed', { language: lang }),
};
