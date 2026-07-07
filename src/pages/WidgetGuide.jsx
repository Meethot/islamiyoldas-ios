import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Smartphone, Lock, Crown, BookOpen, Sparkles,
    RefreshCw, Hand, Flashlight, Camera, MoonStar, Check, ChevronLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useMobile';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { MosqueIcon, TasbihIcon } from '@/components/icons/PrayerIcons';

/* ─── ADIM VERİLERİ — tüm metinler i18n key'i (home.json → widget_guide) ─── */
const LOCK_STEPS = [
    { t: 'l1t', d: 'l1d' },
    { t: 'l2t', d: 'l2d', chip: 'chip_customize' },
    { t: 'l3t', d: 'l3d' },
    { t: 'l4t', d: 'l4d' },
    { t: 'l5t', d: 'l5d', chip: 'chip_done' },
];

const HOME_STEPS = [
    { t: 'h1t', d: 'h1d' },
    { t: 'h2t', d: 'h2d', chip: '+' }, // "+" evrensel, çeviri gerektirmez
    { t: 'h3t', d: 'h3d' },
    { t: 'h4t', d: 'h4d' },
    { t: 'h5t', d: 'h5d', chip: 'chip_add' },
];

const ANDROID_STEPS = [
    { t: 'a1t', d: 'a1d' },
    { t: 'a2t', d: 'a2d', chip: 'chip_widgets' },
    { t: 'a3t', d: 'a3d' },
    { t: 'a4t', d: 'a4d' },
    { t: 'a5t', d: 'a5d' },
];

const WIDGETS = [
    { Icon: MosqueIcon, nameKey: 'w_prayer', sizes: ['size_small', 'size_medium', 'size_lock'] },
    { Icon: BookOpen, nameKey: 'w_verse', sizes: ['size_small', 'size_medium', 'size_lock'] },
    { Icon: TasbihIcon, nameKey: 'w_dhikr', sizes: ['size_small', 'size_medium'] },
    { Icon: Sparkles, nameKey: 'w_esma', sizes: ['size_small', 'size_medium'] },
];

/* ─── Marka logoları — Apple ısırık logosu & Android robot kafası ─── */
const AppleLogo = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 384 512" fill="currentColor" className={className} aria-hidden="true">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.7-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
);

const AndroidLogo = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M4.5 15a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <line x1="4.5" y1="15" x2="19.5" y2="15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <line x1="7.3" y1="5.2" x2="8.8" y2="7.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <line x1="16.7" y1="5.2" x2="15.2" y2="7.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="9.2" cy="11.8" r="1.1" fill="currentColor" />
        <circle cx="14.8" cy="11.8" r="1.1" fill="currentColor" />
    </svg>
);

/* ─── "Uzun bas" dokunma işareti — nabız atan altın halka ─── */
function TapPulse({ className }) {
    return (
        <div className={cn('absolute pointer-events-none', className)}>
            <span className="absolute inset-0 rounded-full bg-islamic-gold/40 animate-ping" style={{ animationDuration: '1.8s' }} />
            <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-islamic-gold/25 ring-2 ring-islamic-gold/80">
                <Hand size={15} className="text-white drop-shadow" />
            </span>
        </div>
    );
}

