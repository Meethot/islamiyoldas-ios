/**
 * WidgetDataService.js
 * 
 * PURPOSE: Bridge between React/Capacitor app and iOS WidgetKit widgets.
 * 
 * HOW IT WORKS:
 * 1. This service serializes prayer times and daily content to JSON
 * 2. Saves data to iOS UserDefaults with App Group suite name
 * 3. Triggers widget refresh via native Swift call
 * 
 * LOCATION: src/services/WidgetDataService.js
 * 
 * REQUIREMENTS:
 * - Capacitor native bridge (WidgetBridge plugin) must be registered in iOS
 * - App Group "group.com.islamiyoldas.app" must be configured in Xcode
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// Register the native WidgetBridge plugin
const WidgetBridge = registerPlugin('WidgetBridge');

// Register the native Effects plugin (for Android system sounds)
const NativeEffects = registerPlugin('NativeEffects');

/**
 * Plays a native system sound with zero latency.
 * iOS uses AudioServicesPlaySystemSound(1104) - keyboard click
 * Android uses playSoundEffect(SoundEffectConstants.CLICK)
 */
export async function playAminSound() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        const platform = Capacitor.getPlatform();
        if (platform === 'ios') {
            // iOS: Use the WidgetBridge extension for system sounds
            await WidgetBridge.playSystemSound({ soundID: 1104 });
        } else if (platform === 'android') {
            // Android: Use the NativeEffects plugin for system sounds
            await NativeEffects.playSystemSound();
        }
    } catch (error) {
        console.error('[NativeEffects] Failed to play system sound:', error);
    }
}

// App Group identifier - must match iOS configuration
const APP_GROUP_SUITE = 'group.com.islamiyoldas.app';

// UserDefaults keys for widget data
const PRAYER_DATA_KEY = 'widget_prayer_data';
const INSPIRATION_DATA_KEY = 'widget_inspiration_data';

/**
 * Daily inspiration content organized by time period
 * Each period shows different spiritual content
 */
const DAILY_INSPIRATIONS = {
    morning: [
        { text: "Sabah namazı, günün bereketinin anahtarıdır.", source: "Hadis-i Şerif" },
        { text: "Her yeni gün, Allah'ın size verdiği yeni bir fırsattır.", source: "İslami Hikmet" },
        { text: "Güneş doğmadan önce kalkan, rızkını bereketli bulur.", source: "Hadis-i Şerif" },
    ],
    noon: [
        { text: "Sabır güzeldir.", source: "Yusuf Suresi, 18" },
        { text: "Allah sabredenlerle beraberdir.", source: "Bakara Suresi, 153" },
        { text: "Kim Allah'a tevekkül ederse, O ona yeter.", source: "Talak Suresi, 3" },
    ],
    evening: [
        { text: "Şükrederseniz, elbette size nimetimi artırırım.", source: "İbrahim Suresi, 7" },
        { text: "Güneş batarken, gününüzü muhasebe edin.", source: "İslami Hikmet" },
        { text: "Akşam, geçen günün şükrü ve yarının tefekkürüdür.", source: "İslami Hikmet" },
    ],
    night: [
        { text: "Gece namazı, müminin şerefidir.", source: "Hadis-i Şerif" },
        { text: "Gecenin son üçte biri, duaların kabul vaktidir.", source: "Hadis-i Şerif" },
        { text: "Uyumadan önce Ayetel Kürsi okumak, sabaha kadar koruma sağlar.", source: "Hadis-i Şerif" },
    ],
};

/**
 * Determines the current time period based on hour
 * @returns {'morning' | 'noon' | 'evening' | 'night'}
 */
function getCurrentPeriod() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'evening';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

/**
 * Gets a random inspiration for the current period
 * @returns {{ text: string, source: string, period: string }}
 */
function getInspirationForPeriod() {
    const period = getCurrentPeriod();
    const inspirations = DAILY_INSPIRATIONS[period];
    const index = Math.floor(Math.random() * inspirations.length);
    return {
        ...inspirations[index],
        period,
    };
}

