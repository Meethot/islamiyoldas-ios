import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { useLocation } from '@/context/LocationContext';

const PrayerTimesContext = createContext();

export const usePrayerTimes = () => useContext(PrayerTimesContext);

export const PrayerTimesProvider = ({ children }) => {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [settings, setSettings] = useState({
        adhanEnabled: true,
        vibrateOnly: false
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
    }, [settings, prayerTimes]); // Added prayerTimes dependency

    const loadSettings = async () => {
        try {
            const { value: adhanEnabled } = await Preferences.get({ key: 'adhanEnabled' });
            const { value: vibrateOnly } = await Preferences.get({ key: 'vibrateOnly' });

            setSettings({
                adhanEnabled: adhanEnabled === null ? true : adhanEnabled === 'true',
                vibrateOnly: vibrateOnly === 'true'
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
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, []);

    const initializeNotifications = async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
            // Request permissions
            const permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }

            // Create Channel for Custom Sound
            await LocalNotifications.createChannel({
                id: 'ezan_vakti',
                name: 'Ezan Vakti',
                importance: 5, // Importance.HIGH
                description: 'Ezan vakti bildirimleri',
                sound: 'ezan.mp3',
                visibility: 1,
                vibration: true
            });
        } catch (error) {
            console.error('Notification initialization error:', error);
        }
    };

    const { i18n } = useTranslation();

    // ...\n
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
                console.log('Prayer times: Using fallback location (Istanbul)');
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
                    sound: settings.vibrateOnly ? null : 'ezan.mp3',
                    channelId: 'ezan_vakti',
                    smallIcon: 'ic_stat_icon_config_sample' // Default resource
                };
            });

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
            }
        } catch (error) {
            console.error('Error scheduling notifications:', error);
        }
    }, [settings.adhanEnabled, settings.vibrateOnly]); // Added dependencies

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
