import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Compass as CompassIcon, Info, X, Star,
    Loader2, Smartphone, MapPin, Navigation2, Vibrate, RotateCcw, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '@/context/LocationContext';
import { useHaptics } from '@/hooks/useMobile';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { CapgoCompass as Compass } from '@capgo/capacitor-compass'; // Native Compass Plugin
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { calculateGeodesicAzimuth, getDetailedDeclination, lowPassFilter, calculateGeodesicDistance } from '../utils/qiblaLogic';
import { useTranslation } from 'react-i18next';

const DEFAULT_ALIGNMENT_THRESHOLD = 3.5;


// --- Subcomponents ---

import premiumKabe from '../assets/images/kabe-premium.png';

const KaabaEthereal = ({ isAligned }) => (
    <motion.div
        animate={{
            scale: isAligned ? 1.1 : 0.9,
            opacity: isAligned ? 1 : 0.8,
            filter: isAligned ? "drop-shadow(0 0 25px rgba(251,191,36,0.6))" : "drop-shadow(0 0 5px rgba(0,0,0,0.5))"
        }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-20 flex items-center justify-center"
    >
        <img
            src={premiumKabe}
            alt="Kaaba"
            className="w-48 h-48 object-contain"
        />
    </motion.div>
);

const BackgroundAtmosphere = () => (
    <div className="absolute inset-0 z-0 bg-[#00100a]">
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/40 rounded-full blur-[150px] pointer-events-none"
        />
        <motion.div
            animate={{
                opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-amber-600/20 rounded-full blur-[120px] pointer-events-none"
        />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-leather.png')" }} />
    </div>
);

const CompassTicks = () => {
    const ticks = [];
    for (let i = 0; i < 360; i += 2) {
        const isMajor = i % 90 === 0;
        const isMedium = i % 30 === 0;
        const height = isMajor ? 8 : (isMedium ? 5 : 2);
        const color = isMajor ? "#FBBF24" : (isMedium ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)");

        ticks.push(
            <line
                key={i}
                x1="50" y1={10 - height / 2}
                x2="50" y2={10}
                stroke={color}
                strokeWidth={isMajor ? 1 : 0.5}
                transform={`rotate(${i} 50 50)`}
            />
        );
    }
    return <g>{ticks}</g>;
};

export default function Qibla() {
    const navigate = useNavigate();
    const { selection, success } = useHaptics();
    const { latitude, longitude, loading: locationLoading, error: locationError, hasLocation } = useLocation();
    const { t } = useTranslation('qibla');

    // State
    const [qiblaAngle, setQiblaAngle] = useState(0);
    const [isAligned, setIsAligned] = useState(false);
    const [degreeDiff, setDegreeDiff] = useState(180);
    const [turnDirection, setTurnDirection] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [status, setStatus] = useState('loading');
    const [compassReady, setCompassReady] = useState(false); // True after first real reading
    const [debugAligned, setDebugAligned] = useState(false);
    const [hapticEnabled, setHapticEnabled] = useState(true);
    const [declination, setDeclination] = useState(0);
    const [distanceKM, setDistanceKM] = useState(0);

    // Refs — direct DOM manipulation for 60fps smooth rotation
    const compassRef = useRef(null);
    const arrowRef = useRef(null);
    const qiblaAngleRef = useRef(0);
    const isAlignedRef = useRef(false);
    const lastHapticRef = useRef(0);
    const targetHeadingRef = useRef(0);
    const displayHeadingRef = useRef(0);
    const mountedRef = useRef(true);
    const declinationRef = useRef(0);
    const rafRef = useRef(null);
    const lastUIUpdateRef = useRef(0);
    const firstReadingRef = useRef(true); // Skip smoothing on first compass reading
    const compassReadyTimeRef = useRef(0); // Warmup: ignore alignment for first 2s

    // Update refs when state changes
    useEffect(() => { qiblaAngleRef.current = qiblaAngle; }, [qiblaAngle]);
    useEffect(() => { isAlignedRef.current = isAligned; }, [isAligned]);
    useEffect(() => { declinationRef.current = declination; }, [declination]);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // 60fps animation loop — interpolates display heading toward target heading
    useEffect(() => {
        const animate = () => {
            if (!mountedRef.current) return;

            const target = targetHeadingRef.current;
            const current = displayHeadingRef.current;

            // Shortest-path angular difference
            let diff = target - current;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;

            // Smooth interpolation (lerp factor 0.12 = very smooth)
            const lerp = 0.12;
            const newHeading = Math.abs(diff) < 0.05
                ? target
                : (current + diff * lerp + 360) % 360;

            displayHeadingRef.current = newHeading;

            // Direct DOM transform — no React re-render
            if (compassRef.current) {
                compassRef.current.style.transform = `rotate(${-newHeading}deg)`;
            }
            if (arrowRef.current) {
                arrowRef.current.style.transform = `rotate(${qiblaAngleRef.current - newHeading}deg)`;
            }

            // Throttled UI state updates (~10fps for degree display)
            const now = performance.now();
            if (now - lastUIUpdateRef.current > 100) {
                lastUIUpdateRef.current = now;

                // Warmup guard: don't update alignment/direction until 2s after first reading
                const isWarmedUp = compassReadyTimeRef.current > 0 && (now - compassReadyTimeRef.current > 2000);

                const targetAngle = qiblaAngleRef.current;
                let angleDiff = targetAngle - newHeading;
                if (angleDiff > 180) angleDiff -= 360;
                if (angleDiff < -180) angleDiff += 360;
                const absAngleDiff = Math.abs(angleDiff);

                setDegreeDiff(absAngleDiff);

                if (isWarmedUp) {
                    // Direction
                    if (absAngleDiff >= DEFAULT_ALIGNMENT_THRESHOLD) {
                        setTurnDirection(angleDiff > 0 ? 'right' : 'left');
                    } else {
                        setTurnDirection(null);
                    }

                    // Alignment
                    const isNowAligned = absAngleDiff < DEFAULT_ALIGNMENT_THRESHOLD;
                    if (isNowAligned !== isAlignedRef.current) {
                        setIsAligned(isNowAligned);
                        if (isNowAligned) success();
                    }
                }
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [success]);

    // Initial Setup — location is already available (splash screen waited for it)
    useEffect(() => {
        if (hasLocation && latitude && longitude) {
            const trueQibla = calculateGeodesicAzimuth(latitude, longitude);
            const declInfo = getDetailedDeclination(latitude, longitude);
            const dist = calculateGeodesicDistance(latitude, longitude);
            setQiblaAngle(trueQibla);
            setDeclination(declInfo.declination);
            setDistanceKM(Math.round(dist));
            setStatus('active');
        } else {
            // Safety fallback — should rarely happen since splash waits for location
            const fallbackLat = 41.0082;
            const fallbackLng = 28.9784;
            setQiblaAngle(calculateGeodesicAzimuth(fallbackLat, fallbackLng));
            setDeclination(getDetailedDeclination(fallbackLat, fallbackLng).declination);
            setDistanceKM(Math.round(calculateGeodesicDistance(fallbackLat, fallbackLng)));
            setStatus('active');
        }
    }, [hasLocation, latitude, longitude]);


    // --- NATIVE COMPASS IMPLEMENTATION ---
    useEffect(() => {
        if (status !== 'active') return;

        // Failsafe: if compass never fires (web/simulator/broken sensor),
        // force ready after 3s so UI doesn't block forever
        const failsafe = setTimeout(() => {
            if (!compassReady && mountedRef.current) {
                console.warn('Compass failsafe triggered — no reading in 3s');
                setCompassReady(true);
            }
        }, 3000);

        const startCompass = async () => {
            if (!mountedRef.current) return;

            try {
                try {
                    const perm = await Compass.checkPermissions();
                    if (perm.compass !== 'granted') await Compass.requestPermissions();
                } catch (e) { console.warn("Perm check skipped", e); }

                await Compass.removeAllListeners();

                // Lightweight listener — only updates the target ref, no React state
                await Compass.addListener('headingChange', (data) => {
                    if (!mountedRef.current) return;

                    let trueHeading = (data.value + declinationRef.current + 360) % 360;
                    if (debugAligned) trueHeading = qiblaAngleRef.current;

                    // First reading: jump directly, don't smooth from 0
                    if (firstReadingRef.current) {
                        firstReadingRef.current = false;
                        targetHeadingRef.current = trueHeading;
                        displayHeadingRef.current = trueHeading;
                        compassReadyTimeRef.current = performance.now();
                        setCompassReady(true);
                        return;
                    }

                    // Gentle low-pass filter on raw sensor data
                    const current = targetHeadingRef.current;
                    let diff = trueHeading - current;
                    if (diff > 180) diff -= 360;
                    if (diff < -180) diff += 360;

                    // Responsive alpha — faster for large changes, smooth for small
                    const absDiff = Math.abs(diff);
                    const alpha = Math.min(0.25, 0.10 + absDiff * 0.003);
                    const smoothed = (current + alpha * diff + 360) % 360;

                    targetHeadingRef.current = smoothed;
                });

                await Compass.startListening({
                    minInterval: 16,
                    minHeadingChange: 0.5  // Filter sensor noise at hardware level
                });

            } catch (e) {
                console.error("Compass Error", e);
                // Force ready so UI isn't stuck
                setCompassReady(true);
            }
        };

        startCompass();

        return () => {
            clearTimeout(failsafe);
            Compass.stopListening();
            Compass.removeAllListeners();
        };
    }, [status]);


    // Haptic Feedback Loop
    useEffect(() => {
        if (isAligned && hapticEnabled) {
            const now = Date.now();
            if (now - lastHapticRef.current > 1500) {
                Haptics.impact({ style: ImpactStyle.Heavy });
                lastHapticRef.current = now;
            }
        }
    }, [isAligned, hapticEnabled]);

    useEffect(() => {
        const handleDebug = () => setDebugAligned(p => !p);
        window.addEventListener('qiblaDebugToggle', handleDebug);
        return () => window.removeEventListener('qiblaDebugToggle', handleDebug);
    }, []);



    return (
        <div
            className="relative flex flex-col h-full w-full text-emerald-50 overflow-hidden font-sans bg-[#022c22]"
            style={{ touchAction: 'none' }}
        >
            <BackgroundAtmosphere />

            {/* Header */}
            <header className="relative z-30 flex justify-between items-center px-10 py-12 pt-[calc(3rem+env(safe-area-inset-top))]">
                <div className="flex flex-col">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 mb-1"
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="w-9 h-9 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 flex items-center justify-center text-emerald-100/60 hover:text-amber-400 active:scale-90 transition-all border border-emerald-500/20"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                        <span className="text-[10px] tracking-[0.6em] text-emerald-200/60 font-bold uppercase">{t('spiritualCompass')}</span>
                    </motion.div>
                    <h1 className="text-3xl font-serif text-white tracking-widest font-light">
                        {t('qiblaDirection')} <span className="text-amber-400 italic font-normal">{t('directionSuffix')}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => { setHapticEnabled(!hapticEnabled); selection(); }}
                        className={cn("p-3 rounded-full border backdrop-blur-3xl transition-all active:scale-95",
                            hapticEnabled ? "bg-emerald-900/30 border-emerald-500/20 text-amber-400" : "bg-white/[0.03] border-white/10 text-emerald-100/30"
                        )}
                    >
                        <Vibrate className={cn("w-6 h-6", !hapticEnabled && "opacity-40")} />
                    </button>

                    <button onClick={() => { selection(); setShowInfo(true); }}
                        className="p-3 rounded-full bg-emerald-900/30 border border-emerald-500/20 backdrop-blur-3xl active:scale-95 transition-all text-emerald-100/60 hover:text-amber-400"
                    >
                        <Info className="w-6 h-6" />
                    </button>

                </div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 gap-6">
                {(status === 'loading' || status === 'calculating' || (status === 'active' && !compassReady)) ? (
                    <div className="flex flex-col items-center gap-6">
                        <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-sm tracking-widest text-emerald-100/50">{t('calculating')}</p>
                            <p className="text-xs text-emerald-100/30 text-center max-w-[240px]">{t('calculatingSubtitle')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center gap-4">
                        {/* Turn Direction Arrows — TOP, above compass */}
                        <div className="flex items-center justify-center gap-16 h-12">
                            {!isAligned && (
                                <>
                                    {/* Left arrow */}
                                    <motion.div
                                        animate={{
                                            opacity: turnDirection === 'left' ? 1 : 0.06,
                                            x: turnDirection === 'left' ? [0, -12, 0] : 0,
                                            scale: turnDirection === 'left' ? [1, 1.2, 1] : 0.6
                                        }}
                                        transition={{ duration: 0.8, repeat: turnDirection === 'left' ? Infinity : 0 }}
                                        className="relative flex items-center justify-center"
                                    >
                                        {turnDirection === 'left' && (
                                            <div className="absolute w-16 h-16 rounded-full bg-amber-400/20 blur-xl" />
                                        )}
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="relative z-10">
                                            <path d="M15 4L7 12L15 20" stroke={turnDirection === 'left' ? '#FBBF24' : '#ffffff10'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>

                                    {/* Right arrow */}
                                    <motion.div
                                        animate={{
                                            opacity: turnDirection === 'right' ? 1 : 0.06,
                                            x: turnDirection === 'right' ? [0, 12, 0] : 0,
                                            scale: turnDirection === 'right' ? [1, 1.2, 1] : 0.6
                                        }}
                                        transition={{ duration: 0.8, repeat: turnDirection === 'right' ? Infinity : 0 }}
                                        className="relative flex items-center justify-center"
                                    >
                                        {turnDirection === 'right' && (
                                            <div className="absolute w-16 h-16 rounded-full bg-amber-400/20 blur-xl" />
                                        )}
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="relative z-10">
                                            <path d="M9 4L17 12L9 20" stroke={turnDirection === 'right' ? '#FBBF24' : '#ffffff10'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                </>
                            )}
                        </div>

                        {/* THE COMPASS */}
                        <div className="relative w-80 h-80 flex items-center justify-center">
                            {/* Alignment Waves */}
                            <AnimatePresence>
                                {isAligned && (
                                    <>
                                        {[1, 2, 3].map((i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 1, opacity: 0 }}
                                                animate={{ scale: 1.6, opacity: [0, 0.1, 0] }}
                                                transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
                                                className="absolute inset-0 border border-amber-400/30 rounded-full blur-sm"
                                            />
                                        ))}
                                    </>
                                )}
                            </AnimatePresence>

                            {/* Rotating Compass Tick Layer — direct DOM transform for 60fps */}
                            <div
                                ref={compassRef}
                                className="absolute inset-0 flex items-center justify-center will-change-transform"
                                style={{ transform: 'rotate(0deg)' }}
                            >
                                <svg className="w-72 h-72 p-1" viewBox="0 0 100 100">
                                    <CompassTicks />
                                    <text x="50" y="18" fontSize="6" fill="white" textAnchor="middle" className="font-bold">{t('compassDirections.north')}</text>
                                    <text x="82" y="52" fontSize="5" fill="white" textAnchor="middle" opacity="0.6">{t('compassDirections.east')}</text>
                                    <text x="50" y="86" fontSize="5" fill="white" textAnchor="middle" opacity="0.6">{t('compassDirections.south')}</text>
                                    <text x="18" y="52" fontSize="5" fill="white" textAnchor="middle" opacity="0.6">{t('compassDirections.west')}</text>
                                </svg>
                            </div>

                            {/* Kaaba (Center) */}
                            <div className="relative w-72 h-72 flex items-center justify-center pointer-events-none">
                                <motion.div className={cn("transition-all duration-1000", isAligned ? "scale-110" : "scale-100")}>
                                    <KaabaEthereal isAligned={isAligned} />
                                </motion.div>
                            </div>

                            {/* Arrow — direct DOM transform for 60fps */}
                            <div
                                ref={arrowRef}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform"
                                style={{ transform: 'rotate(0deg)' }}
                            >
                                <div className="absolute top-[20px] left-1/2 -translate-x-1/2 w-1.5 h-[100px] bg-gradient-to-t from-transparent via-amber-400/60 to-amber-400 rounded-full" />
                                <div className="absolute top-0 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L3 19L12 15L21 19L12 2Z" fill="#FBBF24" stroke="#78350F" strokeWidth="0.5" />
                                        <path d="M12 2L12 15L21 19L12 2Z" fill="#D97706" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Angle Indicator — degree only, arrows are above */}
                        <div className="flex flex-col items-center justify-center gap-2 h-20">
                            {isAligned ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <h2 className="text-4xl font-serif text-amber-400 font-bold drop-shadow-lg">
                                        {t('qiblaFound')}
                                    </h2>
                                    <p className="text-sm text-amber-200/60 tracking-[0.3em] mt-2">
                                        {t('qiblaFoundSubtitle')}
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-mono text-emerald-100 font-light">
                                            {Math.round(degreeDiff)}
                                        </span>
                                        <span className="text-xl text-emerald-400">°</span>
                                    </div>
                                    <p className="text-xs text-emerald-500/50 uppercase tracking-widest mt-1">
                                        {t('degreesRemaining')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <footer className="relative z-20 px-10 pb-24 flex flex-col items-center">
                {latitude && (
                    <div className="flex items-center gap-2 py-2 px-4 rounded-full bg-emerald-950/40 border border-emerald-500/10">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] tracking-widest text-emerald-100/60">
                            {t('distance')} <span className="text-amber-400">{Math.round(distanceKM).toLocaleString('tr-TR')} {t('km')}</span>
                        </span>
                    </div>
                )}
            </footer>

            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-b from-[#0a3d2e] to-[#021a0f] p-7 rounded-[2rem] border border-emerald-500/15 max-w-sm w-full shadow-2xl shadow-emerald-900/40"
                        >
                            {/* Header */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4">
                                    <span className="text-3xl">🕋</span>
                                </div>
                                <h3 className="text-xl text-white font-serif tracking-wide">{t('infoTitle')}</h3>
                                <p className="text-[11px] tracking-[0.4em] text-amber-400/60 mt-1 uppercase">{t('infoSubtitle')}</p>
                            </div>

                            {/* Tips */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                    <span className="text-lg mt-0.5">🧭</span>
                                    <div>
                                        <p className="text-sm text-emerald-100/80 font-medium">{t('tip1Title')}</p>
                                        <p className="text-xs text-emerald-100/40 mt-0.5">{t('tip1Desc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                    <span className="text-lg mt-0.5">🎯</span>
                                    <div>
                                        <p className="text-sm text-emerald-100/80 font-medium">{t('tip2Title')}</p>
                                        <p className="text-xs text-emerald-100/40 mt-0.5">{t('tip2Desc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                    <span className="text-lg mt-0.5">⚠️</span>
                                    <div>
                                        <p className="text-sm text-emerald-100/80 font-medium">{t('tip3Title')}</p>
                                        <p className="text-xs text-emerald-100/40 mt-0.5">{t('tip3Desc')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Distance Badge */}
                            {distanceKM > 0 && (
                                <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-emerald-950/60 border border-emerald-500/10 mb-6">
                                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-xs tracking-wider text-emerald-100/50">
                                        {t('distanceToKaaba', { distance: distanceKM.toLocaleString('tr-TR') })}
                                    </span>
                                </div>
                            )}

                            {/* Hadith */}
                            <div className="text-center mb-6 px-2">
                                <p className="text-xs text-emerald-100/30 italic font-serif leading-relaxed">
                                    {t('hadith')}
                                </p>
                                <p className="text-[10px] text-amber-400/40 mt-1.5">{t('hadithSource')}</p>
                            </div>

                            <Button
                                onClick={() => setShowInfo(false)}
                                className="w-full bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 rounded-xl py-3 text-emerald-50 font-medium tracking-wide transition-all"
                            >
                                {t('understood')}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
