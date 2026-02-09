import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, ChevronLeft, Sparkles, Send, X, Clock, Check, AlertCircle, Trash2, History, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { addPrayer, getApprovedPrayers, incrementAmin } from '@/services/prayerService';

// ========== WEB AUDIO API - INSTANT SOUND ==========
// Uses AudioContext for true zero-latency, overlapping sound playback
const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
let audioContext = null;
let audioBuffer = null;

// Initialize Web Audio API and preload sound
async function initAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch(SOUND_URL);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
        console.log('[Audio] Web Audio API init failed:', e);
    }
}
initAudio();

// Play sound instantly - unlimited overlapping sounds
function playClickSound() {
    if (!audioContext || !audioBuffer) {
        initAudio();
        return;
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}
// ====================================================

// ========== HAPTICS HELPER ==========
async function triggerHaptics() {
    try {
        if (Capacitor.isNativePlatform()) {
            // Use Capacitor Haptics for native platforms (iOS + Android)
            await Haptics.impact({ style: ImpactStyle.Medium });
        } else if ('vibrate' in navigator) {
            // Fallback for web browsers that support vibration
            navigator.vibrate(50);
        }
    } catch (error) {
        console.log('[Haptics] Not available:', error);
    }
}
// ====================================

// ========== SIMULATION DATA ==========
const INITIAL_DUAS = [
    { id: 1, text: "Annem çok hasta, şifa bekliyoruz. Dualarınızda ona da yer ayırır mısınız?", count: 128 },
    { id: 2, text: "Üzerimde çok büyük bir borç yükü var, hayırlı bir kapı açılması için dua bekliyorum.", count: 84 },
    { id: 3, text: "Yarın çok kritik bir sınavım var, zihin açıklığı için dua eder misiniz?", count: 215 },
    { id: 4, text: "Ruhum çok daralıyor, iç huzur ve inşirah için dualarınıza talibim.", count: 156 },
    { id: 5, text: "Evladım hayırlı bir yola girsin, kötü alışkanlıklardan kurtulsun diye dua bekliyorum.", count: 312 },
    { id: 6, text: "Yalnızlık ve kimsesizlik hissinden kurtulmak için kalpten bir dua istiyorum.", count: 97 }
];
// ======================================

export default function DuaKosesi() {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDeleteToast, setShowDeleteToast] = useState(false);

    // Live Data from Firestore
    const [realDuas, setRealDuas] = useState([]);

    // Fake Data (Simulated)
    const [fakeDuas, setFakeDuas] = useState(() => {
        const saved = localStorage.getItem('fakeDuasCounts');
        if (saved) {
            const parsed = JSON.parse(saved);
            return INITIAL_DUAS.map(d => ({
                ...d,
                count: parsed[d.id] || d.count
            }));
        }
        return INITIAL_DUAS;
    });

    // Validate Real vs Fake existence
    const allDuas = [...realDuas, ...fakeDuas];

    // My Requests (Local History)
    const [myRequests, setMyRequests] = useState(() => {
        const saved = localStorage.getItem('myDuaRequests');
        return saved ? JSON.parse(saved) : [];
    });

    // Local tracking of "amined" prayers to prevent double clicks (per session/device)
    const [aminedPrayers, setAminedPrayers] = useState(() => {
        const saved = localStorage.getItem('aminedPrayers');
        return saved ? JSON.parse(saved) : {};
    });

    // Subscribe to real-time approved prayers
    useEffect(() => {
        const unsubscribe = getApprovedPrayers((data) => {
            setRealDuas(data);
        });
        return () => unsubscribe();
    }, []);

    const handleAmin = async (id) => {
        if (aminedPrayers[id]) return;

        // Optimistically update UI
        triggerHaptics();
        playClickSound();

        // Mark as amined locally
        const newAmined = { ...aminedPrayers, [id]: true };
        setAminedPrayers(newAmined);
        localStorage.setItem('aminedPrayers', JSON.stringify(newAmined));

        // If it's a real prayer (ID is string from Firebase), call service
        if (typeof id === 'string') {
            await incrementAmin(id);
        } else {
            // It's a fake prayer (ID is number), update local state only
            const updatedFakes = fakeDuas.map(d => {
                if (d.id === id) {
                    return { ...d, count: d.count + 1 };
                }
                return d;
            });
            setFakeDuas(updatedFakes);

            // Persist fake counts
            const persistData = {};
            updatedFakes.forEach(d => {
                persistData[d.id] = d.count;
            });
            localStorage.setItem('fakeDuasCounts', JSON.stringify(persistData));
        }
    };

    const handleSubmitRequest = async (text) => {
        try {
            const id = await addPrayer(text);

            // Add to local history
            const newRequest = {
                id: id,
                text: text,
                status: 'pending', // Initially pending
                date: new Date().toISOString(),
                aminCount: 0
            };

            const updated = [newRequest, ...myRequests];
            setMyRequests(updated);
            localStorage.setItem('myDuaRequests', JSON.stringify(updated));

            setShowForm(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch (error) {
            console.error("Failed to submit prayer:", error);
            alert("Dua gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
        }
    };

    const handleDeleteRequest = (id) => {
        // Only deletes from local history, not from DB for now
        const updated = myRequests.filter(r => r.id !== id);
        setMyRequests(updated);
        localStorage.setItem('myDuaRequests', JSON.stringify(updated));

        setShowDeleteToast(true);
        setTimeout(() => setShowDeleteToast(false), 2500);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        <Clock size={12} />
                        Onay Bekliyor
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        <Check size={12} />
                        Yayında
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        <AlertCircle size={12} />
                        Reddedildi
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#032e18] p-5 space-y-8 pb-24 animate-in fade-in duration-700">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-islamic-green dark:text-islamic-gold">
                    <ChevronLeft size={24} />
                </Button>
            </header>

            {/* Success Toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-4 right-4 z-50 bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
                    >
                        <div className="p-2 bg-white/20 rounded-full">
                            <Check size={20} />
                        </div>
                        <div>
                            <p className="font-bold">Duanız Alındı!</p>
                            <p className="text-sm text-emerald-100">Editör onayından sonra yayınlanacaktır.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Toast */}
            <AnimatePresence>
                {showDeleteToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-4 right-4 z-50 bg-gray-800 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
                    >
                        <div className="p-2 bg-white/20 rounded-full">
                            <Trash2 size={18} />
                        </div>
                        <p className="font-medium">Dua isteği geçmişten silindi</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Featured Quote */}
            <div className="bg-emerald-900 shadow-xl rounded-[2.5rem] p-8 relative overflow-hidden text-center group">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-islamic-gold/10 to-transparent" />
                <Sparkles className="mx-auto text-islamic-gold mb-4 opacity-50 group-hover:scale-110 transition-transform duration-700" size={32} />
                <p className="font-serif italic text-emerald-50 text-xl leading-relaxed relative z-10">
                    "Müminin mümin kardeşi için gıyabında yaptığı dua makbuldür."
                </p>
                <p className="text-islamic-gold/60 text-xs mt-4 font-bold uppercase tracking-widest relative z-10">- Hadis-i Şerif</p>
            </div>

            {/* Prayer Feed */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Gelen Dua İstekleri</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">CANLI</span>
                    </div>
                </div>

                {allDuas.length === 0 ? (
                    <div className="text-center py-10 opacity-60">
                        <p className="text-sm text-gray-400">Şu an yayında dua yok. İlk duayı sen iste!</p>
                    </div>
                ) : (
                    allDuas.map((dua) => {
                        const isAmined = !!aminedPrayers[dua.id];
                        return (
                            <Card key={dua.id} className="rounded-[2.5rem] border-none shadow-sm dark:bg-white/5 overflow-hidden group">
                                <CardContent className="p-8">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-[1.25rem] bg-islamic-green/10 dark:bg-islamic-gold/10 flex items-center justify-center text-islamic-green dark:text-islamic-gold">
                                            <Heart size={24} className={cn(isAmined && "fill-current animate-pulse text-red-500 dark:text-red-500")} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest mb-2">Bir Kardeşin Diyor ki:</p>
                                            <p className="text-gray-900 dark:text-white font-serif text-lg leading-relaxed italic">
                                                "{dua.text}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                            <MessageCircle size={16} />
                                            <span className="text-xs font-bold">{dua.aminCount || dua.count || 0} Kişi Amin Dedi</span>
                                        </div>
                                        <Button
                                            onClick={() => handleAmin(dua.id)}
                                            disabled={isAmined}
                                            className={cn(
                                                "rounded-full px-8 h-12 font-bold transition-all active:scale-95 shadow-lg",
                                                isAmined
                                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                    : "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] hover:opacity-90"
                                            )}
                                        >
                                            {isAmined ? "Âmin Dedin" : "Âmin De"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Add Own Dua - Floating Action Style */}
            <div className="bg-white dark:bg-white/5 border border-islamic-gold/20 p-6 rounded-[2.5rem] text-center shadow-lg space-y-3">
                <p className="text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-4">Sen de dua kardeşliğine katılmak ister misin?</p>
                <Button
                    onClick={() => setShowForm(true)}
                    className="w-full h-14 bg-transparent border-2 border-dashed border-islamic-gold text-islamic-gold rounded-2xl hover:bg-islamic-gold/5 font-bold gap-2"
                >
                    <Send size={18} />
                    Dua İsteği Gönder
                </Button>
                {myRequests.length > 0 && (
                    <Button
                        onClick={() => setShowHistory(true)}
                        variant="ghost"
                        className="w-full h-12 text-gray-500 dark:text-gray-400 rounded-2xl font-medium gap-2 hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        <History size={18} />
                        Dua İsteklerim ({myRequests.length})
                    </Button>
                )}
            </div>

            {/* Prayer Request Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <DuaIstegiFormu
                        onSubmit={handleSubmitRequest}
                        onCancel={() => setShowForm(false)}
                    />
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {showHistory && (
                    <DuaIstekleriGecmisi
                        requests={myRequests}
                        onDelete={handleDeleteRequest}
                        onClose={() => setShowHistory(false)}
                        getStatusBadge={getStatusBadge}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Prayer Request Form Component
function DuaIstegiFormu({ onSubmit, onCancel }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (text.trim().length < 10) return;

        setIsSubmitting(true);
        await onSubmit(text.trim());
        // Parent handles closing and state reset
        setIsSubmitting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col"
            onClick={onCancel}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.2 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) onCancel();
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-auto h-[85vh] bg-[#fdfaf5] dark:bg-[#032e18] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-4" />
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">Dua İsteği</h2>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Kardeşlerinden dua iste</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full bg-gray-100 dark:bg-white/10">
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    {/* Spiritual Message */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                        <p className="text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed">
                            💚 Dua istekleri, gizlilik ve edep çerçevesinde paylaşılır. İsim ve kişisel bilgi paylaşmayınız.
                        </p>
                    </div>

                    {/* Text Area */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            Dua İsteğiniz
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Duanızı buraya yazın... (örn: Sağlık, huzur, bereket için dua istiyorum)"
                            rows={6}
                            maxLength={500}
                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-islamic-green dark:focus:ring-islamic-gold focus:border-transparent transition-all resize-none font-serif text-lg leading-relaxed"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                            <span>En az 10 karakter gerekli</span>
                            <span>{text.length}/500</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-4 border-t dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl space-y-3">
                    <Button
                        onClick={handleSubmit}
                        disabled={text.trim().length < 10 || isSubmitting}
                        className="w-full h-14 bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] rounded-2xl font-bold text-lg gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Gönder
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onCancel}
                        variant="ghost"
                        className="w-full h-12 text-gray-500 dark:text-gray-400 rounded-2xl font-bold"
                    >
                        Vazgeç
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// History Modal Component
function DuaIstekleriGecmisi({ requests, onDelete, onClose, getStatusBadge }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.2 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) onClose();
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md h-[85vh] bg-[#fdfaf5] dark:bg-[#032e18] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-4" />
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">Dua İsteklerim</h2>
                            <p className="text-sm text-gray-400 dark:text-gray-500">{requests.length} istek</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-gray-100 dark:bg-white/10">
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {requests.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <History className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Henüz bir dua isteğiniz yok</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">İlk dua isteğinizi gönderin!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <Card key={request.id} className="rounded-[2rem] border-none shadow-sm dark:bg-white/5 overflow-hidden">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            {getStatusBadge(request.status)}
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                {new Date(request.date).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 font-serif italic leading-relaxed mb-4">
                                            "{request.text}"
                                        </p>
                                        <div className="flex items-center justify-between">
                                            {/* Amin Count - Only show for approved */}
                                            {request.status === 'approved' && request.aminCount > 0 ? (
                                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                    <Users size={14} />
                                                    <span className="text-xs font-bold">{request.aminCount} Amin</span>
                                                </div>
                                            ) : (
                                                <div /> // Empty spacer
                                            )}
                                            <Button
                                                onClick={() => onDelete(request.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 gap-2 h-9 px-4 rounded-xl"
                                            >
                                                <Trash2 size={14} />
                                                Sil
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl">
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="w-full h-12 text-gray-500 dark:text-gray-400 rounded-2xl font-bold"
                    >
                        Kapat
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