/* ─── Mini telefon çerçevesi — iOS: Dynamic Island, Android: delikli kamera ─── */
function PhoneFrame({ children, platform = 'ios' }) {
    return (
        <div className="relative w-44 h-[330px] mx-auto rounded-[2.6rem] bg-[#02140c] p-2 shadow-xl shadow-stone-300/60 dark:shadow-black/40 ring-1 ring-stone-300 dark:ring-white/15">
            <div className="relative w-full h-full rounded-[2.1rem] overflow-hidden bg-gradient-to-b from-[#0b3d26] via-[#06301c] to-[#021a0f]">
                {platform === 'ios'
                    ? <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black/80 z-10" />
                    : <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-black/80 ring-1 ring-white/10 z-10" />
                }
                {children}
                {/* Cam yansıması */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none z-20" />
            </div>
        </div>
    );
}

/* ─── Kilit ekranı önizlemesi ─── */
function LockPreview({ t }) {
    return (
        <PhoneFrame>
            <div className="flex flex-col items-center pt-9">
                <p className="text-[42px] font-extralight text-white leading-none tracking-tight">09:41</p>

                {/* Saatin altındaki widget satırı — bizimki altın çerçeveyle vurgulu */}
                <div className="flex items-center gap-1.5 mt-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 ring-2 ring-islamic-gold shadow-[0_0_14px_rgba(212,175,55,0.35)]">
                        <MosqueIcon size={15} className="text-islamic-gold" />
                        <div className="text-left">
                            <p className="text-[8px] font-semibold text-white/70 leading-none">{t('widget_guide.mock_prayer')}</p>
                            <p className="text-[11px] font-bold text-white leading-tight">16:32</p>
                        </div>
                    </div>
                    {/* Boş widget yuvası */}
                    <div className="w-9 h-9 rounded-xl bg-white/[0.07] border border-dashed border-white/25 flex items-center justify-center">
                        <span className="text-white/40 text-sm font-light">+</span>
                    </div>
                </div>

                <TapPulse className="top-[190px] left-1/2 -translate-x-1/2" />
            </div>

            {/* Fener & kamera */}
            <div className="absolute bottom-3 inset-x-5 flex justify-between">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><Flashlight size={12} className="text-white/60" /></div>
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><Camera size={12} className="text-white/60" /></div>
            </div>
        </PhoneFrame>
    );
}

/* ─── Ana ekran önizlemesi (iOS + Android) ─── */
function HomePreview({ t, platform = 'ios' }) {
    return (
        <PhoneFrame platform={platform}>
            <div className="px-3 pt-9">
                {/* Bizim orta boy widget */}
                <div className="rounded-2xl p-2.5 bg-gradient-to-br from-[#0b5c35] to-[#032e18] ring-2 ring-islamic-gold shadow-[0_0_14px_rgba(212,175,55,0.3)]">
                    <div className="flex items-center gap-1.5">
                        <MosqueIcon size={14} className="text-islamic-gold" />
                        <p className="text-[9px] font-bold text-white/90 truncate">{t('widget_guide.w_prayer')}</p>
                    </div>
                    <div className="flex items-end justify-between mt-1.5">
                        <div>
                            <p className="text-base font-extrabold text-white leading-none">16:32</p>
                            <p className="text-[8px] font-medium text-white/60 mt-0.5">{t('widget_guide.mock_prayer')}</p>
                        </div>
                        <MoonStar size={14} className="text-islamic-gold/80 mb-0.5" />
                    </div>
                </div>

                {/* Uygulama ikonları — biri bizim uygulama */}
                <div className="relative grid grid-cols-4 gap-2 mt-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        i === 1
                            ? <div key={i} className="h-8 rounded-lg bg-gradient-to-b from-[#0b5c35] to-[#032e18] ring-1 ring-islamic-gold/60 flex items-center justify-center"><MoonStar size={12} className="text-islamic-gold" /></div>
                            : <div key={i} className="h-8 rounded-lg bg-white/10" />
                    ))}
                    <TapPulse className="-bottom-14 left-1/2 -translate-x-1/2" />
                </div>
            </div>

            {/* Dock */}
            <div className="absolute bottom-2 inset-x-2 h-11 rounded-[1.3rem] bg-white/10 flex items-center justify-around px-2">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-7 h-7 rounded-lg bg-white/15" />)}
            </div>
        </PhoneFrame>
    );
}

