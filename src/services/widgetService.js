/**
 * Widget Bridge Service
 * 
 * Syncs prayer times data from the Capacitor app to the iOS Widget Extension.
 * Uses Capacitor's built-in Preferences plugin to store data in standard UserDefaults,
 * then AppDelegate copies it to App Group UserDefaults for the widget to read.
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Key used to pass data from JS → standard UserDefaults → AppDelegate → App Group
const BRIDGE_KEY = 'widget_prayer_data_bridge';

/**
 * Sync prayer times to widget via Preferences → AppDelegate → App Group pipeline.
 * Called automatically when prayer times are calculated.
 * 
 * @param {Object} params
 * @param {Array} params.prayerTimes - Array of {id, name, time} objects
 * @param {string} params.city - Current city name
 * @param {string} [params.hijriDate] - Optional Hijri date string
 */
export async function syncPrayerTimesToWidget({ prayerTimes, city, hijriDate = '' }) {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
        return;
    }

    try {
        const widgetData = {
            city: city || 'Bilinmiyor',
            hijriDate,
            prayers: (prayerTimes || []).map(p => ({
                id: p.id,
                name: p.name,
                time: p.time
            }))
        };

        const jsonValue = JSON.stringify(widgetData);
        console.log('[WidgetService] Saving widget data via Preferences. city:', city, 'len:', jsonValue.length);

        // Write to standard UserDefaults via Capacitor Preferences (proven working)
        await Preferences.set({ key: BRIDGE_KEY, value: jsonValue });

        console.log('[WidgetService] Preferences.set SUCCESS — AppDelegate will copy to App Group');

    } catch (error) {
        console.warn('[WidgetService] Failed to sync:', error?.message || error);
    }
}

/**
 * Sync the current app language to widget via Preferences bridge.
 * Called when user changes language in-app.
 * 
 * @param {string} lang - Language code (tr, en, de, ru, az, ar)
 */
export async function syncLanguageToWidget(lang = 'tr') {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
        return;
    }

    try {
        await Preferences.set({ key: 'widget_language_bridge', value: lang });
        console.log('[WidgetService] Language synced to widget:', lang);
    } catch (error) {
        console.warn('[WidgetService] Failed to sync language:', error?.message || error);
    }
}

/**
 * Force refresh all widget timelines.
 */
export async function refreshWidgets() {
    // No-op on JS side — AppDelegate handles timeline reload
}
