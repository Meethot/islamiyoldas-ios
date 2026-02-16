import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bug, X, Clock, Trash2, Database, Volume2, Calendar,
    FastForward, AlertTriangle, CheckCircle2, RefreshCcw, Navigation, Bell, List, RotateCcw, AlarmClock
} from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Button } from '@/components/ui/button';
import { advanceTestDay, resetTestDay, getTestDayOffset, getTodayString, getDailyPrayersKey } from '@/lib/testDate';
import { addCredit, getCredits, isPremium } from '@/services/creditService';
import { Coins, Crown } from 'lucide-react';

/**
 * DebugMenu - Hidden stress test dashboard for developers
 */

const DEBUG_MODE = true;

// Component that crashes on render to trigger ErrorBoundary
function CrashTrigger({ shouldCrash }) {
    if (shouldCrash) {
        throw new Error('Debug crash test — bu bir test hatasıdır');
    }
    return null;
}

const DebugMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [lastAction, setLastAction] = useState(null);
    const [shouldCrash, setShouldCrash] = useState(false);

    if (!DEBUG_MODE) return null;

    // ===== TIME TRAVEL =====
    const simulateNextDay = () => {
        advanceTestDay();
        setLastAction('⏩ Advanced to next day');
    };

    const triggerMidnight = () => {
        const newDateKey = getTodayString();
        window.dispatchEvent(new CustomEvent('midnightTrigger', { detail: { dateKey: newDateKey } }));
        const prayerKey = getDailyPrayersKey();
        localStorage.removeItem(prayerKey);
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
        const tubaData = {
            currentStreak: 7,
            totalWateredDays: 7,
            lastWateredDate: new Date().toISOString()
        };
        localStorage.setItem('tubaAgaci_data', JSON.stringify(tubaData));
        const prayerKey = getDailyPrayersKey();
        localStorage.setItem(prayerKey, JSON.stringify(['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı']));
        window.dispatchEvent(new Event('prayerStatusChanged'));
        setLastAction('📊 Week data filled (7-day streak + 5 prayers)');
    };

    const fillPlus10 = () => {
        const stored = localStorage.getItem('tubaAgaci_data');
        let tubaData = {
            currentStreak: 1,
            totalWateredDays: 0,
            lastWateredDate: getTodayString()
        };
        if (stored) {
            try { tubaData = JSON.parse(stored); } catch (e) { console.error('Failed to parse tuba data', e); }
        }
        tubaData.totalWateredDays += 10;
        localStorage.setItem('tubaAgaci_data', JSON.stringify(tubaData));
        window.dispatchEvent(new Event('prayerStatusChanged'));
        setLastAction(`🌳 Tuba growth increased by +10 (Total: ${tubaData.totalWateredDays})`);
    };

    const clearAllData = () => {
        localStorage.clear();
        setLastAction('🗑️ Tüm veriler silindi — sıfırdan başlanıyor...');
        setTimeout(() => { window.location.href = '/onboarding'; }, 800);
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

    const test5SecNotification = async () => {
        try {
            let permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') {
                permStatus = await LocalNotifications.requestPermissions();
            }
            if (permStatus.display === 'granted') {
                await LocalNotifications.schedule({
                    notifications: [{
                        title: "Test Başarılı",
                        body: "Ekran kapalıyken bildirim geldi!",
                        id: Math.floor(Math.random() * 100000),
                        schedule: { at: new Date(Date.now() + 5000) },
                        sound: null, attachments: null, actionTypeId: "", extra: null
                    }]
                });
                setLastAction('⏰ Notification scheduled in 5s!');
                alert("Bildirim kuruldu! Hemen ekranı kilitle.");
            } else {
                setLastAction('❌ Notification permission denied');
            }
        } catch (error) {
            setLastAction('❌ Notification error: ' + error.message);
        }
    };

    const test10SecEzan = async () => {
        try {
            let permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') {
                permStatus = await LocalNotifications.requestPermissions();
            }
            if (permStatus.display === 'granted') {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                await LocalNotifications.schedule({
                    notifications: [{
                        title: "🕌 Ezan Vakti",
                        body: "Öğle Namazı Vakti Girdi - TEST",
                        id: Math.floor(Math.random() * 100000),
                        schedule: { at: new Date(Date.now() + 10000), allowWhileIdle: true },
                        sound: isIOS ? 'ezan.caf' : 'ezan',
                        channelId: 'ezan_vakti',
                        attachments: null, actionTypeId: "", extra: null,
                        interruptionLevel: 'timeSensitive'
                    }]
                });
                setLastAction('🕌 Ezan bildirimi 10sn sonra gelecek!');
                alert("Ezan bildirimi kuruldu! 10 saniye içinde gelecek. Ekranı kilitleyin.");
            } else {
                setLastAction('❌ Notification permission denied');
            }
        } catch (error) {
            setLastAction('❌ Ezan test error: ' + error.message);
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

    const listPendingNotifications = async () => {
        try {
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length === 0) {
                alert('Kuyrukta bekleyen bildirim yok.');
                setLastAction('📋 No pending notifications');
                return;
            }
            const list = pending.notifications.map(n => {
                const date = n.schedule?.at ? new Date(n.schedule.at).toLocaleString('tr-TR') : 'Hemen';
                return `ID: ${n.id}\nBaşlık: ${n.title}\nZaman: ${date}\nSes: ${n.sound || 'Sessiz'}`;
            }).join('\n\n---\n\n');
            console.log('Pending Notifications:', pending.notifications);
            alert(`Bekleyen Bildirimler (${pending.notifications.length}):\n\n${list}`);
            setLastAction(`📋 Listed ${pending.notifications.length} notifications`);
        } catch (error) {
            setLastAction('❌ List error: ' + error.message);
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
                { label: 'Fill +10', icon: Database, action: fillPlus10, color: 'bg-emerald-500' },
                { label: 'Clear All Data', icon: Trash2, action: clearAllData, color: 'bg-red-700' },
            ]
        },
        {
            group: '🔔 Notifications',
            items: [
                { label: 'Test Adhan Sound', icon: Volume2, action: testAdhanSound, color: 'bg-amber-500' },
                { label: '10s Ezan Test', icon: Bell, action: test10SecEzan, color: 'bg-green-600' },
                { label: '5s Notification', icon: Bell, action: test5SecNotification, color: 'bg-red-500' },
                { label: 'Pending List', icon: List, action: listPendingNotifications, color: 'bg-blue-600' },
                { label: 'Test Vibration', icon: Database, action: testVibration, color: 'bg-purple-500' },
            ]
        },
        {
            group: '🕋 Qibla Finder',
            items: [
                { label: 'Force Align', icon: Navigation, action: toggleQiblaDebug, color: 'bg-emerald-600' },
            ]
        },
        {
            group: '🕌 Prayer Overlay',
            items: [
                {
                    label: 'Show Overlay', icon: Bell, action: () => {
                        window.dispatchEvent(new CustomEvent('debugShowPrayerOverlay'));
                        setLastAction('🕌 Prayer overlay triggered');
                    }, color: 'bg-islamic-gold'
                },
            ]
        },
        {
            group: '⭐ Review Prompt',
            items: [
                {
                    label: 'Reset Cooldown', icon: RotateCcw, action: () => {
                        localStorage.removeItem('review_prompt_v2');
                        setLastAction('⭐ Review cooldown reset — triggers aktif');
                    }, color: 'bg-yellow-600'
                },
            ]
        },
        {
            group: '💥 Error Testing',
            items: [
                {
                    label: 'Crash App', icon: AlertTriangle, action: () => {
                        setLastAction('💥 Crashing app...');
                        setShouldCrash(true);
                    }, color: 'bg-red-800'
                },
            ]
        },
        {
            group: '🌙 Sahur Alarm',
            items: [
                {
                    label: '10s Sahur Test', icon: AlarmClock, action: async () => {
                        try {
                            let permStatus = await LocalNotifications.checkPermissions();
                            if (permStatus.display !== 'granted') {
                                permStatus = await LocalNotifications.requestPermissions();
                            }
                            if (permStatus.display === 'granted') {
                                await LocalNotifications.schedule({
                                    notifications: [{
                                        id: 4001,
                                        title: '⏰ Sahur Vakti Yaklaşıyor!',
                                        body: "İmsak'a 30 dakika kaldı. Sahura kalkma vakti! (TEST)",
                                        schedule: { at: new Date(Date.now() + 10000), allowWhileIdle: true },
                                        sound: /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'sahur_alarm.caf' : 'sahur_alarm.mp3',
                                        channelId: 'sahur_alarm',
                                        interruptionLevel: 'timeSensitive',
                                        extra: { type: 'sahur_alarm_test' }
                                    }]
                                });
                                setLastAction('🌙 Sahur test bildirimi 10sn sonra gelecek!');
                                alert('Sahur alarm testi kuruldu! 10 saniye içinde bildirim gelecek. Ekranı kilitleyin.');
                            } else {
                                setLastAction('❌ Bildirim izni reddedildi');
                            }
                        } catch (error) {
                            setLastAction('❌ Sahur test error: ' + error.message);
                        }
                    }, color: 'bg-amber-600'
                },
                {
                    label: 'Cancel Alarm', icon: AlarmClock, action: async () => {
                        try {
                            await LocalNotifications.cancel({ notifications: [{ id: 4000 }, { id: 4001 }] });
                            localStorage.removeItem('sahurAlarm');
                            setLastAction('🌙 Sahur alarmı iptal edildi');
                        } catch (error) {
                            setLastAction('❌ Cancel error: ' + error.message);
                        }
                    }, color: 'bg-red-600'
                },
            ]
        },
        {
            group: '💰 Amin Kredisi',
            items: [
                {
                    label: '+50 Kredi', icon: Coins, action: () => {
                        const newCreds = addCredit(50);
                        setLastAction(`💰 +50 kredi eklendi! Toplam: ${newCreds}`);
                    }, color: 'bg-yellow-600'
                },
                {
                    label: isPremium() ? 'Premium: ON ✅' : 'Premium: OFF ❌', icon: Crown, action: () => {
                        const current = isPremium();
                        localStorage.setItem('aminKumbara_premium', (!current).toString());
                        setLastAction(`👑 Premium: ${!current ? 'AKTİF' : 'KAPALI'}`);
                    }, color: isPremium() ? 'bg-amber-500' : 'bg-gray-600'
                },
            ]
        }
    ];

    return (
        <>
            {/* CrashTrigger — throws during render to trigger ErrorBoundary */}
            <CrashTrigger shouldCrash={shouldCrash} />

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

