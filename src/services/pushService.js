import { Capacitor } from '@capacitor/core';
import OneSignal from 'onesignal-cordova-plugin';

export const APP_ID = '3445d1b5-779e-4001-a900-88331b78500c';

export async function initOneSignal() {
    if (!Capacitor.isNativePlatform()) {
        console.log('OneSignal is only supported on native platforms. Skipping init.');
        return;
    }

    try {
        OneSignal.initialize(APP_ID);

        // Only request permission if not yet determined
        // This prevents the iOS "Open Settings" popup on subsequent launches
        const hasPermission = OneSignal.Notifications.hasPermission();
        if (!hasPermission) {
            // Check if we already asked before (stored flag)
            const { Preferences } = await import('@capacitor/preferences');
            const { value: asked } = await Preferences.get({ key: 'onesignal_permission_asked' });
            if (!asked) {
                OneSignal.Notifications.requestPermission(true).then((accepted) => {
                    console.log("User accepted notifications: " + accepted);
                });
                await Preferences.set({ key: 'onesignal_permission_asked', value: 'true' });
            }
        }

        OneSignal.Notifications.addEventListener('click', (event) => {
            console.log('OneSignal: notification clicked:', event);
        });

        console.log('OneSignal initialized successfully.');
    } catch (error) {
        console.error('OneSignal initialization error:', error);
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
