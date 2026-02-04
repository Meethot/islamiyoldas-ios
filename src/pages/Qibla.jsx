import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Compass, Info, X, RefreshCw, Star,
    Loader2, Smartphone, MapPin, Navigation2, Vibrate
} from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { useHaptics } from '@/hooks/useMobile';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// MECCA Constants
const MECCA = { lat: 21.4225, lng: 39.8262 };
const DEFAULT_ALIGNMENT_THRESHOLD = 5;

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
    <div className="absolute inset-0 z-0 bg-[#00100a]"> {/* Deepest Green Black */}
        {/* Islamic Green Glow */}
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/40 rounded-full blur-[150px] pointer-events-none"
        />
        {/* Golden Warmth from bottom */}
        <motion.div
            animate={{
                opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-amber-600/20 rounded-full blur-[120px] pointer-events-none"
        />
        {/* Grainy texture overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-leather.png')" }} />
    </div>
);

const CompassTicks = () => {
    const ticks = [];
    for (let i = 0; i < 360; i += 2) { // Every 2 degrees
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
    const { latitude, longitude, loading: locationLoading, error: locationError, hasLocation, refreshLocation } = useLocation();

    const [heading, setHeading] = useState(0);
    const [qiblaAngle, setQiblaAngle] = useState(0);
    const [isAligned, setIsAligned] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [status, setStatus] = useState('loading');
    const [debugAligned, setDebugAligned] = useState(false);
    const [hapticEnabled, setHapticEnabled] = useState(true);

    const lastHapticRef = useRef(0);

    const getQiblaAngle = useCallback((lat, lng) => {
        const dL = (MECCA.lng - lng) * (Math.PI / 180);
        const phi1 = lat * (Math.PI / 180);
        const phi2 = MECCA.lat * (Math.PI / 180);
        const y = Math.sin(dL);
        const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dL);
        return ((Math.atan2(y, x) * (180 / Math.PI)) + 360) % 360;
    }, []);

    useEffect(() => {
        if (locationLoading) return;
        if (hasLocation && latitude && longitude) {
            setQiblaAngle(getQiblaAngle(latitude, longitude));
            setStatus('active');
        } else if (locationError) {
            setQiblaAngle(getQiblaAngle(41.0082, 28.9784));
            setStatus('active');
        }
    }, [latitude, longitude, locationLoading, locationError, hasLocation, getQiblaAngle]);

    useEffect(() => {
        const handleMotion = (e) => {
            let h = e.webkitCompassHeading || (360 - e.alpha) || 0;
            const effectiveHeading = debugAligned ? qiblaAngle : h;
            setHeading(effectiveHeading);

            const diff = Math.abs(effectiveHeading - qiblaAngle);
            const aligned = diff < DEFAULT_ALIGNMENT_THRESHOLD || diff > (360 - DEFAULT_ALIGNMENT_THRESHOLD);

            if (aligned && !isAligned) {
                setIsAligned(true);
                success();
            } else if (!aligned && isAligned) {
                setIsAligned(false);
            }
        };

        const setup = async () => {
            if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
                try {
                    const res = await DeviceOrientationEvent.requestPermission();
                    if (res === 'granted') window.addEventListener('deviceorientation', handleMotion);
                } catch (e) { }
            } else {
                window.addEventListener('deviceorientation', handleMotion);
            }
        };

        if (status === 'active') setup();
        return () => window.removeEventListener('deviceorientation', handleMotion);
    }, [status, qiblaAngle, isAligned, success, debugAligned]);

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
        <div className="relative flex flex-col h-full w-full text-emerald-50 overflow-hidden font-sans bg-[#022c22]">
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
                    <button
                        onClick={() => {
                            setHapticEnabled(!hapticEnabled);
                            selection();
                        }}
                        className={cn(
                            "p-3 rounded-full border backdrop-blur-3xl transition-all active:scale-95",
                            hapticEnabled
                                ? "bg-emerald-900/30 border-emerald-500/20 text-amber-400"
                                : "bg-white/[0.03] border-white/10 text-emerald-100/30"
                        )}
                    >
                        <Vibrate className={cn("w-6 h-6", !hapticEnabled && "opacity-40")} />
                    </button>

                    <button
                        onClick={() => { selection(); setShowInfo(true); }}
                        className="group relative p-3 rounded-full bg-emerald-900/30 border border-emerald-500/20 backdrop-blur-3xl active:scale-95 transition-all"
                    >
                        <Info className="w-6 h-6 text-emerald-100/60 group-hover:text-amber-400 transition-colors" />
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 gap-16">
                {status === 'loading' ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 border-2 border-emerald-500/10 rounded-full" />
                            <Loader2 className="absolute inset-0 w-24 h-24 text-amber-400/40 animate-spin" strokeWidth={1} />
                        </div>
                        <p className="text-sm tracking-[0.3em] font-medium text-emerald-100/30 uppercase">Yolculuk Hazırlanıyor</p>
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center gap-12">
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
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }}
                                            className="absolute -inset-10 bg-amber-400 rounded-full blur-[80px] pointer-events-none"
                                        />
                                    </>
                                )}
                            </AnimatePresence>

                            {/* Rotating Compass Disk */}
                            <motion.div
                                animate={{ rotate: qiblaAngle - heading }}
                                transition={{ type: "spring", stiffness: 35, damping: 20 }} // Snappier response
                                className="relative w-72 h-72 flex items-center justify-center"
                            >
                                {/* Degree Ticks Ring */}
                                <svg className="absolute inset-0 w-full h-full p-1" viewBox="0 0 100 100">
                                    <CompassTicks />
                                    {/* Cardinal Points - Turkish */}
                                    <text x="50" y="18" fontSize="6" fill="#10b981" textAnchor="middle" className="font-bold" style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.8))' }}>K</text>
                                    <text x="82" y="52" fontSize="5" fill="white" textAnchor="middle" opacity="0.6">D</text>
                                    <text x="50" y="86" fontSize="5" fill="white" textAnchor="middle" opacity="0.6">G</text>
                                    <text x="18" y="52" fontSize="5" fill="white" textAnchor="middle" opacity="0.6">B</text>
                                </svg>

                                {/* Center Stage sphere */}
                                <motion.div
                                    className={cn(
                                        "w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000 relative",
                                        isAligned ? "bg-amber-400/[0.05] shadow-[0_0_50px_rgba(251,191,36,0.1)]" : "bg-emerald-900/[0.1]"
                                    )}
                                >
                                    <KaabaEthereal isAligned={isAligned} />

                                    {/* GOLDEN ARROW - ALWAYS VISIBLE */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        style={{ transform: `rotate(${qiblaAngle - heading}deg)` }}
                                    >
                                        {/* Arrow Shaft (Gradient Fade) */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[130px] w-1.5 h-24 bg-gradient-to-t from-transparent via-amber-400 to-amber-300 opacity-60 rounded-full blur-[1px]" />

                                        {/* PRIMARY ARROW HEAD */}
                                        <div className="absolute top-0 -translate-y-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2L3 19L12 15L21 19L12 2Z" fill="#FBBF24" stroke="#78350F" strokeWidth="0.5" />
                                                <path d="M12 2L12 15L21 19L12 2Z" fill="#D97706" />
                                            </svg>
                                        </div>

                                        {/* Pulsing Target Ring at the tip */}
                                        <div className="absolute top-0 -translate-y-6 w-10 h-10 border-2 border-amber-400/30 rounded-full animate-ping" />
                                    </motion.div>
                                </motion.div>
                            </motion.div>

                            {/* Fixed HUD Overlay (Static Center Marker) */}
                            <div className="absolute pointer-events-none w-2 h-2 bg-white/20 rounded-full z-30 mix-blend-overlay" />
                        </div>

                        {/* Status Message */}
                        <div className="text-center space-y-4 max-w-xs z-20">
                            <motion.h2
                                key={isAligned ? 'al' : 'se'}
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "text-3xl font-serif tracking-tight transition-colors duration-1000 drop-shadow-lg",
                                    isAligned ? "text-amber-300" : "text-emerald-100"
                                )}
                            >
                                {isAligned ? "Kıble Bulundu" : "Kıbleyi Arayın"}
                            </motion.h2>

                            <motion.div
                                animate={{ opacity: [0.5, 0.9, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="flex items-start justify-center gap-2"
                            >
                                {!isAligned && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse mt-1.5 shrink-0" />}
                                <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/50 font-bold">
                                    {isAligned ? "Sükunetle namaza niyet edin" : "Yüzünüzü ve kalbinizi Kabe'ye çevirin."}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-20 px-10 pb-16 flex flex-col items-center gap-8">
                {latitude && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="flex items-center gap-3 py-3 px-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/10 backdrop-blur-xl">
                            <MapPin className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] tracking-[0.2em] font-medium text-emerald-100/60 uppercase">
                                Mesafe: <span className="text-amber-300 font-bold tracking-normal ml-1">{calculateDistance(latitude, longitude, MECCA.lat, MECCA.lng)} KM</span>
                            </span>
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-sm text-center space-y-4"
                >
                    {/* Arabic Verse - Gold Styled */}
                    <p className="text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 leading-relaxed dir-rtl mb-2">
                        فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ
                    </p>

                    <p className="text-base font-serif italic text-emerald-100/70 leading-relaxed px-6">
                        "Yüzünüzü Mescid-i Haram tarafına çevirin."
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-8 bg-emerald-500/10" />
                        <span className="text-[10px] uppercase tracking-[0.4em] text-amber-500/40 font-black">Bakara, 144</span>
                        <div className="h-px w-8 bg-emerald-500/10" />
                    </div>
                </motion.div>
            </footer>

            {/* Premium Info Panel */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#022c22] border border-emerald-500/20 p-10 rounded-[3rem] max-w-sm relative text-center shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] -mr-10 -mt-10" />

                            <button onClick={() => setShowInfo(false)} className="absolute top-8 right-8 text-emerald-500/40 hover:text-emerald-400 transition-colors">
                                <X className="w-8 h-8" strokeWidth={1.5} />
                            </button>

                            <div className="w-20 h-20 bg-emerald-950 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-xl">
                                <Compass className="w-10 h-10 text-amber-400" strokeWidth={1.5} />
                            </div>

                            <h3 className="text-2xl font-serif text-white mb-6 tracking-wide">Pusula Rehberi</h3>

                            <div className="space-y-6 text-left mb-10">
                                {[
                                    { t: "Cihazı yere paralel ve düz tutun.", i: Smartphone },
                                    { t: "Altın ok yönünü takip edin.", i: Navigation2 },
                                    { t: "Kabe simgesi parlayınca durun.", i: Star }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-center bg-emerald-950/30 p-3 rounded-2xl border border-emerald-500/5">
                                        <div className="bg-emerald-900/50 p-2 rounded-lg text-amber-400">
                                            <item.i className="w-4 h-4" />
                                        </div>
                                        <p className="text-[13px] text-emerald-100/70 font-medium">{item.t}</p>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={() => setShowInfo(false)}
                                className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-400 text-emerald-950 hover:text-emerald-950 transition-all font-bold uppercase tracking-wider text-sm shadow-lg shadow-amber-900/20"
                            >
                                Anladım
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
