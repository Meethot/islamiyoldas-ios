import { Capacitor } from '@capacitor/core';
import React, { useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Heart, Star, Brain, Sparkles, Crown } from 'lucide-react';
import { MosqueIcon } from '@/components/icons/PrayerIcons';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useUser } from '@/context/UserContext';
import { useTranslation } from 'react-i18next';
import AvatarIcon from '@/components/AvatarIcon';
import DebugMenu from '@/components/DebugMenu';
import { useSmartPaywall } from '@/hooks/useSmartPaywall';

/* Premium button shimmer animation */
const premiumBtnStyle = `
@keyframes premium-btn-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
`;

export default function AppLayout() {
    const { selection } = useHaptics();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const mainContentRef = useRef(null);
    const { userData, isPremium: hasPremium } = useUser();
    const { t } = useTranslation('home'); // Use home namespace for greetings
    const { t: tNav } = useTranslation('common'); // Use common for nav items
    const isIOS = Capacitor.getPlatform() === 'ios';

    // Real-time avatar sync using ID
    const [headerAvatarId, setHeaderAvatarId] = React.useState(localStorage.getItem('userAvatar') || 'male');

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
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-emerald-100/40 uppercase mb-0.5">
                                {t('header.appName')}
                            </span>
                            <h1 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold animate-in fade-in slide-in-from-left duration-700">
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour >= 5 && hour < 12) return t('greeting.morning');
                                    if (hour >= 12 && hour < 17) return t('greeting.afternoon');
                                    if (hour >= 17 && hour < 22) return t('greeting.evening');
                                    return t('greeting.night');
                                })()}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Premium CTA Button — only for non-premium users */}
                            {!hasPremium && (
                                <button
                                    onClick={() => {
                                        selection();
                                        navigate('/premium');
                                    }}
                                    className="relative flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all active:scale-95 border border-[#D4AF37]/40 overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
                                    }}
                                >
                                    {/* Shimmer sweep overlay */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage: 'linear-gradient(105deg, transparent 35%, rgba(212,175,55,0.2) 45%, rgba(255,215,0,0.35) 50%, rgba(212,175,55,0.2) 55%, transparent 65%)',
                                            backgroundSize: '200% 100%',
                                            animation: 'premium-btn-shimmer 3s ease-in-out infinite',
                                        }}
                                    />
                                    <Crown size={14} className="text-[#D4AF37] relative z-10" fill="#D4AF37" fillOpacity={0.3} />
                                    <span className="text-[11px] font-black tracking-wider text-[#D4AF37] uppercase relative z-10"
                                          style={{ textShadow: '0 0 8px rgba(212,175,55,0.3)' }}>
                                        Premium
                                    </span>
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
