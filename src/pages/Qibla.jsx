import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Navigation, Info, X, MapPin, Volume2, VolumeX, AlertCircle, RefreshCw, Star, Loader2 } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { useHaptics } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Mecca coordinates
const MECCA = { lat: 21.4225, lng: 39.8262 };
const DEFAULT_ALIGNMENT_THRESHOLD = 8;

export default function Qibla() {
    const { selection, success, medium } = useHaptics();

    // Get location from global context
    const { latitude, longitude, loading: locationLoading, error: locationError, hasLocation, refreshLocation } = useLocation();

    // State
    const [userCoords, setUserCoords] = useState(null);
    const [qiblaAngle, setQiblaAngle] = useState(0);
    const [heading, setHeading] = useState(0);
    const [isAligned, setIsAligned] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showInfo, setShowInfo] = useState(false);
    const [status, setStatus] = useState('loading'); // loading, active, error
    const [errorMessage, setErrorMessage] = useState('');

    const audioRef = useRef(null);

    // 1. Math: Qibla Calculation
    const getQiblaAngle = useCallback((lat, lng) => {
        const dL = (MECCA.lng - lng) * (Math.PI / 180);
        const phi1 = lat * (Math.PI / 180);
        const phi2 = MECCA.lat * (Math.PI / 180);
        const y = Math.sin(dL);
        const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dL);
        const angle = Math.atan2(y, x) * (180 / Math.PI);
        return (angle + 360) % 360;
    }, []);

    // 2. Sync with global location context
    useEffect(() => {
        if (locationLoading) {
            setStatus('loading');
            return;
        }

        if (hasLocation && latitude && longitude) {
            setUserCoords({ lat: latitude, lng: longitude });
            setQiblaAngle(getQiblaAngle(latitude, longitude));
            setStatus('active');
        } else if (locationError) {
            // Fallback to Istanbul if location fails
            const fallbackLat = 41.0082;
            const fallbackLng = 28.9784;
            setUserCoords({ lat: fallbackLat, lng: fallbackLng });
            setQiblaAngle(getQiblaAngle(fallbackLat, fallbackLng));
            setErrorMessage(locationError);
            setStatus('active'); // Still show compass with fallback
        }
    }, [latitude, longitude, locationLoading, locationError, hasLocation, getQiblaAngle]);

    // 3. Sensor: Orientation logic
    useEffect(() => {
        let hapticCooldown = 0;
        const handleMotion = (e) => {
            let currentHeading = 0;
            if (e.webkitCompassHeading) {
                currentHeading = e.webkitCompassHeading;
            } else if (e.alpha !== null) {
                currentHeading = 360 - e.alpha;
            } else {
                return;
            }
            setHeading(currentHeading);
            const diff = Math.abs(currentHeading - qiblaAngle);
            const aligned = diff < DEFAULT_ALIGNMENT_THRESHOLD || diff > (360 - DEFAULT_ALIGNMENT_THRESHOLD);
            if (aligned && !isAligned) {
                setIsAligned(true);
                success();
            } else if (!aligned && isAligned) {
                setIsAligned(false);
            }
            if (diff < 15 && Date.now() - hapticCooldown > 1800) {
                medium();
                hapticCooldown = Date.now();
            }
        };
        const setupSensors = async () => {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const res = await DeviceOrientationEvent.requestPermission();
                    if (res === 'granted') {
                        window.addEventListener('deviceorientation', handleMotion);
                    } else {
                        setErrorMessage("Pusula izni verilmedi. Kıble yönü gösterilemiyor.");
                        setStatus('error');
                    }
                } catch (err) {
                    // Silently fail sensor permission in production
                }
            } else {
                window.addEventListener('deviceorientation', handleMotion);
            }
        };
        if (status === 'active') setupSensors();
        return () => window.removeEventListener('deviceorientation', handleMotion);
    }, [status, qiblaAngle, isAligned, success, medium]);

    // 4. Audio Control
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.loop = true;
            if (isAligned && !isMuted) {
                audioRef.current.play().catch(() => { });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isAligned, isMuted]);


    return (
        <div className="relative flex flex-col h-full w-full bg-[#010a05] text-white overflow-hidden group">
            {/* High-Contrast Stage Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                <motion.div
                    className="w-full h-full opacity-10 blur-3xl scale-110"
                    style={{ backgroundImage: "url('/assets/kaaba.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
                    animate={{ rotate: -(heading - qiblaAngle) }}
                />
                {/* Deep Emerald Gradient with subtle amber highlight */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-[#01140b] to-[#010a05]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            </div>

            {/* In-Page Header Redesigned (Pro-Max) */}
            <header className="relative z-30 flex justify-between items-center px-8 py-10 pt-[calc(2.5rem+env(safe-area-inset-top))]">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-amber-400/10 rounded-[2rem] flex items-center justify-center border border-amber-400/20 shadow-2xl shadow-amber-900/20 backdrop-blur-2xl">
                        <Compass className="w-10 h-10 text-amber-400 fill-amber-400/20" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black font-serif text-amber-400 tracking-tight leading-none uppercase">Kıble</h1>
                        <h1 className="text-3xl font-black font-serif text-amber-400 tracking-tight leading-none uppercase">Bulucu</h1>
                    </div>
                </div>
                <button onClick={() => { selection(); setShowInfo(true); }} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 backdrop-blur-3xl group active:scale-90">
                    <Info className="w-7 h-7 text-amber-400 group-hover:scale-110 transition-transform" />
                </button>
            </header>

            {/* Main Interaction Area */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 gap-10">

                {/* LOADING STATE */}
                {status === 'loading' && (
                    <div className="text-center w-full max-w-xs space-y-6">
                        <div className="w-32 h-32 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-xl">
                            <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black font-serif text-white">Konum Alınıyor...</h2>
                            <p className="text-sm text-white/50">Kıble yönünü hesaplamak için konum bilgisi bekleniyor</p>
                        </div>
                        <Button
                            onClick={refreshLocation}
                            variant="ghost"
                            className="gap-2 text-amber-400 hover:text-amber-300"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Tekrar Dene
                        </Button>
                    </div>
                )}

                {/* HIGH-VISIBILITY COMPASS INDICATOR - Only show when active */}
                {status === 'active' && (
                    <div className="text-center w-full max-w-xs space-y-8 pt-4">
                        <div className="relative flex items-center justify-center">
                            <AnimatePresence>
                                {isAligned && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 2.2, opacity: 0.2 }} exit={{ scale: 0, opacity: 0 }}
                                        className="absolute inset-0 bg-amber-400 rounded-full blur-3xl"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Large High-Contrast Compass Dial */}
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                {/* Simplified Dial Ring */}
                                <motion.svg
                                    className="absolute w-full h-full" viewBox="0 0 100 100"
                                    animate={{ rotate: qiblaAngle - heading }}
                                    transition={{ type: "spring", stiffness: 40, damping: 15 }}
                                >
                                    <circle cx="50" cy="50" r="48" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" strokeDasharray="1 3" />
                                    {/* Compass Points */}
                                    <text x="50" y="8" fontSize="6" fill="#D4AF37" textAnchor="middle" fontWeight="black" opacity="0.8">N</text>
                                    <text x="92" y="52" fontSize="6" fill="#D4AF37" textAnchor="middle" fontWeight="black" opacity="0.4">E</text>
                                    <text x="50" y="96" fontSize="6" fill="#D4AF37" textAnchor="middle" fontWeight="black" opacity="0.4">S</text>
                                    <text x="8" y="52" fontSize="6" fill="#D4AF37" textAnchor="middle" fontWeight="black" opacity="0.4">W</text>
                                </motion.svg>

                                {/* Solid Gold Arrow Holder */}
                                <motion.div
                                    className={cn(
                                        "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 relative z-10",
                                        isAligned ? "bg-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.6)] scale-110" : "bg-black/40 backdrop-blur-xl border border-white/10"
                                    )}
                                >
                                    {/* THE ARROW: Large, Solid, Unmistakable */}
                                    <div
                                        className="relative transition-transform duration-500"
                                        style={{ transform: `rotate(${qiblaAngle - heading}deg)` }}
                                    >
                                        {/* Custom Solid Arrow SVG for better control than Navigation icon */}
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"
                                                fill={isAligned ? "black" : "#FBBF24"}
                                                className="transition-colors duration-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                                            />
                                        </svg>

                                        {/* Arrow Glow */}
                                        {!isAligned && (
                                            <div className="absolute inset-0 bg-amber-400/20 blur-xl -z-10 animate-pulse" />
                                        )}
                                    </div>

                                    {/* Center Pivot */}
                                    <div className={cn(
                                        "absolute w-2 h-2 rounded-full z-20 shadow-inner",
                                        isAligned ? "bg-black/20" : "bg-amber-400/40"
                                    )} />
                                </motion.div>
                            </div>
                        </div>

                        <motion.div animate={{ opacity: isAligned ? 1 : 0.9 }} className="space-y-2">
                            <h2 className={cn("text-3xl font-black font-serif tracking-tight transition-all duration-700", isAligned ? "text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] scale-105" : "text-white")}>
                                {isAligned ? "Kabe Önünüzde 🤲" : "Kıbleyi Arıyoruz..."}
                            </h2>
                            <p className="text-[12px] text-white/70 font-black uppercase tracking-[0.5em] font-sans">
                                {isAligned ? "Huzurla Selamlayın" : "Cihazı Yavaşça Çevirin"}
                            </p>
                        </motion.div>

                        {/* Controls */}
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="ghost" onClick={() => { selection(); setIsMuted(!isMuted); }}
                                className={cn(
                                    "rounded-full h-14 w-14 p-0 backdrop-blur-3xl border transition-all duration-500 shadow-2xl",
                                    isMuted ? "bg-white/5 border-white/5" : "bg-amber-400/20 border-amber-400/40 shadow-amber-400/10"
                                )}
                            >
                                {isMuted ? <VolumeX className="w-6 h-6 text-gray-400" /> : <Volume2 className="w-6 h-6 text-amber-400 animate-pulse" />}
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* Spiritual Verse & Footer */}
            <footer className="relative z-20 px-8 pb-12 flex flex-col items-center gap-8">

                {/* Spiritual Verse Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xs text-center p-5 bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/5 flex flex-col gap-3 relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-amber-400/20 rounded-full" />
                    <p className="text-[15px] font-serif italic text-amber-100/80 leading-relaxed px-1">
                        "Yüzünü Mescid-i Haram tarafına çevir. Nerede olursanız olun, yüzünüzü o yöne çevirin."
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-amber-400/40 font-black">Bakara Suresi, 144. Ayet</p>
                </motion.div>

                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-950/40 backdrop-blur-2xl rounded-2xl border border-emerald-500/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-black tracking-[0.3em] text-white/40 font-sans uppercase">
                        {userCoords ? `${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° E` : "Bağlanıyor..."}
                    </span>
                </div>
            </footer>

            <audio ref={audioRef} src="/assets/ezan.mp3" />

            {/* Redesigned Info Modal */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                            className="bg-[#010a05] border border-emerald-500/20 p-12 rounded-[4rem] max-w-sm relative text-center shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden"
                        >
                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
                            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-amber-400/5 rounded-full blur-[100px]" />

                            <button onClick={() => setShowInfo(false)} className="absolute top-10 right-10 p-2 opacity-30 hover:opacity-100 hover:rotate-90 transition-all duration-500">
                                <X className="w-8 h-8" />
                            </button>

                            <div className="w-24 h-24 bg-emerald-950 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-emerald-500/20 shadow-2xl relative">
                                <Compass className="w-12 h-12 text-amber-400" />
                                <div className="absolute inset-0 bg-amber-400/5 animate-pulse rounded-[2.5rem]" />
                            </div>

                            <h2 className="text-4xl font-black mb-8 text-white font-serif tracking-tight leading-none">Kıble Rehberi</h2>

                            <div className="space-y-8 text-left">
                                <div className="flex gap-6 items-start group">
                                    <div className="mt-1 w-8 h-8 bg-emerald-950 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <Star className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-black text-white text-lg tracking-tight">Odağı Yakala</p>
                                        <p className="text-[14px] leading-relaxed text-white/50">Cihaz tam kıbleye döndüğünde <b>altın pencere</b> parlar ve <b>ezan</b> duyulur.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 items-start group">
                                    <div className="mt-1 w-8 h-8 bg-emerald-950 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <RefreshCw className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-black text-white text-lg tracking-tight">Hizalama</p>
                                        <p className="text-[14px] leading-relaxed text-white/50">En hassas sonuç için cihazınızı <b>yere paralel</b> tutarak ağır hareketlerle tarayın.</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => setShowInfo(false)}
                                className="w-full mt-12 bg-amber-400 text-black hover:bg-white hover:scale-[1.02] active:scale-95 transition-all font-black h-20 rounded-[2rem] shadow-[0_10px_40px_rgba(251,191,36,0.2)] text-xl uppercase tracking-[0.2em]"
                            >
                                Hazırım
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
