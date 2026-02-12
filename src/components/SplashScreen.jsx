import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import i18n from "@/i18n";
import logo from "../assets/logo.png";

export default function SplashScreen({ dataReady = false }) {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const startTimeRef = useRef(Date.now());
    const rafRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Smooth continuous progress — never gets "stuck"
    // When dataReady: accelerates to 100%
    // When not ready: slowly fills to ~85%, never reaching 100
    useEffect(() => {
        const animate = () => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;

            setProgress(prev => {
                if (prev >= 100) return 100;

                if (dataReady) {
                    // Smooth fill: faster when far from target, slower when close
                    const step = Math.max(1.5, (100 - prev) * 0.12);
                    return Math.min(prev + step, 100);
                }

                // Data not ready — smooth fill toward 85%
                // Smooth fill: faster when far from target, slower when close
                const targetMax = 85;
                const timeBasedTarget = targetMax * (1 - Math.exp(-elapsed / 3));
                const gap = Math.max(0, timeBasedTarget - prev);
                const step = Math.max(0.15, gap * 0.06);
                return Math.min(prev + step, targetMax + 0.5);
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [dataReady]);

    // Exit when progress hits 100
    useEffect(() => {
        if (progress >= 99.5) {
            window.scrollTo(0, 0);
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [progress]);

    // Max 8s safety — force dismiss
    useEffect(() => {
        const max = setTimeout(() => setIsVisible(false), 8000);
        return () => clearTimeout(max);
    }, []);

    const roundedProgress = Math.round(Math.min(progress, 100));

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-[9999] bg-[#021a0f] flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background Subtle Radial Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120vh] bg-islamic-green/15 blur-[120px] rounded-full -z-10" />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-islamic-green/10 via-transparent to-transparent -z-10" />

                    <div className="flex flex-col items-center w-full max-w-[340px] px-6">
                        {/* Logo with Glow */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative mb-8"
                        >
                            <div className="absolute inset-0 bg-islamic-green/20 blur-2xl rounded-full scale-150 animate-pulse" />
                            <img
                                src={logo}
                                alt={i18n.t('common:splash.title')}
                                className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-[2rem] overflow-hidden"
                            />
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight text-center"
                        >
                            {i18n.t('common:splash.title')}
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-[11px] sm:text-[12px] text-islamic-green font-bold tracking-[0.4em] uppercase mb-14 opacity-90 text-center"
                        >
                            {i18n.t('common:splash.subtitle')}
                        </motion.p>

                        {/* Loading Bar Container */}
                        <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden relative">
                            <motion.div
                                animate={{
                                    width: `${roundedProgress}%`,
                                    filter: `brightness(${1 + (roundedProgress / 100)}) opacity(${0.6 + (roundedProgress / 250)})`
                                }}
                                transition={{ duration: 0.1, ease: "linear" }}
                                className="absolute top-0 left-0 h-full bg-islamic-gold shadow-[0_0_15px_rgba(212,175,55,0.8)]"
                            />
                        </div>

                        {/* Percentage */}
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[9px] sm:text-[10px] text-islamic-gold/60 mt-3 font-mono font-bold"
                        >
                            {roundedProgress}%
                        </motion.span>
                    </div>

                    {/* Footer text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full text-center px-4"
                    >
                        <p className="text-[10px] sm:text-[11px] text-gray-700 tracking-widest uppercase font-medium">
                            {i18n.t('common:splash.footer')}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