/**
 * Formats prayer times for the widget
 * @param {Object} prayerTimes - Object with prayer names as keys and time strings as values
 * @returns {Object} Formatted widget prayer data
 */
function formatPrayerData(prayerTimes) {
    const now = new Date();
    const prayers = [];
    let nextPrayer = null;

    // Prayer order
    const prayerOrder = ['Sabah', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];

    for (const name of prayerOrder) {
        const timeStr = prayerTimes[name];
        if (!timeStr) continue;

        const [hours, minutes] = timeStr.split(':').map(Number);
        const prayerDate = new Date(now);
        prayerDate.setHours(hours, minutes, 0, 0);

        prayers.push({
            name,
            time: timeStr,
            date: prayerDate.toISOString(),
        });

        // Find next prayer
        if (!nextPrayer && prayerDate > now) {
            nextPrayer = {
                name,
                time: timeStr,
                date: prayerDate.toISOString(),
            };
        }
    }

    // If no next prayer today, use tomorrow's Sabah
    if (!nextPrayer && prayers.length > 0) {
        const sabah = prayers[0];
        const tomorrowSabah = new Date(now);
        tomorrowSabah.setDate(tomorrowSabah.getDate() + 1);
        const [hours, minutes] = sabah.time.split(':').map(Number);
        tomorrowSabah.setHours(hours, minutes, 0, 0);

        nextPrayer = {
            name: sabah.name,
            time: sabah.time,
            date: tomorrowSabah.toISOString(),
        };
    }

    return {
        prayers,
        nextPrayerName: nextPrayer?.name || 'Sabah',
        nextPrayerTime: nextPrayer?.date || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Saves prayer times to App Group UserDefaults for iOS widgets
 * @param {Object} prayerTimes - Prayer times object from the app
 */
export async function updatePrayerWidget(prayerTimes) {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
        return;
    }

    try {
        const widgetData = formatPrayerData(prayerTimes);

        await WidgetBridge.saveToAppGroup({
            suiteName: APP_GROUP_SUITE,
            key: PRAYER_DATA_KEY,
            value: JSON.stringify(widgetData),
        });

    } catch (error) {
        console.error('[WidgetDataService] Failed to update prayer widget:', error);
    }
}

/**
 * Saves daily inspiration content to App Group UserDefaults
 */
export async function updateInspirationWidget() {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
        return;
    }

    try {
        const inspiration = getInspirationForPeriod();
        const widgetData = {
            text: inspiration.text,
            source: inspiration.source,
            period: inspiration.period,
            lastUpdated: new Date().toISOString(),
        };

        await WidgetBridge.saveToAppGroup({
            suiteName: APP_GROUP_SUITE,
            key: INSPIRATION_DATA_KEY,
            value: JSON.stringify(widgetData),
        });

    } catch (error) {
        console.error('[WidgetDataService] Failed to update inspiration widget:', error);
    }
}

/**
 * Updates all widget data and triggers timeline refresh
 * Call this whenever prayer times change or app comes to foreground
 * @param {Object} prayerTimes - Prayer times object
 */
export async function updateAllWidgets(prayerTimes) {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
        return;
    }

    try {
        // Update both widget data sources
        await updatePrayerWidget(prayerTimes);
        await updateInspirationWidget();

        // Reload all widget timelines
        await WidgetBridge.reloadAllTimelines();
    } catch (error) {
        console.error('[WidgetDataService] Widget refresh failed:', error);
    }
}

/**
 * Force reload widget timelines without updating data
 * Useful when app returns to foreground
 */
export async function refreshWidgets() {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
        return;
    }

    try {
        await WidgetBridge.reloadAllTimelines();
    } catch (error) {
        console.error('[WidgetDataService] Widget refresh failed:', error);
    }
}

export default {
    updatePrayerWidget,
    updateInspirationWidget,
    updateAllWidgets,
    refreshWidgets,
};
