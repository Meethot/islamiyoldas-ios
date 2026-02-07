import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Compass as CompassIcon, Info, X, Star,
    Loader2, Smartphone, MapPin, Navigation2, Vibrate, Map as MapIcon
} from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { useHaptics } from '@/hooks/useMobile';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { CapgoCompass as Compass } from '@capgo/capacitor-compass'; // Native Compass Plugin
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// MECCA Constants
const MECCA = { lat: 21.4225, lng: 39.8262 };
const DEFAULT_ALIGNMENT_THRESHOLD = 3.5;

// --- Helpers ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toLocaleString('tr-TR', { maximumFractionDigits: 0 });
};

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
    const { selection, success } = useHaptics();
    const { latitude, longitude, loading: locationLoading, error: locationError, hasLocation } = useLocation();

    // State
    const [heading, setHeading] = useState(0); // True North Heading
    const [qiblaAngle, setQiblaAngle] = useState(0); // Angle relative to True North
    const [isAligned, setIsAligned] = useState(false);
    const [degreeDiff, setDegreeDiff] = useState(180); // Difference for display
    const [showInfo, setShowInfo] = useState(false);
    const [status, setStatus] = useState('loading'); // loading, calculating, active
    const [debugAligned, setDebugAligned] = useState(false);
    const [hapticEnabled, setHapticEnabled] = useState(true);

    // Refs for accessing state inside listeners without re-renders
    const qiblaAngleRef = useRef(0);
    const isAlignedRef = useRef(false);
    const lastHapticRef = useRef(0);
    const lastHeadingRef = useRef(0);
    const mountedRef = useRef(true);

    // Update refs when state changes
    useEffect(() => { qiblaAngleRef.current = qiblaAngle; }, [qiblaAngle]);
    useEffect(() => { isAlignedRef.current = isAligned; }, [isAligned]);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // Calculate Qibla Angle relative to TRUE NORTH
    const getQiblaAngle = useCallback((lat, lng) => {
        const dL = (MECCA.lng - lng) * (Math.PI / 180);
        const phi1 = lat * (Math.PI / 180);
        const phi2 = MECCA.lat * (Math.PI / 180);
        const y = Math.sin(dL);
        const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dL);
        return ((Math.atan2(y, x) * (180 / Math.PI)) + 360) % 360;
    }, []);

    // Initial Setup
    useEffect(() => {
        if (locationLoading) return;

        if (hasLocation && latitude && longitude) {
            setStatus('calculating');
            const trueQibla = getQiblaAngle(latitude, longitude);
            setQiblaAngle(trueQibla);
            setStatus('active');
        } else if (locationError) {
            const defaultLat = 41.0082;
            const defaultLng = 28.9784;
            setQiblaAngle(getQiblaAngle(defaultLat, defaultLng));
            setStatus('active');
        }
    }, [latitude, longitude, locationLoading, locationError, hasLocation, getQiblaAngle]);


    // --- NATIVE COMPASS IMPLEMENTATION ---
    useEffect(() => {
        if (status !== 'active') return;

        const startCompass = async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            if (!mountedRef.current) return;

            try {
                // Permission Flow (Blind try for Android, Proper check for iOS)
                try {
                    const perm = await Compass.checkPermissions();
                    if (perm.compass !== 'granted') await Compass.requestPermissions();
                } catch (e) { console.warn("Perm check skipped", e); }

                // Cleanup
                await Compass.removeAllListeners();

                // Setup Listener
                await Compass.addListener('headingChange', (data) => {
                    if (!mountedRef.current) return;

                    let rawHeading = data.value;
                    rawHeading = (rawHeading + 360) % 360;

                    if (debugAligned) rawHeading = qiblaAngleRef.current;

                    // --- Dynamic Algorithm ---
                    const current = lastHeadingRef.current;
                    let diff = rawHeading - current;

                    while (diff > 180) diff -= 360;
                    while (diff < -180) diff += 360;

                    // Adaptive Physics
                    const absDiff = Math.abs(diff);
                    let dynamicAlpha = absDiff > 15 ? 1.0 : (absDiff > 5 ? 0.5 : 0.1);

                    const smoothed = current + diff * dynamicAlpha;
                    const normalizedSmoothed = (smoothed + 360) % 360;

                    lastHeadingRef.current = normalizedSmoothed;

                    // Update main Heading State
                    setHeading(normalizedSmoothed);

                    // --- Calculate Degree Difference for UI ---
                    const targetAngle = qiblaAngleRef.current;
                    let angleDiff = targetAngle - normalizedSmoothed;
                    while (angleDiff > 180) angleDiff -= 360;
                    while (angleDiff < -180) angleDiff += 360;

                    const absAngleDiff = Math.abs(angleDiff);
                    setDegreeDiff(absAngleDiff); // For visual display

                    // Check Alignment
                    const isNowAligned = absAngleDiff < DEFAULT_ALIGNMENT_THRESHOLD;

                    if (isNowAligned && !isAlignedRef.current) {
                        setIsAligned(true);
                        success();
                    } else if (!isNowAligned && isAlignedRef.current) {
                        setIsAligned(false);
                    }
                });

                // Start Engine (30ms = ~33FPS, preventing overload)
                await Compass.startListening({
                    minInterval: 30,
                    minHeadingChange: 0.1
                });

            } catch (e) {
                console.error("Compass Error", e);
            }
        };

        startCompass();

        return () => {
            Compass.stopListening();
            Compass.removeAllListeners();
        };
    }, [status, success]);


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

    const openMap = () => {
        if (latitude && longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${MECCA.lat},${MECCA.lng}&travelmode=walking`;
            window.open(url, '_system');
        }
    };

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
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                        <span className="text-[10px] tracking-[0.6em] text-emerald-200/60 font-bold uppercase">Manevi Pusula</span>
                    </motion.div>
                    <h1 className="text-3xl font-serif text-white tracking-widest font-light">
                        KIBLE <span className="text-amber-400 italic font-normal">YÖNÜ</span>
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

                    <button onClick={() => { selection(); openMap(); }}
                        className="p-3 rounded-full bg-emerald-900/30 border border-emerald-500/20 backdrop-blur-3xl active:scale-95 transition-all text-emerald-100/60 hover:text-amber-400"
                    >
                        <MapIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 gap-10">
                {(status === 'loading' || status === 'calculating') ? (
                    <div className="flex flex-col items-center gap-6">
                        <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                        <p className="text-sm tracking-widest text-emerald-100/50">HESAPLANIYOR...</p>
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center gap-10">
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

                            {/* Rotating Compass Tick Layer */}
                            <motion.div
                                animate={{ rotate: -heading }}
                                transition={{ ease: "linear", duration: 0.1 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <svg className="w-72 h-72 p-1" viewBox="0 0 100 100">
                                    <CompassTicks />
                                    <text x="50" y="18" fontSize="6" fill="white" textAnchor="middle" className="font-bold">K</text>
                                    <text x="82" y="52" fontSize="5" fill="white" textAnchor="middle" opacity="0.6">D</text>
                                    <text x="50" y="86" fontSize="5" fill="white" textAnchor="middle" opacity="0.6">G</text>
                                    <text x="18" y="52" fontSize="5" fill="white" textAnchor="middle" opacity="0.6">B</text>
                                </svg>
                            </motion.div>

                            {/* Kaaba (Center) */}
                            <div className="relative w-72 h-72 flex items-center justify-center pointer-events-none">
                                <motion.div className={cn("transition-all duration-1000", isAligned ? "scale-110" : "scale-100")}>
                                    <KaabaEthereal isAligned={isAligned} />
                                </motion.div>
                            </div>

                            {/* Arrow */}
                            <motion.div
                                animate={{ rotate: qiblaAngle - heading }}
                                transition={{ ease: "linear", duration: 0.1 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <div className="absolute top-[20px] left-1/2 -translate-x-1/2 w-1.5 h-[100px] bg-gradient-to-t from-transparent via-amber-400/60 to-amber-400 rounded-full" />
                                <div className="absolute top-0 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L3 19L12 15L21 19L12 2Z" fill="#FBBF24" stroke="#78350F" strokeWidth="0.5" />
                                        <path d="M12 2L12 15L21 19L12 2Z" fill="#D97706" />
                                    </svg>
                                </div>
                            </motion.div>
                        </div>

                        {/* Dynamic Angle Indicator */}
                        <div className="flex flex-col items-center justify-center gap-2 h-24">
                            {isAligned ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <h2 className="text-4xl font-serif text-amber-400 font-bold drop-shadow-lg">
                                        KIBLE BULUNDU
                                    </h2>
                                    <p className="text-sm text-amber-200/60 tracking-[0.3em] mt-2">
                                        ALLAH KABUL ETSİN
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-mono text-emerald-100 font-light">
                                            {Math.round(degreeDiff)}
                                        </span>
                                        <span className="text-xl text-emerald-400">°</span>
                                    </div>
                                    <p className="text-xs text-emerald-500/50 uppercase tracking-widest mt-1">
                                        Hizalamaya Kalan
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <footer className="relative z-20 px-10 pb-16 flex flex-col items-center">
                {latitude && (
                    <div className="flex items-center gap-2 py-2 px-4 rounded-full bg-emerald-950/40 border border-emerald-500/10">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] tracking-widest text-emerald-100/60">
                            MESAFE: <span className="text-amber-400">{calculateDistance(latitude, longitude, MECCA.lat, MECCA.lng)} KM</span>
                        </span>
                    </div>
                )}
            </footer>

            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8"
                    >
                        <div className="bg-[#022c22] p-8 rounded-3xl border border-emerald-500/20 max-w-sm w-full text-center">
                            <CompassIcon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                            <h3 className="text-xl text-white font-serif mb-4">Pusula ve Harita</h3>
                            <p className="text-sm text-emerald-100/60 mb-6">
                                En doğru sonuç için açıyı 0 dereceye getirmeye çalışın.
                                <br /><br />
                                Metal eşyalar pusulayı etkileyebilir. Emin olmak için <strong>Harita butonunu</strong> kullanabilirsiniz.
                            </p>
                            <Button onClick={() => setShowInfo(false)} className="w-full bg-emerald-800 hover:bg-emerald-700">Tamam</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
