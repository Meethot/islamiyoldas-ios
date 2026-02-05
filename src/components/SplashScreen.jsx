import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import logo from "../assets/logo.png";

export default function SplashScreen() {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Force scroll to top on refresh
        window.scrollTo(0, 0);

        // Simulation of loading progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    window.scrollTo(0, 0); // Scroll to top before hiding
                    setTimeout(() => setIsVisible(false), 500);
                    return 100;
                }
                return prev + 1;
            });
        }, 20); // Total ~2 seconds

        return () => clearInterval(interval);
    }, []);

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

                    <div className="flex flex-col items-center w-full max-w-[280px] px-6">
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
                                alt="İslami Yoldaş Logo"
                                className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                            />
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight text-center"
                        >
                            İslami Yoldaş
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-[9px] sm:text-[10px] text-islamic-green font-bold tracking-[0.3em] uppercase mb-12 opacity-80 text-center"
                        >
                            PREMIUM MANEVİ ASİSTAN
                        </motion.p>

                        {/* Loading Bar Container */}
                        <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden relative">
                            {/* Animated Progress Bar */}
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: `${progress}%` }}
                                className="absolute top-0 left-0 h-full bg-islamic-green shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                            />
                        </div>

                        {/* Animated Percentage */}
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[9px] sm:text-[10px] text-gray-500 mt-3 font-mono"
                        >
                            {progress}%
                        </motion.span>
                    </div>

                    {/* Footer text - Optimized for safe areas */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full text-center px-4"
                    >
                        <p className="text-[9px] sm:text-[10px] text-gray-700 tracking-widest uppercase font-medium">
                            Ümmet için ❤️ ile yapıldı
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
