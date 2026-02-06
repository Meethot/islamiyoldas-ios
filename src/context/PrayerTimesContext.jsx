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

    const scheduleDailyNotifications = useCallback(async (timings) => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // clear existing
            await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }] });

            if (!settings.adhanEnabled) return;

            const prayers = [
                { id: 1, name: 'Sabah Namazı', time: timings.Fajr },
                { id: 2, name: 'Öğle Namazı', time: timings.Dhuhr },
                { id: 3, name: 'İkindi Namazı', time: timings.Asr },
                { id: 4, name: 'Akşam Namazı', time: timings.Maghrib },
                { id: 5, name: 'Yatsı Namazı', time: timings.Isha }
            ];

            const notifications = prayers.map(p => {
                const [h, m] = p.time.split(':').map(Number);
                const date = new Date();
                date.setHours(h);
                date.setMinutes(m);
                date.setSeconds(0);

                // If time passed, schedule for tomorrow (Simple logic, ideal is to have full date support)
                if (date < new Date()) {
                    date.setDate(date.getDate() + 1);
                }

                return {
                    title: 'Ezan Vakti',
                    body: `${p.name} Vakti Girdi`,
                    id: p.id,
                    schedule: { at: date, allowWhileIdle: true },
                    sound: settings.vibrateOnly ? null : (Capacitor.getPlatform() === 'android' ? 'ezan' : 'ezan.caf'),
                    channelId: 'ezan_vakti',
                    smallIcon: 'ic_stat_icon_config_sample',
                    interruptionLevel: 'timeSensitive' // Ensures better sound delivery on iOS
                };
            });

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
            }
        } catch (error) {
            console.error('Error scheduling notifications:', error);
        }
    }, [settings.adhanEnabled, settings.vibrateOnly]); // Added dependencies

    const scheduleVerseNotifications = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // Cancel existing verse notifications (IDs 1001 and 1002)
            await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }] });

            if (!settings.verseEnabled) return;

            // Helper to get random verse
            const getRandomVerse = () => DAILY_VERSES[Math.floor(Math.random() * DAILY_VERSES.length)];

            // Schedule for tomorrow if time passed
            const getScheduleDate = (hour, minute) => {
                const date = new Date();
                date.setHours(hour, minute, 0, 0);
                if (date < new Date()) {
                    date.setDate(date.getDate() + 1);
                }
                return date;
            };

            const morningVerse = getRandomVerse();
            const eveningVerse = getRandomVerse();

            const notifications = [
                {
                    id: 1001,
                    title: 'Günün Ayeti (Sabah)',
                    body: morningVerse.text,
                    schedule: { at: getScheduleDate(9, 0), allowWhileIdle: true },
                    smallIcon: 'ic_stat_icon_config_sample',
                    sound: null
                },
                {
                    id: 1002,
                    title: 'Günün Ayeti (Akşam)',
                    body: eveningVerse.text,
                    schedule: { at: getScheduleDate(21, 0), allowWhileIdle: true },
                    smallIcon: 'ic_stat_icon_config_sample',
                    sound: null
                }
            ];

            await LocalNotifications.schedule({ notifications });

        } catch (error) {
            console.error('Error scheduling verse notifications:', error);
        }
    }, [settings.verseEnabled]);

    const scheduleFridayMessage = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // Cancel existing Friday notifications (using a range of IDs)
            // We'll use IDs 2000 to 2050 for Friday messages
            const pending = await LocalNotifications.getPending();
            const fridayIds = pending.notifications
                .filter(n => n.id >= 2000 && n.id < 2050)
                .map(n => ({ id: n.id }));

            if (fridayIds.length > 0) {
                await LocalNotifications.cancel({ notifications: fridayIds });
            }

            if (!settings.fridayMessage) return;

            const FRIDAY_MESSAGES = [
                "Hayırlı Cumalar 🌹 Allah dualarınızı kabul, ömrünüzü bereketli eylesin.",
                "Cumanız Mübarek Olsun. Kalbiniz nur, eviniz huzur dolsun. 🤲",
                "Ey Rabbimiz! Bizi sana boyun eğenlerden kıl. Hayırlı Cumalar.",
                "Gönüller duada birleşince Cumalar güzelleşir. Hayırlı Cumalar 🕌",
                "Allah'ım! Recep ve Şaban'ı bize mübarek kıl ve bizi Ramazan'a ulaştır. Hayırlı Cumalar.",
                "Cuma gününün hayrı, bereketi üzerinize olsun. Selam ve dua ile... 🌹",
                "Rabbim! Gönlümüzden geçen hayırlı duaları kabul eyle. Cumanız mübarek olsun.",
                "Bugün duaların geri çevrilmediği o icabet saatine denk gelmeniz duasıyla. Hayırlı Cumalar.",
                "Allah'ın rahmeti ve bereketi üzerinize olsun. Hayırlı, huzurlu Cumalar.",
                "Ömrümüzün her anı Cuma bereketiyle dolsun. Dualarda buluşmak ümidiyle. 🤲"
            ];

            const notifications = [];
            const now = new Date();

            // Schedule for the next 10 weeks
            for (let i = 0; i < 10; i++) {
                const nextFriday = new Date();
                nextFriday.setHours(11, 30, 0, 0);

                const dayOfWeek = now.getDay();
                const daysUntilFriday = (5 + 7 - dayOfWeek) % 7;

                // Calculate date for this iteration's Friday
                if (i === 0) {
                    if (dayOfWeek === 5 && now > nextFriday) {
                        nextFriday.setDate(now.getDate() + 7);
                    } else {
                        nextFriday.setDate(now.getDate() + daysUntilFriday);
                    }
                } else {
                    // For i > 0, calculate based on the first scheduled Friday
                    const baseFriday = new Date();
                    baseFriday.setHours(11, 30, 0, 0);
                    let baseDaysToAdd = daysUntilFriday;
                    if (dayOfWeek === 5 && now > baseFriday) {
                        baseDaysToAdd += 7;
                    }
                    nextFriday.setDate(now.getDate() + baseDaysToAdd + (i * 7));
                }

                // Verify future check
                if (nextFriday <= now) {
                    nextFriday.setDate(nextFriday.getDate() + 7);
                }

                notifications.push({
                    id: 2000 + i,
                    title: 'Hayırlı Cumalar 🌹',
                    body: FRIDAY_MESSAGES[i % FRIDAY_MESSAGES.length],
                    schedule: { at: nextFriday, allowWhileIdle: true },
                    sound: settings.vibrateOnly ? null : (Capacitor.getPlatform() === 'android' ? 'beep' : 'beep.caf'),
                    smallIcon: 'ic_stat_icon_config_sample'
                });
            }

            console.log(`Scheduling ${notifications.length} Friday messages`);
            await LocalNotifications.schedule({ notifications });

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
