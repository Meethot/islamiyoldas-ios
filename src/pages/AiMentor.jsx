import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, ChevronLeft, Crown, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getSpiritualAdvice } from '@/services/AiMentorService';
import AiPrescriptionCard from '@/components/AiPrescriptionCard';
import { triggerReviewPrompt } from '@/components/ReviewPrompt';
import AiConsentModal, { hasAiConsent } from '@/components/AiConsentModal';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useMobile';
import { isPremium } from '@/services/creditService';
import { getAppDate } from '@/lib/testDate';
import { analytics } from '@/services/analyticsService';


const DAILY_LIMIT_FREE = 1;
const DAILY_LIMIT_PREMIUM = 30;

function getQuotaKey() {
    const d = getAppDate();
    return `ai_mentor_quota_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getUsedToday() {
    const key = getQuotaKey();
    return parseInt(localStorage.getItem(key) || '0', 10);
}

function incrementUsed() {
    const key = getQuotaKey();
    const current = getUsedToday();
    localStorage.setItem(key, (current + 1).toString());
}

export default function AiMentor() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('misc');
    const { light, heavy } = useHaptics();
    const chatEndRef = useRef(null);
    const [messages, setMessages] = useState(() => {
        const welcome = {
            id: 'welcome',
            role: 'assistant',
            text: t('aiMentor.welcomeMessage'),
            isPrescription: false
        };
        try {
            const saved = JSON.parse(localStorage.getItem('ai_mentor_history') || '[]');
            return saved.length > 0 ? [welcome, ...saved] : [welcome];
        } catch {
            return [welcome];
        }
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [usedCount, setUsedCount] = useState(getUsedToday());
    const [consentGranted, setConsentGranted] = useState(hasAiConsent());

    const premium = isPremium();
    const dailyLimit = premium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
    const remaining = Math.max(0, dailyLimit - usedCount);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        analytics.aiFeatureDiscovered('direct');
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Persist last 3 messages (excluding welcome)
    useEffect(() => {
        const toSave = messages.filter(m => m.id !== 'welcome').slice(-3);
        if (toSave.length > 0) {
            try { localStorage.setItem('ai_mentor_history', JSON.stringify(toSave)); }
            catch { /* quota exceeded */ }
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        // Check daily quota
        if (remaining <= 0) {
            heavy();
            if (!premium) {
                navigate('/premium');
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'assistant',
                    text: t('aiMentor.dailyLimitReached'),
                    isPrescription: false
                }]);
            }
            return;
        }

        light();

        const userMsg = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        analytics.aiQuestionAsked('spiritual');
        const requestStart = performance.now();

        try {
            // Call AI Service
            const adviceData = await getSpiritualAdvice(userMsg.text, i18n.language);

            const responseTime = Math.round(performance.now() - requestStart);
            analytics.aiResponseReceived('spiritual', premium, responseTime);

            // Increment usage on successful response
            incrementUsed();
            setUsedCount(prev => prev + 1);

            const aiMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                text: null,
                data: adviceData,
                isPrescription: true
            };
            setMessages(prev => {
                const next = [...prev, aiMsg];
                const aiCount = next.filter(m => m.role === 'assistant' && m.id !== 'welcome').length;
                if (aiCount >= 2) {
                    setTimeout(() => triggerReviewPrompt('ai_chat'), 2000);
                }
                return next;
            });
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                text: t('aiMentor.connectionError'),
                isPrescription: false
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-[#021a0f] text-white overflow-hidden">

            {/* Header */}
            <div className="pt-safe px-4 py-3 relative flex items-center justify-center bg-[#032e18]/90 backdrop-blur-xl z-20 border-b border-white/5 shrink-0 shadow-sm min-h-[60px]">
                {/* Back Button - absolute left */}
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute left-2 text-white/70 hover:text-white rounded-full hover:bg-white/5">
                    <ChevronLeft />
                </Button>

                {/* Centered Title */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-islamic-gold animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                        <h1 className="font-serif font-bold text-lg text-islamic-gold tracking-wide">{t('aiMentor.title')}</h1>
                    </div>
                    <p className="text-[10px] text-white/50 font-medium tracking-wider uppercase">{t('aiMentor.subtitle')}</p>
                </div>

                {/* Credit Badge - absolute right */}
                <div className="absolute right-3">
                    <motion.div
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${remaining > 0
                            ? premium
                                ? 'bg-islamic-gold/10 border-islamic-gold/20'
                                : 'bg-amber-500/10 border-amber-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                            }`}
                        animate={remaining === 0 ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: remaining === 0 ? Infinity : 0 }}
                    >
                        {premium ? (
                            <Crown size={12} className="text-islamic-gold" fill="currentColor" />
                        ) : (
                            <MessageCircle size={12} className={remaining > 0 ? "text-amber-400" : "text-red-400"} />
                        )}
                        <span className={`text-xs font-bold tabular-nums ${remaining > 0
                            ? premium ? 'text-islamic-gold' : 'text-amber-400'
                            : 'text-red-400'
                            }`}>
                            {remaining}
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Credit Info Banner - show for all users */}
            <motion.div
                className={`px-4 py-2 flex items-center justify-center gap-2 border-b ${premium
                    ? 'bg-islamic-gold/[0.04] border-islamic-gold/10'
                    : remaining > 0
                        ? 'bg-islamic-gold/[0.04] border-islamic-gold/10'
                        : 'bg-red-500/[0.06] border-red-500/10'
                    }`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
            >
                {premium ? (
                    <>
                        <Crown size={12} className="text-islamic-gold" fill="currentColor" />
                        <span className="text-[11px] text-islamic-gold/70 font-medium">
                            Premium
                        </span>
                        <span className="text-[10px] text-white/20 mx-0.5">·</span>
                        <span className="text-[11px] text-islamic-gold/60 font-medium">
                            {t('aiMentor.premiumQuota', { count: remaining })}
                        </span>
                    </>
                ) : remaining > 0 ? (
                    <>
                        <MessageCircle size={12} className="text-islamic-gold/60" />
                        <span className="text-[11px] text-islamic-gold/60 font-medium">
                            {t('aiMentor.freeQuota', { count: remaining })}
                        </span>
                        <span className="text-[10px] text-white/20 mx-1">|</span>
                        <button
                            onClick={() => navigate('/premium')}
                            className="text-[11px] text-islamic-gold font-semibold flex items-center gap-1 hover:underline"
                        >
                            <Crown size={10} fill="currentColor" />
                            {t('aiMentor.unlockMore')}
                        </button>
                    </>
                ) : (
                    <>
                        <Crown size={12} className="text-amber-400" fill="currentColor" />
                        <span className="text-[11px] text-amber-300/80 font-medium">
                            {t('aiMentor.limitReachedBanner')}
                        </span>
                        <button
                            onClick={() => navigate('/premium')}
                            className="text-[11px] text-islamic-gold font-bold ml-1 underline underline-offset-2"
                        >
                            Premium
                        </button>
                    </>
                )}
            </motion.div>

            {/* Chat Area - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-none p-4 space-y-6 scroll-smooth pb-0">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-islamic-gold to-amber-600'
                            }`}>
                            {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-[#032e18]" />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-emerald-600/30 to-emerald-900/30 border border-emerald-500/20 text-white rounded-tr-sm backdrop-blur-sm'
                            : 'bg-white/5 border border-white/10 text-gray-100 rounded-tl-sm w-full backdrop-blur-md'
                            }`}>
                            {msg.isPrescription ? (
                                <AiPrescriptionCard data={msg.data} />
                            ) : (
                                <p className="leading-relaxed text-[15px] whitespace-pre-wrap font-light tracking-wide">{msg.text}</p>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Loading State: Tefekkür Modu */}
                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-islamic-gold flex items-center justify-center shrink-0">
                            <Bot size={14} className="text-[#032e18]" />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 rounded-tl-sm flex items-center gap-3">
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                                        className="w-1.5 h-1.5 bg-islamic-gold rounded-full"
                                        style={{ backgroundColor: '#D4AF37' }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-islamic-gold italic font-medium">{t('aiMentor.thinking')}</span>
                        </div>
                    </motion.div>
                )}
                <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Input Area - Fixed Bottom */}
            <div className="p-4 bg-[#021a0f]/95 backdrop-blur-xl border-t border-white/5 pb-safe shrink-0 z-50 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)]">
                <div className={`relative max-w-2xl mx-auto flex items-end gap-2 border rounded-[24px] p-2 pl-4 transition-all ${remaining <= 0 && !premium
                    ? 'bg-red-500/5 border-red-500/15 opacity-60'
                    : 'bg-black/20 border-white/10 focus-within:border-islamic-gold/50 focus-within:bg-black/40 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    }`}>
                    <textarea
                        value={input}
                        maxLength={1000}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={remaining <= 0 && !premium ? t('aiMentor.limitReachedPlaceholder') : t('aiMentor.placeholder')}
                        disabled={remaining <= 0 && !premium}
                        className="w-full bg-transparent text-white placeholder-white/30 resize-none outline-none py-3 max-h-32 min-h-[50px] text-[15px] leading-relaxed scrollbar-hide disabled:cursor-not-allowed"
                        rows={1}
                        style={{ minHeight: '52px' }}
                    />
                    <Button
                        onClick={remaining <= 0 && !premium ? () => navigate('/premium') : handleSend}
                        disabled={remaining <= 0 && !premium ? false : (!input.trim() || isLoading)}
                        className={`rounded-full w-12 h-12 shrink-0 shadow-lg transition-all active:scale-95 ${remaining <= 0 && !premium
                            ? 'bg-gradient-to-br from-islamic-gold to-amber-500 text-[#032e18]'
                            : 'bg-gradient-to-br from-islamic-gold to-amber-500 hover:from-islamic-gold/90 hover:to-amber-500/90 text-[#032e18] disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                    >
                        {remaining <= 0 && !premium ? (
                            <Crown className="w-5 h-5" fill="currentColor" />
                        ) : isLoading ? (
                            <Sparkles className="animate-spin w-5 h-5" />
                        ) : (
                            <Send className="ml-0.5 w-5 h-5" />
                        )}
                    </Button>
                </div>
                {/* Character Counter */}
                <div className="flex justify-end pr-4 mt-1.5">
                    <span className={`text-[10px] font-medium transition-colors ${input.length >= 1000 ? 'text-red-500/90' : 'text-white/30'}`}>
                        {input.length}/1000
                    </span>
                </div>
            </div>

            {/* AI Consent Modal — shown before first use */}
            {!consentGranted && (
                <AiConsentModal
                    onAccept={() => setConsentGranted(true)}
                    onDecline={() => navigate(-1)}
                />
            )}
        </div>
    );
}
