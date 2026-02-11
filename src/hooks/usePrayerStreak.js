import { useState, useEffect, useCallback } from 'react';
import { getTodayString, getAppDate } from '@/lib/testDate';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for managing prayer streak gamification
 * Tracks consecutive days of completing all 5 daily prayers
 */
export function usePrayerStreak() {
    const { t } = useTranslation('home');

    const [streakData, setStreakData] = useState(() => {
        try {
            const saved = localStorage.getItem('prayerStreak');
            if (saved && saved !== 'undefined' && saved !== 'null') {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('[usePrayerStreak] Corrupted data, resetting...', e);
            localStorage.removeItem('prayerStreak');
        }
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: null,
            streakHistory: []
        };
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('prayerStreak', JSON.stringify(streakData));
    }, [streakData]);

    // Helper to parse YYYY-MM-DD as a LOCAL date
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Check if streak should be reset (missed a day)
    const checkStreakValidity = useCallback(() => {
        if (!streakData.lastCompletedDate) return;

        const lastDate = parseLocalDate(streakData.lastCompletedDate);
        const today = getAppDate();
        today.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        // If more than 1 day has passed, reset streak
        if (diffDays > 1) {
            setStreakData(prev => ({
                ...prev,
                currentStreak: 0
            }));
        }
    }, [streakData.lastCompletedDate]);

    // Run validity check on mount
    useEffect(() => {
        checkStreakValidity();
    }, [checkStreakValidity]);

    // Called when all 5 prayers are completed
    const recordDayComplete = useCallback(() => {
        const todayKey = getTodayString();

        setStreakData(prev => {
            // Already recorded today
            if (prev.lastCompletedDate === todayKey) {
                return prev;
            }

            const lastDateStr = prev.lastCompletedDate;
            let newStreak = 1;

            if (lastDateStr) {
                const lastDate = parseLocalDate(lastDateStr);
                const today = getAppDate();
                today.setHours(0, 0, 0, 0);

                const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

                // Consecutive day
                if (diffDays === 1) {
                    newStreak = prev.currentStreak + 1;
                } else if (diffDays === 0) {
                    return prev;
                }
            }

            const newLongest = Math.max(prev.longestStreak, newStreak);

            return {
                currentStreak: newStreak,
                longestStreak: newLongest,
                lastCompletedDate: todayKey,
                streakHistory: [...prev.streakHistory.slice(-364), todayKey]
            };
        });
    }, []);

    // Check if today is already completed
    const isTodayComplete = streakData.lastCompletedDate === getTodayString();

    // Get motivational message based on streak (bilingual)
    const getStreakMessage = () => {
        const streak = streakData.currentStreak;
        if (streak === 0) return { text: t('streak.start'), emoji: '🌱' };
        if (streak === 1) return { text: t('streak.firstStep'), emoji: '✨' };
        if (streak < 7) return { text: t('streak.keepGoing'), emoji: '🔥' };
        if (streak < 30) return { text: t('streak.doingGreat'), emoji: '💪' };
        if (streak < 100) return { text: t('streak.amazing'), emoji: '🏆' };
        return { text: t('streak.legendary'), emoji: '👑' };
    };

    return {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        isTodayComplete,
        recordDayComplete,
        getStreakMessage,
        streakHistory: streakData.streakHistory
    };
}
