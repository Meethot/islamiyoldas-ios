import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
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
        fridayMessage: true,
        dhikrReminder: true
    });

    const [loading, setLoading] = useState(true);
    const [locationSource, setLocationSource] = useState('loading');

    // Ref to track if initial schedule has been done
    const initialScheduleDoneRef = useRef(false);

    const { latitude, longitude, hasLocation } = useLocation();

    const FALLBACK_COORDS = { lat: 41.0082, lng: 28.9784 };

    // Initial Setup
    useEffect(() => {
        loadSettings();
        if (Capacitor.isNativePlatform()) {
            initializeNotifications();
        }
    }, []);

    // Fetch prayer times immediately and re-fetch when location updates
    useEffect(() => {
        fetchPrayerTimes();
    }, [latitude, longitude, hasLocation]);

    // Schedule notifications when prayer times or relevant settings change
    useEffect(() => {
        if (!prayerTimes) return;

        scheduleDailyNotifications(prayerTimes);
    }, [prayerTimes, settings.adhanEnabled, settings.vibrateOnly]);

    // Schedule verse notifications when setting changes
    useEffect(() => {
        scheduleVerseNotifications();
    }, [settings.verseEnabled]);

    // Schedule Friday message when setting changes
    useEffect(() => {
        scheduleFridayMessage();
    }, [settings.fridayMessage, settings.vibrateOnly]);

    // Schedule dhikr reminder when setting changes
    useEffect(() => {
        scheduleDhikrReminder();
    }, [settings.dhikrReminder]);

    // Re-schedule prayer notifications every time app becomes active (handles 12-day expiry)
    useEffect(() => {
        if (!Capacitor.isNativePlatform() || !prayerTimes) return;

        const handleAppResume = () => {
            console.log('📿 App resumed — refreshing prayer notification schedule');
            scheduleDailyNotifications(prayerTimes);
        };

        // Capacitor App plugin fires 'resume' when app comes to foreground
        const importApp = async () => {
            try {
                const { App } = await import('@capacitor/app');
                App.addListener('resume', handleAppResume);
                return () => App.removeAllListeners('resume');
            } catch (e) {
                console.warn('Could not add resume listener', e);
            }
        };

        let cleanup;
        importApp().then(fn => { cleanup = fn; });

        return () => { if (cleanup) cleanup(); };
    }, [prayerTimes, settings.adhanEnabled, settings.vibrateOnly]);

    const loadSettings = async () => {
        try {
            const { value: adhanEnabled } = await Preferences.get({ key: 'adhanEnabled' });
            const { value: vibrateOnly } = await Preferences.get({ key: 'vibrateOnly' });
            const { value: verseEnabled } = await Preferences.get({ key: 'verseEnabled' });
            const { value: prayerFocusMode } = await Preferences.get({ key: 'prayerFocusMode' });
            const { value: spiritualRewards } = await Preferences.get({ key: 'spiritualRewards' });
            const { value: fridayMessage } = await Preferences.get({ key: 'fridayMessage' });
            const { value: dhikrReminder } = await Preferences.get({ key: 'dhikrReminder' });

            setSettings({
                adhanEnabled: adhanEnabled === null ? true : adhanEnabled === 'true',
                vibrateOnly: vibrateOnly === 'true',
                verseEnabled: verseEnabled === null ? true : verseEnabled === 'true',
                prayerFocusMode: prayerFocusMode === null ? true : prayerFocusMode === 'true',
                spiritualRewards: spiritualRewards === null ? true : spiritualRewards === 'true',
                fridayMessage: fridayMessage === null ? true : fridayMessage === 'true',
                dhikrReminder: dhikrReminder === null ? true : dhikrReminder === 'true'
            });
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const updateSettings = useCallback(async (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
        try {
            for (const [key, value] of Object.entries(newSettings)) {
                if (value !== undefined) {
                    await Preferences.set({ key, value: String(value) });
                }
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, []);

    const initializeNotifications = async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
            const permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }

            // Android notification channel — sound is baked into the channel
            // IMPORTANT: Once created, Android caches the channel. Changing sound requires
            // the user to uninstall/reinstall or manually reset in system settings.
            if (Capacitor.getPlatform() === 'android') {
                await LocalNotifications.createChannel({
                    id: 'ezan_vakti',
                    name: 'Ezan Vakti',
                    importance: 5,
                    description: 'Ezan vakti bildirimleri',
                    sound: 'ezan.mp3',
                    visibility: 1,
                    vibration: true
                });

                await LocalNotifications.createChannel({
                    id: 'sahur_alarm',
                    name: 'Sahur Alarmı',
                    importance: 5,
                    description: 'Sahur vakti alarm bildirimi',
                    sound: 'sahur_alarm.mp3',
                    visibility: 1,
                    vibration: true
                });
            }
        } catch (error) {
            console.error('Notification initialization error:', error);
        }
    };

    const { i18n } = useTranslation();

    const fetchPrayerTimes = useCallback(async () => {
        try {
            setLoading(true);
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

            const method = i18n.language?.startsWith('tr') ? 13 : 3;

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

            const response = await axios.get(`https://api.aladhan.com/v1/timings/${dateStr}`, {
                params: { latitude: lat, longitude: lng, method }
            });

            const timings = response.data.data.timings;
            setPrayerTimes(timings);
            findNextPrayer(timings);
        } catch (error) {
            console.error('Error fetching prayer times:', error);
        } finally {
            setLoading(false);
        }
    }, [i18n.language, latitude, longitude, hasLocation]);

    const findNextPrayer = (timings) => {
        try {
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
            if (!next) next = prayers[0];
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
            // Cancel all existing prayer notifications (IDs 1-60)
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

            const isIOS = Capacitor.getPlatform() === 'ios';
            const isAndroid = Capacitor.getPlatform() === 'android';
            const notifications = [];
            const now = new Date();

            // Sound config:
            // - Android: channel handles the sound, but we set it here too for redundancy
            // - iOS: per-notification sound file (must be in app bundle root)
            // - Vibrate-only: empty string = system default silent behavior
            const soundValue = settings.vibrateOnly
                ? ''
                : (isIOS ? 'ezan.caf' : 'ezan.mp3');

            for (let day = 0; day < MAX_PRAYER_DAYS; day++) {
                prayers.forEach((p, idx) => {
                    const [h, m] = p.time.split(':').map(Number);
                    if (isNaN(h) || isNaN(m)) return; // Guard against malformed times

                    const date = new Date();
                    date.setDate(date.getDate() + day);
                    date.setHours(h, m, 0, 0);

                    if (date <= now) return;

                    const id = day * 5 + idx + 1; // IDs 1-60

                    const notif = {
                        title: 'Ezan Vakti 🕌',
                        body: `${p.name} vakti girdi. Haydi namaza!`,
                        id,
                        schedule: { at: date, allowWhileIdle: true },
                        sound: soundValue,
                        channelId: 'ezan_vakti',
                        smallIcon: 'ic_stat_icon_config_sample',
                    };

                    // iOS: time-sensitive ensures delivery even in Focus/DND mode
                    if (isIOS) {
                        notif.interruptionLevel = 'timeSensitive';
                    }

                    notifications.push(notif);
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
            await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }, { id: 1003 }] });

            if (!settings.verseEnabled) return;

            const getRandomVerse = () => DAILY_VERSES[Math.floor(Math.random() * DAILY_VERSES.length)];

            const verseSlots = [
                { id: 1001, hour: 9, minute: 0, label: 'Sabah' },
                { id: 1002, hour: 14, minute: 0, label: 'Öğleden Sonra' },
                { id: 1003, hour: 21, minute: 0, label: 'Akşam' }
            ];

            const notifications = verseSlots.map(slot => {
                const verse = getRandomVerse();
                const scheduleDate = new Date();
                scheduleDate.setHours(slot.hour, slot.minute, 0, 0);

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
                    sound: '' // Silent — no sound for verse notifications
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

            const now = new Date();
            const nextFriday = new Date();
            nextFriday.setHours(11, 30, 0, 0);
            const dayOfWeek = now.getDay();
            const daysUntilFriday = (5 + 7 - dayOfWeek) % 7;
            nextFriday.setDate(now.getDate() + (daysUntilFriday === 0 && now > nextFriday ? 7 : daysUntilFriday));

            const randomMessage = FRIDAY_MESSAGES[Math.floor(Math.random() * FRIDAY_MESSAGES.length)];

            const isIOS = Capacitor.getPlatform() === 'ios';
            const isAndroid = Capacitor.getPlatform() === 'android';
            const soundValue = settings.vibrateOnly
                ? ''
                : (isIOS ? 'beep.caf' : 'beep.wav');

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
                    sound: soundValue,
                    smallIcon: 'ic_stat_icon_config_sample'
                }]
            });

        } catch (error) {
            console.error('Error scheduling Friday message:', error);
        }
    }, [settings.fridayMessage, settings.vibrateOnly]);

    const scheduleDhikrReminder = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await LocalNotifications.cancel({ notifications: [{ id: 3000 }] });

            if (!settings.dhikrReminder) return;

            const DHIKR_MESSAGES = [
                "Kalpler ancak Allah'ı anmakla huzur bulur. Bugün zikrini yaptın mı? 📿",
                "Bir dakika bile olsa zikret, kalbini nurlandır. Zikirmatik seni bekliyor 🤲",
                "Her tesbih bir adım cennete… Bugünkü adımlarını attın mı? 📿",
                "Dil Allah'ı zikrettiğinde kalp sükûnet bulur. Hadi zikredelim 🌿",
                "Günün en bereketli anı: Allah'ı anma vakti. Zikirmatik'te buluşalım 📿",
                "Zikir, ruhun gıdasıdır. Bugün ruhunu doyurdun mu? 🕊️",
                "Sübhanallah, Elhamdülillah, Allahu Ekber… Üç kelimeyle huzur bul 📿",
                "Kalbin paslanmasın, zikirle parıldasın. Haydi bir kaç dakika ayır 🌟",
            ];

            const scheduleDate = new Date();
            scheduleDate.setHours(10, 0, 0, 0);
            if (scheduleDate <= new Date()) {
                scheduleDate.setDate(scheduleDate.getDate() + 1);
            }

            const randomMessage = DHIKR_MESSAGES[Math.floor(Math.random() * DHIKR_MESSAGES.length)];

            console.log('📿 Scheduling daily dhikr reminder notification (permanent)');
            await LocalNotifications.schedule({
                notifications: [{
                    id: 3000,
                    title: 'Zikir Vakti 📿',
                    body: randomMessage,
                    schedule: {
                        at: scheduleDate,
                        every: 'day',
                        allowWhileIdle: true
                    },
                    sound: '',
                    smallIcon: 'ic_stat_icon_config_sample'
                }]
            });

        } catch (error) {
            console.error('Error scheduling dhikr reminder:', error);
        }
    }, [settings.dhikrReminder]);

    const value = useMemo(() => ({
        prayerTimes,
        nextPrayer,
        loading,
        settings,
        locationSource,
        updateSettings,
        fetchPrayerTimes
    }), [prayerTimes, nextPrayer, loading, settings, locationSource, updateSettings, fetchPrayerTimes]);

    return (
        <PrayerTimesContext.Provider value={value}>
            {children}
        </PrayerTimesContext.Provider>
    );
};
