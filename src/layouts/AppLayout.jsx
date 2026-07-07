import { Capacitor } from '@capacitor/core';
import React, { useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Heart, Star, Brain, Sparkles, Crown, Flame } from 'lucide-react';
import { MosqueIcon } from '@/components/icons/PrayerIcons';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useUser } from '@/context/UserContext';
import { useTranslation } from 'react-i18next';
import AvatarIcon from '@/components/AvatarIcon';
import DebugMenu from '@/components/DebugMenu';
import { useSmartPaywall } from '@/hooks/useSmartPaywall';
import { useDiscountOffer, OFFER_DURATION_SECONDS } from '@/hooks/useDiscountOffer';

/* Premium button shimmer animation */
const premiumBtnStyle = `
/* Işık süzülmesi: ~1,4sn zarif geçiş, sonra ~2,6sn bekle → 4sn'de bir, göz almayan */
@keyframes hdr-offer-sweep {
  0% { transform: translateX(-100%); }
  35% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
@keyframes hdr-offer-glow {
  0%, 100% { box-shadow: 0 0 6px rgba(255,215,0,0.14), inset 0 0 5px rgba(255,215,0,0.03); }
  50% { box-shadow: 0 0 12px rgba(255,215,0,0.3), inset 0 0 7px rgba(255,215,0,0.07); }
}
@keyframes hdr-offer-glow-red {
  0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.35), inset 0 0 6px rgba(239,68,68,0.08); }
  50% { box-shadow: 0 0 20px rgba(239,68,68,0.75), inset 0 0 10px rgba(239,68,68,0.15); }
}
@keyframes hdr-flame-flicker {
  0%, 100% { transform: scale(1) rotate(-4deg); }
  30% { transform: scale(1.15) rotate(3deg); }
  60% { transform: scale(0.95) rotate(-2deg); }
  80% { transform: scale(1.1) rotate(4deg); }
}
@keyframes hdr-digit-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
`;

