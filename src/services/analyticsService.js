import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;

let initialized = false;

export const initAnalytics = () => {
    if (initialized) return;
    if (!AMPLITUDE_API_KEY) {
        console.warn('[Analytics] VITE_AMPLITUDE_API_KEY missing — tracking disabled');
        return;
    }
    amplitude.init(AMPLITUDE_API_KEY, {
        autocapture: {
            elementInteractions: {
                cssSelectorAllowlist: [
                    'button',
                    'a',
                    '[data-amp-track]',
                    'input',
                    'select',
                ],
                pageUrlDenylist: [
                    /\/legal\//,
                    /\/settings\/legal/,
                ],
            },
        },
        defaultTracking: {
            sessions: true,
            pageViews: true,
            formInteractions: true,
            fileDownloads: false,
        },
    });
    initialized = true;
};

export const trackEvent = (eventName, properties = {}) => {
    amplitude.track(eventName, properties);
};

export const trackRevenue = (productId, price, quantity = 1) => {
    const event = new amplitude.Revenue()
        .setProductId(productId)
        .setPrice(price)
        .setQuantity(quantity)
        .setRevenueType('subscription');
    amplitude.revenue(event);
};

export const setUserProperties = (properties) => {
    const identify = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
        identify.set(key, value);
    });
    amplitude.identify(identify);
};

export const analytics = {
    // ── Permission Events ──
    permissionRequested: (type) => trackEvent('permission_requested', { type }),
    permissionGranted: (type) => trackEvent('permission_granted', { type }),
    permissionDenied: (type) => trackEvent('permission_denied', { type }),

    // ── Performance & Lifecycle Events ──
    appLoaded: (loadTimeMs, isFirstOpen) => trackEvent('app_loaded', { load_time_ms: loadTimeMs, is_first_open: isFirstOpen }),
    firstScreenVisible: (screen, timeMs) => trackEvent('first_screen_visible', { screen, time_ms: timeMs }),
    appStateChanged: (state) => trackEvent('app_state_changed', { state, timestamp: Date.now() }),

    // ── Onboarding Events ──
    onboardingStepViewed: (step, question) => trackEvent('onboarding_step_viewed', { step, question }),
    onboardingStepCompleted: (step, question, answer) => trackEvent('onboarding_step_completed', { step, question, answer }),
    onboardingStepSkipped: (step) => trackEvent('onboarding_step_skipped', { step }),
    onboardingAbandoned: (lastStep) => trackEvent('onboarding_abandoned', { last_step: lastStep }),
    onboardingCompleted: (answers) => trackEvent('onboarding_completed', answers),

    // ── Premium Funnel Events ──
    premiumPageViewed: (source) => trackEvent('premium_page_viewed', { source }),
    premiumPlanSelected: (plan, price) => trackEvent('premium_plan_selected', { plan, price }),
    premiumPurchaseStarted: () => trackEvent('premium_purchase_started'),
    premiumPurchaseCompleted: (plan, price, productId) => {
        trackEvent('premium_purchase_completed', { plan, revenue: price });
        if (price > 0) trackRevenue(productId, price);
    },
    premiumPurchaseFailed: (reason) => trackEvent('premium_purchase_failed', { reason }),
    premiumCancelled: (reason) => trackEvent('premium_cancelled', { reason }),

    // ── Feature Usage Events ──
    prayerMarked: (prayer, status) => trackEvent('prayer_marked', { prayer, status }),
    dhikrStarted: (dhikrName, target) => trackEvent('dhikr_started', { dhikr_name: dhikrName, target }),
    dhikrCompleted: (dhikrName, count) => trackEvent('dhikr_completed', { dhikr_name: dhikrName, count }),
    aiQuestionAsked: (category) => trackEvent('ai_question_asked', { category }),
    aiResponseReceived: (responseTimeMs) => trackEvent('ai_response_received', { response_time_ms: responseTimeMs }),
    sleepModeStarted: (content) => trackEvent('sleep_mode_started', { content }),
    sleepModeCompleted: (durationMin) => trackEvent('sleep_mode_completed', { duration_min: durationMin }),
    storyStarted: (title, durationMin) => trackEvent('story_started', { title, duration_min: durationMin }),
    storyCompleted: (title, completionPct) => trackEvent('story_completed', { title, completion_pct: completionPct }),

    // ── Push Notification Events ──
    pushNotificationOpened: (type, prayer) => trackEvent('push_notification_opened', { type, prayer }),

    // ── Misc Events ──
    languageChanged: (lang) => trackEvent('language_changed', { language: lang }),
};
