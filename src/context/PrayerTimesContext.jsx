import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { useLocation } from '@/context/LocationContext';
import { DAILY_VERSES, DAILY_VERSES_EN, DAILY_VERSES_DE, DAILY_VERSES_RU, DAILY_VERSES_AZ, DAILY_VERSES_AR } from '@/data/dailyVerses';
import { getAppDate, getTodayString } from '@/lib/testDate';

const PrayerTimesContext = createContext();

export const usePrayerTimes = () => useContext(PrayerTimesContext);

export const PrayerTimesProvider = ({ children }) => {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [countdown, setCountdown] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [isTurkishLocation, setIsTurkishLocation] = useState(false);
    const [location, setLocationState] = useState(null);
    const [address, setAddressState] = useState('');
    const [settings, setSettings] = useState({
        adhanEnabled: true,
        vibrateOnly: false,
        verseEnabled: true,
        prayerFocusMode: true,
        spiritualRewards: true,
        fridayMessage: true,
        dhikrReminder: true
    });

    const [locationSource, setLocationSource] = useState('loading');

    // Ref to track if initial schedule has been done
    const initialScheduleDoneRef = useRef(false);

    // Debounce ref for notification scheduling - prevents duplicate calls from rapid state changes
    const scheduleDebounceRef = useRef(null);
    // Mutex to prevent overlapping schedule operations (cancel + schedule race condition)
    const schedulingRef = useRef(false);

    const { latitude, longitude, hasLocation } = useLocation();
    const { i18n } = useTranslation();

    const FALLBACK_COORDS = { lat: 41.0082, lng: 28.9784 };

    // Initial Setup & Cache Validation
    useEffect(() => {
        const CACHE_VERSION = 'v3_final_sync'; // Final sync with Diyanet official calendar
        const version = localStorage.getItem('app_data_version');
        if (version !== CACHE_VERSION) {
            // Sadece cache ve namaz vakti anahtarlarını temizle, TÜM veriyi (Premium, Onboarding vb.) DEĞİL!
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k.startsWith('diyanet_') || k.startsWith('prayers_') || k.startsWith('cached_')) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            localStorage.setItem('app_data_version', CACHE_VERSION);
        }
        
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
        // Clear any pending debounce
        if (scheduleDebounceRef.current) {
            clearTimeout(scheduleDebounceRef.current);
        }

        // Debounce: wait 1s for rapid state changes to settle before scheduling
        scheduleDebounceRef.current = setTimeout(() => {
            schedulePrayerNotifications(prayerTimes);
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
                    id: 'ezan_vakti_silent',
                    name: 'Ezan Vakti (Sessiz)',
                    importance: 5,
                    description: 'Sessiz ezan vakti bildirimleri',
                    sound: null,
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


    // ─── Diyanet API helpers ───
    const DIYANET_API = 'https://prayertimes.api.abdus.dev/api/diyanet';

    // Resolve Diyanet location_id from district name (cached)
    const resolveDiyanetLocationId = async (districtName) => {
        if (!districtName) return null;

        // Check cache first
        const cacheKey = `diyanet_loc_${districtName.toLowerCase()}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) return parseInt(cached, 10);

        try {
            const res = await axios.get(`${DIYANET_API}/search`, {
                params: { q: districtName },
                timeout: 5000,
            });
            const results = res.data;
            if (results && results.length > 0) {
                // Try exact match on district OR city
                const exact = results.find(
                    r => (r.district?.toLowerCase() === districtName.toLowerCase()) || 
                         (r.region?.toLowerCase() === districtName.toLowerCase()) || 
                         (r.city?.toLowerCase() === districtName.toLowerCase())
                );
                const id = (exact || results[0]).id;
                localStorage.setItem(cacheKey, String(id));
                return id;
            }
        } catch (e) {
            console.warn('Diyanet location search failed:', e.message);
        }
        return null;
    };

    // Today's normalization helper
    const normalizeTimings = (rawTimes, isTurkish) => {
        if (!rawTimes) return null;
        
        const addMinutes = (timeStr, mins) => {
            if (!timeStr) return timeStr;
            const [h, m] = timeStr.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m + mins);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        };

        const result = { ...rawTimes };
        
        // Diyanet standard offsets for Turkey
        if (isTurkish) {
            // Priority: Fajr is always Imsak in TR
            result.Imsak = rawTimes.Fajr || rawTimes.Imsak;
            result.Fajr = rawTimes.Fajr || rawTimes.Imsak;
            
            // Diyanet Safety Buffers (Emniyet Payı)
            // Diyanet officially adds +2 mins to Dhuhr and Asr calculations
            result.Dhuhr = addMinutes(rawTimes.Dhuhr, 2);
            result.Asr = addMinutes(rawTimes.Asr, 2); 
            
            // Diyanet adds +1 to Sunrise for atmospheric refraction/safety
            result.Sunrise = addMinutes(rawTimes.Sunrise, 1);
            
            // Maghrib and Isha are usually exactly what the API (Diyanet scraper) provides
            result.Maghrib = rawTimes.Maghrib;
            result.Isha = rawTimes.Isha;
            result.Sunset = result.Maghrib;
        }
        
        return result;
    };

    // Fetch today's times from Diyanet
    const fetchDiyanetTimes = async (locationId) => {
        try {
            const res = await axios.get(`${DIYANET_API}/prayertimes`, {
                params: { location_id: locationId },
                timeout: 5000,
            });
            const days = res.data;
            if (!days || days.length === 0) return null;

            const todayStr = getTodayString();
            const todayData = days.find(d => d.date?.startsWith(todayStr));
            if (!todayData) return null;

            // Raw map first
            const raw = {
                Fajr: todayData.fajr,
                Sunrise: todayData.sun,
                Dhuhr: todayData.dhuhr,
                Asr: todayData.asr,
                Maghrib: todayData.maghrib,
                Isha: todayData.isha,
                _source: 'diyanet_raw'
            };

            return normalizeTimings(raw, true);
        } catch (e) {
            console.warn('Diyanet prayer times fetch failed:', e.message);
            return null;
        }
    };

    const fetchPrayerTimes = useCallback(async () => {
        try {
            setLoading(true);

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

            // Turkey bounding box: lat 36-42, lng 26-45
            const isInTurkey = lat >= 36 && lat <= 42 && lng >= 26 && lng <= 45;
            const countryCode = localStorage.getItem('cached_country_code');
            const turkish = isInTurkey || countryCode === 'tr';
            setIsTurkishLocation(turkish);
            setLocationState({ latitude: lat, longitude: lng });
            setAddressState(localStorage.getItem('cached_address') || '');

            // ── Try Diyanet API first for Turkey ──
            if (turkish) {
                const district = localStorage.getItem('cached_district');
                const city = localStorage.getItem('cached_address');
                
                // Try district first, then city, then fallback to Istanbul if we are SURE it's Turkey
                const searchTerms = [district, city].filter(Boolean);
                if (searchTerms.length === 0 && turkish) searchTerms.push('Istanbul');

                let diyanetSuccess = false;
                for (const term of searchTerms) {
                    const locationId = await resolveDiyanetLocationId(term);
                    if (locationId) {
                        const diyanetTimings = await fetchDiyanetTimes(locationId);
                        if (diyanetTimings) {
                            setPrayerTimes(diyanetTimings);
                            findNextPrayer(diyanetTimings);
                            schedulePrayerNotifications(diyanetTimings);
                            setLoading(false); // Manually set loading false before return
                            diyanetSuccess = true;
                            return;
                        }
                    }
                }
                
                // If we failed all specific queries but we are IN TURKEY, 
                // do an absolute final fallback to Istanbul via Diyanet before Aladhan to avoid 10 min Isha shift
                if (!diyanetSuccess && turkish) {
                    const lastResortId = await resolveDiyanetLocationId('Istanbul');
                    if (lastResortId) {
                        const diyanetTimings = await fetchDiyanetTimes(lastResortId);
                        if (diyanetTimings) {
                            setPrayerTimes(diyanetTimings);
                            findNextPrayer(diyanetTimings);
                            schedulePrayerNotifications(diyanetTimings);
                            setLoading(false);
                            return;
                        }
                    }
                }
            }

            // ── Fallback: Aladhan API ──
            const appDate = getAppDate();
            const dateStr = `${appDate.getDate()}-${appDate.getMonth() + 1}-${appDate.getFullYear()}`;
            
            // If we are in Turkey, Aladhan is NOT accurate (Method 13 is only an approximation)
            // We should warn or try harder for Diyanet.
            const method = turkish ? 13 : 3; 

            const response = await axios.get(`https://api.aladhan.com/v1/timings/${dateStr}`, {
                params: { latitude: lat, longitude: lng, method }
            });

            const rawTimings = response.data.data.timings;
            const normalized = normalizeTimings(rawTimings, turkish);
            normalized._source = turkish ? 'aladhan_tr_norm' : 'aladhan';
            
            setPrayerTimes(normalized);
            findNextPrayer(normalized);
            schedulePrayerNotifications(normalized);
        } catch (error) {
            console.error('Error fetching prayer times:', error);
        } finally {
            setLoading(false);
        }
    }, [latitude, longitude, hasLocation]);

    // Re-fetch prayer times + re-schedule notifications every time app becomes active
    // This handles: 7-day notification expiry, date changes, and stale cached data
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const handleAppResume = async () => {
            try {
                await LocalNotifications.removeAllDeliveredNotifications();
            } catch (e) {
                console.warn('Could not clear delivered notifications', e);
            }
            fetchPrayerTimes();
        };

        LocalNotifications.removeAllDeliveredNotifications().catch(() => { });

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
    }, [fetchPrayerTimes]);

    const findNextPrayer = (timings) => {
        try {
            const now = getAppDate();
            const timeToMinutes = (time) => {
                if (!time) return -1;
                const clean = time.split(' ')[0];
                const [h, m] = clean.split(':').map(Number);
                return h * 60 + m;
            };
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // Turkish/AZ convention: İmsak (fasting start) as first prayer
            // International convention: Fajr (dawn prayer) as first prayer
            const lang = (i18n.language || 'en').split('-')[0];
            const useImsak = lang === 'tr' || lang === 'az';
            const firstPrayerTime = useImsak ? timings.Imsak : timings.Fajr;
            const firstPrayerName = useImsak ? 'İmsak' : 'Fajr';

            const prayers = [
                { name: firstPrayerName, time: firstPrayerTime },
                { name: 'Güneş', time: timings.Sunrise },
                { name: 'Öğle', time: timings.Dhuhr },
                { name: 'İkindi', time: timings.Asr },
                { name: 'Akşam', time: timings.Maghrib },
                { name: 'Yatsı', time: timings.Isha }
            ];

            let next = prayers.find(p => p.time && timeToMinutes(p.time) > currentMinutes);
            if (!next) next = prayers[0];
            setNextPrayer(next);
        } catch (e) {
            console.error("Error calculating next prayer", e);
        }
    };

    // iOS limit: 64 pending notifications
    // Budget: 3 repeating verse + 1 repeating friday + 1 dhikr = 5 permanent
    // Prayer: 7 days × 5 prayers = 35 slots (IDs 1-35)
    // Reserved: 24 slots for future features
    const MAX_PRAYER_DAYS = 7;

    const schedulePrayerNotifications = useCallback(async (todayTimings) => {
        if (!Capacitor.isNativePlatform()) return;
        if (schedulingRef.current) return;
        schedulingRef.current = true;

        try {
            // Cancel all existing prayer notifications (IDs 1-35)
            const cancelIds = Array.from({ length: 35 }, (_, i) => ({ id: i + 1 }));
            await LocalNotifications.cancel({ notifications: cancelIds });

            if (!settings.adhanEnabled || !todayTimings) return;

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
            const localIsInTurkey = lat >= 36 && lat <= 42 && lng >= 26 && lng <= 45;
            const countryCode = localStorage.getItem('cached_country_code');
            const localIsTurkish = localIsInTurkey || countryCode === 'tr';

            // Fetch calendar data for accurate per-day prayer times
            let calendarData = {};
            let useDiyanetFormat = false;
            try {
                // ── Try Diyanet first for Turkey ──
                const district = localStorage.getItem('cached_district');
                if (localIsTurkish && district) {
                    const locationId = await resolveDiyanetLocationId(district);
                    if (locationId) {
                        const res = await axios.get(`${DIYANET_API}/prayertimes`, {
                            params: { location_id: locationId },
                            timeout: 5000,
                        });
                        const days = res.data || [];
                        if (days.length > 0) {
                            useDiyanetFormat = true;
                            days.forEach(d => {
                                if (!d.date) return;
                                const dateObj = new Date(d.date);
                                const dd = String(dateObj.getDate()).padStart(2, '0');
                                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const yyyy = dateObj.getFullYear();
                                const dateKey = `${dd}-${mm}-${yyyy}`;
                                // Map to Aladhan-compatible structure with CENTRALIZED normalization
                                const raw = {
                                    Fajr: d.fajr,
                                    Sunrise: d.sun,
                                    Dhuhr: d.dhuhr,
                                    Asr: d.asr,
                                    Maghrib: d.maghrib,
                                    Isha: d.isha
                                };
                                calendarData[dateKey] = normalizeTimings(raw, true);
                            });
                        }
                    }
                }

                // ── Supplement missing dates (Diyanet only returns current month) ──
                // Check if all 7 days are covered — if not, fill gaps with Aladhan
                const today = getAppDate();
                let hasMissingDays = false;
                for (let d = 0; d < MAX_PRAYER_DAYS; d++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(checkDate.getDate() + d);
                    const dd = String(checkDate.getDate()).padStart(2, '0');
                    const mm = String(checkDate.getMonth() + 1).padStart(2, '0');
                    const yyyy = checkDate.getFullYear();
                    if (!calendarData[`${dd}-${mm}-${yyyy}`]) {
                        hasMissingDays = true;
                        break;
                    }
                }

                if (hasMissingDays) {
                    // Fetch Aladhan calendar for the missing month(s)
                    const method = isTurkishLocation ? 13 : 3;
                    const monthsToFetch = new Set();
                    for (let d = 0; d < MAX_PRAYER_DAYS; d++) {
                        const checkDate = new Date(today);
                        checkDate.setDate(checkDate.getDate() + d);
                        monthsToFetch.add(`${checkDate.getFullYear()}-${checkDate.getMonth() + 1}`);
                    }

                    for (const ym of monthsToFetch) {
                        const [y, m] = ym.split('-').map(Number);
                        try {
                            const res = await axios.get(`https://api.aladhan.com/v1/calendar/${y}/${m}`, {
                                params: { latitude: lat, longitude: lng, method }
                            });
                            const days = res.data?.data || [];
                            days.forEach(d => {
                                const dateKey = d.date?.gregorian?.date;
                                // Only fill gaps — don't overwrite Diyanet data
                                if (dateKey && !calendarData[dateKey]) {
                                    calendarData[dateKey] = normalizeTimings(d.timings, localIsTurkish);
                                }
                            });
                        } catch (e2) {
                            console.warn(`Aladhan calendar ${y}/${m} failed`, e2);
                        }
                    }
                }

                // ── Full Aladhan fallback (no Diyanet data at all) ──
                if (Object.keys(calendarData).length === 0) {
                    const year = today.getFullYear();
                    const month = today.getMonth() + 1;
                    const method = isTurkishLocation ? 13 : 3;

                    const res = await axios.get(`https://api.aladhan.com/v1/calendar/${year}/${month}`, {
                        params: { latitude: lat, longitude: lng, method }
                    });
                    const days = res.data?.data || [];
                    days.forEach(d => {
                        const dateKey = d.date?.gregorian?.date;
                        if (dateKey) calendarData[dateKey] = normalizeTimings(d.timings, localIsTurkish);
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
                            if (dateKey) calendarData[dateKey] = normalizeTimings(d.timings, localIsTurkish);
                        });
                    }
                }
            } catch (e) {
                console.warn('Calendar API failed, using today\'s times as fallback', e);
            }

            const isIOS = Capacitor.getPlatform() === 'ios';
            const notifications = [];

            const soundValue = settings.vibrateOnly
                ? null
                : (isIOS ? 'ezan.caf' : 'ezan.mp3');

            const appDate = getAppDate();
            const now = appDate;

            for (let day = 0; day < MAX_PRAYER_DAYS; day++) {
                const targetDate = new Date(appDate);
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
                        channelId: settings.vibrateOnly ? 'ezan_vakti_silent' : 'ezan_vakti',
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
    }, [settings.adhanEnabled, settings.vibrateOnly, latitude, longitude, hasLocation, i18n.language]);

    const scheduleVerseNotifications = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }, { id: 1003 }] });

            if (!settings.verseEnabled) return;

            const lang = i18n.language || 'en';

            const versesMap = { tr: DAILY_VERSES, en: DAILY_VERSES_EN, de: DAILY_VERSES_DE, ru: DAILY_VERSES_RU, az: DAILY_VERSES_AZ, ar: DAILY_VERSES_AR };
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

            const appDate = getAppDate();
            const verseSlots = [
                { id: 1001, hour: 9, minute: 0, label: labels[0] },
                { id: 1002, hour: 14, minute: 0, label: labels[1] },
                { id: 1003, hour: 21, minute: 0, label: labels[2] }
            ];

            const notifications = verseSlots.map(slot => {
                const verse = getRandomVerse();
                const scheduleDate = new Date(appDate);
                scheduleDate.setHours(slot.hour, slot.minute, 0, 0);

                if (scheduleDate <= appDate) {
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
    }, [settings.verseEnabled, i18n.language]);

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

            const appDate = getAppDate();
            const nextFriday = new Date(appDate);
            nextFriday.setHours(11, 30, 0, 0);
            const dayOfWeek = appDate.getDay();
            const daysUntilFriday = (5 + 7 - dayOfWeek) % 7;
            nextFriday.setDate(appDate.getDate() + (daysUntilFriday === 0 && appDate > nextFriday ? 7 : daysUntilFriday));

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
                    channelId: settings.vibrateOnly ? 'ezan_vakti_silent' : 'ezan_vakti',
                    smallIcon: 'ic_stat_icon_config_sample'
                }]
            });

        } catch (error) {
            console.error('Error scheduling Friday message:', error);
        }
    }, [settings.fridayMessage, settings.vibrateOnly, i18n.language]);

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

            const appDate = getAppDate();
            const scheduleDate = new Date(appDate);
            scheduleDate.setHours(10, 0, 0, 0);
            if (scheduleDate <= appDate) {
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
    }, [settings.dhikrReminder, i18n.language]);

    const value = useMemo(() => ({
        prayerTimes,
        nextPrayer,
        countdown,
        loading,
        error: error || locationError,
        location,
        address,
        isTurkishLocation,
        settings,
        updateSettings,
        refreshPrayerTimes: fetchPrayerTimes,
        schedulePrayerNotifications,
    }), [
        prayerTimes, 
        nextPrayer, 
        countdown, 
        loading, 
        error, 
        locationError, 
        location, 
        address, 
        isTurkishLocation, 
        settings, 
        updateSettings, 
        fetchPrayerTimes, 
        schedulePrayerNotifications
    ]);

    return (
        <PrayerTimesContext.Provider value={value}>
            {children}
        </PrayerTimesContext.Provider>
    );
};
