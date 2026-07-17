import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Reusable Settings Header with back navigation
 */
export function SettingsHeader({ title, onBack }) {
    const navigate = useNavigate();

    return (
        <div className="bg-[#FFFDF6] dark:bg-[#044d29]/40 backdrop-blur-md sticky top-0 z-40 p-4 flex items-center gap-4 border-b dark:border-white/5">
            <Button
                variant="ghost"
                size="icon"
                onClick={onBack || (() => navigate(-1))}
                className="rounded-full dark:text-white"
            >
                <ArrowLeft size={24} />
            </Button>
            <h1 className="text-xl font-serif font-bold text-islamic-green dark:text-islamic-gold">{title}</h1>
        </div>
    );
}

/**
 * Toggle switch for boolean settings
 */
export function SettingsToggle({ icon: Icon, label, subtitle, active, onToggle, disabled = false }) {
    return (
        <button
            onClick={onToggle}
            disabled={disabled}
            className={cn(
                "w-full flex items-center justify-between p-5 hover:bg-[#F0E8D5] dark:hover:bg-white/5 transition-colors border-b last:border-0 dark:border-white/5",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-3 rounded-2xl transition-colors",
                    active
                        ? "bg-islamic-green/10 text-islamic-green dark:bg-islamic-gold/20 dark:text-islamic-gold"
                        : "bg-[#F0E8D5] text-gray-400 dark:bg-white/5 dark:text-gray-500"
                )}>
                    <Icon size={20} />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{subtitle}</p>
                </div>
            </div>
            <div className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors relative",
                active ? "bg-islamic-green dark:bg-islamic-gold" : "bg-gray-200 dark:bg-white/10"
            )}>
                <div className={cn(
                    "w-4 h-4 bg-[#FFFDF6] rounded-full shadow-sm transition-transform",
                    active ? "translate-x-6" : "translate-x-0"
                )} />
            </div>
        </button>
    );
}

/**
 * Navigation link for drill-down pattern
 */
export function SettingsLink({ icon: Icon, label, subtitle, onClick, badge }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-5 hover:bg-[#F0E8D5] dark:hover:bg-white/5 transition-colors border-b last:border-0 dark:border-white/5 group"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F6F0E1] dark:bg-white/5 rounded-2xl text-gray-400 dark:text-gray-500 group-hover:scale-110 transition-transform">
                    <Icon size={20} />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
                    {subtitle && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{subtitle}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {badge && (
                    <span className="px-2 py-0.5 bg-islamic-green/10 dark:bg-islamic-gold/10 text-islamic-green dark:text-islamic-gold text-[10px] font-bold rounded-full">
                        {badge}
                    </span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-200 dark:text-gray-700 group-hover:translate-x-1 transition-transform" />
            </div>
        </button>
    );
}

/**
 * Section header for grouping settings
 */
export function SettingsSection({ title, children }) {
    return (
        <section className="space-y-3">
            <h3 className="px-2 text-[10px] font-bold text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest">
                {title}
            </h3>
            <div className="bg-[#FFFDF6] dark:bg-white/5 rounded-[2rem] shadow-sm border dark:border-white/5 overflow-hidden">
                {children}
            </div>
        </section>
    );
}

/**
 * Container for settings page layout
 */
export function SettingsContainer({ children }) {
    return (
        <div className="min-h-screen bg-[#F6F0E1] dark:bg-[#032e18] pb-24 animate-in slide-in-from-right duration-300">
            {children}
        </div>
    );
}
