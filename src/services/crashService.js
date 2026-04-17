import { Capacitor } from '@capacitor/core';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { analytics } from './analyticsService';

let initialized = false;

export async function initCrashlytics() {
    if (!Capacitor.isNativePlatform() || initialized) return;
    initialized = true;

    try {
        // Explicitly enable Crashlytics data collection
        await FirebaseCrashlytics.setEnabled({ enabled: true });

        // Send any unsent reports from previous sessions
        await FirebaseCrashlytics.sendUnsentReports();

        // Set user context (anonymous device ID)
        const deviceId = localStorage.getItem('device_id') || crypto.randomUUID();
        localStorage.setItem('device_id', deviceId);
        await FirebaseCrashlytics.setUserId({ userId: deviceId });

        // Log app start
        await FirebaseCrashlytics.log({ message: 'App initialized successfully' });

    } catch (e) {
        console.error('[Crashlytics] Init failed:', e);
    }

    // Global JS error handler → log to Crashlytics
    window.addEventListener('error', (event) => {
        const errorDetails = `JS Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
        try { analytics.appCrash(errorDetails); } catch(e) {}
        FirebaseCrashlytics.recordException({
            message: errorDetails,
        }).catch(() => { });
    });

    // Unhandled promise rejection → log to Crashlytics
    window.addEventListener('unhandledrejection', (event) => {
        const msg = event.reason?.message || event.reason?.toString() || 'Unhandled promise rejection';
        try { analytics.appCrash(`Promise rejection: ${msg}`); } catch(e) {}
        FirebaseCrashlytics.recordException({ message: `Promise rejection: ${msg}` }).catch(() => { });
    });
}

export async function logCrash(message) {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await FirebaseCrashlytics.recordException({ message });
    } catch { }
}

export async function logEvent(key, value) {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await FirebaseCrashlytics.setCustomKey({ key, value: String(value), type: 'string' });
    } catch { }
}

export async function logPageView(pathname) {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await FirebaseCrashlytics.setCustomKey({ key: 'last_screen', value: pathname, type: 'string' });
        await FirebaseCrashlytics.log({ message: `Navigate: ${pathname}` });
    } catch { }
}
