import { useState, useEffect } from 'react';
import { getTodayString } from '@/lib/testDate';
import { usePrayerTimes } from '@/context/PrayerTimesContext';

/**
 * usePrayerFocus Hook
 * 
 * Detects when a prayer time is active and the prayer hasn't been completed yet.
 * Triggers the Prayer Time Overlay to gently remind users.
 * 
 * @param {Array} prayerTimes - Array of prayer objects { name, time }
 * @param {Array} completedPrayers - Array of completed prayer names
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

            // Filter to only actual prayer times (exclude Güneş, İmsak)
            const actualPrayers = prayerTimes.filter(p =>
                !['Güneş', 'İmsak'].includes(p.name)
            );

            // Find current or next prayer
            let foundPrayer = null;

            for (const prayer of actualPrayers) {
                // Parse prayer time (format: "HH:MM")
                const [prayerHour, prayerMinute] = prayer.time.split(':').map(Number);
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
                // Check if prayer is already completed
                const isCompleted = completedPrayers.includes(foundPrayer.name);

                // Check if prayer is explicitly dismissed for today
                const dismissalKey = `popup_dismissed_${todayStr}_${foundPrayer.name}`;
                const isDismissed = localStorage.getItem(dismissalKey);

                if (!isCompleted && !isDismissed) {
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
    }, [prayerTimes, completedPrayers]);

    // Snooze / Dismiss for the day
    const snooze = (prayerName) => {
        const todayStr = getTodayString();
        const dismissalKey = `popup_dismissed_${todayStr}_${prayerName}`;

        localStorage.setItem(dismissalKey, 'true');
        setShouldShowOverlay(false);
    };

    // Clear snooze (when prayer is completed) - effectively same as snooze/dismiss + marks done in parent
    const clearSnooze = (prayerName) => {
        const todayStr = getTodayString();
        const dismissalKey = `popup_dismissed_${todayStr}_${prayerName}`;

        localStorage.setItem(dismissalKey, 'true');
        setShouldShowOverlay(false);
    };

    return {
        activePrayer,
        shouldShowOverlay,
        snooze,
        clearSnooze
    };
}
