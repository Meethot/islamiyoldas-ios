import { useState, useEffect, useMemo } from 'react';
import { Moon, Sunrise, Sun, Sunset } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrayerTimes } from '@/context/PrayerTimesContext';
import { useLocation } from '@/context/LocationContext';
import { buildPrayerSchedule } from '@/lib/prayerTimeUtils';

/**
 * Custom hook for prayer times management
 * Now consumes from PrayerTimesContext for consistency with GPS-based times
 * Maintains backward compatibility with existing components
 */
export function usePrayers() {
    const [nextPrayerInfo, setNextPrayerInfo] = useState({ name: '-', timeLeft: '--:--:--' });

    // Get prayer times from global context (already GPS-aware)
    const { prayerTimes: rawTimes, loading: loadingPrayers, fetchPrayerTimes, locationSource } = usePrayerTimes();
    const { latitude, longitude, hasLocation, manualCountry } = useLocation();

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

            // Sequence-aware schedule: handles 12h/24h formats and a midnight-crossing
            // Isha (e.g. "00:10" at high latitudes) counting as upcoming, not passed
            let schedule = buildPrayerSchedule(prayerTimes.map(p => p.time), now);
            let nextIdx = schedule.findIndex(d => d && d > now);
            if (nextIdx === -1) {
                // All of today's prayers passed — wrap to tomorrow's first prayer
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                schedule = buildPrayerSchedule(prayerTimes.map(p => p.time), tomorrow);
                nextIdx = schedule.findIndex(Boolean);
            }
            if (nextIdx === -1) return;

            const next = { name: prayerTimes[nextIdx].name, time: schedule[nextIdx] };
            const diff = next.time - now;
            const pad = (n) => n.toString().padStart(2, '0');
            // Local date key (toISOString is UTC and shifts the day near midnight)
            const localDateKey = `${next.time.getFullYear()}-${pad(next.time.getMonth() + 1)}-${pad(next.time.getDate())}`;
            setNextPrayerInfo({
                name: next.name,
                timeLeft: `${pad(Math.floor(diff / 3600000))}:${pad(Math.floor((diff / 60000) % 60))}:${pad(Math.floor((diff / 1000) % 60))}`,
                // Liste saatleriyle aynı biçim: İngilizce'de 12 saatlik, diğerlerinde 24 saatlik.
                // (Sabit 'tr-TR' idi; İngilizce'de liste "5:30 AM" derken burası "05:30" diyordu.)
                time: i18n.language?.startsWith('en')
                    ? next.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : `${pad(next.time.getHours())}:${pad(next.time.getMinutes())}`,
                date: localDateKey
            });
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [prayerTimes, i18n.language]);

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
        // Manuel seçimde gerçekten seçilen ülke; GPS modunda zaten ilçe gösteriliyor.
        // (Sabit 'Türkiye' idi — Berlin'i elle seçen kullanıcıya da "Türkiye" diyordu.)
        country: locationSource === 'gps' ? '' : (manualCountry || ''),
        refreshPrayers: fetchPrayerTimes,
        locationSource,
    };
}
