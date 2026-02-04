import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bug, X, Clock, Trash2, Database, Volume2, Calendar,
    FastForward, AlertTriangle, CheckCircle2, RefreshCcw, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { advanceTestDay, resetTestDay, getTestDayOffset, getTodayString, getDailyPrayersKey } from '@/lib/testDate';

/**
 * DebugMenu - Hidden stress test dashboard for developers
 * 
 * Features:
 * - Time Travel: Simulate day changes
 * - Data Stress: Corrupt/fill/clear localStorage
 * - Notification Testing: Trigger sounds
 * 
 * Toggle: Set DEBUG_MODE = true to enable
 */

// 🔧 TOGGLE THIS TO ENABLE/DISABLE DEBUG MENU
const DEBUG_MODE = true;

const DebugMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [lastAction, setLastAction] = useState(null);

    if (!DEBUG_MODE) return null;

    // ===== TIME TRAVEL =====
    const simulateNextDay = () => {
        advanceTestDay();
        setLastAction('⏩ Advanced to next day');
    };

    const triggerMidnight = () => {
        // Dispatch custom event simulating midnight
        const newDateKey = getTodayString();
        window.dispatchEvent(new CustomEvent('midnightTrigger', { detail: { dateKey: newDateKey } }));

        // Clear today's prayers to simulate fresh day
        const prayerKey = getDailyPrayersKey();
        localStorage.removeItem(prayerKey);

        // Dispatch prayer status change
        window.dispatchEvent(new Event('prayerStatusChanged'));

        setLastAction('🌙 Midnight triggered, prayers reset');
    };

    const resetToRealTime = () => {
        resetTestDay();
        setLastAction('🔄 Reset to real date');
    };

    // ===== DATA STRESS =====
    const corruptStorage = () => {
        const corruptData = [
            { key: getDailyPrayersKey(), value: '{invalid json::' },
            { key: 'tubaAgaci_data', value: 'undefined' },
            { key: 'qadaCounts', value: '[null, null, "broken"' },
        ];

        corruptData.forEach(({ key, value }) => {
            localStorage.setItem(key, value);
        });

        setLastAction('💥 Storage corrupted (reload to test)');
    };

    const fillWeekData = () => {
        // Mark last 7 days as complete for Tuba Tree
        const tubaData = {
            currentStreak: 7,
            totalWateredDays: 7,
            lastWateredDate: new Date().toISOString()
        };
        localStorage.setItem('tubaAgaci_data', JSON.stringify(tubaData));

        // Mark all 5 prayers as complete
        const prayerKey = getDailyPrayersKey();
        localStorage.setItem(prayerKey, JSON.stringify(['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı']));

        // Dispatch update
        window.dispatchEvent(new Event('prayerStatusChanged'));

        setLastAction('📊 Week data filled (7-day streak + 5 prayers)');
    };

    const clearAllData = () => {
        const keysToKeep = ['onboardingComplete', 'user_language'];
        const allKeys = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !keysToKeep.includes(key)) {
                allKeys.push(key);
            }
        }

        allKeys.forEach(key => localStorage.removeItem(key));

        setLastAction('🗑️ All data cleared (keeping onboarding + language)');

        setTimeout(() => window.location.reload(), 1000);
    };

    // ===== NOTIFICATION & SOUND =====
    const testAdhanSound = async () => {
        try {
            const audio = new Audio('/sounds/ezan.wav');
            audio.volume = 0.5;
            await audio.play();
            setLastAction('🔊 Playing Adhan sound');
        } catch (error) {
            setLastAction('❌ Sound failed: ' + error.message);
        }
    };

    const testVibration = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 200]);
            setLastAction('📳 Vibration triggered');
        } else {
            setLastAction('❌ Vibration not supported');
        }
    };

    const toggleQiblaDebug = () => {
        window.dispatchEvent(new CustomEvent('qiblaDebugToggle'));
        setLastAction('🧭 Qibla debug toggled');
    };

    // ===== ACTION BUTTONS CONFIG =====
    const actions = [
        {
            group: '⏰ Time Travel',
            items: [
                { label: 'Next Day (+1)', icon: FastForward, action: simulateNextDay, color: 'bg-blue-500' },
                { label: 'Trigger Midnight', icon: Clock, action: triggerMidnight, color: 'bg-indigo-500' },
                { label: 'Reset to Real', icon: RefreshCcw, action: resetToRealTime, color: 'bg-gray-500' },
            ]
        },
        {
            group: '💾 Data Stress',
            items: [
                { label: 'Corrupt Storage', icon: AlertTriangle, action: corruptStorage, color: 'bg-red-500' },
                { label: 'Fill Week Data', icon: CheckCircle2, action: fillWeekData, color: 'bg-green-500' },
                { label: 'Clear All Data', icon: Trash2, action: clearAllData, color: 'bg-red-700' },
            ]
        },
        {
            group: '🔔 Notifications',
            items: [
                { label: 'Test Adhan Sound', icon: Volume2, action: testAdhanSound, color: 'bg-amber-500' },
                { label: 'Test Vibration', icon: Database, action: testVibration, color: 'bg-purple-500' },
            ]
        },
        {
            group: '🕋 Qibla Finder',
            items: [
                { label: 'Force Align', icon: Navigation, action: toggleQiblaDebug, color: 'bg-emerald-600' },
            ]
        }
    ];

    return (
        <>
            {/* Floating Trigger Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-4 z-[9999] w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
            >
                <Bug size={24} />
            </motion.button>

            {/* Debug Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="fixed bottom-40 right-4 z-[9999] w-80 max-h-[70vh] overflow-y-auto bg-gray-900 rounded-2xl shadow-2xl border border-gray-700"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bug size={20} className="text-red-500" />
                                <h3 className="text-white font-bold">Debug Menu</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Current State Info */}
                        <div className="p-4 bg-gray-800/50 border-b border-gray-700">
                            <div className="text-xs text-gray-400 space-y-1">
                                <p>📅 App Date: <span className="text-white">{getTodayString()}</span></p>
                                <p>⏱️ Offset: <span className="text-yellow-400">{getTestDayOffset()} days</span></p>
                            </div>
                        </div>

                        {/* Action Groups */}
                        <div className="p-4 space-y-4">
                            {actions.map((group) => (
                                <div key={group.group}>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">{group.group}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {group.items.map((item) => (
                                            <Button
                                                key={item.label}
                                                onClick={item.action}
                                                className={`${item.color} hover:opacity-90 text-white text-xs py-2 px-3 h-auto flex items-center gap-1.5 justify-start`}
                                            >
                                                <item.icon size={14} />
                                                <span className="truncate">{item.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Last Action Feedback */}
                        {lastAction && (
                            <div className="p-3 bg-gray-800 border-t border-gray-700">
                                <p className="text-xs text-green-400 font-mono">{lastAction}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DebugMenu;
