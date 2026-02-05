import React from 'react';
import { Moon } from 'lucide-react';

export default function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[999] bg-[#044d29] flex flex-col items-center justify-center animate-out fade-out duration-1000 delay-[2000ms]">
            <div className="relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-islamic-gold/20 blur-3xl rounded-full scale-150 animate-pulse" />

                {/* Center Logo/Icon */}
                <div className="relative animate-in zoom-in-0 duration-1000 ease-out">
                    <div className="w-32 h-32 rounded-full border-2 border-islamic-gold/30 flex items-center justify-center bg-white/5 backdrop-blur-sm shadow-2xl">
                        <Moon className="w-16 h-16 text-islamic-gold fill-current animate-pulse-slow" />
                    </div>
                </div>
            </div>

            {/* App Name */}
            <div className="mt-8 text-center animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                <h1 className="text-3xl font-serif font-bold text-white tracking-widest uppercase">
                    İslami Yoldaş
                </h1>
                <div className="w-12 h-1 bg-islamic-gold mx-auto mt-2 rounded-full" />
                <p className="text-emerald-100/40 text-[10px] uppercase font-bold tracking-[0.3em] mt-4">
                    Manevi Yolculuğun Başlıyor
                </p>
            </div>
        </div>
    );
}