/* ─── ANA SAYFA ─── */
export default function WidgetGuide() {
    const navigate = useNavigate();
    const { t } = useTranslation('home');
    const { selection } = useHaptics();
    const { isPremium } = useUser();
    // Android cihazda Android rehberi, diğer her yerde iPhone açılır
    const [platform, setPlatform] = useState(() => Capacitor.getPlatform() === 'android' ? 'android' : 'ios');
    const [activeTab, setActiveTab] = useState('lock'); // sayfanın asıl konusu kilit ekranı
    const isIos = platform === 'ios';

    const switchPlatform = (p) => {
        if (p === platform) return;
        selection();
        setPlatform(p);
    };

    const switchTab = (tab) => {
        if (tab === activeTab) return;
        selection();
        setActiveTab(tab);
    };

    const steps = !isIos ? ANDROID_STEPS : (activeTab === 'lock' ? LOCK_STEPS : HOME_STEPS);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#021a0f] text-gray-900 dark:text-white pb-28">
            <div className="p-5 space-y-5 max-w-md mx-auto">
                {/* Üst satır: açıklama + iPhone/Android seçici (aktif olan etiketiyle genişler) */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { selection(); navigate(-1); }}
                        aria-label={t('widget_guide.back', 'Geri')}
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex items-center justify-center text-islamic-green dark:text-islamic-gold hover:bg-stone-50 dark:hover:bg-white/10 transition-colors active:scale-95"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <p className="flex-1 min-w-0 text-sm text-stone-500 dark:text-gray-400 leading-relaxed px-1">
                        {t('widget_guide.subtitle')}
                    </p>
                    <div className="flex-shrink-0 flex items-center gap-1 p-1 rounded-full bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10 shadow-sm dark:shadow-none">
                        {[
                            { key: 'ios', Icon: AppleLogo, label: 'iPhone' },
                            { key: 'android', Icon: AndroidLogo, label: 'Android' },
                        ].map(({ key, Icon, label }) => (
                            <button
                                key={key}
                                onClick={() => switchPlatform(key)}
                                aria-label={label}
                                className={cn(
                                    'flex items-center justify-center gap-1.5 h-9 rounded-full transition-all active:scale-95',
                                    platform === key
                                        ? 'px-3.5 bg-islamic-green text-white dark:bg-islamic-gold dark:text-[#021a0f] shadow-md'
                                        : 'w-9 text-stone-400 dark:text-gray-500'
                                )}
                            >
                                <Icon size={15} />
                                {platform === key && <span className="text-xs font-bold whitespace-nowrap">{label}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Premium banner — altın, parıltılı (sadece free kullanıcıda) */}
                {!isPremium && (
                    <div
                        onClick={() => { selection(); navigate('/premium'); }}
                        className="relative overflow-hidden flex items-center gap-3.5 rounded-[1.5rem] p-4 cursor-pointer border border-[#b08d1e]/50 ring-1 ring-inset ring-white/40 shadow-[0_10px_28px_-8px_rgba(212,175,55,0.55)] active:scale-[0.98] transition-transform"
                        style={{ background: 'linear-gradient(150deg, #FFE066 0%, #F5C842 45%, #D4AF37 100%)' }}
                    >
                        {/* Parıltı süpürmesi */}
                        <div className="wg2-shimmer absolute inset-0 pointer-events-none" />

                        {/* Zümrüt taç mührü */}
                        <div className="relative flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-b from-[#0a5433] to-[#032e18] ring-1 ring-inset ring-white/20 flex items-center justify-center shadow-[0_5px_14px_rgba(3,46,24,0.35)]">
                            <Crown size={18} className="text-islamic-gold fill-current" />
                            <span className="absolute inset-0 rounded-full ring-2 ring-[#064e3b]/30 animate-ping" style={{ animationDuration: '2.4s' }} />
                        </div>

                        <div className="relative flex-1 min-w-0">
                            <p className="text-sm font-extrabold text-[#053a22] leading-tight">{t('widget_guide.premium_title')}</p>
                            <p className="text-xs font-medium text-[#064e3b]/80 mt-0.5 leading-snug">{t('widget_guide.premium_desc')}</p>
                        </div>

                        <span className="relative flex-shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-b from-[#0a5433] to-[#032e18] text-islamic-gold text-xs font-extrabold shadow-[0_4px_12px_rgba(3,46,24,0.4)]">
                            {t('widget_guide.premium_cta')}
                        </span>
                    </div>
                )}

                {/* Rehber kartı — sekme + önizleme + adımlar tek gövdede */}
                <div className="rounded-[2rem] bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden">

                    {/* Kilit Ekranı / Ana Ekran — yalnızca iPhone'da (Android'de kilit widget'ı yok) */}
                    {isIos && (
                        <div className="flex gap-1 p-1 m-4 mb-0 rounded-xl bg-stone-100 dark:bg-white/[0.06]">
                            {[
                                { key: 'lock', icon: Lock, label: t('widget_guide.tab_lock') },
                                { key: 'home', icon: Smartphone, label: t('widget_guide.tab_home') },
                            ].map(({ key, icon: Icon, label }) => (
                                <button
                                    key={key}
                                    onClick={() => switchTab(key)}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-bold transition-all active:scale-[0.98]',
                                        activeTab === key
                                            ? 'bg-white dark:bg-islamic-gold text-islamic-green dark:text-[#021a0f] shadow-sm'
                                            : 'text-stone-500 dark:text-gray-400'
                                    )}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Telefon önizlemesi — "ne elde edeceğim?" bir bakışta */}
                    <div key={`preview-${platform}-${activeTab}`} className="wg2-fade p-6 pb-5">
                        {isIos && activeTab === 'lock'
                            ? <LockPreview t={t} />
                            : <HomePreview t={t} platform={platform} />
                        }
                        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 dark:text-gray-400 mt-4 text-center">
                            <Sparkles size={12} className="text-islamic-gold" />
                            {isIos && activeTab === 'lock' ? t('widget_guide.preview_lock') : t('widget_guide.preview_home')}
                        </p>
                    </div>

                    <div className="mx-5 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />

                    {/* Adımlar — hepsi tek bakışta, dikey zaman çizelgesi */}
                    <div key={`steps-${platform}-${activeTab}`} className="wg2-fade p-5 pt-4">
                        <h3 className="text-base font-bold font-serif text-islamic-green dark:text-islamic-gold px-1">
                            {isIos && activeTab === 'lock' ? t('widget_guide.how_lock') : t('widget_guide.how_home')}
                        </h3>
                        <p className="text-[11px] font-medium text-stone-400 dark:text-gray-500 px-1 mt-0.5 mb-5">
                            {t('widget_guide.steps_meta')}
                        </p>

                        {steps.map((s, i) => {
                            const isLast = i === steps.length - 1;
                            return (
                                <div key={s.t} className="flex gap-3.5">
                                    {/* Numara rozeti + bağlantı çizgisi — son adım altın onay */}
                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shadow-sm',
                                            isLast
                                                ? 'bg-gradient-to-b from-[#F2D678] to-[#C9A227] text-[#022c22]'
                                                : 'bg-islamic-green text-white dark:bg-islamic-gold dark:text-[#021a0f]'
                                        )}>
                                            {isLast ? <Check size={16} strokeWidth={3} /> : i + 1}
                                        </div>
                                        {!isLast && <div className="w-px flex-1 my-1.5 bg-stone-200 dark:bg-white/10" />}
                                    </div>

                                    <div className={cn('min-w-0 pt-1', !isLast && 'pb-5')}>
                                        <p className="text-sm font-bold text-stone-900 dark:text-white leading-snug">{t(`widget_guide.${s.t}`)}</p>
                                        <p className="text-xs text-stone-500 dark:text-gray-400 mt-1 leading-relaxed">{t(`widget_guide.${s.d}`)}</p>
                                        {s.chip && (
                                            <span className="inline-flex mt-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-white/10 border border-stone-300/70 dark:border-white/20 border-b-2 text-[11px] font-bold text-stone-700 dark:text-white">
                                                {s.chip === '+' ? '+' : t(`widget_guide.${s.chip}`)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Widget vitrini */}
                <div>
                    <h3 className="text-[10px] font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest px-2 mb-3">
                        {t('widget_guide.available_widgets')}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {WIDGETS.map(({ Icon, nameKey, sizes }) => (
                            <div key={nameKey} className="rounded-2xl p-4 bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col items-center text-center gap-2">
                                <div className="w-11 h-11 rounded-xl bg-islamic-green/10 text-islamic-green dark:bg-islamic-gold/10 dark:text-islamic-gold flex items-center justify-center">
                                    <Icon size={22} />
                                </div>
                                <p className="text-xs font-bold text-stone-900 dark:text-white">{t(`widget_guide.${nameKey}`)}</p>
                                <div className="flex flex-wrap justify-center gap-1">
                                    {sizes.filter(sz => isIos || sz !== 'size_lock').map(sz => (
                                        <span key={sz} className={cn(
                                            'px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide',
                                            sz === 'size_lock'
                                                ? 'bg-islamic-gold/15 text-[#a8861f] dark:text-islamic-gold'
                                                : 'bg-stone-100 text-stone-500 dark:bg-white/10 dark:text-gray-400'
                                        )}>
                                            {t(`widget_guide.${sz}`)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bilmekte fayda var */}
                <div className="rounded-[2rem] p-5 bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10 shadow-sm dark:shadow-none space-y-4">
                    <h3 className="text-base font-bold font-serif text-islamic-green dark:text-islamic-gold px-1">
                        {t('widget_guide.gtk_title')}
                    </h3>

                    {[
                        { Icon: RefreshCw, text: t('widget_guide.tip_desc') },
                        { Icon: Smartphone, text: isIos ? t('widget_guide.ios_note_desc') : t('widget_guide.android_note') },
                        { Icon: Crown, text: isPremium ? t('widget_guide.premium_note') : t('widget_guide.free_note'), gold: true },
                    ].map(({ Icon, text, gold }, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={cn(
                                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                                gold
                                    ? 'bg-islamic-gold/10 text-islamic-gold'
                                    : 'bg-islamic-green/10 text-islamic-green dark:bg-white/10 dark:text-emerald-300'
                            )}>
                                <Icon size={15} />
                            </div>
                            <p className="text-xs text-stone-600 dark:text-gray-300 leading-relaxed pt-1.5">{text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sekme geçiş animasyonu */}
            <style>{`
                @keyframes wg2fade {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .wg2-fade { animation: wg2fade 0.25s ease-out both; }
                @keyframes wg2shimmer {
                    0% { background-position: 250% 0; }
                    100% { background-position: -150% 0; }
                }
                .wg2-shimmer {
                    background: linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.45) 50%, transparent 58%);
                    background-size: 250% 100%;
                    animation: wg2shimmer 2.8s linear infinite;
                }
            `}</style>
        </div>
    );
}
