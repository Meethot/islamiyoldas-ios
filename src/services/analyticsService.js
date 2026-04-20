import * as amplitude from '@amplitude/analytics-browser';
import { Capacitor } from '@capacitor/core';

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;

let initialized = false;

export const initAnalytics = () => {
    if (initialized) return;
    if (!AMPLITUDE_API_KEY) {
        console.warn('[Analytics] VITE_AMPLITUDE_API_KEY missing — tracking disabled');
        return;
    }

    // Detect real platform from Capacitor
    const nativePlatform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
    const platformLabel = nativePlatform === 'ios' ? 'iOS'
                        : nativePlatform === 'android' ? 'Android'
                        : 'Web';

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

    // Override platform so Amplitude shows iOS/Android instead of "Web"
    const identify = new amplitude.Identify();
    identify.set('platform', platformLabel);
    identify.set('os_name', platformLabel);
    identify.set('device_type', nativePlatform === 'web' ? 'desktop' : 'mobile');
    amplitude.identify(identify);

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

export const setPremiumUserProperties = (isPremium, planId = 'free') => {
    setUserProperties({
        is_premium: isPremium,
        subscription_status: isPremium ? 'active' : 'inactive',
        subscription_plan: isPremium ? planId : 'free',
    });
};

export const analytics = {
    // ── Permission Events ──
    permissionRequested: (type) => trackEvent('permission_requested', { permission_type: type }),
    permissionGranted: (type) => trackEvent('permission_granted', { permission_type: type }),
    permissionDenied: (type) => trackEvent('permission_denied', { permission_type: type }),

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
    premiumPurchaseStarted: (plan) => trackEvent('premium_purchase_started', { plan }),
    premiumPurchaseCompleted: (plan, price, productId) => {
        trackEvent('premium_purchase_completed', { plan, revenue: price });
        if (price > 0) trackRevenue(productId, price);
    },
    premiumPurchaseFailed: (plan, reason) => trackEvent('premium_purchase_failed', { plan, error_code: reason }),
    premiumCancelled: (reason) => trackEvent('premium_cancelled', { reason }),
    premiumCancelReasonSelected: (reason) => trackEvent('premium_cancel_reason_selected', { cancel_reason: reason }),
    paywallDismissed: (source) => trackEvent('paywall_dismissed', { source }),
    premiumDowngradeViewed: () => trackEvent('premium_downgrade_viewed'),

    // ── Feature Usage Events ──
    prayerMarked: (prayer, status) => trackEvent('prayer_marked', { prayer, status }),
    dhikrStarted: (dhikrName, target) => trackEvent('dhikr_started', { dhikr_name: dhikrName, target }),
    dhikrCompleted: (dhikrName, count) => trackEvent('dhikr_completed', { dhikr_name: dhikrName, count }),
    aiFeatureDiscovered: (source) => trackEvent('ai_feature_discovered', { source }),
    aiQuestionAsked: (category) => trackEvent('ai_question_asked', { category }),
    aiResponseReceived: (category, isPremiumUser, responseTimeMs) => trackEvent('ai_response_received', { category, is_premium_user: isPremiumUser, response_time_ms: responseTimeMs }),
    aiResponseRated: (rating, category) => trackEvent('ai_response_rated', { rating, category }),
    sleepModeStarted: (content, durationMinutes) => trackEvent('sleep_mode_started', { content, duration_minutes: durationMinutes }),
    sleepModeCompleted: (durationMinutes) => trackEvent('sleep_mode_completed', { duration_minutes: durationMinutes }),
    storyStarted: (title, durationMin) => trackEvent('story_started', { title, duration_min: durationMin }),
    storyCompleted: (title, completionPct) => trackEvent('story_completed', { title, completion_pct: completionPct }),

    // ── Push Notification Events ──
    pushNotificationOpened: (type, prayer) => trackEvent('push_notification_opened', { type, prayer }),
    notificationReceived: (type) => trackEvent('notification_received', { notification_type: type }),
    notificationTapped: (type) => trackEvent('notification_tapped', { notification_type: type }),
    notificationDismissed: (type) => trackEvent('notification_dismissed', { type }),

    // ── Search & Discovery ──
    searchPerformed: (query, resultsCount) => trackEvent('search_performed', { search_query_text: query, results_count: resultsCount }),
    searchNoResults: (query) => trackEvent('search_no_results', { search_query_text: query }),
    searchResultClicked: () => trackEvent('search_result_clicked', {}),

    // ── Health & Error ──
    errorOccurred: (errorType, screen) => trackEvent('error_occurred', { error_type: errorType, screen }),
    appCrash: (crashReason, screenName) => trackEvent('app_crash', { crash_reason: crashReason, screen_name: screenName || 'unknown' }),
    appUpdatePrompted: () => trackEvent('app_update_prompted'),

    // ── Quran Content Tracking ──
    quranOpened: (surah, ayah) => trackEvent('quran_opened', { surah, ayah }),
    quranVerseRead: (surah, ayah) => trackEvent('quran_verse_read', { surah, ayah }),
    quranPageScrolled: (surah) => trackEvent('quran_page_scrolled', { surah }),
    quranReadingCompleted: (surah) => trackEvent('quran_reading_completed', { surah }),
    quranBookmarkAdded: (surah, ayah) => trackEvent('quran_bookmark_added', { surah, ayah }),
    quranAudioPlayed: (surah, reciter) => trackEvent('quran_audio_played', { surah, reciter }),
    contentShared: (contentType, platform) => trackEvent('content_shared', { content_type: contentType, platform }),

    // ── Misc Events ──
    languageChanged: (lang) => trackEvent('language_changed', { language: lang }),
    dailyStreakAchieved: (streakCount) => trackEvent('daily_streak_achieved', { streak: streakCount }),
    habitGoalSet: (goalType, target) => trackEvent('habit_goal_set', { goal_type: goalType, target }),
    habitGoalCompleted: (goalType) => trackEvent('habit_goal_completed', { goal_type: goalType }),
    widgetUsed: (widgetType) => trackEvent('widget_used', { widget_type: widgetType }),
    duaRead: (duaName) => trackEvent('dua_read', { dua_name: duaName }),
    duaBookmarked: (duaName) => trackEvent('dua_bookmarked', { dua_name: duaName }),
    takvimViewed: () => trackEvent('takvim_viewed'),
};
