import { Capacitor } from '@capacitor/core';
import React, { useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Target, User, Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useUser } from '@/context/UserContext';
import { useTranslation } from 'react-i18next';
import AvatarIcon from '@/components/AvatarIcon';
import DebugMenu from '@/components/DebugMenu';

export default function AppLayout() {
    const { selection } = useHaptics();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const mainContentRef = useRef(null);
    const { userData } = useUser();
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

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo(0, 0);
        }
    }, [pathname]);

    return (
        <div className="min-h-screen bg-[#FAFAF5] dark:bg-[#032e18] font-sans selection:bg-islamic-gold/30">
            {/* Mobile-First Container */}
            <div className={cn(
                "max-w-md mx-auto min-h-screen flex flex-col shadow-2xl relative parchment-texture",
                pathname === '/qibla' ? "bg-[#010a05]" : "bg-[#FBF9F4] dark:bg-[#032e18]"
            )}>

                {/* Top Bar (Dynamic Greeting) */}
                {pathname !== '/qibla' && (
                    <header className={cn(
                        "px-6 pb-2 flex justify-between items-center bg-[#FBF9F4]/80 dark:bg-[#032e18]/80 backdrop-blur-md sticky top-0 z-40 border-b border-amber-100/50 dark:border-white/5",
                        isIOS ? "pt-[env(safe-area-inset-top,2rem)]" : "header-safe-padding"
                    )}>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-emerald-100/40 uppercase mb-0.5">
                                İslami Yoldaş
                            </span>
                            <h1 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold animate-in fade-in slide-in-from-left duration-700">
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour >= 5 && hour < 11) return t('greeting.morning');
                                    if (hour >= 11 && hour < 17) return t('greeting.afternoon');
                                    if (hour >= 17 && hour < 22) return t('greeting.evening');
                                    return t('greeting.night');
                                })()}
                            </h1>
                        </div>
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
                    </header>
                )}

                {/* Main Content Area */}
                <main
                    ref={mainContentRef}
                    className="flex-1 pb-40 pb-safe overflow-y-auto scroll-smooth"
                >
                    <Outlet />
                </main>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#FBF9F4]/90 dark:bg-[#032e18]/90 backdrop-blur-xl border-t border-amber-100/50 dark:border-white/5 flex justify-around items-center px-4 py-2 pb-safe z-50 shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1)]">
                    <NavLinkItem to="/" icon={Home} label={tNav('nav.home')} onClick={selection} />
                    <NavLinkItem to="/learn" icon={BookOpen} label={tNav('nav.learn')} onClick={selection} />
                    <NavLinkItem to="/stories" icon={Heart} label={tNav('nav.stories')} onClick={selection} />
                    <NavLinkItem to="/tracking" icon={Target} label={tNav('nav.worship')} onClick={selection} />
                    <NavLinkItem to="/profile" icon={User} label={tNav('nav.profile')} onClick={selection} />
                </nav>

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
                    "flex flex-col items-center justify-center px-3 py-2.5 rounded-2xl transition-all duration-300 min-w-[64px] min-h-[48px] active:scale-90",
                    isActive
                        ? "text-islamic-green dark:text-islamic-gold bg-islamic-green/5 dark:bg-islamic-gold/10 font-bold"
                        : "text-gray-400 dark:text-gray-600 hover:text-islamic-green/70"
                )
            }
        >
            <Icon className={cn("w-6 h-6 mb-1 transition-transform", "group-active:scale-110")} />
            <span className="text-[10px] tracking-tight">{label}</span>
        </NavLink>
    );
}
