import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { useLocation } from '@/context/LocationContext';
import { DAILY_VERSES, DAILY_VERSES_EN, DAILY_VERSES_DE, DAILY_VERSES_RU, DAILY_VERSES_AZ } from '@/data/dailyVerses';

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

    // Debounce ref for notification scheduling — prevents duplicate calls from rapid state changes
    const scheduleDebounceRef = useRef(null);
    // Mutex to prevent overlapping schedule operations (cancel + schedule race condition)
    const schedulingRef = useRef(false);

    const { latitude, longitude, hasLocation } = useLocation();
    const { i18n } = useTranslation();

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

    // Schedule notifications when prayer times or relevant settings change (debounced)
    useEffect(() => {
        if (!prayerTimes) return;

        // Clear any pending debounce
        if (scheduleDebounceRef.current) {
            clearTimeout(scheduleDebounceRef.current);
        }

        // Debounce: wait 1s for rapid state changes to settle before scheduling
        scheduleDebounceRef.current = setTimeout(() => {
            scheduleDailyNotifications(prayerTimes);
        }, 1000);

        return () => {
            if (scheduleDebounceRef.current) {
                clearTimeout(scheduleDebounceRef.current);
            }
        };
    }, [prayerTimes, settings.adhanEnabled, settings.vibrateOnly, i18n.language]);

    // Schedule verse notifications when setting or language changes
    useEffect(() => {
        scheduleVerseNotifications();
    }, [settings.verseEnabled, i18n.language]);

    // Schedule Friday message when setting changes
    useEffect(() => {
        scheduleFridayMessage();
    }, [settings.fridayMessage, settings.vibrateOnly, i18n.language]);

    // Schedule dhikr reminder when setting changes
    useEffect(() => {
        scheduleDhikrReminder();
    }, [settings.dhikrReminder, i18n.language]);

    // Re-schedule prayer notifications every time app becomes active (handles 12-day expiry)
    // Also clears delivered notifications to prevent flood after phone wake
    useEffect(() => {
        if (!Capacitor.isNativePlatform() || !prayerTimes) return;

        const handleAppResume = async () => {
            try {
                // Clear ALL delivered notifications from notification center first
                // This prevents the "45 notifications at once" flood after phone has been off
                await LocalNotifications.removeAllDeliveredNotifications();
            } catch (e) {
                console.warn('Could not clear delivered notifications', e);
            }
            scheduleDailyNotifications(prayerTimes);
        };

        // Also clear delivered notifications on initial mount (fresh app open)
        LocalNotifications.removeAllDeliveredNotifications().catch(() => { });

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


    const fetchPrayerTimes = useCallback(async () => {
        try {
            setLoading(true);
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

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

            // Determine calculation method by location, NOT language
            // Turkey bounding box: lat 36-42, lng 26-45
            const isInTurkey = lat >= 36 && lat <= 42 && lng >= 26 && lng <= 45;
            const method = isInTurkey ? 13 : 3; // 13 = Diyanet, 3 = MWL

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
    }, [latitude, longitude, hasLocation]);

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

    const scheduleDailyNotifications = useCallback(async (todayTimings) => {
        if (!Capacitor.isNativePlatform()) return;
        if (schedulingRef.current) return;
        schedulingRef.current = true;

        try {
            // Cancel all existing prayer notifications (IDs 1-60)
            const cancelIds = Array.from({ length: 60 }, (_, i) => ({ id: i + 1 }));
            await LocalNotifications.cancel({ notifications: cancelIds });

            if (!settings.adhanEnabled) return;

            const lang = i18n.language || 'en';

            const prayerNames = {
                tr: ['Sabah Namazı', 'Öğle Namazı', 'İkindi Namazı', 'Akşam Namazı', 'Yatsı Namazı'],
                en: ['Fajr Prayer', 'Dhuhr Prayer', 'Asr Prayer', 'Maghrib Prayer', 'Isha Prayer'],
                de: ['Fajr-Gebet', 'Dhuhr-Gebet', 'Asr-Gebet', 'Maghrib-Gebet', 'Isha-Gebet'],
                ru: ['Утренний намаз', 'Полуденный намаз', 'Послеполуденный намаз', 'Вечерний намаз', 'Ночной намаз'],
                ar: ['صلاة الفجر', 'صلاة الظهر', 'صلاة العصر', 'صلاة المغرب', 'صلاة العشاء'],
                az: ['Sübh Namazı', 'Günorta Namazı', 'İkindi Namazı', 'Axşam Namazı', 'Yatsı Namazı']
            };
            const notifTitle = { tr: 'Ezan Vakti 🕌', en: 'Prayer Time 🕌', de: 'Gebetszeit 🕌', ru: 'Время намаза 🕌', ar: 'وقت الأذان 🕌', az: 'Azan Vaxtı 🕌' };
            const notifBody = { tr: 'vakti geldi. Haydi namaza!', en: 'time has come. Let\'s pray!', de: 'Zeit ist gekommen. Lasst uns beten!', ru: 'время пришло. Давайте помолимся!', ar: 'حان وقت الصلاة!', az: 'vaxtı gəldi. Haydi namaza!' };
            const names = prayerNames[lang] || prayerNames.en;

            // Determine GPS coords for API call
            const lat = (hasLocation && latitude) ? latitude : FALLBACK_COORDS.lat;
            const lng = (hasLocation && longitude) ? longitude : FALLBACK_COORDS.lng;
            const isInTurkey = lat >= 36 && lat <= 42 && lng >= 26 && lng <= 45;
            const method = isInTurkey ? 13 : 3;

            // Fetch calendar data for accurate per-day prayer times
            // Use calendar API to get the whole month in one call
            let calendarData = {};
            try {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth() + 1;

                const res = await axios.get(`https://api.aladhan.com/v1/calendar/${year}/${month}`, {
                    params: { latitude: lat, longitude: lng, method }
                });
                const days = res.data?.data || [];
                days.forEach(d => {
                    const dateKey = d.date?.gregorian?.date; // "DD-MM-YYYY"
                    if (dateKey) calendarData[dateKey] = d.timings;
                });

                // If 12-day window spans into next month, fetch that too
                const lastDay = new Date(today);
                lastDay.setDate(lastDay.getDate() + MAX_PRAYER_DAYS - 1);
                if (lastDay.getMonth() + 1 !== month) {
                    const nextMonth = lastDay.getMonth() + 1;
                    const nextYear = lastDay.getFullYear();
                    const res2 = await axios.get(`https://api.aladhan.com/v1/calendar/${nextYear}/${nextMonth}`, {
                        params: { latitude: lat, longitude: lng, method }
                    });
                    const days2 = res2.data?.data || [];
                    days2.forEach(d => {
                        const dateKey = d.date?.gregorian?.date;
                        if (dateKey) calendarData[dateKey] = d.timings;
                    });
                }
            } catch (e) {
                console.warn('Calendar API failed, using today\'s times as fallback', e);
            }

            const isIOS = Capacitor.getPlatform() === 'ios';
            const notifications = [];
            const now = new Date();

            const soundValue = settings.vibrateOnly
                ? null
                : (isIOS ? 'ezan.caf' : 'ezan.mp3');

            for (let day = 0; day < MAX_PRAYER_DAYS; day++) {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + day);

                // Build date key in Aladhan format: "DD-MM-YYYY"
                const dd = String(targetDate.getDate()).padStart(2, '0');
                const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
                const yyyy = targetDate.getFullYear();
                const dateKey = `${dd}-${mm}-${yyyy}`;

                // Use per-day times from calendar, or fall back to today's timings
                const dayTimings = calendarData[dateKey] || todayTimings;

                const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                prayerKeys.forEach((key, idx) => {
                    const rawTime = dayTimings[key];
                    if (!rawTime) return;
                    // Strip timezone offset: "06:12 (+03)" → "06:12"
                    const timeStr = rawTime.split(' ')[0];
                    const [h, m] = timeStr.split(':').map(Number);
                    if (isNaN(h) || isNaN(m)) return;

                    const date = new Date(targetDate);
                    date.setHours(h, m, 0, 0);

                    if (date <= now) return;

                    const id = day * 5 + idx + 1;

                    const notif = {
                        title: notifTitle[lang] || notifTitle.en,
                        body: `${names[idx]} ${notifBody[lang] || notifBody.en}`,
                        id,
                        schedule: { at: date, allowWhileIdle: true },
                        sound: soundValue,
                        channelId: 'ezan_vakti',
                        smallIcon: 'ic_stat_icon_config_sample',
                    };

                    if (isIOS) {
                        notif.interruptionLevel = 'timeSensitive';
                    }

                    notifications.push(notif);
                });
            }

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
            }
        } catch (error) {
            console.error('Error scheduling notifications:', error);
        } finally {
            schedulingRef.current = false;
        }
    }, [settings.adhanEnabled, settings.vibrateOnly, latitude, longitude, hasLocation]);

    const scheduleVerseNotifications = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }, { id: 1003 }] });

            if (!settings.verseEnabled) return;

            const lang = i18n.language || 'en';

            const versesMap = { tr: DAILY_VERSES, en: DAILY_VERSES_EN, de: DAILY_VERSES_DE, ru: DAILY_VERSES_RU, az: DAILY_VERSES_AZ };
            const verses = versesMap[lang] || DAILY_VERSES_EN;
            const getRandomVerse = () => verses[Math.floor(Math.random() * verses.length)];
            const slotLabels = {
                tr: ['Sabah', 'Öğleden Sonra', 'Akşam'],
                en: ['Morning', 'Afternoon', 'Evening'],
                de: ['Morgen', 'Nachmittag', 'Abend'],
                ru: ['Утро', 'День', 'Вечер'],
                ar: ['الصباح', 'بعد الظهر', 'المساء'],
                az: ['Səhər', 'Günortadan sonra', 'Axşam']
            };
            const verseTitle = { tr: 'Günün Ayeti', en: 'Verse of the Day', de: 'Vers des Tages', ru: 'Аят дня', ar: 'آية اليوم', az: 'Günün Ayəsi' };
            const labels = slotLabels[lang] || slotLabels.en;

            const verseSlots = [
                { id: 1001, hour: 9, minute: 0, label: labels[0] },
                { id: 1002, hour: 14, minute: 0, label: labels[1] },
                { id: 1003, hour: 21, minute: 0, label: labels[2] }
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
                    title: `${verseTitle[lang] || verseTitle.en} 📖`,
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

            const lang = i18n.language || 'en';
            const FRIDAY_MESSAGES_MAP = {
                tr: [
                    "Hayırlı Cumalar 🌹 Allah dualarınızı kabul, ömrünüzü bereketli eylesin.",
                    "Cumanız Mübarek Olsun. Kalbiniz nur, eviniz huzur dolsun. 🤲",
                    "Ey Rabbimiz! Bizi sana boyun eğenlerden kıl. Hayırlı Cumalar.",
                    "Gönüller duada birleşince Cumalar güzelleşir. Hayırlı Cumalar 🕌",
                    "Cuma gününün hayrı, bereketi üzerinize olsun. Selam ve dua ile... 🌹",
                ],
                en: [
                    "Blessed Friday 🌹 May Allah accept your prayers and bless your life.",
                    "Jumu'ah Mubarak! May your heart be filled with light and your home with peace. 🤲",
                    "Our Lord! Make us among those who submit to You. Blessed Friday.",
                    "When hearts unite in prayer, Fridays become beautiful. Blessed Friday 🕌",
                    "May the blessings of Friday be upon you. With peace and prayers... 🌹",
                ],
                az: [
                    "Xeyirli Cümələr 🌹 Allah dualarınızı qəbul, ömrünüzü bərəkətli eləsin.",
                    "Cüməniz Mübarək Olsun. Qəlbiniz nur, eviniz hüzur dolsun. 🤲",
                    "Ey Rəbbimiz! Bizi Sənə boyun əyənlərdən et. Xeyirli Cümələr.",
                    "Könüllər duada birləşəndə Cümələr gözəlləşir. Xeyirli Cümələr 🕌",
                    "Cümə gününün xeyri, bərəkəti üzərinizə olsun. Salam və dua ilə... 🌹",
                ],
                de: [
                    "Gesegneter Freitag 🌹 Möge Allah eure Gebete annehmen und euer Leben segnen.",
                    "Jumu'ah Mubarak! Möge euer Herz mit Licht und euer Heim mit Frieden erfüllt sein. 🤲",
                ],
                ru: [
                    "Благословенная пятница 🌹 Да примет Аллах ваши молитвы и благословит вашу жизнь.",
                    "Джума Мубарак! Пусть ваше сердце наполнится светом, а дом — покоем. 🤲",
                ],
                ar: [
                    "جمعة مباركة 🌹 تقبّل الله دعاءكم وبارك في أعماركم.",
                    "جمعة طيبة! نسأل الله أن يملأ قلوبكم نوراً وبيوتكم سكينة. 🤲",
                ]
            };
            const fridayTitle = { tr: 'Hayırlı Cumalar 🌹', en: 'Blessed Friday 🌹', de: 'Gesegneter Freitag 🌹', ru: 'Благословенная пятница 🌹', ar: 'جمعة مباركة 🌹', az: 'Xeyirli Cümələr 🌹' };

            const messages = FRIDAY_MESSAGES_MAP[lang] || FRIDAY_MESSAGES_MAP.en;

            const now = new Date();
            const nextFriday = new Date();
            nextFriday.setHours(11, 30, 0, 0);
            const dayOfWeek = now.getDay();
            const daysUntilFriday = (5 + 7 - dayOfWeek) % 7;
            nextFriday.setDate(now.getDate() + (daysUntilFriday === 0 && now > nextFriday ? 7 : daysUntilFriday));

            const randomMessage = messages[Math.floor(Math.random() * messages.length)];

            const isIOS = Capacitor.getPlatform() === 'ios';
            const isAndroid = Capacitor.getPlatform() === 'android';
            const soundValue = settings.vibrateOnly
                ? null
                : (isIOS ? 'beep.caf' : 'beep.wav');

            await LocalNotifications.schedule({
                notifications: [{
                    id: 2000,
                    title: fridayTitle[lang] || fridayTitle.en,
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

            const lang = i18n.language || 'en';
            const DHIKR_MESSAGES_MAP = {
                tr: [
                    "Kalpler ancak Allah'ı anmakla huzur bulur. Bugün zikrini yaptın mı? 📿",
                    "Bir dakika bile olsa zikret, kalbini nurlandır. Zikirmatik seni bekliyor 🤲",
                    "Her tesbih bir adım cennete… Bugünkü adımlarını attın mı? 📿",
                    "Dil Allah'ı zikrettiğinde kalp sükûnet bulur. Hadi zikredelim 🌿",
                ],
                en: [
                    "Hearts find peace only in the remembrance of Allah. Have you done your dhikr today? 📿",
                    "Even a minute of dhikr enlightens the heart. The counter is waiting for you 🤲",
                    "Every tasbih is a step to Paradise… Have you taken your steps today? 📿",
                    "SubhanAllah, Alhamdulillah, Allahu Akbar… Find peace in three words 📿",
                ],
                az: [
                    "Qəlblər ancaq Allahı zikr etməklə hüzur tapır. Bu gün zikrini etdinmi? 📿",
                    "Bir dəqiqə belə olsa zikr et, qəlbini nurlandır. Zikirmatik səni gözləyir 🤲",
                    "Hər təsbeh cənnətə bir addımdır… Bugünkü addımlarını atdınmı? 📿",
                    "Sübhanallah, Əlhəmdülillah, Allahu Əkbər… Üç söz ilə hüzur tap 📿",
                ],
                de: [
                    "Herzen finden nur im Gedenken Allahs Ruhe. Hast du heute deinen Dhikr gemacht? 📿",
                    "Jeder Tasbih ist ein Schritt zum Paradies… Hast du deine Schritte heute gemacht? 📿",
                ],
                ru: [
                    "Сердца обретают покой лишь в поминании Аллаха. Ты сделал свой зикр сегодня? 📿",
                    "СубханАллах, Альхамдулиллях, Аллаху Акбар… Обрети покой в трёх словах 📿",
                ],
                ar: [
                    "ألا بذكر الله تطمئن القلوب. هل ذكرت الله اليوم؟ 📿",
                    "سبحان الله والحمد لله والله أكبر… اطمئن بثلاث كلمات 📿",
                ]
            };
            const dhikrTitle = { tr: 'Zikir Vakti 📿', en: 'Dhikr Time 📿', de: 'Dhikr-Zeit 📿', ru: 'Время зикра 📿', ar: 'وقت الذكر 📿', az: 'Zikr Vaxtı 📿' };

            const dhikrMessages = DHIKR_MESSAGES_MAP[lang] || DHIKR_MESSAGES_MAP.en;

            const scheduleDate = new Date();
            scheduleDate.setHours(10, 0, 0, 0);
            if (scheduleDate <= new Date()) {
                scheduleDate.setDate(scheduleDate.getDate() + 1);
            }

            const randomMessage = dhikrMessages[Math.floor(Math.random() * dhikrMessages.length)];

            await LocalNotifications.schedule({
                notifications: [{
                    id: 3000,
                    title: dhikrTitle[lang] || dhikrTitle.en,
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
