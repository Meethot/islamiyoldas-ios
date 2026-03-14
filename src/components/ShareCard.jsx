import React from 'react';
import { Sprout, TreeDeciduous, TreePalm, Flower2 } from 'lucide-react';

/**
 * ShareCard - "The Spiritual Garden" Edition
 * Dimensions: 1080x1920 (Fixed pixel layout for html2canvas)
 * Concept: A minimal, poster-like visualization of the user's Tuba Tree growth.
 *
 * Supports multiple theme variants for sharing.
 */

// Theme Definitions
export const SHARE_THEMES = {
    emerald: {
        id: 'emerald',
        name: 'Zümrüt',
        preview: 'bg-[#064e3b]',
        background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
        cardBg: 'bg-emerald-950',
        accentColor: 'text-[#d4af37]', // Gold accent
        textColor: 'text-white',
        treeColor: 'text-emerald-400',
        glowColor: 'bg-emerald-500/20',
        borderColor: 'border-[#d4af37]/20',
        archClass: 'border-[4px] border-[#d4af37]/30 shadow-[inset_0_0_0_10px_#022c22,inset_0_0_0_12px_#d4af37/10]',
        archShadow: 'shadow-[0_0_30px_rgba(212,175,55,0.15)]'
    },
    gold: {
        id: 'gold',
        name: 'Altın',
        preview: 'bg-[#d97706]',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', // Light gold/cream background for better legibility
        cardBg: 'bg-[#fef3c7]',
        accentColor: 'text-[#92400e]', // Rich brown/bronze
        textColor: 'text-[#451a03]',
        treeColor: 'text-[#d97706]',
        glowColor: 'bg-amber-500/10',
        borderColor: 'border-[#92400e]/20',
        archClass: 'border-[5px] border-[#92400e]/30 shadow-[inset_0_0_0_10px_#fef3c7,inset_0_0_0_12px_#92400e/10]',
        archShadow: 'shadow-[0_0_30px_rgba(146,64,14,0.1)]'
    },
    gray: {
        id: 'gray',
        name: 'Gece',
        preview: 'bg-gray-800',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        cardBg: 'bg-gray-950',
        accentColor: 'text-blue-300',
        textColor: 'text-white',
        treeColor: 'text-gray-400',
        glowColor: 'bg-gray-500/10',
        borderColor: 'border-white/10',
        archClass: 'border-[3px] border-white/20 shadow-[inset_0_0_0_10px_#111827,inset_0_0_0_12px_white/5]',
        archShadow: 'shadow-[0_0_30px_rgba(255,255,255,0.05)]'
    },
    blue: {
        id: 'blue',
        name: 'Okyanus',
        preview: 'bg-blue-800',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        cardBg: 'bg-blue-950',
        accentColor: 'text-cyan-300',
        textColor: 'text-white',
        treeColor: 'text-blue-400',
        glowColor: 'bg-blue-500/10',
        borderColor: 'border-cyan-300/20',
        archClass: 'border-[3px] border-cyan-300/20 shadow-[inset_0_0_0_10px_#0f172a,inset_0_0_0_12px_cyan-300/5]',
        archShadow: 'shadow-[0_0_30px_rgba(6,182,212,0.1)]'
    },
    cream: {
        id: 'cream',
        name: 'Sabah',
        preview: 'bg-amber-100',
        background: 'radial-gradient(circle at center, #fef3c7 0%, #fde68a 40%, #fcd34d 100%)',
        cardBg: 'bg-amber-50',
        accentColor: 'text-amber-700',
        textColor: 'text-amber-900',
        treeColor: 'text-amber-600',
        glowColor: 'bg-amber-500/10',
        borderColor: 'border-amber-700/10',
        archClass: 'border-[4px] border-amber-700/30 shadow-[inset_0_0_0_10px_#fffbeb,inset_0_0_0_12px_amber-700/5]',
        archShadow: 'shadow-[0_0_20px_rgba(180,83,9,0.1)]'
    },
    floral: {
        id: 'floral',
        name: 'Gül',
        preview: 'bg-[#eecbd0]',
        background: '#f8f4ed', 
        cardBg: 'bg-[#f8f4ed]',
        accentColor: 'text-[#ab7e5c]', 
        textColor: 'text-[#3c2a21]',
        treeColor: 'text-[#eecbd0]',
        glowColor: 'bg-[#eecbd0]/20',
        borderColor: 'border-transparent',
        archClass: 'border-[6px] border-[#8cb3b8] shadow-[inset_0_0_0_12px_#f8f4ed,inset_0_0_0_14px_#eecbd0]',
        archShadow: 'shadow-[0_0_30px_rgba(140,179,184,0.2)]'
    }
};

