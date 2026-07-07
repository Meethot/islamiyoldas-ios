import { useState, useEffect } from 'react';
import { getTodayString } from '@/lib/testDate';
import { buildPrayerSchedule } from '@/lib/prayerTimeUtils';
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
            const todayStr = getTodayString();

            // Filter to only actual prayer times (exclude sunrise)
            const actualPrayers = prayerTimes.filter(p => p.id !== 'sunrise');
            const times = actualPrayers.map(p => p.time);

            // Sequence-aware schedules for today AND yesterday: a midnight-crossing
            // Isha (e.g. "00:10") belongs to yesterday's table right after it fires,
            // so both must be checked for the 15-minute window
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const schedules = [buildPrayerSchedule(times, now), buildPrayerSchedule(times, yesterday)];

            // Find the prayer whose 15-minute window we're currently in
            let foundPrayer = null;
            for (const schedule of schedules) {
                for (let i = 0; i < actualPrayers.length; i++) {
                    if (!schedule[i]) continue;
                    const diffMinutes = (now - schedule[i]) / 60000;
                    if (diffMinutes >= 0 && diffMinutes <= 15) {
                        foundPrayer = actualPrayers[i];
                        break;
                    }
                }
                if (foundPrayer) break;
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
                const lang = localStorage.getItem('i18nextLng') || 'en';
                const snoozeTitle = {
                    tr: 'Namaz Vakti Hatırlatması',
                    en: 'Prayer Time Reminder',
                    de: 'Gebetszeit-Erinnerung',
                    ru: 'Напоминание о намазе',
                    ar: 'تذكير بوقت الصلاة',
                    az: 'Namaz Vaxtı Xatırlatması'
                };
                const snoozeBody = {
                    tr: 'Namazını kılmayı unutma! 🕌',
                    en: "Don't forget to pray! 🕌",
                    de: 'Vergiss nicht zu beten! 🕌',
                    ru: 'Не забудь помолиться! 🕌',
                    ar: 'لا تنسَ الصلاة! 🕌',
                    az: 'Namazını qılmağı unutma! 🕌'
                };
                const notif = {
                    title: snoozeTitle[lang] || snoozeTitle.tr,
                    body: snoozeBody[lang] || snoozeBody.tr,
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
