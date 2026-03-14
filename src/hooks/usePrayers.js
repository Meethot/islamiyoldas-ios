import { useState, useEffect, useMemo } from 'react';
import { Moon, Sunrise, Sun, Sunset } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrayerTimes } from '@/context/PrayerTimesContext';
import { useLocation } from '@/context/LocationContext';

/**
 * Custom hook for prayer times management
 * Now consumes from PrayerTimesContext for consistency with GPS-based times
 * Maintains backward compatibility with existing components
 */
export function usePrayers() {
    const [nextPrayerInfo, setNextPrayerInfo] = useState({ name: '-', timeLeft: '--:--:--' });

    // Get prayer times from global context (already GPS-aware)
    const { prayerTimes: rawTimes, loading: loadingPrayers, fetchPrayerTimes, locationSource } = usePrayerTimes();
    const { latitude, longitude, hasLocation } = useLocation();

    const { t, i18n } = useTranslation('common');

    // Format times and add icons for UI display
    const prayerTimes = useMemo(() => {
        if (!rawTimes) return null;

        const formatTime = (time) => {
            if (!time) return '--:--';
            const cleanTime = time.split(' ')[0];
            if (i18n.language?.startsWith('en')) {
                const [h, m] = cleanTime.split(':');
                const date = new Date();
                date.setHours(h, m);
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            }
            return cleanTime;
        };

        // In Turkey (Method 13), Aladhan's "Fajr" is the official Diyanet "İmsak".
        // Aladhan's "Imsak" is a 10-minute safety buffer. For TR/AZ, we want the official time in Fajr.
        const firstPrayerTime = rawTimes.Fajr;

        return [
            { id: 'fajr', name: t('prayer.fajr'), time: formatTime(firstPrayerTime), icon: Moon },
            { id: 'sunrise', name: t('prayer.sunrise'), time: formatTime(rawTimes.Sunrise), icon: Sunrise },
            { id: 'dhuhr', name: t('prayer.dhuhr'), time: formatTime(rawTimes.Dhuhr), icon: Sun },
            { id: 'asr', name: t('prayer.asr'), time: formatTime(rawTimes.Asr), icon: Sun },
            { id: 'maghrib', name: t('prayer.maghrib'), time: formatTime(rawTimes.Maghrib), icon: Sunset },
            { id: 'isha', name: t('prayer.isha'), time: formatTime(rawTimes.Isha), icon: Moon },
        ];
    }, [rawTimes, i18n.language, t]);

    // Countdown timer logic for next prayer
    useEffect(() => {
        if (!prayerTimes) return;

        const updateTimer = () => {
            const now = new Date();
            let next = null;
            let minDiff = Infinity;

            prayerTimes.forEach((p) => {
                // Handle 12h format (e.g., "5:23 AM") or 24h format (e.g., "05:23")
                let hours, minutes;
                const timeStr = p.time;

                if (timeStr.includes('AM') || timeStr.includes('PM')) {
                    // 12h format
                    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (match) {
                        hours = parseInt(match[1]);
                        minutes = parseInt(match[2]);
                        if (match[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
                        if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
                    }
                } else {
                    // 24h format
                    const [h, m] = timeStr.split(':').map(Number);
                    hours = h;
                    minutes = m;
                }

                if (isNaN(hours) || isNaN(minutes)) return;

                const pDate = new Date();
                pDate.setHours(hours, minutes, 0, 0);
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
                    time: next.time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    date: next.time.toISOString().split('T')[0]
                });
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [prayerTimes]);

    // Generate location display string
    const { cityName } = useLocation();
    const locationDisplay = useMemo(() => {
        return cityName;
    }, [cityName]);

    return {
        prayerTimes,
        loadingPrayers,
        nextPrayerInfo,
        city: locationDisplay,
        country: locationSource === 'gps' ? '' : 'Türkiye',
        refreshPrayers: fetchPrayerTimes,
        locationSource,
    };
}