export default function AppLayout() {
    const { selection } = useHaptics();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { isActive: isOfferActive, formattedTime, timeLeft } = useDiscountOffer();
    const offerFraction = Math.max(0, Math.min(1, timeLeft / OFFER_DURATION_SECONDS));
    // Son 60 sn (00:00 dahil): alarm modu. 00:00'da kırmızı kalmalı, yoksa bir an sarıya dönüp bug gibi görünüyor.
    const isOfferCritical = isOfferActive && timeLeft <= 60;
    const mainContentRef = useRef(null);
    const { userData, isPremium: hasPremium } = useUser();
    const { t } = useTranslation('home'); // Use home namespace for greetings
    const { t: tNav } = useTranslation('common'); // Use common for nav items
    const isIOS = Capacitor.getPlatform() === 'ios';

    // Real-time avatar sync using ID
    const [headerAvatarId, setHeaderAvatarId] = React.useState(localStorage.getItem('userAvatar') || 'male');

    // 🔧 TEST: premium kullanıcının da paywall giriş butonunu görebilmesi için debug bayrağı.
    // Varsayılan kapalı; Profile'dan açılır. YAYIN ÖNCESİ KALDIRILACAK.
    const [debugShowPaywall, setDebugShowPaywall] = React.useState(() => localStorage.getItem('debug_show_paywall') === 'true');
    React.useEffect(() => {
        const h = () => setDebugShowPaywall(localStorage.getItem('debug_show_paywall') === 'true');
        window.addEventListener('debugPaywallChanged', h);
        window.addEventListener('storage', h);
        return () => { window.removeEventListener('debugPaywallChanged', h); window.removeEventListener('storage', h); };
    }, []);

    React.useEffect(() => {
        const updateHeaderAvatar = () => {
            const savedId = localStorage.getItem('userAvatar');
            if (savedId) {
                setHeaderAvatarId(savedId);
            }
        };

        // Initial check
        updateHeaderAvatar();

        window.addEventListener('avatarChanged', updateHeaderAvatar);
        return () => window.removeEventListener('avatarChanged', updateHeaderAvatar);
    }, []);

    // Smart Paywall: agresif ama kontrollü paywall gösterimi
    const { checkNavigation } = useSmartPaywall(hasPremium);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo(0, 0);
        }
        // Smart Paywall: her 3. navigasyonda paywall'a yönlendir
        if (checkNavigation(pathname)) {
            navigate('/premium', { replace: true });
        }
    }, [pathname]);

    // Layout tamamen unmount olduğunda (örn. paywall'a gidildiğinde) reklamı kesin kaldır
    useEffect(() => {
        return () => {
            import('@/services/adService').then(({ hideBannerAd }) => hideBannerAd()).catch(() => {});
        };
    }, []);

    // --- Banner Ad Global Controller ---
    const bannerVersionRef = useRef(0);
    
    useEffect(() => {
        const version = ++bannerVersionRef.current;
        
        // Reklamın gösterileceği sayfalar
        const allowedPaths = ['/', '/stories', '/dhikr', '/uyku', '/qibla', '/dua', '/tracking'];
        const shouldShow = !hasPremium && allowedPaths.includes(pathname);
        
        import('@/services/adService').then(async ({ showBannerAd, hideBannerAd }) => {
            // Eğer bu effect'ten sonra yeni bir effect çalıştıysa, bu eski çağrıyı iptal et
            if (version !== bannerVersionRef.current) return;
            
            if (shouldShow) {
                await showBannerAd();
            } else {
                hideBannerAd();
            }
        }).catch(() => {});

        return () => {
            // Sadece bu sayfa banner göstermemesi gerekiyorsa gizle
            if (!shouldShow) {
                import('@/services/adService').then(({ hideBannerAd }) => hideBannerAd()).catch(() => {});
            }
        };
    }, [hasPremium, pathname]);

    return (
        <div className="h-full bg-[#FAFAF5] dark:bg-[#032e18] font-sans selection:bg-islamic-gold/30">
            {/* Mobile-First Container (Simplified for Global Wrapper) */}
            <div className={cn(
                "h-full flex flex-col relative parchment-texture",
                pathname === '/qibla' ? "bg-[#010a05]" : "bg-[#FBF9F4] dark:bg-[#032e18]"
            )}>

                {/* Premium button shimmer CSS */}
                <style>{premiumBtnStyle}</style>

                {/* Top Bar (Dynamic Greeting) */}
                {pathname !== '/qibla' && pathname !== '/ai-mentor' && (
                    <header className={cn(
                        "px-6 pb-2 flex justify-between items-center bg-[#FBF9F4]/80 dark:bg-[#032e18]/80 backdrop-blur-md sticky top-0 z-40 border-b border-amber-100/50 dark:border-white/5",
                        isIOS ? "pt-[env(safe-area-inset-top,2rem)]" : "header-safe-padding"
                    )}>
                        <div className="flex flex-col min-w-0 mr-2">
                            <span className="text-[11px] font-semibold tracking-[0.14em] text-stone-500/90 dark:text-emerald-100/60 uppercase mb-0.5 truncate animate-in fade-in slide-in-from-left duration-700">
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour >= 5 && hour < 12) return t('greeting.morning');
                                    if (hour >= 12 && hour < 17) return t('greeting.afternoon');
                                    if (hour >= 17 && hour < 22) return t('greeting.evening');
                                    return t('greeting.night');
                                })()}
                            </span>
                            <h1 className="font-display text-[24px] font-semibold tracking-tight leading-tight text-islamic-green dark:text-islamic-gold">
                                {t('header.appName')}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Premium CTA Button — non-premium users (veya test için debug bayrağı açıkken premium'a da) */}
                            {(!hasPremium || debugShowPaywall) && (
                                <button
                                    onClick={() => {
                                        selection();
                                        navigate(isOfferActive ? '/premium?offer=true' : '/premium');
                                    }}
                                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all active:scale-95 border overflow-hidden ${
                                        isOfferActive
                                            ? (isOfferCritical ? 'border-red-500/60' : 'border-[#FFD700]/50')
                                            : 'border-[#D4AF37]/40'
                                    }`}
                                    style={{
                                        background: isOfferActive
                                            ? 'linear-gradient(135deg, rgba(255,215,0,0.16) 0%, rgba(4,26,16,0.55) 100%)'
                                            : 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
                                        animation: isOfferActive
                                            ? (isOfferCritical ? 'hdr-offer-glow-red 1s ease-in-out infinite' : 'hdr-offer-glow 5s ease-in-out infinite')
                                            : 'none',
                                    }}
                                >
                                    {/* Shimmer sweep overlay — tek geçiş + bekleme (transform, 4sn'de bir, göz almayan) */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage: isOfferActive
                                                ? 'linear-gradient(105deg, transparent 38%, rgba(255,215,0,0.16) 47%, rgba(255,255,255,0.32) 50%, rgba(255,215,0,0.16) 53%, transparent 62%)'
                                                : 'linear-gradient(105deg, transparent 38%, rgba(212,175,55,0.14) 47%, rgba(255,215,0,0.32) 50%, rgba(212,175,55,0.14) 53%, transparent 62%)',
                                            animation: 'hdr-offer-sweep 4s ease-out infinite',
                                            willChange: 'transform',
                                            transform: 'translateZ(0)',
                                        }}
                                    />
                                    {isOfferActive ? (
                                        <>
                                            <div className="flex items-center gap-1.5 relative z-10 py-0.5">
                                                {/* Titreyen alev — aciliyetin kalbi */}
                                                <Flame
                                                    size={16}
                                                    className={`flex-shrink-0 ${isOfferCritical ? 'text-red-400' : 'text-[#FFD700]'}`}
                                                    fill="currentColor"
                                                    fillOpacity={0.35}
                                                    style={{
                                                        animation: 'hdr-flame-flicker 1.1s ease-in-out infinite',
                                                        filter: isOfferCritical
                                                            ? 'drop-shadow(0 0 5px rgba(239,68,68,0.8))'
                                                            : 'drop-shadow(0 0 5px rgba(255,215,0,0.6))',
                                                    }}
                                                />
                                                <div className="flex flex-col items-start leading-none">
                                                    <span className={`text-[8px] font-extrabold tracking-[0.14em] uppercase mb-[3px] whitespace-nowrap ${
                                                        isOfferCritical ? 'text-red-400/90' : 'text-[#FFD700]/80'
                                                    }`}>
                                                        {tNav('premium.last_offer')}
                                                    </span>
                                                    <span
                                                        className={`text-[14px] font-black tracking-wider tabular-nums leading-none ${
                                                            isOfferCritical ? 'text-red-400' : 'text-[#FFD700]'
                                                        }`}
                                                        style={{
                                                            fontVariantNumeric: 'tabular-nums',
                                                            textShadow: isOfferCritical ? '0 0 8px rgba(239,68,68,0.6)' : '0 0 8px rgba(255,215,0,0.5)',
                                                            animation: isOfferCritical ? 'hdr-digit-blink 1s ease-in-out infinite' : 'none',
                                                        }}
                                                    >
                                                        {formattedTime}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Yanan fitil — kalan süre alt kenarda gerçek zamanlı erir */}
                                            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/40">
                                                <div
                                                    className="h-full origin-left rounded-r-full"
                                                    style={{
                                                        background: isOfferCritical
                                                            ? 'linear-gradient(90deg, #7f1d1d, #ef4444)'
                                                            : 'linear-gradient(90deg, #8a6d1f, #D4AF37, #FFD700)',
                                                        boxShadow: isOfferCritical ? '0 0 6px rgba(239,68,68,0.8)' : '0 0 6px rgba(255,215,0,0.6)',
                                                        transform: `scaleX(${offerFraction})`,
                                                        transition: 'transform 1s linear',
                                                    }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Crown size={14} className="text-[#D4AF37] relative z-10" fill="#D4AF37" fillOpacity={0.3} />
                                            <span className="text-[11px] font-black tracking-wider text-[#D4AF37] uppercase relative z-10"
                                                  style={{ textShadow: '0 0 8px rgba(212,175,55,0.3)' }}>
                                                Premium
                                            </span>
                                        </>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    selection();
                                    navigate('/ai-mentor');
                                }}
                                className="relative p-2.5 rounded-2xl transition-all active:scale-95 group border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 dark:from-indigo-400/10 dark:to-purple-400/10 hover:from-indigo-500/20 hover:to-purple-600/20"
                            >
                                <div className="absolute -top-1 -right-1 bg-indigo-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-white dark:border-[#032e18]">
                                    AI
                                </div>
                                <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl animate-pulse" />
                                <Brain size={24} className="text-indigo-600 dark:text-indigo-300 drop-shadow-sm" />
                            </button>

                            <button
                                onClick={() => {
                                    selection();
                                    navigate('/profile');
                                }}
                                className="p-2.5 bg-islamic-green/5 dark:bg-white/5 hover:bg-islamic-green/10 dark:hover:bg-white/10 rounded-2xl transition-all active:scale-95 group border border-transparent hover:border-islamic-green/20"
                            >
                                <div className="text-2xl flex items-center justify-center">
                                    <AvatarIcon id={headerAvatarId} size={28} className="text-islamic-green dark:text-islamic-gold" />
                                </div>
                            </button>
                        </div>
                    </header>
                )}

                <main
                    id="main-scroll-container"
                    ref={mainContentRef}
                    className="flex-1 pb-40 pb-safe overflow-y-auto scroll-smooth scrollbar-hide overscroll-none"
                >
                    <Outlet />
                </main>

                {/* Bottom Navigation */}
                {pathname !== '/ai-mentor' && (
                    <nav className="absolute bottom-0 left-0 right-0 w-full bg-[#FBF9F4]/90 dark:bg-[#032e18]/90 backdrop-blur-xl border-t border-amber-100/50 dark:border-white/5 z-50 shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1)]">
                        <div className="flex justify-around items-center px-4 py-2 pb-safe max-w-2xl mx-auto">
                            <NavLinkItem to="/" icon={CustomHome} label={tNav('nav.home')} onClick={selection} />
                            <NavLinkItem to="/learn" icon={CustomBookOpen} label={tNav('nav.learn')} onClick={selection} />
                            <NavLinkItem to="/stories" icon={Heart} label={tNav('nav.stories')} onClick={selection} />
                            <NavLinkItem to="/tracking" icon={MosqueIcon} label={tNav('nav.worship')} onClick={selection} />
                            <NavLinkItem to="/profile" icon={Settings} label={tNav('nav.profile')} onClick={selection} />
                        </div>
                    </nav>
                )}

                {/* Debug Menu (Developer Tools) */}
                <DebugMenu />
            </div>
        </div>
    );
}

function NavLinkItem({ to, icon: Icon, label, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                cn(
                    "flex flex-col items-center justify-center px-3 py-2.5 rounded-2xl transition-all duration-300 min-w-[64px] min-h-[48px] active:scale-90 group",
                    isActive
                        ? "text-islamic-green dark:text-islamic-gold bg-islamic-green/5 dark:bg-islamic-gold/10 font-bold"
                        : "text-gray-400 dark:text-white/40 hover:text-islamic-green/70"
                )
            }
        >
            <Icon className={cn("w-6 h-6 mb-1 transition-transform", "group-active:scale-110")} />
            <span className="text-[10px] tracking-tight">{label}</span>
        </NavLink>
    );
}

function CustomBookOpen(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M12 7a4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 0 3 3v-14a4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3" />
        </svg>
    );
}

function CustomHome(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H15v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8H5a2 2 0 0 1-2-2z" />
        </svg>
    );
}
