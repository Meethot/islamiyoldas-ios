import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { useLocation } from '@/context/LocationContext';
import { DAILY_VERSES } from '@/data/dailyVerses';

const PrayerTimesContext = createContext();

export const usePrayerTimes = () => useContext(PrayerTimesContext);

export const PrayerTimesProvider = ({ children }) => {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [settings, setSettings] = useState({
        adhanEnabled: true,
        vibrateOnly: false,
        verseEnabled: true,
        prayerFocusMode: true,
        spiritualRewards: true,
        fridayMessage: true
    });

    const [loading, setLoading] = useState(true);
    const [locationSource, setLocationSource] = useState('loading'); // 'gps' | 'fallback' | 'loading'

    // Get location from global context
    const { latitude, longitude, loading: locationLoading, hasLocation, error: locationError } = useLocation();

    // Istanbul fallback coordinates
    const FALLBACK_COORDS = { lat: 41.0082, lng: 28.9784 };

    // Initial Setup
    useEffect(() => {
        loadSettings();
        if (Capacitor.isNativePlatform()) {
            initializeNotifications();
        }
    }, []);

    // Fetch prayer times when location changes
    useEffect(() => {
        if (!locationLoading) {
            fetchPrayerTimes();
        }
    }, [latitude, longitude, locationLoading]);

    // Re-schedule when settings change
    useEffect(() => {
        if (prayerTimes) {
            scheduleDailyNotifications(prayerTimes);
        }
        scheduleVerseNotifications();
        scheduleFridayMessage();
    }, [settings, prayerTimes]); // Added prayerTimes dependency

    const loadSettings = async () => {
        try {
            const { value: adhanEnabled } = await Preferences.get({ key: 'adhanEnabled' });
            const { value: vibrateOnly } = await Preferences.get({ key: 'vibrateOnly' });
            const { value: verseEnabled } = await Preferences.get({ key: 'verseEnabled' });
            const { value: prayerFocusMode } = await Preferences.get({ key: 'prayerFocusMode' });
            const { value: spiritualRewards } = await Preferences.get({ key: 'spiritualRewards' });
            const { value: fridayMessage } = await Preferences.get({ key: 'fridayMessage' });

            setSettings({
                adhanEnabled: adhanEnabled === null ? true : adhanEnabled === 'true',
                vibrateOnly: vibrateOnly === 'true',
                verseEnabled: verseEnabled === null ? true : verseEnabled === 'true',
                prayerFocusMode: prayerFocusMode === null ? true : prayerFocusMode === 'true',
                spiritualRewards: spiritualRewards === null ? true : spiritualRewards === 'true',
                fridayMessage: fridayMessage === null ? true : fridayMessage === 'true'
            });
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const updateSettings = useCallback(async (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
        try {
            if (newSettings.adhanEnabled !== undefined) {
                await Preferences.set({ key: 'adhanEnabled', value: String(newSettings.adhanEnabled) });
            }
            if (newSettings.vibrateOnly !== undefined) {
                await Preferences.set({ key: 'vibrateOnly', value: String(newSettings.vibrateOnly) });
            }
            if (newSettings.verseEnabled !== undefined) {
                await Preferences.set({ key: 'verseEnabled', value: String(newSettings.verseEnabled) });
            }
            if (newSettings.prayerFocusMode !== undefined) {
                await Preferences.set({ key: 'prayerFocusMode', value: String(newSettings.prayerFocusMode) });
            }
            if (newSettings.spiritualRewards !== undefined) {
                await Preferences.set({ key: 'spiritualRewards', value: String(newSettings.spiritualRewards) });
            }
            if (newSettings.fridayMessage !== undefined) {
                await Preferences.set({ key: 'fridayMessage', value: String(newSettings.fridayMessage) });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, []);

    const initializeNotifications = async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
            // Request permissions (Robust display and sound request)
            const permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted' || permStatus.sound !== 'granted') {
                await LocalNotifications.requestPermissions({
                    permissions: ['display', 'sound', 'badge']
                });
            }

            // Create Channel for Custom Sound
            await LocalNotifications.createChannel({
                id: 'ezan_vakti',
                name: 'Ezan Vakti',
                importance: 5, // Importance.HIGH
                description: 'Ezan vakti bildirimleri',
                sound: Capacitor.getPlatform() === 'android' ? 'ezan' : 'ezan.caf',
                visibility: 1,
                vibration: true
            });
        } catch (error) {
            console.error('Notification initialization error:', error);
        }
    };

    const { i18n } = useTranslation();

    // ...
    const fetchPrayerTimes = useCallback(async () => {
        try {
            setLoading(true);
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

            // Dynamic method: 13 (Diyanet) for TR, 3 (MWL) for others
            const method = i18n.language?.startsWith('tr') ? 13 : 3;

            // Use GPS coordinates if available, otherwise fallback to Istanbul
            let lat, lng;
            if (hasLocation && latitude && longitude) {
                lat = latitude;
                lng = longitude;
                setLocationSource('gps');
            } else {
                lat = FALLBACK_COORDS.lat;
                lng = FALLBACK_COORDS.lng;
                setLocationSource('fallback');
            }

            // Use coordinate-based API instead of city-based
            const response = await axios.get(`https://api.aladhan.com/v1/timings/${dateStr}`, {
                params: {
                    latitude: lat,
                    longitude: lng,
                    method: method
                }
            });

            const timings = response.data.data.timings;
            setPrayerTimes(timings);
            findNextPrayer(timings);
            // scheduleDailyNotifications called via effect
        } catch (error) {
            console.error('Error fetching prayer times:', error);
        } finally {
            setLoading(false);
        }
    }, [i18n.language, latitude, longitude, hasLocation]);

    const findNextPrayer = (timings) => {
        try {
            // Simple logic to find next prayer based on current time
            // This can be enhanced
            const now = new Date();
            const timeToMinutes = (time) => {
                const [h, m] = time.split(':').map(Number);
                return h * 60 + m;
            };
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const prayers = [
                { name: 'İmsak', time: timings.Fajr },
                { name: 'Güneş', time: timings.Sunrise },
                { name: 'Öğle', time: timings.Dhuhr },
                { name: 'İkindi', time: timings.Asr },
                { name: 'Akşam', time: timings.Maghrib },
                { name: 'Yatsı', time: timings.Isha }
            ];

            let next = prayers.find(p => timeToMinutes(p.time) > currentMinutes);
            if (!next) {
                next = prayers[0]; // Next day Fajr
            }
            setNextPrayer(next);
        } catch (e) {
            console.error("Error calculating next prayer", e);
        }
    };

    // iOS limit: 64 pending notifications
    // Budget: 3 repeating verse + 1 repeating friday = 4 permanent
    // Remaining: 60 slots / 5 prayers = 12 days of prayer notifications
    const MAX_PRAYER_DAYS = 12;

    const scheduleDailyNotifications = useCallback(async (timings) => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // Cancel all existing prayer notifications (IDs 1-60 for 12 days × 5 prayers)
            const cancelIds = Array.from({ length: 60 }, (_, i) => ({ id: i + 1 }));
            await LocalNotifications.cancel({ notifications: cancelIds });

            if (!settings.adhanEnabled) return;

            const prayers = [
                { name: 'Sabah Namazı', time: timings.Fajr },
                { name: 'Öğle Namazı', time: timings.Dhuhr },
                { name: 'İkindi Namazı', time: timings.Asr },
                { name: 'Akşam Namazı', time: timings.Maghrib },
                { name: 'Yatsı Namazı', time: timings.Isha }
            ];

            const notifications = [];
            const now = new Date();

            // Schedule for next 12 days (max budget within iOS 64 limit)
            for (let day = 0; day < MAX_PRAYER_DAYS; day++) {
                prayers.forEach((p, idx) => {
                    const [h, m] = p.time.split(':').map(Number);
                    const date = new Date();
                    date.setDate(date.getDate() + day);
                    date.setHours(h, m, 0, 0);

                    if (date <= now) return;

                    const id = day * 5 + idx + 1; // IDs 1-60

                    notifications.push({
                        title: 'Ezan Vakti 🕌',
                        body: `${p.name} vakti girdi. Haydi namaza!`,
                        id,
                        schedule: { at: date, allowWhileIdle: true },
                        sound: settings.vibrateOnly ? null : (Capacitor.getPlatform() === 'android' ? 'ezan' : 'ezan.caf'),
                        channelId: 'ezan_vakti',
                        smallIcon: 'ic_stat_icon_config_sample',
                        interruptionLevel: 'timeSensitive'
                    });
                });
            }

            if (notifications.length > 0) {
                console.log(`📿 Scheduling ${notifications.length} prayer notifications for next ${MAX_PRAYER_DAYS} days`);
                await LocalNotifications.schedule({ notifications });
            }
        } catch (error) {
            console.error('Error scheduling notifications:', error);
        }
    }, [settings.adhanEnabled, settings.vibrateOnly]);

    const scheduleVerseNotifications = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // Cancel existing verse notifications (3 repeating IDs)
            await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }, { id: 1003 }] });

            if (!settings.verseEnabled) return;

            const getRandomVerse = () => DAILY_VERSES[Math.floor(Math.random() * DAILY_VERSES.length)];

            const verseSlots = [
                { id: 1001, hour: 9, minute: 0, label: 'Sabah' },
                { id: 1002, hour: 14, minute: 0, label: 'Öğleden Sonra' },
                { id: 1003, hour: 21, minute: 0, label: 'Akşam' }
            ];

            // Use 'every: day' for PERMANENT repeating notifications
            const notifications = verseSlots.map(slot => {
                const verse = getRandomVerse();
                const scheduleDate = new Date();
                scheduleDate.setHours(slot.hour, slot.minute, 0, 0);

                // If time passed today, start from tomorrow
                if (scheduleDate <= new Date()) {
                    scheduleDate.setDate(scheduleDate.getDate() + 1);
                }

                return {
                    id: slot.id,
                    title: `Günün Ayeti (${slot.label}) 📖`,
                    body: verse.text,
                    schedule: {
                        at: scheduleDate,
                        every: 'day',
                        allowWhileIdle: true
                    },
                    smallIcon: 'ic_stat_icon_config_sample',
                    sound: null
                };
            });

            console.log('📖 Scheduling 3 repeating daily verse notifications (permanent)');
            await LocalNotifications.schedule({ notifications });

        } catch (error) {
            console.error('Error scheduling verse notifications:', error);
        }
    }, [settings.verseEnabled]);

    const scheduleFridayMessage = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // Cancel existing Friday notification (single repeating ID)
            await LocalNotifications.cancel({ notifications: [{ id: 2000 }] });

            if (!settings.fridayMessage) return;

            const FRIDAY_MESSAGES = [
                "Hayırlı Cumalar 🌹 Allah dualarınızı kabul, ömrünüzü bereketli eylesin.",
                "Cumanız Mübarek Olsun. Kalbiniz nur, eviniz huzur dolsun. 🤲",
                "Ey Rabbimiz! Bizi sana boyun eğenlerden kıl. Hayırlı Cumalar.",
                "Gönüller duada birleşince Cumalar güzelleşir. Hayırlı Cumalar 🕌",
                "Cuma gününün hayrı, bereketi üzerinize olsun. Selam ve dua ile... 🌹",
                "Rabbim! Gönlümüzden geçen hayırlı duaları kabul eyle. Cumanız mübarek olsun.",
                "Allah'ın rahmeti ve bereketi üzerinize olsun. Hayırlı, huzurlu Cumalar.",
                "Ömrümüzün her anı Cuma bereketiyle dolsun. Dualarda buluşmak ümidiyle. 🤲"
            ];

            // Find next Friday
            const now = new Date();
            const nextFriday = new Date();
            nextFriday.setHours(11, 30, 0, 0);
            const dayOfWeek = now.getDay();
            const daysUntilFriday = (5 + 7 - dayOfWeek) % 7;
            nextFriday.setDate(now.getDate() + (daysUntilFriday === 0 && now > nextFriday ? 7 : daysUntilFriday));

            // Use 'every: week' for PERMANENT weekly repeating
            const randomMessage = FRIDAY_MESSAGES[Math.floor(Math.random() * FRIDAY_MESSAGES.length)];

            console.log('🕌 Scheduling 1 repeating weekly Friday notification (permanent)');
            await LocalNotifications.schedule({
                notifications: [{
                    id: 2000,
                    title: 'Hayırlı Cumalar 🌹',
                    body: randomMessage,
                    schedule: {
                        at: nextFriday,
                        every: 'week',
                        allowWhileIdle: true
                    },
                    sound: settings.vibrateOnly ? null : (Capacitor.getPlatform() === 'android' ? 'beep' : 'beep.caf'),
                    smallIcon: 'ic_stat_icon_config_sample'
                }]
            });

        } catch (error) {
            console.error('Error scheduling Friday message:', error);
        }
    }, [settings.fridayMessage, settings.vibrateOnly]);

    const value = useMemo(() => ({
        prayerTimes,
        nextPrayer,
        loading,
        settings,
        locationSource, // 'gps' | 'fallback' | 'loading'
        updateSettings,
        fetchPrayerTimes
    }), [prayerTimes, nextPrayer, loading, settings, locationSource, updateSettings, fetchPrayerTimes]);

    return (
        <PrayerTimesContext.Provider value={value}>
            {children}
        </PrayerTimesContext.Provider>
    );
};
