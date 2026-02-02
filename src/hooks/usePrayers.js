import { useState, useEffect } from 'react';
import { Moon, Sunrise, Sun, Sunset } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for prayer times management
 * Centralizes prayer time fetching, countdown logic, and city/country state
 */
export function usePrayers() {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [loadingPrayers, setLoadingPrayers] = useState(true);
    const [nextPrayerInfo, setNextPrayerInfo] = useState({ name: '-', timeLeft: '00:00:00' });
    const [city, setCity] = useState(localStorage.getItem('userCity') || 'İstanbul');
    const [country, setCountry] = useState(localStorage.getItem('userCountry') || 'Türkiye');

    const { t, i18n } = useTranslation('common');
    // Default method: 13 (Diyanet) for TR, 3 (MWL) for others
    const calculationMethod = i18n.language?.startsWith('tr') ? 13 : 3;

    // Fetch prayer times from API
    const fetchPrayers = async () => {
        setLoadingPrayers(true);
        try {
            const response = await fetch(
                `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${calculationMethod}`
            );
            const data = await response.json();
            if (data.code === 200) {
                const timings = data.data.timings;

                const formatTime = (time) => {
                    const cleanTime = time.split(' ')[0];
                    if (i18n.language?.startsWith('en')) {
                        const [h, m] = cleanTime.split(':');
                        const date = new Date();
                        date.setHours(h, m);
                        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    }
                    return cleanTime;
                };

                setPrayerTimes([
                    { id: 'fajr', name: t('prayer.fajr'), time: formatTime(timings.Fajr), icon: Moon },
                    { id: 'sunrise', name: t('prayer.sunrise'), time: formatTime(timings.Sunrise), icon: Sunrise },
                    { id: 'dhuhr', name: t('prayer.dhuhr'), time: formatTime(timings.Dhuhr), icon: Sun },
                    { id: 'asr', name: t('prayer.asr'), time: formatTime(timings.Asr), icon: Sun },
                    { id: 'maghrib', name: t('prayer.maghrib'), time: formatTime(timings.Maghrib), icon: Sunset },
                    { id: 'isha', name: t('prayer.isha'), time: formatTime(timings.Isha), icon: Moon },
                ]);
            }
        } catch (error) {
            console.error('Prayer fetch error:', error);
        } finally {
            setLoadingPrayers(false);
        }
    };

    // Fetch prayers on mount and when city/country/language changes
    useEffect(() => {
        fetchPrayers();
    }, [city, country, i18n.language]);

    // Countdown timer logic for next prayer
    useEffect(() => {
        if (!prayerTimes) return;

        const timer = setInterval(() => {
            const now = new Date();
            let next = null;
            let minDiff = Infinity;

            prayerTimes.forEach((p) => {
                const [h, m] = p.time.split(':').map(Number);
                const pDate = new Date();
                pDate.setHours(h, m, 0, 0);
                if (pDate < now) pDate.setDate(pDate.getDate() + 1);
                const diff = pDate - now;
                if (diff < minDiff) {
                    minDiff = diff;
                    next = { name: p.name, time: pDate };
                }
            });

            if (next) {
                const diff = next.time - now;
                const pad = (n) => n.toString().padStart(2, '0');
                setNextPrayerInfo({
                    name: next.name,
                    timeLeft: `${pad(Math.floor(diff / 3600000))}:${pad(Math.floor((diff / 60000) % 60))}:${pad(Math.floor((diff / 1000) % 60))}`,
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [prayerTimes]);

    return {
        prayerTimes,
        loadingPrayers,
        nextPrayerInfo,
        city,
        country,
        refreshPrayers: fetchPrayers,
    };
}
