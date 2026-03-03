import { Capacitor } from '@capacitor/core';
import OneSignal from 'onesignal-cordova-plugin';

export const APP_ID = '3445d1b5-779e-4001-a900-88331b78500c';

export async function initOneSignal() {
    if (!Capacitor.isNativePlatform()) {
        console.log('OneSignal is only supported on native platforms. Skipping init.');
        return;
    }

    try {
        // Uncomment to set OneSignal device logging to VERBOSE  
        // OneSignal.Debug.setLogLevel(6);

        OneSignal.initialize(APP_ID);

        // Prompts the user for notification permissions.
        // * Since this shows a generic native prompt, we recommend instead using an In-App Message to prompt for notification permission (See step 7) to better communicate to your users what notifications they will get.
        OneSignal.Notifications.requestPermission(true).then((accepted) => {
            console.log("User accepted notifications: " + accepted);
        });

        // Add event listeners
        OneSignal.Notifications.addEventListener('click', (event) => {
            console.log('OneSignal: notification clicked:', event);
        });

        console.log('OneSignal initialized successfully.');
    } catch (error) {
        console.error('OneSignal initialization error:', error);
    }
}
