import { Capacitor } from '@capacitor/core';
import OneSignal from 'onesignal-cordova-plugin';
import { analytics } from './analyticsService';

export const APP_ID = '3445d1b5-779e-4001-a900-88331b78500c';

export async function initOneSignal() {
    if (!Capacitor.isNativePlatform()) {
        console.log('OneSignal is only supported on native platforms. Skipping init.');
        return;
    }

    try {
        OneSignal.initialize(APP_ID);

        // Permission is now requested separately via requestNotificationPermission()
        // This prevents the iOS notification popup from firing on app launch.

        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
            const data = event?.notification?.additionalData || {};
            analytics.notificationReceived(data.type || 'push_general');
        });

        OneSignal.Notifications.addEventListener('click', (event) => {
            console.log('OneSignal: notification clicked:', event);
            const data = event?.notification?.additionalData || {};
            analytics.notificationTapped(data.type || 'push_general');
            analytics.pushNotificationOpened(data.type || 'general', data.prayer || undefined);
        });

        console.log('OneSignal initialized successfully.');
    } catch (error) {
        console.error('OneSignal initialization error:', error);
    }
}

/**
 * Request notification permission — call this contextually, not on boot.
 * Uses a persistent flag to ensure the iOS prompt is shown at most once.
 */
export async function requestNotificationPermission() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        const hasPermission = OneSignal.Notifications.hasPermission();
        if (hasPermission) return;

        const { Preferences } = await import('@capacitor/preferences');
        const { value: asked } = await Preferences.get({ key: 'onesignal_permission_asked' });
        if (asked) return;

        analytics.permissionRequested('notification');
        OneSignal.Notifications.requestPermission(true).then((accepted) => {
            console.log("User accepted notifications: " + accepted);
            if (accepted) {
                analytics.permissionGranted('notification');
            } else {
                analytics.permissionDenied('notification');
            }
        });
        await Preferences.set({ key: 'onesignal_permission_asked', value: 'true' });
    } catch (error) {
        console.error('Notification permission request error:', error);
    }
}

export function setLanguageTag(langCode) {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const lang = (langCode || 'en').split('-')[0];
        OneSignal.User.addTag('app_language', lang);
        OneSignal.User.setLanguage(lang);
        console.log('OneSignal language tag set:', lang);
    } catch (error) {
        console.error('OneSignal setLanguageTag error:', error);
    }
}
