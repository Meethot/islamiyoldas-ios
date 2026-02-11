import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getSpiritualAdvice } from '@/services/AiMentorService';
import AiPrescriptionCard from '@/components/AiPrescriptionCard';
import { triggerReviewPrompt } from '@/components/ReviewPrompt';


export default function AiMentor() {
    const navigate = useNavigate();
    const chatEndRef = useRef(null);
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            text: 'Selamün aleyküm güzel kardeşim. Ben senin Manevi Asistanınım. Kalbinde ne var, seni daraltan veya şükrettiren nedir? Bana anlat, sana Kuran ve Sünnet ışığında bir reçete hazırlayayım.',
            isPrescription: false
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Call AI Service
            const adviceData = await getSpiritualAdvice(userMsg.text);

            const aiMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                text: null, // Text is inside component for prescription
                data: adviceData,
                isPrescription: true
            };
            setMessages(prev => {
                const next = [...prev, aiMsg];
                // 2. AI yanıtından 2sn sonra popup
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
                text: `Hata oluştu: ${error.message || 'Bağlantı hatası.'}`,
                isPrescription: false
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-[#021a0f] text-white overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z' fill='%23D4AF37' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                }}
            />

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
                        <h1 className="font-serif font-bold text-lg text-islamic-gold tracking-wide">Manevi Asistan</h1>
                    </div>
                    <p className="text-[10px] text-white/50 font-medium tracking-wider uppercase">Yapay Zeka Destekli Asistan</p>
                </div>

                {/* Bot Icon - absolute right */}
                <div className="absolute right-4 p-2 bg-islamic-gold/10 rounded-full">
                    <Bot size={20} className="text-islamic-gold" />
                </div>
            </div>

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
                            <span className="text-xs text-islamic-gold italic font-medium">Tefekkür ediliyor...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Input Area - Fixed Bottom */}
            <div className="p-4 bg-[#021a0f]/95 backdrop-blur-xl border-t border-white/5 pb-safe shrink-0 z-50 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)]">
                <div className="relative max-w-2xl mx-auto flex items-end gap-2 bg-black/20 border border-white/10 rounded-[24px] p-2 pl-4 focus-within:border-islamic-gold/50 transition-all focus-within:bg-black/40 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Derdim var, içim daralıyor..."
                        className="w-full bg-transparent text-white placeholder-white/30 resize-none outline-none py-3 max-h-32 min-h-[50px] text-[15px] leading-relaxed scrollbar-hide"
                        rows={1}
                        style={{ minHeight: '52px' }}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="rounded-full w-12 h-12 shrink-0 bg-gradient-to-br from-islamic-gold to-amber-500 hover:from-islamic-gold/90 hover:to-amber-500/90 text-[#032e18] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all active:scale-95"
                    >
                        {isLoading ? <Sparkles className="animate-spin w-5 h-5" /> : <Send className="ml-0.5 w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