export default function ShareCard({
    streak = 0,
    theme = 'emerald',
    data = null // { type: 'verse', arabic, translation, surah, verseNumber }
}) {
    // Get theme config
    const currentTheme = SHARE_THEMES[theme] || SHARE_THEMES.emerald;

    // Determine Tree Stage based on streak
    const getTreeStage = (days) => {
        if (days <= 3) return 'seedling';
        if (days <= 10) return 'sapling';
        if (days <= 30) return 'blooming';
        return 'majestic';
    };

    const stage = getTreeStage(streak);

    const renderTree = () => {
        const treeClasses = `${currentTheme.treeColor} drop-shadow-[0_0_50px_rgba(52,211,153,0.6)] relative z-10`;

        switch (stage) {
            case 'seedling':
                return (
                    <div className="relative flex items-center justify-center">
                        <div className={`absolute inset-0 ${currentTheme.glowColor} blur-[100px] rounded-full w-96 h-96`} />
                        <Sprout
                            className={treeClasses}
                            style={{ width: '400px', height: '400px' }}
                            strokeWidth={1}
                        />
                        <p className={`absolute -bottom-20 ${currentTheme.textColor} opacity-60 font-serif text-3xl tracking-widest uppercase`}>Fidan</p>
                    </div>
                );
            case 'sapling':
                return (
                    <div className="relative flex items-center justify-center">
                        <div className={`absolute inset-0 ${currentTheme.glowColor} blur-[100px] rounded-full w-[500px] h-[500px]`} />
                        <TreeDeciduous
                            className={treeClasses}
                            style={{ width: '500px', height: '500px' }}
                            strokeWidth={1}
                        />
                        <p className={`absolute -bottom-20 ${currentTheme.textColor} opacity-60 font-serif text-3xl tracking-widest uppercase`}>Genç Ağaç</p>
                    </div>
                );
            case 'blooming':
                return (
                    <div className="relative flex items-center justify-center">
                        <div className={`absolute inset-0 bg-pink-500/10 blur-[120px] rounded-full w-[600px] h-[600px]`} />
                        <div className="relative">
                            <TreeDeciduous
                                className={treeClasses}
                                style={{ width: '600px', height: '600px' }}
                                strokeWidth={1}
                            />
                            <Flower2 className="absolute top-20 left-20 text-pink-300 w-24 h-24 animate-pulse" fill="rgba(249, 168, 212, 0.5)" />
                            <Flower2 className="absolute top-40 right-32 text-pink-300 w-20 h-20 animate-pulse delay-75" fill="rgba(249, 168, 212, 0.5)" />
                            <Flower2 className="absolute top-10 right-1/2 text-pink-300 w-16 h-16 animate-pulse delay-150" fill="rgba(249, 168, 212, 0.5)" />
                        </div>
                        <p className={`absolute -bottom-20 text-pink-200/60 font-serif text-3xl tracking-widest uppercase`}>Çiçekli Ağaç</p>
                    </div>
                );
            case 'majestic':
                return (
                    <div className="relative flex items-center justify-center">
                        <div className={`absolute inset-0 ${currentTheme.glowColor} blur-[150px] rounded-full w-[700px] h-[700px]`} />
                        <div className="relative">
                            <TreePalm
                                className={`${currentTheme.accentColor} drop-shadow-[0_0_80px_rgba(212,175,55,0.6)] relative z-10`}
                                style={{ width: '700px', height: '700px' }}
                                strokeWidth={0.8}
                            />
                            <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full blur-[2px] shadow-[0_0_20px_white]" />
                            <div className="absolute top-1/2 left-10 w-3 h-3 bg-white rounded-full blur-[2px] shadow-[0_0_20px_white]" />
                        </div>
                        <p className={`absolute -bottom-20 ${currentTheme.accentColor} opacity-60 font-serif text-3xl tracking-widest uppercase`}>Cennet Bahçesi</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            id="share-card"
            className="fixed"
            style={{
                width: '1080px',
                height: '1920px',
                left: '-9999px',
                top: '0',
                zIndex: -5
            }}
        >
            <div
                className={`w-[1080px] h-[1920px] flex flex-col items-center justify-between ${currentTheme.cardBg} relative overflow-hidden font-sans`}
                style={{
                    padding: '160px 80px',
                    background: currentTheme.background,
                }}
            >
                {/* Sunburst / Divine Light Effect */}
                <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] ${currentTheme.glowColor} rounded-full blur-[200px] pointer-events-none`} />

                {/* Islamic Pattern Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '120px 120px'
                    }}
                />

                {data ? (
                    // --- VERSE LAYOUT (Clean Premium Design) ---
                    <>
                        {/* Subtle Corner Frames - Thin & Elegant */}
                        <div className="absolute top-16 left-16 w-20 h-20 border-l-2 border-t-2 border-white/20" />
                        <div className="absolute top-16 right-16 w-20 h-20 border-r-2 border-t-2 border-white/20" />
                        <div className="absolute bottom-16 left-16 w-20 h-20 border-l-2 border-b-2 border-white/20" />
                        <div className="absolute bottom-16 right-16 w-20 h-20 border-r-2 border-b-2 border-white/20" />

                        {/* HEADER SECTION */}
                        <div className="relative z-10 w-full flex flex-col items-center pt-8" style={{ gap: '32px' }}>
                            {/* Surah & Verse Number */}
                            <div className="text-center">
                                <h2 className={`font-serif font-bold ${currentTheme.accentColor} tracking-wide`}
                                    style={{ fontSize: '56px', lineHeight: '1.2' }}>
                                    {data.surah}
                                </h2>
                                <p className={`${currentTheme.textColor} opacity-80 font-medium tracking-widest uppercase`}
                                    style={{ fontSize: '32px', marginTop: '16px' }}>
                                    {data.verseNumber}. Ayet
                                </p>
                            </div>

                            {/* Elegant Divider */}
                            <div className="flex items-center justify-center" style={{ gap: '24px' }}>
                                <div className={`h-px w-20 ${currentTheme.accentColor.replace('text-', 'bg-')} opacity-40`} />
                                <div className={`w-2 h-2 rounded-full ${currentTheme.accentColor.replace('text-', 'bg-')} opacity-60`} />
                                <div className={`h-px w-20 ${currentTheme.accentColor.replace('text-', 'bg-')} opacity-40`} />
                            </div>
                        </div>

                        {/* ARABIC TEXT - Centered & Dominant */}
                        <div className="flex-1 flex items-center justify-center relative z-10 w-full"
                            style={{ padding: '32px 64px' }}>
                            <p className={`${currentTheme.accentColor} font-arabic text-center w-full`}
                                dir="rtl"
                                lang="ar"
                                style={{
                                    fontSize: '70px',
                                    lineHeight: '1.6',
                                    textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    textWrap: 'balance'
                                }}>
                                {data.arabic}
                            </p>
                        </div>

                        {/* TRANSLATION SECTION */}
                        <div className="relative z-10 w-full flex flex-col items-center pb-8" style={{ gap: '48px' }}>
                            {/* Translation Card */}
                            <div className="w-full flex justify-center" style={{ padding: '0 48px' }}>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 text-center"
                                    style={{
                                        padding: '40px 48px',
                                        borderRadius: '32px',
                                        maxWidth: '920px'
                                    }}>
                                    <p className={`${currentTheme.textColor} font-serif italic`}
                                        style={{
                                            fontSize: '40px',
                                            lineHeight: '1.6',
                                            opacity: 0.95
                                        }}>
                                        "{data.translation}"
                                    </p>
                                </div>
                            </div>

                            {/* App Branding - Minimal & Clean */}
                            <div className="flex flex-col items-center text-center" style={{ gap: '20px' }}>
                                <p className={`${currentTheme.textColor} font-bold tracking-wider`}
                                    style={{ fontSize: '28px', letterSpacing: '0.15em' }}>
                                    İSLAMİ YOLDAŞ
                                </p>
                                <p className={`${currentTheme.textColor} opacity-50 font-mono`}
                                    style={{ fontSize: '24px', letterSpacing: '0.1em' }}>
                                    islamiyoldas.app
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    // --- TREE/STREAK LAYOUT ---
                    <>
                        {/* Header */}
                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <h1 className={`font-serif font-bold ${currentTheme.accentColor} leading-tight drop-shadow-2xl`}
                                style={{ fontSize: '80px' }}
                            >
                                Cennet Bahçem<br />
                                <span className={currentTheme.textColor}>Yeşeriyor</span>
                            </h1>
                            <div className={`h-1 w-32 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${currentTheme.accentColor}`} />
                        </div>

                        {/* Hero: The Tree */}
                        <div className="flex-grow flex items-center justify-center relative z-10 w-full">
                            {renderTree()}
                        </div>

                        {/* Footer */}
                        <div className="relative z-10 w-full flex flex-col items-center text-center space-y-8">
                            {/* Streak Badge */}
                            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-10 py-5 rounded-full border border-white/10 shadow-xl">
                                <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_#22c55e]" />
                                <span className={`${currentTheme.textColor} text-4xl font-bold tracking-wide`}>{streak} Gün</span>
                            </div>

                            <p className={`${currentTheme.textColor} opacity-80 font-serif italic text-4xl mt-4`}>
                                "Bugün de ruhumu besledim."
                            </p>

                            <div className="flex flex-col items-center text-center space-y-6 mt-4">
                                <p className={`font-bold ${currentTheme.textColor}`} style={{ fontSize: '42px' }}>
                                    İslami Yoldaş ile <span className={currentTheme.accentColor}>sen de başla!</span> 🤲
                                </p>

                                <div className="bg-white/10 border border-white/20 rounded-[30px] px-12 py-6 flex items-center gap-4 backdrop-blur-md">
                                    <span className={`${currentTheme.textColor} opacity-80 font-mono tracking-wider`} style={{ fontSize: '32px' }}>
                                        islamiyoldas.app/download
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Border Frame */}
                <div className={`absolute inset-10 border ${currentTheme.borderColor} rounded-[4rem] pointer-events-none`} />
                <div className={`absolute inset-12 border ${currentTheme.borderColor} rounded-[3.5rem] pointer-events-none`} />
            </div>
        </div>
    );
}
