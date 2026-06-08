import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Volume2, Volume1, Volume, VolumeX, Smartphone, Settings, Heart, Star, Sparkles, Edit3, X, Check, Trash2, ChevronLeft, Crown, ChevronDown, Fingerprint, Sliders, Palette } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHaptics } from '../hooks/useMobile';
import { triggerReviewPrompt } from '@/components/ReviewPrompt';
import { useTranslation } from 'react-i18next';
import { isPremium } from '@/services/creditService';
import { getAppDate } from '@/lib/testDate';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { analytics } from '@/services/analyticsService';
import { Preferences } from '@capacitor/preferences';
import DhikrPickerSheet from '@/components/DhikrPickerSheet';
import { ESMA_UL_HUSNA } from '@/data/esmaUlHusna';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { VolumeButtons } from '@capacitor-community/volume-buttons';

const DHIKR_PRESETS = [
    { id: 'subhanallah', name: 'Sübhanallah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Allah noksan sıfatlardan uzaktır', defaultTarget: 33 },
    { id: 'elhamdulillah', name: 'Elhamdülillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'Hamd (şükür) Allah\'adır', defaultTarget: 33 },
    { id: 'allahuekber', name: 'Allahü Ekber', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah en büyüktür', defaultTarget: 33 },
    { id: 'last', name: 'Lâ ilâhe illallah', arabic: 'لَا إِلٰهَ إِلَّا اللّٰه', meaning: 'Allah\'tan başka ilah yoktur', defaultTarget: 100 },
    { id: 'istigfar', name: 'Estağfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: 'Allah\'tan bağışlanma dilerim', defaultTarget: 100 },
    { id: 'salavat', name: 'Salavat', arabic: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ', meaning: 'Allah\'ım, Efendimiz Muhammed\'e rahmet et', defaultTarget: 100 },
    { id: 'ihlas', name: 'İhlas Suresi', arabic: 'سُورَةُ الإِخْلَاصِ', meaning: 'O tektir, Samed\'dir, doğurmamış ve doğurulmamıştır.', defaultTarget: 100 },
    { id: 'fatiha', name: 'Fatiha Suresi', arabic: 'سُورَةُ الْفَاتِحَةِ', meaning: 'Hamd, âlemlerin Rabbi olan Allah\'a mahsustur.', defaultTarget: 100 },
    { id: 'ayetel_kursi', name: 'Ayetel Kürsi', arabic: 'آيَةُ الْكُرْسِيِّ', meaning: 'Allah, O\'ndan başka ilah yoktur. Diridir, Kayyum\'dur.', defaultTarget: 100 },
    { id: 'hasbunallah', name: 'Hasbünallahü ve Ni\'mel Vekîl', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', meaning: 'Allah bize yeter, O ne güzel vekildir.', defaultTarget: 100 },
    { id: 'lahavle', name: 'Lâ Havle ve Lâ Kuvvete illâ Billâh', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', meaning: 'Güç ve kuvvet ancak Allah\'a mahsustur.', defaultTarget: 100 },
    { id: 'yunus_duasi', name: 'Dua-i Yunus', arabic: 'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', meaning: 'Senden başka ilah yoktur, seni tenzih ederim.', defaultTarget: 100 },
    { id: 'salati_tefriciye', name: 'Salat-ı Tefriciye', arabic: 'الصَّلَاةُ التَّفْرِيجِيَّةُ', meaning: 'Tüm sıkıntıların giderilmesi, dileklerin kabulü için.', defaultTarget: 4444 },
];

export default function Dhikr() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation('dhikr');

    // Countdown mode from Manevi Asistan
    const navState = location.state || {};
    const isCountdownMode = navState.mode === 'countdown' && navState.targetCount > 0;
    const countdownTarget = isCountdownMode ? navState.targetCount : 0;
    const countdownName = navState.targetZikirName || '';
    const countdownArabic = navState.zikirArabic || '';
    const countdownMeaning = navState.zikirMeaning || '';

    const [count, setCount] = useState(isCountdownMode ? countdownTarget : 0);
    const [totalCount, setTotalCount] = useState(() => parseInt(localStorage.getItem('totalDhikrOverall') || '0', 10));
    const [activePreset, setActivePreset] = useState(DHIKR_PRESETS[2]);
    const [target, setTarget] = useState(isCountdownMode ? countdownTarget : (isPremium() ? 33 : 33));
    const [showDhikrLimit, setShowDhikrLimit] = useState(false);
    const [hapticsMode, setHapticsMode] = useState('all');
    const [soundMode, setSoundMode] = useState(() => localStorage.getItem('dhikr_sound_mode') || 'digital'); // 'digital', 'wood', 'water', 'mute'
    const [volumeButtonsEnabled, setVolumeButtonsEnabled] = useState(() => localStorage.getItem('dhikr_volume_buttons') === 'true');
    const [dhikrTheme, setDhikrTheme] = useState(() => localStorage.getItem('dhikr_theme') || 'classic'); // 'classic', 'tasbih'
    const [beadType, setBeadType] = useState(() => localStorage.getItem('dhikr_bead_type') || 'kehribar'); // 'kehribar', 'kuka', 'turkuaz', 'zumrut'
    const [particles, setParticles] = useState([]);

    const beadDragY = useMotionValue(0);

    // Dynamic thread sway path mapping (bends the string reactively as you drag)
    const stringPath = useTransform(beadDragY, [-80, 80], [
        "M 160 0 Q 185 140 160 320",
        "M 160 0 Q 215 180 160 320"
    ]);

    // Tassel dynamic drag sway rotation mapping
    const tasselDragRotate = useTransform(beadDragY, [-80, 80], [-2.5, 2.5]);
    const tasselImpactRotate = useMotionValue(0);
    const tasselRotate = useTransform([tasselDragRotate, tasselImpactRotate], ([d, i]) => d + i);

    // Dynamic glare shift mapping (moves highlights opposite to drag direction)
    const glareY = useTransform(beadDragY, [-80, 80], [5, -5]);
    const glareX = useTransform(beadDragY, [-80, 80], [2, -2]);

    // Dynamic core shift mapping (moves inner features for 3D parallax depth)
    const coreY = useTransform(beadDragY, [-80, 80], [2, -2]);
    const coreX = useTransform(beadDragY, [-80, 80], [1, -1]);

    const triggerParticles = () => {
        const newParticles = Array.from({ length: 6 }).map((_, i) => ({
            id: Math.random(),
            angle: (i * 360) / 6 + Math.random() * 15,
            distance: 45 + Math.random() * 25
        }));
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 480);
    };
    const [isRipple, setIsRipple] = useState(false);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [tempTarget, setTempTarget] = useState('33');
    const [celebrating, setCelebrating] = useState(false);
    const [hapticMessage, setHapticMessage] = useState('');
    const [showTotalResetConfirm, setShowTotalResetConfirm] = useState(false);
    const [countdownCompleted, setCountdownCompleted] = useState(false);
    const [countdownRounds, setCountdownRounds] = useState(0);
    const [showDhikrPicker, setShowDhikrPicker] = useState(false);

    // Full-screen tap mode and feedback states
    const [isFullScreenTap, setIsFullScreenTap] = useState(() => localStorage.getItem('dhikr_fullscreen_tap') === 'true');
    const [isScreenFlash, setIsScreenFlash] = useState(false);
    
    // States for custom total zikir count editing
    const [showTotalModal, setShowTotalModal] = useState(false);
    const [tempTotal, setTempTotal] = useState('0');
    
    // Scroll detection coordinates for safe touch input
    const touchStartYRef = useRef(0);
    const touchStartXRef = useRef(0);
    const haptics = useHaptics();

    // Debouncing widget sync to prevent bridge congestion during fast tapping
    const widgetSyncTimeoutRef = useRef(null);
    const latestSyncValuesRef = useRef({ count, preset: activePreset, total: totalCount, target });
    const isSyncingRef = useRef(false);
    const incrementRef = useRef(null);

    // Keep the latest sync ref updated as states change
    useEffect(() => {
        latestSyncValuesRef.current = { count, preset: activePreset, total: totalCount, target };
    }, [count, activePreset, totalCount, target]);

    const syncToWidget = async (currentCount, preset, currentTotal, currentTarget) => {
        if (isCountdownMode) return;
        const idx = DHIKR_PRESETS.findIndex(p => p.id === preset.id);
        try {
            await Preferences.set({ key: 'dhikr_widget_count', value: String(currentCount) });
            await Preferences.set({ key: 'dhikr_widget_preset_index', value: String(idx >= 0 ? idx : -1) });
            await Preferences.set({ key: 'dhikr_widget_total', value: String(currentTotal) });
            await Preferences.set({ key: 'dhikr_widget_target', value: String(currentTarget) });
            
            if (idx === -1) {
                await Preferences.set({ key: 'dhikr_widget_custom_name', value: preset.name || '' });
                await Preferences.set({ key: 'dhikr_widget_custom_arabic', value: preset.arabic || '' });
            } else {
                await Preferences.remove({ key: 'dhikr_widget_custom_name' });
                await Preferences.remove({ key: 'dhikr_widget_custom_arabic' });
            }
        } catch (error) {
            console.error('Widget sync error:', error);
        }
    };

    const queueSyncToWidget = (currentCount, preset, currentTotal, currentTarget) => {
        if (isCountdownMode) return;
        
        // Update the latest values ref immediately
        latestSyncValuesRef.current = { count: currentCount, preset, total: currentTotal, target: currentTarget };
        
        // Clear existing timeout
        if (widgetSyncTimeoutRef.current) {
            clearTimeout(widgetSyncTimeoutRef.current);
        }
        
        // Schedule widget sync in 500ms
        widgetSyncTimeoutRef.current = setTimeout(() => {
            syncToWidget(
                latestSyncValuesRef.current.count,
                latestSyncValuesRef.current.preset,
                latestSyncValuesRef.current.total,
                latestSyncValuesRef.current.target
            );
        }, 500);
    };

    // Track dhikr session start
    useEffect(() => {
        const container = document.getElementById('main-scroll-container');
        if (container) {
            container.scrollTo(0, 0);
        }
        window.scrollTo(0, 0);
        const name = isCountdownMode ? countdownName : activePreset.name;
        const t = isCountdownMode ? countdownTarget : target;
        analytics.dhikrStarted(name, t);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Listen to backgrounding to immediately flush any pending widget sync
    useEffect(() => {
        let stateListener = null;
        const setupStateListener = async () => {
            try {
                stateListener = await App.addListener('appStateChange', ({ isActive }) => {
                    if (!isActive) {
                        if (widgetSyncTimeoutRef.current) {
                            clearTimeout(widgetSyncTimeoutRef.current);
                        }
                        syncToWidget(
                            latestSyncValuesRef.current.count,
                            latestSyncValuesRef.current.preset,
                            latestSyncValuesRef.current.total,
                            latestSyncValuesRef.current.target
                        );
                    }
                });
            } catch (e) {
                console.warn('App state listener not supported:', e);
            }
        };
        setupStateListener();

        return () => {
            if (stateListener) stateListener.remove();
            if (widgetSyncTimeoutRef.current) {
                clearTimeout(widgetSyncTimeoutRef.current);
            }
        };
    }, []);

    // Web Audio API Context and Buffers
    const audioContextRef = useRef(null);
    const audioBuffersRef = useRef({
        digital: null
    });

    useEffect(() => {
        // Initialize Audio Context and pre-load all zikir sounds
        const initAudio = async () => {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                }

                const loadSound = async (key, url) => {
                    if (audioBuffersRef.current[key]) return;
                    try {
                        const response = await fetch(url);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                        audioBuffersRef.current[key] = audioBuffer;
                    } catch (e) {
                        console.error(`Failed to load sound ${key}:`, e);
                    }
                };

                await loadSound('digital', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            } catch (error) {
                console.error("Audio init error:", error);
            }
        };

        initAudio();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playClickSound = () => {
        if (soundMode === 'mute' || !audioContextRef.current || !audioBuffersRef.current[soundMode]) return;

        // Resume context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Create a new buffer source for every click -> Zero Latency, Perfect Concurrency
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffersRef.current[soundMode];
        source.connect(audioContextRef.current.destination);
        source.start(0);
    };

    useEffect(() => {
        if (hapticMessage) {
            const timer = setTimeout(() => setHapticMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [hapticMessage]);

    // Sway tassel gently on zikir count changes using smooth spring velocity impulses
    useEffect(() => {
        if (count === 0) return;
        // Inject a physical velocity impulse alternating direction, avoiding hard position sets to prevent jitter
        const impulse = count % 2 === 0 ? 15 : -15;
        animate(tasselImpactRotate, 0, {
            type: 'spring',
            velocity: impulse,
            stiffness: 40,
            damping: 14,
            mass: 0.8
        });
    }, [count]);

    const syncAndLoadWidgetData = async () => {
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        try {
            const activeIdx = DHIKR_PRESETS.findIndex(p => p.id === activePreset.id);
            const { value: indexStr } = await Preferences.get({ key: 'dhikr_widget_preset_index' });
            const { value: countStr } = await Preferences.get({ key: 'dhikr_widget_count' });
            const { value: targetStr } = await Preferences.get({ key: 'dhikr_widget_target' });
            const { value: totalStr } = await Preferences.get({ key: 'dhikr_widget_total' });
            const { value: syncFlag } = await Preferences.get({ key: 'widget_sync_flag' });
            const { value: customName } = await Preferences.get({ key: 'dhikr_widget_custom_name' });
            const { value: customArabic } = await Preferences.get({ key: 'dhikr_widget_custom_arabic' });

            const widgetIdx = indexStr ? parseInt(indexStr, 10) : -1;
            const isWidgetSyncActive = syncFlag === 'true';
            
            if (isWidgetSyncActive) {
                await Preferences.remove({ key: 'widget_sync_flag' });
            }
            
            // 1. Determine target preset (either from widget or current active)
            let targetPreset = activePreset;
            if (widgetIdx >= 0 && widgetIdx < DHIKR_PRESETS.length) {
                targetPreset = DHIKR_PRESETS[widgetIdx];
            } else if (widgetIdx === -1 && customName) {
                targetPreset = {
                    id: 'custom',
                    name: customName,
                    arabic: customArabic || '',
                    meaning: '',
                    defaultTarget: 100,
                    isEsma: true
                };
            }
            
            // 2. Sync overall total count
            if (isWidgetSyncActive && totalStr) {
                const widgetTotal = parseInt(totalStr, 10);
                const localTotal = parseInt(localStorage.getItem('totalDhikrOverall') || '0', 10);
                if (!isNaN(widgetTotal) && widgetTotal !== localTotal) {
                    setTotalCount(widgetTotal);
                    localStorage.setItem('totalDhikrOverall', widgetTotal.toString());
                }
            }
            
            // 3. Sync target count
            let activeTarget = targetPreset.defaultTarget;
            const savedTarget = localStorage.getItem(`dhikr_target_${targetPreset.id}`);
            if (savedTarget) {
                activeTarget = parseInt(savedTarget, 10);
            }
            
            if (isWidgetSyncActive && targetStr) {
                activeTarget = parseInt(targetStr, 10);
                setTarget(activeTarget);
                setTempTarget(targetStr);
                localStorage.setItem(`dhikr_target_${targetPreset.id}`, targetStr);
            } else {
                setTarget(activeTarget);
                setTempTarget(String(activeTarget));
            }

            // 4. Sync count
            if (isWidgetSyncActive && countStr) {
                const widgetCount = parseInt(countStr, 10);
                setCount(widgetCount);
                localStorage.setItem(`dhikr_count_${targetPreset.id}`, widgetCount.toString());
            } else {
                const savedCount = localStorage.getItem(`dhikr_count_${targetPreset.id}`) || '0';
                setCount(parseInt(savedCount, 10));
                const currentTotal = parseInt(localStorage.getItem('totalDhikrOverall') || '0', 10);
                syncToWidget(parseInt(savedCount, 10), targetPreset, currentTotal, activeTarget);
            }
            
            // 5. Update selected preset in app state if it differs
            if (targetPreset.id !== activePreset.id || (targetPreset.id === 'custom' && targetPreset.name !== activePreset.name)) {
                setActivePreset(targetPreset);
            }
        } catch (e) {
            console.error('Failed to sync widget data:', e);
            const savedCount = localStorage.getItem(`dhikr_count_${activePreset.id}`) || '0';
            setCount(parseInt(savedCount, 10));
        } finally {
            isSyncingRef.current = false;
        }
    };

    // Mount-level initialization and state listener
    useEffect(() => {
        if (isCountdownMode) return;
        
        syncAndLoadWidgetData();

        let appListener = null;
        const setupStateListener = async () => {
            try {
                appListener = await App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) {
                        syncAndLoadWidgetData();
                    }
                });
            } catch (e) {
                console.warn('App state listener not supported:', e);
            }
        };
        setupStateListener();

        return () => {
            if (appListener) appListener.remove();
        };
    }, []);

    // Preset changing sync
    useEffect(() => {
        if (isCountdownMode) return;
        
        syncAndLoadWidgetData();
    }, [activePreset.id, activePreset.name]);

    // Sync increment function to ref to avoid volume listener stale closures
    useEffect(() => {
        incrementRef.current = increment;
    });

    // Handle physical volume button presses natively on iOS/Android
    useEffect(() => {
        let isWatching = false;
        
        const startWatching = async () => {
            if (!volumeButtonsEnabled) {
                try {
                    await VolumeButtons.clearWatch();
                } catch (e) {
                    console.warn('clearWatch failed:', e);
                }
                return;
            }

            try {
                // Clear any existing watcher first (wrapped in try/catch to prevent failure from aborting execution)
                try {
                    await VolumeButtons.clearWatch();
                } catch (e) {
                    // Ignore if no watch is currently active
                }
                
                const options = {
                    disableSystemVolumeHandler: true,
                    suppressVolumeIndicator: true
                };
                
                await VolumeButtons.watchVolume(options, (result) => {
                    // Call the latest increment handler
                    if (incrementRef.current) {
                        incrementRef.current();
                    }
                });
                isWatching = true;
            } catch (e) {
                console.warn('watchVolume failed:', e);
            }
        };

        if (Capacitor.isNativePlatform()) {
            startWatching();
        }

        return () => {
            if (isWatching && Capacitor.isNativePlatform()) {
                VolumeButtons.clearWatch().catch(e => console.warn('clearWatch failed on unmount:', e));
            }
        };
    }, [volumeButtonsEnabled]);

    // Handle dhikr/esma selection from picker
    const handleDhikrSelect = useCallback((item) => {
        // Check if it's a standard preset, custom zikir, or an esma
        const standardPreset = DHIKR_PRESETS.find(p => p.id === item.id);
        if (standardPreset) {
            setActivePreset(standardPreset);
        } else if (item.id === 'custom') {
            setActivePreset({
                id: 'custom',
                name: item.name,
                arabic: item.arabic === '✨' ? '' : item.arabic,
                meaning: '',
                defaultTarget: 100,
                isEsma: false
            });
        } else {
            // Esma-ül Hüsna item — adapt to preset shape
            setActivePreset({
                id: item.id,
                name: item.transliteration || item.name,
                arabic: item.arabic,
                meaning: item.meaning || '',
                defaultTarget: item.defaultTarget || 100,
                isEsma: true,
            });
        }
    }, []);

    const increment = (skipStandardHaptic = false) => {
        triggerParticles();
        if (isFullScreenTap) {
            setIsScreenFlash(true);
            setTimeout(() => setIsScreenFlash(false), 120);
        }

        if (isCountdownMode) {
            // COUNTDOWN MODE: Decrement (resets at 0 for next round)
            // Daily dhikr limit for non-premium users (100 free per day)
            if (!isPremium()) {
                const stored = JSON.parse(localStorage.getItem('zikirmatik_daily_limit') || '{}');
                const today = getAppDate().toISOString().slice(0, 10);
                const dailyCount = stored.date === today ? (stored.count || 0) : 0;
                if (dailyCount >= 66) {
                    setShowDhikrLimit(true);
                    return;
                }
                localStorage.setItem('zikirmatik_daily_limit', JSON.stringify({
                    count: dailyCount + 1,
                    date: today
                }));
            }

            const newCount = count - 1;
            const newTotal = totalCount + 1;

            setTotalCount(newTotal);
            localStorage.setItem('totalDhikrOverall', newTotal.toString());

            // Haptic feedback
            if (hapticsMode !== 'off' && !skipStandardHaptic) {
                if (newCount === 0) {
                    haptics.targetReached();
                } else if (hapticsMode === 'all') {
                    haptics.heavy();
                }
            }

            playClickSound();

            setIsRipple(true);
            setTimeout(() => setIsRipple(false), 300);

            // Round complete! Reset to target and increment round
            if (newCount === 0) {
                setCount(countdownTarget); // restart from target
                setCountdownRounds(prev => prev + 1);
                setCelebrating(true);
                triggerReviewPrompt('dhikr');
                analytics.dhikrCompleted(countdownName, countdownTarget);
                setTimeout(() => setCelebrating(false), 3000);
            } else {
                setCount(newCount);
            }
        } else {
            // STANDARD MODE: Increment
            // Daily dhikr limit for non-premium users (100 free per day)
            if (!isPremium()) {
                const stored = JSON.parse(localStorage.getItem('zikirmatik_daily_limit') || '{}');
                const today = getAppDate().toISOString().slice(0, 10);
                const dailyCount = stored.date === today ? (stored.count || 0) : 0;
                if (dailyCount >= 66) {
                    setShowDhikrLimit(true);
                    return;
                }
                localStorage.setItem('zikirmatik_daily_limit', JSON.stringify({
                    count: dailyCount + 1,
                    date: today
                }));
            }

            const newCount = count + 1;
            const newTotal = totalCount + 1;
            const isTargetReached = newCount > 0 && newCount % target === 0;

            setCount(newCount);
            setTotalCount(newTotal);

            localStorage.setItem(`dhikr_count_${activePreset.id}`, newCount.toString());
            localStorage.setItem('totalDhikrOverall', newTotal.toString());
            queueSyncToWidget(newCount, activePreset, newTotal, target);

            if (hapticsMode !== 'off' && !skipStandardHaptic) {
                if (isTargetReached) {
                    haptics.targetReached();
                } else if (hapticsMode === 'all') {
                    haptics.heavy();
                }
            }

            playClickSound();

            setIsRipple(true);
            setTimeout(() => setIsRipple(false), 300);

            if (isTargetReached) {
                setCelebrating(true);
                triggerReviewPrompt('dhikr');
                analytics.dhikrCompleted(activePreset.name, newCount);
                setTimeout(() => setCelebrating(false), 2000);
            }
        }
    };

    const handleSaveTarget = () => {
        let val = parseInt(tempTarget, 10);
        if (!isNaN(val) && val > 0) {
            if (val > 999999) {
                val = 999999;
            }
            setTarget(val);
            localStorage.setItem(`dhikr_target_${activePreset.id}`, val.toString());
            
            // Mathematically reset turn/round to 1 by setting count to count % newTarget
            const newCount = count % val;
            setCount(newCount);
            localStorage.setItem(`dhikr_count_${activePreset.id}`, newCount.toString());
            
            setShowTargetModal(false);
            syncToWidget(newCount, activePreset, totalCount, val);
            
            // Trigger success haptic feedback
            try {
                haptics.success();
            } catch (e) {
                console.warn('Haptics failed:', e);
            }
        }
    };

    const handleSaveTotal = () => {
        let val = parseInt(tempTotal, 10);
        if (!isNaN(val) && val >= 0) {
            if (val > 999999) {
                val = 999999;
            }
            setTotalCount(val);
            localStorage.setItem('totalDhikrOverall', val.toString());
            
            // Calculate proportional current count
            const newCount = target > 0 ? (val % target) : 0;
            setCount(newCount);
            localStorage.setItem(`dhikr_count_${activePreset.id}`, newCount.toString());
            
            setShowTotalModal(false);
            syncToWidget(newCount, activePreset, val, target);
            
            // Trigger success haptic feedback
            try {
                haptics.success();
            } catch (e) {
                console.warn('Haptics failed:', e);
            }
        }
    };

    const reset = () => {
        if (confirm(t('confirmReset'))) {
            if (isCountdownMode) {
                setCount(countdownTarget);
                setCountdownCompleted(false);
                setCountdownRounds(0);
            } else {
                setCount(0);
                localStorage.setItem(`dhikr_count_${activePreset.id}`, '0');
                syncToWidget(0, activePreset, totalCount, target);
            }
        }
    };

    const resetTotal = () => {
        setTotalCount(0);
        localStorage.setItem('totalDhikrOverall', '0');
        setShowTotalResetConfirm(false);
        syncToWidget(count, activePreset, 0, target);
    };

    const progress = isCountdownMode
        ? ((countdownTarget - count) / countdownTarget) * 100
        : (count % target) / target * 100;
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    // Progress percentage (0 to 1) for visual glow intensity
    const progressRatio = isCountdownMode
        ? (countdownTarget > 0 ? (countdownTarget - count) / countdownTarget : 0)
        : (target > 0 ? (count % target) / target : 0);

    // Subtle glow that intensifies as target approaches
    const glowStyle = {
        boxShadow: `0 0 ${40 + progressRatio * 40}px rgba(212, 175, 55, ${0.1 + progressRatio * 0.25}), inset 0 0 20px rgba(255, 255, 255, 0.03)`
    };

    return (
        <div 
            onTouchStart={(e) => {
                if (isFullScreenTap) {
                    touchStartYRef.current = e.touches[0].clientY;
                    touchStartXRef.current = e.touches[0].clientX;
                }
            }}
            onTouchEnd={(e) => {
                if (isFullScreenTap) {
                    // Prevent incrementing when tapping on buttons, header, or footer
                    if (e.target.closest('button') || e.target.closest('header') || e.target.closest('footer') || e.target.closest('.no-tap-anywhere')) {
                        return;
                    }
                    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);
                    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartXRef.current);
                    // Standard tap click has minimal displacement (<10px)
                    if (deltaY < 10 && deltaX < 10) {
                        e.preventDefault();
                        increment();
                    }
                }
            }}
            onClick={(e) => {
                if (isFullScreenTap) {
                    if (e.target.closest('button') || e.target.closest('header') || e.target.closest('footer') || e.target.closest('.no-tap-anywhere')) {
                        return;
                    }
                    increment();
                }
            }}
            className={cn(
                "flex flex-col min-h-screen text-white px-5 pb-5 pt-0 relative overflow-hidden font-sans transition-colors duration-150 select-none",
                isScreenFlash && isFullScreenTap ? "bg-[#042818]" : "bg-[#021a0f]"
            )}
        >
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-islamic-gold/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 bg-islamic-green/20 rounded-full blur-[120px] pointer-events-none" />

            {/* Islamic Geometric Background Pattern */}
            <div 
                className="absolute inset-0 opacity-[0.035] pointer-events-none z-0 mix-blend-overlay" 
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='12' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3Cpath d='M0 0 L80 80 M80 0 L0 80' stroke='%23D4AF37' stroke-width='0.3' stroke-dasharray='1,2'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat'
                }} 
            />

            <header className="flex justify-between items-center z-10 mb-4 sticky top-0 bg-[#021a0f]/80 backdrop-blur-sm -mx-6 px-6 py-1 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all border border-white/10"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="bg-islamic-gold/10 p-2 rounded-xl">
                        <Sparkles className="w-5 h-5 text-islamic-gold animate-pulse" />
                    </div>
                    <h2 className="text-xl font-serif font-bold tracking-tight">{isCountdownMode ? countdownName : t('title')}</h2>
                </div>
                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                    <button
                        onClick={() => {
                            const modes = ['digital', 'mute'];
                            const labels = {
                                digital: 'Klik Sesi',
                                mute: 'Ses Kapalı'
                            };
                            const currentIndex = modes.indexOf(soundMode);
                            const nextMode = modes[(currentIndex + 1) % modes.length];
                            setSoundMode(nextMode);
                            localStorage.setItem('dhikr_sound_mode', nextMode);
                            setHapticMessage(labels[nextMode]);
                            try {
                                haptics.selection();
                            } catch (e) {}
                        }}
                        className={cn("w-10 h-10 rounded-xl transition-all relative flex items-center justify-center", soundMode !== 'mute' ? "text-islamic-gold bg-white/5" : "text-white/20")}
                        title={soundMode === 'mute' ? 'Sessiz' : 'Klik Sesi'}
                    >
                        {soundMode === 'mute' ? (
                            <VolumeX size={18} />
                        ) : (
                            <Volume2 size={18} />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            const modes = ['all', 'target', 'off'];
                            const labels = {
                                all: t('vibration.everyClick'),
                                target: t('vibration.targetOnly'),
                                off: t('vibration.off')
                            };
                            const currentIndex = modes.indexOf(hapticsMode);
                            const nextMode = modes[(currentIndex + 1) % modes.length];
                            setHapticsMode(nextMode);
                            setHapticMessage(labels[nextMode]);
                        }}
                        className={cn(
                            "w-10 h-10 rounded-xl transition-all relative flex items-center justify-center",
                            hapticsMode !== 'off' ? "text-islamic-gold bg-white/5" : "text-white/20"
                        )}
                        title={hapticsMode === 'all' ? t('vibrationTooltip.all') : hapticsMode === 'target' ? t('vibrationTooltip.target') : t('vibrationTooltip.off')}
                    >
                        <Smartphone size={18} />
                        {hapticsMode === 'target' && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-islamic-gold rounded-full border border-black animate-pulse" />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            const newMode = !isFullScreenTap;
                            setIsFullScreenTap(newMode);
                            localStorage.setItem('dhikr_fullscreen_tap', String(newMode));
                            setHapticMessage(newMode ? t('fullScreenTap.enabled', { defaultValue: 'Ekran Dokunma Açık' }) : t('fullScreenTap.disabled', { defaultValue: 'Ekran Dokunma Kapalı' }));
                            if (hapticsMode !== 'off') {
                                haptics.selection();
                            }
                        }}
                        className={cn(
                            "w-10 h-10 rounded-xl transition-all relative flex items-center justify-center",
                            isFullScreenTap ? "text-islamic-gold bg-white/5" : "text-white/20"
                        )}
                        title={t('fullScreenTapTooltip', { defaultValue: 'Tam Ekran Zikir Modu' })}
                    >
                        <Fingerprint size={18} />
                        {isFullScreenTap && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-islamic-gold rounded-full border border-black animate-pulse" />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            const nextTheme = dhikrTheme === 'classic' ? 'tasbih' : 'classic';
                            setDhikrTheme(nextTheme);
                            localStorage.setItem('dhikr_theme', nextTheme);
                            setHapticMessage(nextTheme === 'tasbih' ? 'Tesbih Teması' : 'Klasik Tema');
                            try {
                                haptics.selection();
                            } catch (e) {}
                        }}
                        className={cn(
                            "w-10 h-10 rounded-xl transition-all relative flex items-center justify-center",
                            dhikrTheme === 'tasbih' ? "text-islamic-gold bg-white/5" : "text-white/20"
                        )}
                        title="Zikirmatik Teması"
                    >
                        <Palette size={18} />
                    </button>
                    {Capacitor.isNativePlatform() && (
                        <button
                            onClick={() => {
                                const newMode = !volumeButtonsEnabled;
                                setVolumeButtonsEnabled(newMode);
                                localStorage.setItem('dhikr_volume_buttons', String(newMode));
                                setHapticMessage(newMode ? 'Ses Tuşları ile Çekim Açık' : 'Ses Tuşları ile Çekim Kapalı');
                                if (hapticsMode !== 'off') {
                                    try {
                                        haptics.selection();
                                    } catch (e) {}
                                }
                            }}
                            className={cn(
                                "w-10 h-10 rounded-xl transition-all relative flex items-center justify-center",
                                volumeButtonsEnabled ? "text-islamic-gold bg-white/5" : "text-white/20"
                            )}
                            title="Ses Tuşları ile Çekim"
                        >
                            <Sliders size={18} />
                            {volumeButtonsEnabled && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-islamic-gold rounded-full border border-black animate-pulse" />
                            )}
                        </button>
                    )}
                </div>
            </header>

            {/* Main Interaction Area - Aesthetic spacing from top */}
            <div className="flex-1 flex flex-col justify-start items-center z-10 relative mt-8">
                {/* Visual Feedback Text - Balanced margin */}
                <div className="text-center mb-6 animate-in fade-in zoom-in duration-700">
                    {isCountdownMode ? (
                        <>
                            <p className="text-islamic-gold font-serif text-4xl mb-2 opacity-95 drop-shadow-lg" dir="rtl">{countdownArabic || countdownName}</p>
                            {countdownArabic && (
                                <p className="text-white font-bold text-lg mb-1 tracking-wide">{countdownName}</p>
                            )}
                            <p className="text-white/40 text-xs italic mb-4 font-normal tracking-wide">{countdownMeaning}</p>
                            <div className="flex items-center justify-center gap-3 bg-islamic-gold/5 px-10 py-3.5 rounded-full border border-islamic-gold/40 mx-auto shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                                <span className="text-islamic-gold font-bold text-xs uppercase tracking-[0.25em]">{t('targetWithUnit', { count: countdownTarget })}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Display of Arabic and Meaning (Elegant, static floating layout) */}
                            <div className="flex flex-col items-center text-center select-none pointer-events-none mb-4 animate-in fade-in duration-300">
                                <p className="text-islamic-gold font-serif text-4xl mb-2 opacity-95 drop-shadow-[0_4px_12px_rgba(212,175,55,0.2)]" dir="rtl">
                                    {activePreset.arabic}
                                </p>
                                <p className="text-white/40 text-xs italic font-normal tracking-wide max-w-[280px]">
                                    {activePreset.id === 'custom'
                                        ? ''
                                        : (activePreset.isEsma
                                            ? t(`esma.${activePreset.id}.meaning`, { defaultValue: activePreset.meaning })
                                            : t(`presets.${activePreset.id}.meaning`))}
                                </p>
                            </div>

                            {/* Control Row: Zikir Selector & Target Setting side-by-side */}
                            <div className="flex items-center justify-center gap-2 mb-2">
                                {/* Zikir Selector Pill */}
                                <button
                                    onClick={() => setShowDhikrPicker(true)}
                                    className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all active:scale-95 text-xs font-semibold text-white/80 shadow-md"
                                >
                                    <span>{activePreset.id === 'custom' || activePreset.isEsma ? activePreset.name : t(`presets.${activePreset.id}.name`, { defaultValue: activePreset.name })}</span>
                                    <ChevronDown size={14} className="text-islamic-gold opacity-85 transition-transform group-active:translate-y-[1px]" />
                                </button>

                                {/* Target Pill */}
                                <button
                                    onClick={() => setShowTargetModal(true)}
                                    className="group flex items-center gap-2 bg-islamic-gold/5 hover:bg-islamic-gold/10 px-4 py-2 rounded-full border border-islamic-gold/30 transition-all active:scale-95 text-xs font-bold text-islamic-gold shadow-md"
                                >
                                    <span>{t('target', { count: target })}</span>
                                    <Edit3 size={11} className="text-islamic-gold/75" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* The Button & Progress / Tasbih Beads */}
                {dhikrTheme === 'classic' ? (
                    <div className="relative w-80 h-80 flex items-center justify-center">
                        {/* SVG Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                            {/* Background Ring */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                className="text-white/5"
                            />
                            {/* Progress Ring */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className={cn(
                                    "transition-all duration-300 ease-out",
                                    celebrating ? "text-emerald-400 stroke-[14px]" : "text-islamic-gold"
                                )}
                            />
                        </svg>

                        {/* Ripple Effect Background */}
                        <div className={cn(
                            "absolute inset-0 bg-islamic-gold/10 rounded-full transition-all duration-700 scale-0",
                            isRipple && "scale-100 opacity-0"
                        )} />

                        {/* Target Reached Celebration Sparkles */}
                        {celebrating && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <Sparkles className="text-islamic-gold w-full h-full animate-ping opacity-20" />
                            </div>
                        )}

                        {/* Main Button with Framer Motion spring physics & progress glow */}
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            onTouchStart={(e) => {
                                e.preventDefault(); // Prevent long-press context menu on iOS
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault(); // Prevent ghost click
                                increment();
                            }}
                            onClick={(e) => {
                                // Desktop/web fallback — touch devices already handled above
                                if (e.detail > 0) increment(); // Only keyboard/mouse, not synthetic from touch
                            }}
                            onContextMenu={(e) => e.preventDefault()} // Block long-press context menu
                            className={cn(
                                "w-60 h-60 rounded-full bg-gradient-to-br from-white/10 to-black/30 border border-white/20 flex flex-col items-center justify-center relative backdrop-blur-lg group select-none touch-manipulation",
                                celebrating && "border-emerald-500/50 shadow-emerald-500/20"
                            )}
                            style={glowStyle}
                        >
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/5 rounded-t-full pointer-events-none" />

                            <span className={cn(
                                "text-7xl font-mono font-bold tracking-tighter transition-all duration-300 drop-shadow-2xl",
                                celebrating ? "text-emerald-400 scale-110" : "text-white group-hover:text-islamic-gold",
                                countdownCompleted && "text-emerald-400"
                            )}>
                                {isCountdownMode ? count : (count % target === 0 && count > 0 ? target : count % target)}
                            </span>

                            {isCountdownMode ? (
                                <div className="flex flex-col items-center mt-2 opacity-40">
                                    {countdownRounds > 0 && (
                                        <span className="text-[10px] font-bold text-islamic-gold/60 uppercase tracking-[0.15em]">{t('roundCompleted', { round: countdownRounds })}</span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center mt-2 opacity-40">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{t('round')}</span>
                                    <span className="text-xl font-mono font-bold">{Math.floor(count / target) + 1}</span>
                                </div>
                            )}
                        </motion.button>

                        {/* Decorative Stars */}
                        <Star size={16} className="absolute top-8 right-8 text-islamic-gold/20 animate-pulse" />
                        <Star size={12} className="absolute bottom-10 left-12 text-islamic-gold/10 animate-pulse delay-700" />
                        <Heart size={14} className="absolute top-12 left-10 text-islamic-gold/10 animate-pulse delay-500" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center z-10">
                        {/* Dynamic Aura Glow linked to active material */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <motion.div
                                key={`aura-${beadType}-${count}`}
                                initial={{ scale: 0.8, opacity: 0.35 }}
                                animate={{ 
                                    scale: 1, 
                                    opacity: 1,
                                    transition: { type: 'spring', stiffness: 180, damping: 14 }
                                }}
                                className={cn(
                                    "w-56 h-56 rounded-full blur-[70px] mix-blend-screen transition-all duration-700",
                                    beadType === 'kehribar' && "bg-gradient-to-br from-amber-500/25 to-orange-600/15 shadow-[0_0_90px_rgba(245,158,11,0.25)]",
                                    beadType === 'kuka' && "bg-gradient-to-br from-amber-900/15 to-[#3d2102]/15 shadow-[0_0_70px_rgba(146,64,14,0.15)]",
                                    beadType === 'turkuaz' && "bg-gradient-to-br from-cyan-500/25 to-teal-700/15 shadow-[0_0_80px_rgba(6,182,212,0.2)]",
                                    beadType === 'zumrut' && "bg-gradient-to-br from-emerald-500/30 to-emerald-900/20 shadow-[0_0_100px_rgba(16,185,129,0.35)]"
                                )}
                            />
                        </div>

                        <div className="relative w-80 h-80 flex flex-col items-center justify-center select-none touch-manipulation z-10">
                            {/* Round indicator for Tasbih Beads theme */}
                            <div className="absolute top-2 bg-islamic-gold/10 px-4 py-1.5 rounded-full border border-islamic-gold/20 flex items-center gap-1.5 backdrop-blur-md z-20">
                                <span className="text-[10px] font-bold text-islamic-gold/60 uppercase tracking-widest">{t('round')}:</span>
                                <span className="text-xs font-mono font-bold text-islamic-gold">{Math.floor(count / target) + 1}</span>
                            </div>

                            {/* Dynamic Curved String (Sways Reactively on Bead Drag) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-85 z-1" viewBox="0 0 320 320">
                                {/* Base Solid Gold Thread */}
                                <motion.path
                                    d={stringPath}
                                    fill="none"
                                    stroke="url(#ropeGrad)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                />
                                {/* Dark Grooves */}
                                <motion.path
                                    d={stringPath}
                                    fill="none"
                                    stroke="#5c4015"
                                    strokeWidth="1.8"
                                    strokeDasharray="3,5"
                                    opacity="0.75"
                                    strokeLinecap="round"
                                />
                                {/* Shiny Highlights */}
                                <motion.path
                                    d={stringPath}
                                    fill="none"
                                    stroke="#fff2c2"
                                    strokeWidth="1.8"
                                    strokeDasharray="3,5"
                                    strokeDashoffset="4"
                                    opacity="0.85"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#aa882c" stopOpacity="0" />
                                        <stop offset="20%" stopColor="#d4af37" stopOpacity="0.8" />
                                        <stop offset="50%" stopColor="#ffd700" stopOpacity="1" />
                                        <stop offset="80%" stopColor="#d4af37" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#aa882c" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            
                            {/* The beads list */}
                            <div className="relative w-full h-full flex items-center justify-center overflow-hidden z-10 no-tap-anywhere">
                                <AnimatePresence initial={false}>
                                    {[
                                        { id: count + 2, position: 'top-out', y: -130, x: 0, scale: 0.45, opacity: 0.25, blurClass: "blur-[1.5px]" },
                                        { id: count + 1, position: 'top-in', y: -65, x: 10, scale: 0.72, opacity: 0.65, blurClass: "" },
                                        { id: count, position: 'active', y: 0, x: 20, scale: 1.0, opacity: 1, blurClass: "" },
                                        { id: count - 1, position: 'bottom-in', y: 65, x: 10, scale: 0.72, opacity: 0.65, blurClass: "" },
                                        { id: count - 2, position: 'bottom-out', y: 130, x: 0, scale: 0.45, opacity: 0.25, blurClass: "blur-[1.5px]" }
                                    ].map((bead) => {
                                        // Custom bead text color map
                                        const beadTextColors = {
                                            kehribar: "text-[#291703]",
                                            kuka: "text-[#fff2e6]",
                                            turkuaz: "text-[#021f12]",
                                            zumrut: "text-[#021c0e]"
                                        };
                                        
                                        // Custom dynamic spring physics transition
                                        const getBeadTransition = (pos) => {
                                            if (pos === 'active') {
                                                return { type: 'spring', stiffness: 350, damping: 18 };
                                            }
                                            if (pos.startsWith('bottom')) {
                                                return { type: 'spring', stiffness: 450, damping: 12, mass: 0.6 };
                                            }
                                            return { type: 'spring', stiffness: 300, damping: 20 };
                                        };

                                        const isActive = bead.position === 'active';

                                        return (
                                            <motion.div
                                                key={bead.id}
                                                initial={{ y: bead.y - 30, x: bead.x, scale: bead.scale, opacity: 0 }}
                                                animate={{ 
                                                    y: bead.y, 
                                                    x: bead.x,
                                                    scale: bead.scale, 
                                                    opacity: bead.opacity,
                                                    transition: getBeadTransition(bead.position)
                                                }}
                                                exit={{ y: bead.y + 30, x: bead.x, scale: bead.scale, opacity: 0 }}
                                                style={{ 
                                                    zIndex: isActive ? 10 : 5,
                                                    width: isActive ? '180px' : '110px',
                                                    height: isActive ? '180px' : '110px',
                                                    touchAction: 'none'
                                                }}
                                                onTap={(event) => {
                                                    event.stopPropagation();
                                                    if (isActive) {
                                                        increment();
                                                    }
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                className="absolute left-1/2 -translate-x-1/2 cursor-pointer flex items-center justify-center"
                                            >
                                                <div
                                                    className={cn(
                                                        "transition-all duration-300 relative select-none flex items-center justify-center rounded-full overflow-hidden shadow-lg",
                                                        bead.blurClass,
                                                        isActive ? "w-20 h-20 border-2" : "w-14 h-14 border opacity-60 backdrop-blur-sm",
                                                        isActive 
                                                            ? (beadType === 'kehribar' ? "bg-gradient-to-br from-amber-300 via-amber-500 to-amber-800 shadow-[0_0_25px_rgba(245,158,11,0.65)] border-white/40"
                                                               : beadType === 'kuka' ? "bg-gradient-to-br from-[#8a5329] via-[#5c310c] to-[#2b1401] shadow-[0_0_20px_rgba(92,49,12,0.65)] border-amber-900/60"
                                                               : beadType === 'turkuaz' ? "bg-gradient-to-br from-cyan-400 via-teal-600 to-teal-900 shadow-[0_0_22px_rgba(13,148,136,0.65)] border-teal-300/30"
                                                               : "bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.75)] border-emerald-300/40")
                                                            : (beadType === 'kehribar' ? "bg-gradient-to-br from-amber-300/40 via-amber-500/30 to-amber-800/30 border-white/10"
                                                               : beadType === 'kuka' ? "bg-gradient-to-br from-[#8a5329]/40 via-[#5c310c]/30 to-[#2b1401]/30 border-amber-900/20"
                                                               : beadType === 'turkuaz' ? "bg-gradient-to-br from-cyan-400/40 via-teal-600/30 to-teal-900/30 border-white/10"
                                                               : "bg-gradient-to-br from-emerald-400/40 via-emerald-600/30 to-emerald-950/30 border-white/10")
                                                    )}
                                                >
                                                    {/* Highlights & details depending on material */}
                                                    {beadType === 'kehribar' && (
                                                        <>
                                                            {isActive ? (
                                                                <motion.div 
                                                                    style={{ x: glareX, y: glareY }}
                                                                    className="absolute rounded-full blur-[0.5px] rotate-[-15deg] pointer-events-none bg-white/35 top-1.5 left-2.5 w-7 h-2.5"
                                                                />
                                                            ) : (
                                                                <div className="absolute rounded-full blur-[0.5px] rotate-[-15deg] pointer-events-none bg-white/35 top-1 left-1.5 w-4 h-1.5" />
                                                            )}
                                                            {isActive ? (
                                                                <motion.div 
                                                                    style={{ x: coreX, y: coreY }}
                                                                    className="absolute bg-gradient-to-br from-amber-300/70 to-orange-500/60 rounded-full blur-[2px] pointer-events-none inset-2"
                                                                />
                                                            ) : (
                                                                <div className="absolute bg-gradient-to-br from-amber-300/70 to-orange-500/60 rounded-full blur-[2px] pointer-events-none inset-1.5" />
                                                            )}
                                                            <div className="absolute inset-0 opacity-25 pointer-events-none rounded-full" style={{
                                                                backgroundImage: 'radial-gradient(circle at 35% 40%, rgba(255,255,255,0.7) 1px, transparent 1px), radial-gradient(circle at 65% 55%, rgba(255,223,0,0.9) 1.5px, transparent 1.5px)'
                                                            }} />
                                                        </>
                                                    )}
                                                    {beadType === 'kuka' && (
                                                        <>
                                                            <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none rounded-full" style={{
                                                                backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 2px, transparent 2px, transparent 4px)'
                                                            }} />
                                                            {isActive ? (
                                                                <>
                                                                    <motion.div 
                                                                        style={{ x: coreX, y: coreY }}
                                                                        className="absolute border border-islamic-gold/25 rounded-full pointer-events-none inset-2.5"
                                                                    />
                                                                    <motion.div 
                                                                        style={{ x: coreX, y: coreY }}
                                                                        className="absolute border border-islamic-gold/15 rounded-full pointer-events-none inset-[14px]"
                                                                    />
                                                                    <motion.div 
                                                                        style={{ x: glareX, y: glareY }}
                                                                        className="absolute rounded-full blur-[0.5px] pointer-events-none bg-white/10 top-1.5 left-3 w-5 h-2"
                                                                    />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="absolute border border-islamic-gold/25 rounded-full pointer-events-none inset-2" />
                                                                    <div className="absolute border border-islamic-gold/15 rounded-full pointer-events-none inset-[10px]" />
                                                                    <div className="absolute rounded-full blur-[0.5px] pointer-events-none bg-white/10 top-1 left-2 w-3 h-1" />
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    {beadType === 'turkuaz' && (
                                                        <>
                                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,transparent_60%,rgba(0,0,0,0.5)_95%)] rounded-full pointer-events-none" />
                                                            {isActive ? (
                                                                <motion.div 
                                                                    style={{ x: coreX, y: coreY }}
                                                                    className="absolute inset-0 opacity-[0.22] pointer-events-none rounded-full"
                                                                    style={{
                                                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M20 0 Q40 25 15 50 T80 75 T100 100 M80 0 Q50 30 65 60 T30 100 M0 70 Q35 60 70 85' fill='none' stroke='%23422006' stroke-width='1.5'/%3E%3C/svg%3E")`,
                                                                        backgroundSize: '100% 100%'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 opacity-[0.22] pointer-events-none rounded-full" style={{
                                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M20 0 Q40 25 15 50 T80 75 T100 100 M80 0 Q50 30 65 60 T30 100 M0 70 Q35 60 70 85' fill='none' stroke='%23422006' stroke-width='1.5'/%3E%3C/svg%3E")`,
                                                                    backgroundSize: '100% 100%'
                                                                }} />
                                                            )}
                                                            {isActive ? (
                                                                <motion.div 
                                                                    style={{ x: glareX, y: glareY }}
                                                                    className="absolute rounded-full blur-[0.5px] pointer-events-none bg-white/25 top-1.5 left-2.5 w-6 h-2"
                                                                />
                                                            ) : (
                                                                <div className="absolute rounded-full blur-[0.5px] pointer-events-none bg-white/25 top-1 left-1.5 w-4 h-1" />
                                                            )}
                                                        </>
                                                    )}
                                                    {beadType === 'zumrut' && (
                                                        <>
                                                            {isActive ? (
                                                                <motion.div 
                                                                    className="absolute inset-0 opacity-35 mix-blend-screen pointer-events-none rounded-full"
                                                                    style={{
                                                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z M0 0 L40 40 L80 0 M0 80 L40 40 L80 80 M40 0 L40 80 M0 40 L80 40' fill='none' stroke='%23ffffff' stroke-width='0.75'/%3E%3C/svg%3E")`,
                                                                        backgroundSize: '100% 100%',
                                                                        x: coreX,
                                                                        y: coreY
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 opacity-35 mix-blend-screen pointer-events-none rounded-full" style={{
                                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z M0 0 L40 40 L80 0 M0 80 L40 40 L80 80 M40 0 L40 80 M0 40 L80 40' fill='none' stroke='%23ffffff' stroke-width='0.75'/%3E%3C/svg%3E")`,
                                                                    backgroundSize: '100% 100%'
                                                                }} />
                                                            )}
                                                            {isActive ? (
                                                                <motion.div 
                                                                    className="absolute rounded-full pointer-events-none bg-white/10 inset-1"
                                                                    style={{
                                                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
                                                                        x: coreX,
                                                                        y: coreY
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="absolute rounded-full pointer-events-none bg-white/10 inset-0.5" style={{
                                                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
                                                                }} />
                                                            )}
                                                            {isActive ? (
                                                                <motion.div 
                                                                    style={{ x: glareX, y: glareY }}
                                                                    className="absolute bg-emerald-400/25 rounded-full blur-[1.5px] pointer-events-none inset-[6px] top-[12px]"
                                                                />
                                                            ) : (
                                                                <div className="absolute bg-emerald-400/25 rounded-full blur-[1.5px] pointer-events-none inset-[4px] top-[8px]" />
                                                            )}
                                                        </>
                                                    )}
                                                    
                                                    {/* Active bead displays current count inside */}
                                                    {isActive && (
                                                        <span className={cn(
                                                            "text-xl font-mono font-bold drop-shadow-sm select-none",
                                                            beadTextColors[beadType]
                                                        )}>
                                                            {isCountdownMode ? count : (count % target === 0 && count > 0 ? target : count % target)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Particle spray burst centered inside active bead wrapper */}
                                                {isActive && (
                                                    <>
                                                        {particles.map((p) => {
                                                            const rad = (p.angle * Math.PI) / 180;
                                                            const tx = Math.cos(rad) * p.distance;
                                                            const ty = Math.sin(rad) * p.distance;
                                                            
                                                            return (
                                                                <motion.div
                                                                    key={p.id}
                                                                    initial={{ x: 0, y: 0, scale: 0.1, opacity: 1 }}
                                                                    animate={{ 
                                                                        x: tx, 
                                                                        y: ty, 
                                                                        scale: 1.1, 
                                                                        opacity: 0,
                                                                        rotate: p.angle * 3
                                                                    }}
                                                                    transition={{ duration: 0.45, ease: "easeOut" }}
                                                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                                                                >
                                                                    <Star size={12} className="text-[#ffd700] fill-[#ffd700] drop-shadow-[0_0_8px_rgba(212,175,55,0.9)]" />
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Swaying Tassel (Pendulum Physics on Count Change + Reacts to Drag) */}
                                <motion.div
                                    style={{ rotate: tasselRotate }}
                                    className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center origin-top z-1 pointer-events-none"
                                >
                                    {/* Gold Imame Connector Cap */}
                                    <div className="w-4 h-6 bg-gradient-to-br from-[#ffd700] via-islamic-gold to-[#8a6d1c] rounded-b-md border border-white/20 shadow-lg flex flex-col items-center justify-between py-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-inner" />
                                        <div className="w-2.5 h-0.5 bg-black/30 rounded-full" />
                                    </div>
                                    {/* Red Silk Binding Cord */}
                                    <div className="w-3 h-1.5 bg-gradient-to-r from-red-700 to-red-900 border-y border-white/10 shadow-sm" />
                                    {/* Three Cascading Silk Threads */}
                                    <div className="flex gap-[1.5px] items-stretch h-14">
                                        <div className="w-1 bg-gradient-to-b from-islamic-gold via-amber-500 to-transparent rounded-b-full shadow-sm" />
                                        <div className="w-[4px] bg-gradient-to-b from-islamic-gold via-amber-600 to-transparent rounded-b-full shadow-sm translate-y-[2px]" />
                                        <div className="w-1 bg-gradient-to-b from-islamic-gold via-amber-500 to-transparent rounded-b-full shadow-sm" />
                                    </div>
                                </motion.div>
                            </div>


                        </div>

                        {/* Bead Material Selector */}
                        <div className="flex items-center gap-3.5 mt-4 bg-black/35 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {[
                                { id: 'kehribar', name: 'Kehribar', bg: 'bg-gradient-to-br from-amber-400 to-amber-700 shadow-md' },
                                { id: 'kuka', name: 'Kuka', bg: 'bg-gradient-to-br from-[#8a5329] to-[#2b1401] shadow-md' },
                                { id: 'turkuaz', name: 'Turkuaz', bg: 'bg-gradient-to-br from-cyan-400 to-teal-700 shadow-md' },
                                { id: 'zumrut', name: 'Zümrüt', bg: 'bg-gradient-to-br from-emerald-400 to-emerald-800 shadow-md' }
                            ].map((mat) => (
                                <button
                                    key={mat.id}
                                    onClick={() => {
                                        setBeadType(mat.id);
                                        localStorage.setItem('dhikr_bead_type', mat.id);
                                        if (hapticsMode !== 'off') {
                                            try {
                                                haptics.selection();
                                            } catch (e) {}
                                        }
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-90 relative",
                                        beadType === mat.id ? "border-islamic-gold scale-110 shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "border-white/20 opacity-55 hover:opacity-90"
                                    )}
                                    title={mat.name}
                                >
                                    <div className={cn("w-6 h-6 rounded-full", mat.bg)} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cumulative Counter Card - Compact floating pill */}
                <div className="relative bg-white/[0.07] backdrop-blur-md px-6 py-3.5 rounded-full border border-white/15 flex items-center justify-between gap-4 shadow-xl max-w-[320px] mx-auto w-full mt-14 transition-all hover:bg-white/10 hover:border-islamic-gold/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <button
                        onClick={() => {
                            setTempTotal(totalCount.toString());
                            setShowTotalModal(true);
                        }}
                        className="flex items-center gap-3.5 text-left active:scale-[0.97] transition-transform flex-1 py-1"
                    >
                        <div className="p-1.5 bg-islamic-gold/20 rounded-full shrink-0">
                            <Star size={18} className="text-islamic-gold drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] leading-none mb-1 flex items-center gap-1">
                                {t('totalDhikr')}
                                <Edit3 size={11} className="text-islamic-gold/80 animate-pulse" />
                            </span>
                            <span className="text-lg font-mono font-bold text-islamic-gold leading-none">{totalCount.toLocaleString('tr-TR')}</span>
                        </div>
                    </button>

                    {/* Reset Total Button */}
                    <button
                        onClick={() => setShowTotalResetConfirm(true)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-red-400 rounded-full transition-all active:scale-90 border border-white/10 shrink-0"
                        title={t('resetAllTooltip')}
                    >
                        <RotateCcw size={15} />
                    </button>

                    {/* Total Reset Confirmation Dialog */}
                    {showTotalResetConfirm && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                            <div className="absolute inset-0 bg-[#021a0f]/95 rounded-full backdrop-blur-md" />
                            <div className="relative text-center px-4 z-10 flex flex-col items-center justify-center h-full w-full">
                                <p className="text-[10px] text-white/90 font-bold uppercase tracking-wider mb-2 leading-none">{t('resetAllTitle')}</p>
                                <div className="flex gap-2.5 justify-center">
                                    <button
                                        onClick={() => setShowTotalResetConfirm(false)}
                                        className="px-4 py-1 rounded-full bg-white/15 text-white/80 text-[10px] font-bold uppercase transition-all active:scale-95"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        onClick={resetTotal}
                                        className="px-4 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase transition-all shadow-md shadow-red-500/20 active:scale-95"
                                    >
                                        {t('reset')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Quote / Inspiration */}
            <footer className="mt-4 text-center pb-6 z-10 px-10">
                <div className="relative inline-block px-12">
                    <div className="relative py-4 flex flex-col items-center">
                        <div className="absolute top-0 left-0 w-10 h-[1px] bg-gradient-to-r from-transparent to-islamic-gold/40" />
                        <div className="absolute top-0 right-0 w-10 h-[1px] bg-gradient-to-l from-transparent to-islamic-gold/40" />

                        <p className="text-islamic-gold/80 italic font-serif text-sm leading-relaxed px-2">
                            {t('footerVerse')}
                        </p>

                        <div className="absolute bottom-0 left-0 w-10 h-[1px] bg-gradient-to-r from-transparent to-islamic-gold/40" />
                        <div className="absolute bottom-0 right-0 w-10 h-[1px] bg-gradient-to-l from-transparent to-islamic-gold/40" />
                    </div>
                    <p className="text-[9px] text-white/20 mt-4 font-bold uppercase tracking-[0.2em] font-sans">{t('footerVerseSource')}</p>
                </div>
            </footer>

            {/* Daily Dhikr Limit Overlay */}
            <AnimatePresence>
                {showDhikrLimit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[9999]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 30 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="px-8 text-center"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
                                        <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="4" />
                                        <motion.circle
                                            cx="48" cy="48" r="42"
                                            fill="none"
                                            stroke="url(#goldGradZ)"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeDasharray={2 * Math.PI * 42}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                            animate={{ strokeDashoffset: 0 }}
                                            transition={{ duration: 1.2, ease: 'easeOut' }}
                                        />
                                        <defs>
                                            <linearGradient id="goldGradZ" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#D4AF37" />
                                                <stop offset="100%" stopColor="#F5D68A" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-islamic-gold">66</span>
                                        <span className="text-[9px] text-islamic-gold/50 font-bold uppercase tracking-widest">/ 66</span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl font-serif font-bold text-white mb-2 leading-tight">
                                {t('dhikrLimit.title', { defaultValue: 'Günlük Zikir Hakkınız' })}<br />
                                <span className="text-islamic-gold">{t('dhikrLimit.completed', { defaultValue: 'Tamamlandı' })}</span>
                            </h3>

                            <p className="text-[13px] text-white/45 leading-relaxed mb-8">
                                {t('dhikrLimit.desc1', { defaultValue: 'Ücretsiz olarak günde' })} <span className="text-islamic-gold/80 font-semibold">{t('dhikrLimit.count', { count: 66, defaultValue: '66 zikir' })}</span> {t('dhikrLimit.desc2', { defaultValue: 'çekebilirsiniz.' })}<br />
                                {t('dhikrLimit.desc3', { defaultValue: 'Sınırsız zikir için Premium\'a yükseltin.' })}
                            </p>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => { setShowDhikrLimit(false); navigate('/premium'); }}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-islamic-gold via-amber-400 to-islamic-gold text-[#0a2e1f] font-bold text-sm tracking-wide shadow-lg shadow-islamic-gold/20 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} />
                                {t('dhikrLimit.cta', { defaultValue: 'Sınırsız Zikir — Premium' })}
                            </motion.button>

                            <button
                                onClick={() => setShowDhikrLimit(false)}
                                className="w-full mt-4 py-2 text-white/25 text-xs font-medium hover:text-white/40 transition-colors"
                            >
                                {t('dhikrLimit.dismiss', { defaultValue: 'Yarın tekrar gel' })}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Countdown Completed Overlay */}


            {/* Haptic Mode Feedback Message */}
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className={cn(
                    "bg-islamic-gold/90 text-[#021a0f] px-6 py-2 rounded-full font-bold text-xs shadow-2xl transition-all duration-500 transform translate-y-4 opacity-0 border border-white/20",
                    hapticMessage && "translate-y-0 opacity-100"
                )}>
                    {hapticMessage}
                </div>
            </div>

            {showTargetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTargetModal(false)} />
                    <div className="bg-[#032e18] border border-white/10 rounded-[3rem] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-5 duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setShowTargetModal(false)} className="text-white/40 hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-islamic-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-islamic-gold/20">
                                <Settings className="text-islamic-gold w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-islamic-gold mb-2">{t('setTarget')}</h3>
                            <p className="text-white/40 text-sm">{t('setTargetDesc', { name: activePreset.name })}</p>
                        </div>

                        <div className="relative mb-8">
                            <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={tempTarget}
                                onChange={(e) => {
                                    if (!isPremium()) return;
                                    let val = e.target.value;
                                    const parsed = parseInt(val, 10);
                                    if (!isNaN(parsed) && parsed > 999999) {
                                        val = "999999";
                                    }
                                    setTempTarget(val);
                                }}
                                readOnly={!isPremium()}
                                className={cn(
                                    "w-full bg-black/30 border border-white/10 rounded-2xl py-5 px-6 text-4xl font-mono font-bold text-center text-islamic-gold focus:outline-none focus:border-islamic-gold/50 transition-all placeholder:opacity-20",
                                    !isPremium() && "opacity-50 cursor-not-allowed"
                                )}
                                placeholder="33"
                                autoFocus={isPremium()}
                            />
                            <div className="mt-3 flex gap-2 justify-center">
                                {[33, 99, 100, 313, 1000].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => isPremium() ? setTempTarget(v.toString()) : navigate('/premium')}
                                        className={cn(
                                            "text-[12px] font-bold px-3 py-1 rounded-lg border border-white/5 transition-all",
                                            isPremium()
                                                ? "bg-white/5 hover:bg-islamic-gold/20 hover:text-islamic-gold"
                                                : "bg-white/5 opacity-50"
                                        )}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => isPremium() ? handleSaveTarget() : navigate('/premium')}
                            className="w-full h-16 rounded-2xl bg-islamic-gold hover:bg-amber-600 text-[#021a0f] text-lg font-bold shadow-lg shadow-islamic-gold/20 flex items-center justify-center gap-3"
                        >
                            {isPremium() ? (
                                <><Check size={20} strokeWidth={3} /> {t('saveTarget')}</>
                            ) : (
                                <><Crown size={20} fill="currentColor" /> Premium</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {showTotalModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTotalModal(false)} />
                    <div className="bg-[#032e18] border border-white/10 rounded-[3rem] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-5 duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setShowTotalModal(false)} className="text-white/40 hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-islamic-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-islamic-gold/20">
                                <Star className="text-islamic-gold w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-islamic-gold mb-2">{t('setTotalCount', { defaultValue: 'Toplam Zikri Ayarla' })}</h3>
                            <p className="text-white/40 text-sm">{t('setTotalCountDesc', { defaultValue: 'Başka yerde çektiğiniz zikirleri buraya eklemek için toplam zikir sayısını güncelleyebilirsiniz.' })}</p>
                        </div>

                        <div className="relative mb-8">
                            <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={tempTotal}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val > 999999) {
                                        setTempTotal('999999');
                                    } else {
                                        setTempTotal(e.target.value);
                                    }
                                }}
                                max="999999"
                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-5 px-6 text-4xl font-mono font-bold text-center text-islamic-gold focus:outline-none focus:border-islamic-gold/50 transition-all placeholder:opacity-20"
                                placeholder="1000"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleSaveTotal}
                            className="w-full h-16 rounded-2xl bg-islamic-gold hover:bg-amber-600 text-[#021a0f] text-lg font-bold shadow-lg shadow-islamic-gold/20 flex items-center justify-center gap-3"
                        >
                            <Check size={20} strokeWidth={3} /> {t('save', { defaultValue: 'KAYDET' })}
                        </button>
                    </div>
                </div>
            )}

            {/* Style for hiding scrollbar */}
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Dhikr Picker Bottom Sheet */}
            <DhikrPickerSheet
                isOpen={showDhikrPicker}
                onClose={() => setShowDhikrPicker(false)}
                activePreset={activePreset}
                dhikrPresets={DHIKR_PRESETS}
                onSelect={handleDhikrSelect}
            />
        </div>
    );
}