import { useState, useEffect } from 'react';
import { getTodayString } from '@/lib/testDate';
import { usePrayerTimes } from '@/context/PrayerTimesContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * usePrayerFocus Hook
 * 
 * Detects when a prayer time is active and the prayer hasn't been completed yet.
 * Triggers the Prayer Time Overlay to gently remind users.
 * 
 * @param {Array} prayerTimes - Array of prayer objects { id, name, time }
 * @param {Array} completedPrayers - Array of completed prayer IDs (e.g. ['fajr', 'asr'])
 * @returns {Object} { activePrayer, shouldShowOverlay, snooze, clearSnooze }
 */
export function usePrayerFocus(prayerTimes, completedPrayers) {
    const { settings } = usePrayerTimes();
    const [activePrayer, setActivePrayer] = useState(null);
    const [shouldShowOverlay, setShouldShowOverlay] = useState(false);

    // If focus mode is disabled in settings, return default state (never show overlay)
    const isFocusModeEnabled = settings?.prayerFocusMode ?? true;

    useEffect(() => {
        if (!prayerTimes || prayerTimes.length === 0 || !isFocusModeEnabled) return;

        const checkPrayerTime = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeInMinutes = currentHour * 60 + currentMinute;
            const todayStr = getTodayString();

            // Filter to only actual prayer times (exclude sunrise)
            const actualPrayers = prayerTimes.filter(p => p.id !== 'sunrise');

            // Find current or next prayer
            let foundPrayer = null;

            for (const prayer of actualPrayers) {
                // Parse prayer time (format: "HH:MM" or "h:mm AM/PM")
                let prayerHour, prayerMinute;
                const timeStr = prayer.time;

                if (timeStr.includes('AM') || timeStr.includes('PM')) {
                    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (match) {
                        prayerHour = parseInt(match[1]);
                        prayerMinute = parseInt(match[2]);
                        if (match[3].toUpperCase() === 'PM' && prayerHour !== 12) prayerHour += 12;
                        if (match[3].toUpperCase() === 'AM' && prayerHour === 12) prayerHour = 0;
                    }
                } else {
                    [prayerHour, prayerMinute] = timeStr.split(':').map(Number);
                }

                if (isNaN(prayerHour) || isNaN(prayerMinute)) continue;

                const prayerTimeInMinutes = prayerHour * 60 + prayerMinute;

                // Check if we're within the prayer time window (30 minutes)
                const timeDiff = currentTimeInMinutes - prayerTimeInMinutes;

                if (timeDiff >= 0 && timeDiff <= 30) {
                    // We're in the prayer window!
                    foundPrayer = prayer;
                    break;
                }
            }

            if (foundPrayer) {
                // Check if prayer is already completed (using prayer ID for language independence)
                const isCompleted = completedPrayers.includes(foundPrayer.id);

                // Check if prayer is explicitly dismissed for today
                const dismissalKey = `popup_dismissed_${todayStr}_${foundPrayer.id}`;
                const isDismissed = localStorage.getItem(dismissalKey);

                // Check if prayer is currently snoozed
                const snoozeUntilKey = `popup_snooze_until_${todayStr}_${foundPrayer.id}`;
                const snoozeUntil = localStorage.getItem(snoozeUntilKey);
                const isSnoozed = snoozeUntil && Date.now() < parseInt(snoozeUntil, 10);

                if (!isCompleted && !isDismissed && !isSnoozed) {
                    setActivePrayer(foundPrayer);
                    setShouldShowOverlay(true);
                } else {
                    setActivePrayer(null);
                    setShouldShowOverlay(false);
                }
            } else {
                setActivePrayer(null);
                setShouldShowOverlay(false);
            }
        };

        // Check immediately
        checkPrayerTime();

        // Re-check every minute
        const interval = setInterval(checkPrayerTime, 60000);

        return () => clearInterval(interval);
    }, [prayerTimes, completedPrayers, isFocusModeEnabled]);

    // Snooze / Dismiss for the day (receives prayer ID)
    const snooze = async (prayerId) => {
        const todayStr = getTodayString();
        const snoozeUntilKey = `popup_snooze_until_${todayStr}_${prayerId}`;

        // Set snooze for 10 minutes from now
        const tenMinutesLater = Date.now() + 10 * 60 * 1000;
        localStorage.setItem(snoozeUntilKey, tenMinutesLater.toString());

        // Schedule a real system notification for 10 minutes later
        if (Capacitor.isNativePlatform()) {
            try {
                const notificationId = Math.floor(Math.random() * 2147483647);
                const isIOS = Capacitor.getPlatform() === 'ios';
                const notif = {
                    title: 'Prayer Time Reminder',
                    body: `Don't forget to pray! 🕌`,
                    id: notificationId,
                    schedule: { at: new Date(tenMinutesLater), allowWhileIdle: true },
                    sound: isIOS ? 'beep.caf' : 'beep.wav',
                    channelId: 'ezan_vakti',
                    smallIcon: 'ic_stat_icon_config_sample',
                };
                if (isIOS) notif.interruptionLevel = 'timeSensitive';

                await LocalNotifications.schedule({ notifications: [notif] });
            } catch (error) {
                console.error('Snooze notification error:', error);
            }
        }

        setShouldShowOverlay(false);
    };

    // Clear snooze (when prayer is completed, receives prayer ID)
    const clearSnooze = (prayerId) => {
        const todayStr = getTodayString();
        const dismissalKey = `popup_dismissed_${todayStr}_${prayerId}`;
        const snoozeUntilKey = `popup_snooze_until_${todayStr}_${prayerId}`;

        // Mark as dismissed for the day (since it's done)
        localStorage.setItem(dismissalKey, 'true');
        localStorage.removeItem(snoozeUntilKey);
        setShouldShowOverlay(false);
    };

    return {
        activePrayer,
        shouldShowOverlay,
        snooze,
        clearSnooze
    };
}
