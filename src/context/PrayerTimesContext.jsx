import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { useLocation } from '@/context/LocationContext';
import { DAILY_VERSES, DAILY_VERSES_EN, DAILY_VERSES_DE, DAILY_VERSES_RU, DAILY_VERSES_AZ, DAILY_VERSES_AR } from '@/data/dailyVerses';
import { getAppDate, getTodayString } from '@/lib/testDate';
import { buildPrayerSchedule } from '@/lib/prayerTimeUtils';
import { syncPrayerTimesToWidget } from '@/services/widgetService';
import { analytics } from '@/services/analyticsService';

const PrayerTimesContext = createContext();

export const usePrayerTimes = () => useContext(PrayerTimesContext);

export const PrayerTimesProvider = ({ children }) => {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [calculationMethod, setCalculationMethodState] = useState(localStorage.getItem('calculationMethod') || 'auto');

    const setCalculationMethod = (method) => {
        setCalculationMethodState(method);
        localStorage.setItem('calculationMethod', method);
    };
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
        dhikrReminder: true,
        preReminderEnabled: false,
        preReminderMinutes: 30,
        hapticsEnabled: true
    });

    const [locationSource, setLocationSource] = useState('loading');

    // Ref to track if initial schedule has been done
    const initialScheduleDoneRef = useRef(false);

    // Debounce ref for notification scheduling - prevents duplicate calls from rapid state changes
    const scheduleDebounceRef = useRef(null);
    // Mutex to prevent overlapping schedule operations (cancel + schedule race condition)
    const schedulingRef = useRef(false);
    // Ref to always hold the latest fetchPrayerTimes (avoids stale closure in effects)
    const fetchPrayerTimesRef = useRef(null);
    const prevManualCityRef = useRef(null);
    // Circuit breaker: skip Diyanet API for 60s after a network failure
    const diyanetDownUntilRef = useRef(0);

    const { latitude, longitude, hasLocation, manualCity, manualCountry, cityName, geoRevision } = useLocation();
    const { i18n } = useTranslation();

    const FALLBACK_COORDS = { lat: 41.0082, lng: 28.9784 };

    // ─── Prayer times cache helpers (instant splash dismiss) ───
    const PRAYER_CACHE_KEY = 'cached_prayer_times';
    const cachePrayerTimes = (timings) => {
        try {
            const payload = { date: getTodayString(), timings };
            localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(payload));
        } catch { /* quota exceeded — ignore */ }
    };
    const restoreCachedPrayerTimes = () => {
        try {
            const raw = localStorage.getItem(PRAYER_CACHE_KEY);
            if (!raw) return null;
            const { date, timings } = JSON.parse(raw);
            // Only use cache if it's from today
            if (date === getTodayString() && timings) return timings;
        } catch { /* corrupt cache — ignore */ }
        return null;
    };

    // Stable refresh function that always calls the latest fetchPrayerTimes
    const refreshPrayerTimesStable = useCallback(() => {
        if (fetchPrayerTimesRef.current) {
            return fetchPrayerTimesRef.current();
        }
    }, []);

    // Initial Setup & Cache Validation
    useEffect(() => {
        const CACHE_VERSION = 'v6_diyanet_guard'; // v6: Diyanet search validation, monthly cache, method auto-select, midnight-crossing times
        const version = localStorage.getItem('app_data_version');
        if (version !== CACHE_VERSION) {
            // Clear cache and prayer time keys only, NOT all data
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

    // Fetch prayer times immediately and re-fetch when location or manual city changes
    useEffect(() => {
        // When manual city changes, clear old Diyanet location cache to force fresh API lookup
        if (manualCity && manualCity !== prevManualCityRef.current) {
            prevManualCityRef.current = manualCity;
            // Clear all diyanet location caches to ensure fresh lookup
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('diyanet_loc_')) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        }
        // Use ref to always call the latest version of fetchPrayerTimes
        if (fetchPrayerTimesRef.current) {
            fetchPrayerTimesRef.current();
        }
    }, [latitude, longitude, hasLocation, manualCity, calculationMethod]);

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

    // Schedule pre-prayer reminders when setting changes
    useEffect(() => {
        if (prayerTimes) schedulePreReminderNotifications(prayerTimes);
    }, [settings.preReminderEnabled, settings.preReminderMinutes, i18n.language]);


    const loadSettings = async () => {
        try {
            const { value: adhanEnabled } = await Preferences.get({ key: 'adhanEnabled' });
            const { value: vibrateOnly } = await Preferences.get({ key: 'vibrateOnly' });
            const { value: verseEnabled } = await Preferences.get({ key: 'verseEnabled' });
            const { value: prayerFocusMode } = await Preferences.get({ key: 'prayerFocusMode' });
            const { value: spiritualRewards } = await Preferences.get({ key: 'spiritualRewards' });
            const { value: fridayMessage } = await Preferences.get({ key: 'fridayMessage' });
            const { value: dhikrReminder } = await Preferences.get({ key: 'dhikrReminder' });
            const { value: preReminderEnabled } = await Preferences.get({ key: 'preReminderEnabled' });
            const { value: preReminderMinutes } = await Preferences.get({ key: 'preReminderMinutes' });
            const { value: hapticsEnabled } = await Preferences.get({ key: 'hapticsEnabled' });

            const loaded = {
                adhanEnabled: adhanEnabled === null ? true : adhanEnabled === 'true',
                vibrateOnly: vibrateOnly === 'true',
                verseEnabled: verseEnabled === null ? true : verseEnabled === 'true',
                prayerFocusMode: prayerFocusMode === null ? true : prayerFocusMode === 'true',
                spiritualRewards: spiritualRewards === null ? true : spiritualRewards === 'true',
                fridayMessage: fridayMessage === null ? true : fridayMessage === 'true',
                dhikrReminder: dhikrReminder === null ? true : dhikrReminder === 'true',
                preReminderEnabled: preReminderEnabled === 'true',
                preReminderMinutes: preReminderMinutes ? parseInt(preReminderMinutes, 10) : 30,
                hapticsEnabled: hapticsEnabled === null ? true : hapticsEnabled === 'true'
            };

            // If OS notification permission is NOT granted, show all notification toggles as OFF
            if (Capacitor.isNativePlatform()) {
                try {
                    const permStatus = await LocalNotifications.checkPermissions();
                    if (permStatus.display !== 'granted') {
                        loaded.adhanEnabled = false;
                        loaded.verseEnabled = false;
                        loaded.fridayMessage = false;
                        loaded.dhikrReminder = false;
                        loaded.preReminderEnabled = false;
                    }
                } catch { /* permission check failed, keep loaded values */ }
            }

            setSettings(loaded);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const NOTIFICATION_KEYS = ['adhanEnabled', 'verseEnabled', 'fridayMessage', 'dhikrReminder', 'spiritualRewards', 'preReminderEnabled'];

    const updateSettings = useCallback(async (newSettings) => {
        // If enabling any notification toggle, check OS permission first
        if (Capacitor.isNativePlatform()) {
            const isEnablingNotification = NOTIFICATION_KEYS.some(k => newSettings[k] === true);
            if (isEnablingNotification) {
                try {
                    let perm = await LocalNotifications.checkPermissions();

                    if (perm.display === 'prompt') {
                        // First time — request permission
                        perm = await LocalNotifications.requestPermissions();
                    }

                    if (perm.display !== 'granted') {
                        // Permission denied — redirect user to iOS/Android Settings
                        // Note: iOS only allows opening the app's main settings page via 'app-settings:'
                        // Deep-linking to the notifications sub-page is not supported by Apple's public API
                        try {
                            window.open('app-settings:', '_blank');
                        } catch (e) {
                            console.warn('[NOTIF] Could not open settings:', e?.message);
                        }
                        // Revert toggle(s) since permission is still denied
                        const reverted = {};
                        NOTIFICATION_KEYS.forEach(k => { if (newSettings[k] === true) reverted[k] = false; });
                        setSettings(prev => ({ ...prev, ...reverted }));
                        return; // Don't persist
                    }
                } catch (e) {
                    console.error('Permission check error:', e);
                    return;
                }
            }
        }

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

            // Track when notifications are delivered (even if app is in foreground)
            await LocalNotifications.addListener('localNotificationReceived', (notification) => {
                const type = notification.id <= 45 ? 'prayer' :
                             notification.id >= 100 && notification.id <= 114 ? 'pre_reminder' :
                             notification.id >= 1001 && notification.id <= 1003 ? 'verse' :
                             notification.id === 2000 ? 'friday' :
                             notification.id === 3000 ? 'dhikr' : 'other';
                analytics.notificationReceived(type);
            });

            // Track when user taps on a notification
            await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
                const id = action.notification?.id;
                const type = id <= 45 ? 'prayer' :
                             id >= 100 && id <= 114 ? 'pre_reminder' :
                             id >= 1001 && id <= 1003 ? 'verse' :
                             id === 2000 ? 'friday' :
                             id === 3000 ? 'dhikr' : 'other';
                analytics.notificationTapped(type);
            });
        } catch (error) {
            console.error('Notification initialization error:', error);
        }
    };


    // ─── Diyanet API helpers ───
    const DIYANET_API = 'https://prayertimes.api.abdus.dev/api/diyanet';

    // Turkish → ASCII normalization (Diyanet API rejects İ, ı, Ş, ş, etc.)
    const normalizeTurkishChars = (str) => {
        const map = { 'İ': 'I', 'ı': 'i', 'Ş': 'S', 'ş': 's', 'Ğ': 'G', 'ğ': 'g', 'Ü': 'U', 'ü': 'u', 'Ö': 'O', 'ö': 'o', 'Ç': 'C', 'ç': 'c' };
        return str.replace(/[İıŞşĞğÜüÖöÇç]/g, c => map[c] || c);
    };

    // Normalized comparison key: trims (API data has trailing spaces like "LONDON "),
    // folds Turkish chars and lowercases
    const diyanetNorm = (s) => normalizeTurkishChars(String(s || '').trim()).toLowerCase();

    // Diyanet country name (normalized) for the manual selection. Manual countries are
    // stored as English names (countriesnow.space); Diyanet uses Turkish names (ALMANYA).
    const getManualCountryDiyanetName = () => {
        const c = (manualCountry || '').trim();
        if (!c || c === 'Turkey' || c === 'Türkiye') return 'turkiye';
        try {
            const cache = JSON.parse(localStorage.getItem('countries_data_cache') || '[]');
            const iso2 = cache.find(x => x.country === c)?.iso2;
            if (iso2) {
                const trName = new Intl.DisplayNames(['tr'], { type: 'region' }).of(iso2);
                if (trName) return diyanetNorm(trName);
            }
        } catch { /* fall through to English name */ }
        return diyanetNorm(c);
    };

    // Resolve Diyanet location_id with validation (cached).
    // Search results have shape { id, country, city (province), region (district) }.
    // Same-named districts exist in different provinces (Ereğli: Konya vs Zonguldak)
    // and foreign queries can match the wrong continent ("London" → London, Canada),
    // so a result is only accepted when it matches the expected country and, if
    // known, the expected province. No match → null → caller falls back to Aladhan.
    const resolveDiyanetLocationId = async (name, { expectedProvince = null, expectedCountry = 'turkiye' } = {}) => {
        if (!name) return null;

        // Circuit breaker: skip if Diyanet API was down recently
        if (Date.now() < diyanetDownUntilRef.current) {
            return null;
        }

        const query = diyanetNorm(name);
        const province = expectedProvince ? diyanetNorm(expectedProvince) : null;
        const cacheKey = `diyanet_loc_${expectedCountry}_${province || 'any'}_${query}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) return parseInt(cached, 10);

        try {
            const res = await axios.get(`${DIYANET_API}/search`, {
                params: { q: normalizeTurkishChars(String(name).trim()) },
                timeout: 5000,
            });
            let results = Array.isArray(res.data) ? res.data : [];
            results = results.filter(r => diyanetNorm(r.country) === expectedCountry);

            if (province) {
                const inProvince = results.filter(r => diyanetNorm(r.city) === province);
                if (inProvince.length > 0) {
                    results = inProvince;
                } else if (results.length > 1) {
                    // Name exists only outside the user's province — ambiguous, don't guess
                    return null;
                }
            }

            // Region (district) match has priority over city (province) match:
            // searching "Istanbul" must pick the İSTANBUL center entry (9541), not the
            // alphabetically-first district (Arnavutköy — 2 min different times).
            const exactRegions = results.filter(r => diyanetNorm(r.region) === query);
            let match = null;
            if (exactRegions.length === 1) {
                match = exactRegions[0];
            } else if (exactRegions.length > 1) {
                // Same district name in multiple provinces — only safe if province-filtered
                match = province ? exactRegions[0] : null;
            } else {
                const exactCity = results.find(r => diyanetNorm(r.city) === query);
                // Without an exact name match, only accept when the candidate set is
                // unambiguous (single result, or province-validated list)
                match = exactCity || (results.length === 1 ? results[0] : (province ? results[0] : null));
            }
            if (match) {
                localStorage.setItem(cacheKey, String(match.id));
                return match.id;
            }
        } catch (e) {
            // Network error → activate circuit breaker for 60 seconds
            console.warn('Diyanet API unreachable, skipping for 60s:', e.message);
            diyanetDownUntilRef.current = Date.now() + 60000;
        }
        return null;
    };

    // ─── Diyanet monthly cache ───
    // The proxy returns ~31 days from today; caching the whole list means the rest
    // of the month works offline and the Aladhan fallback is almost never needed.
    const DIYANET_MONTH_KEY = 'diyanet_month_cache';

    const readDiyanetMonthCache = (locationId) => {
        try {
            const raw = localStorage.getItem(DIYANET_MONTH_KEY);
            if (!raw) return null;
            const { locationId: cachedId, days } = JSON.parse(raw);
            if (cachedId !== locationId || !Array.isArray(days) || days.length === 0) return null;
            const todayStr = getTodayString();
            if (!days.some(d => d.date?.startsWith(todayStr))) return null; // stale
            return days;
        } catch {
            return null;
        }
    };

    const fetchDiyanetMonth = async (locationId) => {
        const cached = readDiyanetMonthCache(locationId);
        if (cached) return cached;

        if (Date.now() < diyanetDownUntilRef.current) return null;

        try {
            const res = await axios.get(`${DIYANET_API}/prayertimes`, {
                params: { location_id: locationId },
                timeout: 5000,
            });
            const days = res.data;
            if (!days || days.length === 0) return null;
            try {
                localStorage.setItem(DIYANET_MONTH_KEY, JSON.stringify({ locationId, days }));
            } catch { /* quota exceeded — ignore */ }
            return days;
        } catch (e) {
            console.warn('Diyanet prayer times fetch failed:', e.message);
            diyanetDownUntilRef.current = Date.now() + 60000;
            return null;
        }
    };

    // Today's normalization helper
    const normalizeTimings = (rawTimes, isTurkish) => {
        if (!rawTimes) return null;

        const addMinutes = (timeStr, mins) => {
            if (!timeStr) return timeStr;
            const pureTime = timeStr.split(' ')[0]; // Strip timezone like "(+03)"
            const [h, m] = pureTime.split(':').map(Number);
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

            // Öğle (Dhuhr): Diyanet delays öğle ~2 min past true zenith (praying at
            // the exact zenith/zeval is not permitted). Neither the Diyanet proxy nor
            // Aladhan includes this margin — both return the calculated zenith time —
            // so it's added on BOTH paths. Verified in Urla: calc 13:23 vs ezan 13:25.
            result.Dhuhr = addMinutes(rawTimes.Dhuhr, 2);

            // Other prayers: NO offset. Verified against the real ezan that Aladhan
            // method 13 and the Diyanet proxy match within ±1 min (İkindi/Akşam were
            // exact once the correct district resolves — see resolveDiyanetLocationId;
            // İstanbul now maps to the center, not the ~2-min-later first district).

            result.Sunset = result.Maghrib;
        }

        return result;
    };

    // Fetch today's times from Diyanet (via the cached monthly list)
    const fetchDiyanetTimes = async (locationId) => {
        const days = await fetchDiyanetMonth(locationId);
        if (!days) return null;

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
    };

    // Where to look up Diyanet times, in priority order.
    // Manual selection wins outright; GPS mode validates the reverse-geocoded
    // district/province so same-named districts can't cross provinces.
    const getDiyanetSearchPlans = (turkish) => {
        if (manualCity) {
            return [{ term: manualCity, opts: { expectedCountry: getManualCountryDiyanetName() } }];
        }
        if (!turkish) return [];
        const plans = [];
        const district = localStorage.getItem('cached_district');
        const provinceCtx = localStorage.getItem('cached_address');
        if (district) plans.push({ term: district, opts: { expectedProvince: provinceCtx } });
        if (provinceCtx) plans.push({ term: provinceCtx, opts: { expectedProvince: provinceCtx } });
        return plans;
    };

    // ─── Shared multi-day calendar ───
    // Builds dateKey ("DD-MM-YYYY") → normalized timings covering the next
    // CALENDAR_WINDOW_DAYS. Used by notification scheduling AND the widget
    // multi-day sync; session-cached so both consumers share one fetch.
    const CALENDAR_WINDOW_DAYS = 10;
    const calendarCacheRef = useRef({ key: null, data: null });

    const fetchCalendarData = async () => {
        const lat = (hasLocation && latitude) ? latitude : FALLBACK_COORDS.lat;
        const lng = (hasLocation && longitude) ? longitude : FALLBACK_COORDS.lng;
        // Same detection logic as fetchPrayerTimes
        const localIsInTurkey = lat >= 36 && lat <= 42 && lng >= 26 && lng <= 45;
        const countryCode = localStorage.getItem('cached_country_code');
        const manualIsTurkey = manualCountry === 'Turkey' || manualCountry === 'Türkiye';
        const localIsTurkish = manualCity ? manualIsTurkey : (countryCode ? countryCode === 'tr' : localIsInTurkey);

        const cacheKey = `${getTodayString()}|${manualCity || `${lat},${lng}`}|${calculationMethod}`;
        if (calendarCacheRef.current.key === cacheKey) return calendarCacheRef.current.data;

        const calendarData = {};

        // ── Try Diyanet first (validated search, cached monthly list) ──
        const allowDiyanet = calculationMethod === 'auto' || calculationMethod === '13';
        if (allowDiyanet) {
            for (const plan of getDiyanetSearchPlans(localIsTurkish)) {
                const locationId = await resolveDiyanetLocationId(plan.term, plan.opts);
                if (!locationId) continue;
                const days = await fetchDiyanetMonth(locationId) || [];
                if (days.length === 0) continue;
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
                        Isha: d.isha,
                        _source: 'diyanet_raw'
                    };
                    calendarData[dateKey] = normalizeTimings(raw, true);
                });
                break;
            }
        }

        // ── Fill gaps with Aladhan (Diyanet unavailable, or window not covered) ──
        const today = getAppDate();
        let hasMissingDays = false;
        for (let d = 0; d < CALENDAR_WINDOW_DAYS; d++) {
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
            // Auto mode outside Turkey: omit `method` so Aladhan picks the local authority
            const method = calculationMethod === 'auto' ? (localIsTurkish ? 13 : null) : parseInt(calculationMethod, 10);
            const monthsToFetch = new Set();
            for (let d = 0; d < CALENDAR_WINDOW_DAYS; d++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() + d);
                monthsToFetch.add(`${checkDate.getFullYear()}-${checkDate.getMonth() + 1}`);
            }

            for (const ym of monthsToFetch) {
                const [y, m] = ym.split('-').map(Number);
                try {
                    const calParams = { latitude: lat, longitude: lng };
                    if (method != null) calParams.method = method;
                    const res = await axios.get(`https://api.aladhan.com/v1/calendar/${y}/${m}`, {
                        params: calParams
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

        // Only cache successful results — a network failure must not stick for the session
        if (Object.keys(calendarData).length > 0) {
            calendarCacheRef.current = { key: cacheKey, data: calendarData };
        }
        return calendarData;
    };

    const fetchPrayerTimes = useCallback(async (isBackgroundRefresh = false) => {
        try {
            if (!isBackgroundRefresh) setLoading(true);

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

            // Turkish location detection: manual selection wins; otherwise trust the
            // reverse-geocoded country code and only use the bounding box when no
            // geocode is available (the box also covers Yerevan, Aleppo, Rhodes...)
            const isInTurkey = lat >= 36 && lat <= 42 && lng >= 26 && lng <= 45;
            const countryCode = localStorage.getItem('cached_country_code');
            const manualIsTurkey = manualCountry === 'Turkey' || manualCountry === 'Türkiye';
            const turkish = manualCity ? manualIsTurkey : (countryCode ? countryCode === 'tr' : isInTurkey);
            setIsTurkishLocation(turkish);
            setLocationState({ latitude: lat, longitude: lng });
            setAddressState(localStorage.getItem('cached_address') || '');

            // ── Try Diyanet API first (Turkey, or a manual city Diyanet publishes) ──
            const allowDiyanet = calculationMethod === 'auto' || calculationMethod === '13';
            if (allowDiyanet) {
                for (const plan of getDiyanetSearchPlans(turkish)) {
                    const locationId = await resolveDiyanetLocationId(plan.term, plan.opts);
                    if (!locationId) continue;
                    const diyanetTimings = await fetchDiyanetTimes(locationId);
                    if (diyanetTimings) {
                        setPrayerTimes(diyanetTimings);
                        findNextPrayer(diyanetTimings);
                        schedulePrayerNotifications(diyanetTimings);
                        schedulePreReminderNotifications(diyanetTimings);
                        syncWidgetData(diyanetTimings);
                        cachePrayerTimes(diyanetTimings);
                        setLoading(false);
                        return;
                    }
                }
                // No validated Diyanet match → Aladhan with the exact coordinates.
                // (Guessing a city like the old Istanbul fallback is 20+ min wrong
                // for eastern Turkey; coordinates are within ±1 min.)
            }

            // ── Fallback: Aladhan API ──
            const appDate = getAppDate();
            const dateStr = `${appDate.getDate()}-${appDate.getMonth() + 1}-${appDate.getFullYear()}`;

            // In auto mode outside Turkey, omit `method` — Aladhan then selects the
            // local authority itself (e.g. Umm al-Qura in Saudi Arabia, Egyptian
            // Authority in Egypt). A hardcoded MWL was 7-10 min off in those regions.
            const method = calculationMethod === 'auto' ? (turkish ? 13 : null) : parseInt(calculationMethod, 10);

            let response;
            // Always prioritize manual city for Aladhan if set, regardless of background physical GPS state
            if (manualCity) {
                const addressQuery = manualCountry ? `${manualCity}, ${manualCountry}` : manualCity;
                const params = { address: addressQuery };
                if (method != null) params.method = method;
                response = await axios.get(`https://api.aladhan.com/v1/timingsByAddress/${dateStr}`, { params });
            } else {
                const params = { latitude: lat, longitude: lng };
                if (method != null) params.method = method;
                response = await axios.get(`https://api.aladhan.com/v1/timings/${dateStr}`, { params });
            }

            const rawTimings = response.data.data.timings;
            const normalized = normalizeTimings(rawTimings, turkish);
            normalized._source = turkish ? 'aladhan_tr_norm' : 'aladhan';

            setPrayerTimes(normalized);
            findNextPrayer(normalized);
            schedulePrayerNotifications(normalized);
            schedulePreReminderNotifications(normalized);
            syncWidgetData(normalized);
            cachePrayerTimes(normalized);
        } catch (error) {
            console.error('Error fetching prayer times:', error);
        } finally {
            setLoading(false);
        }
    }, [latitude, longitude, hasLocation, manualCity, manualCountry, calculationMethod]);

    // Push prayer times to iOS Widget via App Group UserDefaults
    const syncWidgetData = useCallback(async (timings) => {
        if (!timings) return;
        const lang = (i18n.language || 'en').split('-')[0];
        const city = cityName || 'Bilinmiyor';
        const prayerNames = {
            tr: { fajr: 'İmsak', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
            en: { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
            de: { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
            ru: { fajr: 'Фаджр', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' },
            ar: { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
            az: { fajr: 'Sübh', dhuhr: 'Günorta', asr: 'İkindi', maghrib: 'Axşam', isha: 'Yatsı' },
        };
        const names = prayerNames[lang] || prayerNames.en;
        const toPrayerArray = (t) => ([
            { id: 'fajr', name: names.fajr, time: (t.Fajr || t.Imsak || '').split(' ')[0] },
            { id: 'sunrise', name: (lang === 'tr' || lang === 'az') ? 'Güneş' : 'Sunrise', time: (t.Sunrise || '').split(' ')[0] },
            { id: 'dhuhr', name: names.dhuhr, time: (t.Dhuhr || '').split(' ')[0] },
            { id: 'asr', name: names.asr, time: (t.Asr || '').split(' ')[0] },
            { id: 'maghrib', name: names.maghrib, time: (t.Maghrib || '').split(' ')[0] },
            { id: 'isha', name: names.isha, time: (t.Isha || '').split(' ')[0] },
        ]);
        const prayers = toPrayerArray(timings);

        // Multi-day schedule so the widget stays accurate for days without an
        // app open (previously it froze on the last synced day's times)
        const days = [];
        try {
            const calendarData = await fetchCalendarData() || {};
            const base = getAppDate();
            for (let i = 0; i < CALENDAR_WINDOW_DAYS; i++) {
                const d = new Date(base);
                d.setDate(d.getDate() + i);
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const yyyy = d.getFullYear();
                const dayTimings = calendarData[`${dd}-${mm}-${yyyy}`] || (i === 0 ? timings : null);
                if (!dayTimings) continue;
                days.push({ date: `${yyyy}-${mm}-${dd}`, prayers: toPrayerArray(dayTimings) });
            }
        } catch { /* widget falls back to the single-day list */ }

        syncPrayerTimesToWidget({ prayerTimes: prayers, city, days });
    }, [cityName, i18n.language, latitude, longitude, hasLocation, manualCity, manualCountry, calculationMethod]);

    // Keep ref always pointing to the latest fetchPrayerTimes
    fetchPrayerTimesRef.current = fetchPrayerTimes;

    // Re-sync widget data when cityName or prayerTimes change
    // This ensures the widget is updated regardless of how/when data arrives
    useEffect(() => {
        if (prayerTimes && cityName) {
            console.log('[PrayerTimesContext] Widget sync triggered. city:', cityName, 'prayerTimes:', !!prayerTimes);
            syncWidgetData(prayerTimes);
        }
    }, [cityName, prayerTimes, syncWidgetData]);

    // On first mount: restore cache instantly (unblocks splash), then refresh in background
    useEffect(() => {
        const cached = restoreCachedPrayerTimes();
        if (cached) {
            // Cache hit — UI is ready, fetch fresh data silently
            setPrayerTimes(cached);
            findNextPrayer(cached);
            setLoading(false);
            // Background refresh (won't set loading=true)
            setTimeout(() => fetchPrayerTimesRef.current?.(true), 100);
        } else {
            // No cache — normal blocking fetch
            fetchPrayerTimesRef.current?.();
        }
    }, []);

    // Fresh reverse geocode landed: the initial fetch may have run in the window
    // where cached_district was cleared (cold-start GPS refresh) and resolved the
    // PROVINCE (e.g. İzmir merkez) instead of the district (Urla). Re-resolve
    // silently with the now-correct district/country data.
    useEffect(() => {
        if (!geoRevision) return; // 0 = mount, initial fetch handles it
        // Calendar session cache doesn't key on district — bust it so the widget
        // and notification schedules also re-resolve, not just today's times
        calendarCacheRef.current = { key: null, data: null };
        fetchPrayerTimesRef.current?.(true);
    }, [geoRevision]);

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

            // Sync notification toggles with OS permission on every resume
            try {
                const perm = await LocalNotifications.checkPermissions();
                if (perm.display !== 'granted') {
                    // Permission not granted (denied/prompt) — show all toggles as OFF
                    const offSettings = {
                        adhanEnabled: false,
                        verseEnabled: false,
                        fridayMessage: false,
                        dhikrReminder: false,
                        spiritualRewards: false,
                        preReminderEnabled: false
                    };
                    setSettings(prev => ({ ...prev, ...offSettings }));
                } else {
                    // Permission granted — restore saved settings from Preferences
                    await loadSettings();
                }
            } catch (e) {
                console.warn('Could not sync notification permission', e);
            }

            fetchPrayerTimes();
        };

        LocalNotifications.removeAllDeliveredNotifications().catch(() => { });

        const setupResumeListener = async () => {
            NativeApp.addListener('resume', handleAppResume);
            return () => NativeApp.removeAllListeners('resume');
        };

        let cleanup;
        setupResumeListener().then(fn => { cleanup = fn; });

        return () => { if (cleanup) cleanup(); };
    }, [fetchPrayerTimes]);

    const findNextPrayer = (timings) => {
        try {
            const now = getAppDate();

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

            // Sequence-aware schedule: a midnight-crossing Isha (e.g. 00:10 at high
            // latitudes) counts as tonight's upcoming prayer, not as already passed
            const schedule = buildPrayerSchedule(prayers.map(p => p.time), now);
            let next = null;
            for (let i = 0; i < prayers.length; i++) {
                if (schedule[i] && schedule[i] > now) {
                    next = prayers[i];
                    break;
                }
            }
            if (!next) next = prayers[0];
            setNextPrayer(next);
        } catch (e) {
            console.error("Error calculating next prayer", e);
        }
    };

    // iOS limit: 64 pending notifications
    // Budget: 3 repeating verse + 1 repeating friday + 1 dhikr = 5 permanent
    // Prayer: 3 days × 5 prayers = 15 slots (IDs 1-15)
    // Pre-reminder: 3 days x 5 = 15 slots
    // This totals to ~35 scheduled notifications, giving 100% safety buffer against iOS limit crashes.
    const MAX_PRAYER_DAYS = 3;

    const schedulePrayerNotifications = useCallback(async (todayTimings) => {
        if (!Capacitor.isNativePlatform()) return;
        if (schedulingRef.current) return;
        schedulingRef.current = true;

        try {
            // Cancel all existing prayer notifications (IDs 1-35) safely
            try {
                const pending = await LocalNotifications.getPending();
                if (pending && pending.notifications) {
                    const toCancel = pending.notifications.filter(n => n.id >= 1 && n.id <= 35).map(n => ({ id: n.id }));
                    if (toCancel.length > 0) {
                        await LocalNotifications.cancel({ notifications: toCancel });
                    }
                }
            } catch (ce) { console.warn('Cancel prayers fail', ce); }

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

            // Fetch calendar data for accurate per-day prayer times
            // (shared with the widget multi-day sync — one fetch per session)
            let calendarData = {};
            try {
                calendarData = await fetchCalendarData() || {};
            } catch (e) {
                console.warn('Calendar API failed, using today\'s times as fallback', e);
            }

            const isIOS = Capacitor.getPlatform() === 'ios';
            const notifications = [];

            const soundValue = settings.vibrateOnly
                ? undefined
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

                const prayerKeys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                // Sequence-aware dates: a midnight-crossing Isha (high latitudes,
                // e.g. "00:10") lands on the next calendar day instead of being
                // scheduled in the past and silently skipped
                const daySchedule = buildPrayerSchedule(prayerKeys.map(k => dayTimings[k]), targetDate);
                prayerKeys.forEach((key, idx) => {
                    const date = daySchedule[idx];
                    if (!date) return;

                    if (date <= now) return;

                    const id = day * 6 + idx + 1;

                    const isSunrise = key === 'Sunrise';
                    const sunriseTitle = {
                        tr: 'Güneş Doğdu 🌅',
                        en: 'Sunrise 🌅',
                        de: 'Sonnenaufgang 🌅',
                        ru: 'Восход 🌅',
                        ar: 'الشروق 🌅',
                        az: 'Günəş Doğdu 🌅'
                    };
                    const sunriseBody = {
                        tr: 'Güneş vakti girdi.',
                        en: 'Sunrise time has arrived.',
                        de: 'Die Zeit für den Sonnenaufgang ist da.',
                        ru: 'Время восхода солнца наступило.',
                        ar: 'حان وقت شروق الشمس.',
                        az: 'Günəş vaxtı girdi.'
                    };

                    const prayerName = key === 'Fajr' ? names[0] : names[idx - 1];

                    const notif = {
                        title: isSunrise ? (sunriseTitle[lang] || sunriseTitle.tr) : (notifTitle[lang] || notifTitle.en),
                        body: isSunrise ? (sunriseBody[lang] || sunriseBody.tr) : `${prayerName} ${notifBody[lang] || notifBody.en}`,
                        id,
                        schedule: { at: date, allowWhileIdle: true },
                        smallIcon: 'ic_stat_icon_config_sample',
                    };

                    const soundValueForThis = isSunrise
                        ? (settings.vibrateOnly ? undefined : 'default')
                        : soundValue;

                    if (soundValueForThis) {
                        notif.sound = soundValueForThis;
                    }
                    if (isSunrise || settings.vibrateOnly) {
                        notif.channelId = (isSunrise && !settings.vibrateOnly) ? 'default' : 'ezan_vakti_silent';
                    } else {
                        notif.channelId = 'ezan_vakti';
                    }

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
    }, [settings.adhanEnabled, settings.vibrateOnly, latitude, longitude, hasLocation, manualCity, manualCountry, calculationMethod, i18n.language]);

    const scheduleVerseNotifications = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            try {
                const pending = await LocalNotifications.getPending();
                if (pending && pending.notifications) {
                    const toCancel = pending.notifications.filter(n => [1001, 1002, 1003].includes(n.id)).map(n => ({ id: n.id }));
                    if (toCancel.length > 0) {
                        await LocalNotifications.cancel({ notifications: toCancel });
                    }
                }
            } catch (ce) {}

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
                    body: `${verse.text} — ${verse.source}`,
                    schedule: {
                        at: scheduleDate,
                        every: 'day',
                        allowWhileIdle: true
                    },
                    smallIcon: 'ic_stat_icon_config_sample'
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
            try {
                const pending = await LocalNotifications.getPending();
                if (pending && pending.notifications) {
                    const toCancel = pending.notifications.filter(n => n.id === 2000).map(n => ({ id: n.id }));
                    if (toCancel.length > 0) {
                        await LocalNotifications.cancel({ notifications: toCancel });
                    }
                }
            } catch (ce) {}

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

            const notifPayload = {
                notifications: [{
                    id: 2000,
                    title: fridayTitle[lang] || fridayTitle.en,
                    body: randomMessage,
                    schedule: {
                        at: nextFriday,
                        every: 'week',
                        allowWhileIdle: true
                    },
                    sound: settings.vibrateOnly ? undefined : 'default',
                    channelId: settings.vibrateOnly ? 'ezan_vakti_silent' : 'default',
                    smallIcon: 'ic_stat_icon_config_sample'
                }]
            };

            await LocalNotifications.schedule(notifPayload);

        } catch (error) {
            console.error('Error scheduling Friday message:', error);
        }
    }, [settings.fridayMessage, settings.vibrateOnly, i18n.language]);

    const scheduleDhikrReminder = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            try {
                const pending = await LocalNotifications.getPending();
                if (pending && pending.notifications) {
                    const toCancel = pending.notifications.filter(n => n.id === 3000).map(n => ({ id: n.id }));
                    if (toCancel.length > 0) {
                        await LocalNotifications.cancel({ notifications: toCancel });
                    }
                }
            } catch (ce) {}

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
                    smallIcon: 'ic_stat_icon_config_sample',
                    extra: { type: 'dhikr_reminder', route: '/dhikr' }
                }]
            });

        } catch (error) {
            console.error('Error scheduling dhikr reminder:', error);
        }
    }, [settings.dhikrReminder, i18n.language]);

    // ─── Pre-Prayer Reminder Notifications (100-114, 3 days × 5 prayers) ───
    const MAX_PREREMINDER_DAYS = 3;

    const schedulePreReminderNotifications = useCallback(async (todayTimings) => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // Cancel all existing pre-reminder notifications (IDs 100-114) safely
            try {
                const pending = await LocalNotifications.getPending();
                if (pending && pending.notifications) {
                    const toCancel = pending.notifications.filter(n => n.id >= 100 && n.id <= 114).map(n => ({ id: n.id }));
                    if (toCancel.length > 0) {
                        await LocalNotifications.cancel({ notifications: toCancel });
                    }
                }
            } catch (ce) {}

            if (!settings.preReminderEnabled || !todayTimings) return;

            const minutes = settings.preReminderMinutes || 30;
            const lang = i18n.language || 'en';

            const prayerNames = {
                tr: ['Sabah Namazı', 'Öğle Namazı', 'İkindi Namazı', 'Akşam Namazı', 'Yatsı Namazı'],
                en: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
                de: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
                ru: ['Фаджр', 'Зухр', 'Аср', 'Магриб', 'Иша'],
                ar: ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'],
                az: ['Sübh', 'Günorta', 'İkindi', 'Axşam', 'Yatsı']
            };
            const reminderTitle = {
                tr: '⏰ Namaz Hatırlatma',
                en: '⏰ Prayer Reminder',
                de: '⏰ Gebetserinnerung',
                ru: '⏰ Напоминание о намазе',
                ar: '⏰ تذكير بالصلاة',
                az: '⏰ Namaz Xatırlatması'
            };
            const reminderBody = {
                tr: `{{name}} vaktine {{min}} dakika kaldı`,
                en: `{{min}} minutes until {{name}}`,
                de: `Noch {{min}} Minuten bis {{name}}`,
                ru: `{{min}} минут до {{name}}`,
                ar: `{{min}} دقيقة حتى {{name}}`,
                az: `{{name}} vaxtına {{min}} dəqiqə qaldı`
            };
            const names = prayerNames[lang] || prayerNames.en;

            const isIOS = Capacitor.getPlatform() === 'ios';
            const notifications = [];
            const appDate = getAppDate();
            const now = appDate;

            for (let day = 0; day < MAX_PREREMINDER_DAYS; day++) {
                const targetDate = new Date(appDate);
                targetDate.setDate(targetDate.getDate() + day);

                const dd = String(targetDate.getDate()).padStart(2, '0');
                const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
                const yyyy = targetDate.getFullYear();
                const dateKey = `${dd}-${mm}-${yyyy}`;

                // Reuse today's timings — pre-reminder doesn't need multi-day calendar precision
                const dayTimings = todayTimings;

                const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                // Sequence-aware dates (midnight-crossing Isha lands on the next day)
                const daySchedule = buildPrayerSchedule(prayerKeys.map(k => dayTimings[k]), targetDate);
                prayerKeys.forEach((key, idx) => {
                    if (!daySchedule[idx]) return;

                    // Schedule `minutes` before the prayer time
                    const date = new Date(daySchedule[idx]);
                    date.setMinutes(date.getMinutes() - minutes);

                    if (date <= now) return;

                    const id = 100 + day * 5 + idx;
                    const bodyTemplate = reminderBody[lang] || reminderBody.en;
                    const body = bodyTemplate
                        .replace('{{name}}', names[idx])
                        .replace('{{min}}', String(minutes));

                    const notif = {
                        title: reminderTitle[lang] || reminderTitle.en,
                        body,
                        id,
                        schedule: { at: date, allowWhileIdle: true },
                        smallIcon: 'ic_stat_icon_config_sample',
                    };

                    if (isIOS) {
                        notif.interruptionLevel = 'active';
                    }

                    notifications.push(notif);
                });
            }

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
                console.log(`[PreReminder] Scheduled ${notifications.length} notifications (${minutes}min before)`);
            }
        } catch (error) {
            console.error('Error scheduling pre-reminder notifications:', error);
        }
    }, [settings.preReminderEnabled, settings.preReminderMinutes, i18n.language]);

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
        refreshPrayerTimes: refreshPrayerTimesStable,
        calculationMethod,
        setCalculationMethod,
        schedulePrayerNotifications,
        schedulePreReminderNotifications,
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
        refreshPrayerTimesStable,
        calculationMethod,
        setCalculationMethod,
        schedulePrayerNotifications,
        schedulePreReminderNotifications
    ]);

    return (
        <PrayerTimesContext.Provider value={value}>
            {children}
        </PrayerTimesContext.Provider>
    );
};
