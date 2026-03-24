/**
 * WidgetDataService.js
 * 
 * PURPOSE: System sound effects for iOS/Android.
 * Widget data sync is handled by widgetService.js via Preferences plugin.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Android-only native effects plugin
const NativeEffects = registerPlugin('NativeEffects');

/**
 * Plays a native system sound with zero latency.
 * iOS: Uses Capacitor Haptics (impact feedback)
 * Android: Uses NativeEffects plugin
 */
export async function playAminSound() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        const platform = Capacitor.getPlatform();
        if (platform === 'ios') {
            await Haptics.impact({ style: ImpactStyle.Light });
        } else if (platform === 'android') {
            await NativeEffects.playSystemSound();
        }
    } catch (error) {
        // Silent fail — sound is non-critical
    }
}

// Widget data functions are no-ops — widgetService.js handles sync via Preferences
export async function updatePrayerWidget() {}
export async function updateInspirationWidget() {}
export async function updateAllWidgets() {}
export async function refreshWidgets() {}

export default {
    updatePrayerWidget,
    updateInspirationWidget,
    updateAllWidgets,
    refreshWidgets,
};
