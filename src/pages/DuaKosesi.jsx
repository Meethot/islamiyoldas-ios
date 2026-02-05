import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, ChevronLeft, Sparkles, Send, X, Clock, Check, AlertCircle, Trash2, History, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ========== SIMULATION CONFIG ==========
// Set to true to test: 1 minute = 1 hour (fast simulation)
// Set to false for production: real time delays
const IS_TEST_MODE = true;

// Time constants
const ONE_HOUR_MS = IS_TEST_MODE ? 60 * 1000 : 60 * 60 * 1000; // 1 min or 1 hour
const APPROVAL_DELAY_MS = 3 * ONE_HOUR_MS; // 3 hours (or 3 mins in test mode)
const THREE_DAYS_MS = 3 * 24 * ONE_HOUR_MS; // Duration for likes to continue

const LIKES_PER_DAY_MIN = 30;
const LIKES_PER_DAY_MAX = 50;
// ========================================

const INITIAL_DUAS = [
    { id: 1, text: "Annem çok hasta, şifa bekliyoruz. Dualarınızda ona da yer ayırır mısınız?", count: 128 },
    { id: 2, text: "Üzerimde çok büyük bir borç yükü var, hayırlı bir kapı açılması için dua bekliyorum.", count: 84 },
    { id: 3, text: "Yarın çok kritik bir sınavım var, zihin açıklığı için dua eder misiniz?", count: 215 },
    { id: 4, text: "Ruhum çok daralıyor, iç huzur ve inşirah için dualarınıza talibim.", count: 156 },
    { id: 5, text: "Evladım hayırlı bir yola girsin, kötü alışkanlıklardan kurtulsun diye dua bekliyorum.", count: 312 },
    { id: 6, text: "Yalnızlık ve kimsesizlik hissinden kurtulmak için kalpten bir dua istiyorum.", count: 97 }
];

// ========== SIMULATION ENGINE ==========
function runSimulationEngine(requests) {
    if (!requests || requests.length === 0) return requests;

    const now = Date.now();
    let hasChanges = false;

    const updated = requests.map(request => {
        const requestDate = new Date(request.date).getTime();
        const timeSinceCreation = now - requestDate;
        let updatedRequest = { ...request };

        // Rule 1: Auto-approve after 3 hours
        if (request.status === 'pending' && timeSinceCreation >= APPROVAL_DELAY_MS) {
            updatedRequest.status = 'approved';
            updatedRequest.approvedAt = now;
            updatedRequest.aminCount = updatedRequest.aminCount || 0;
            hasChanges = true;
        }

        // Rule 2: Add fake amin counts for approved prayers
        if (updatedRequest.status === 'approved') {
            const approvedAt = updatedRequest.approvedAt || requestDate + APPROVAL_DELAY_MS;
            const timeSinceApproval = now - approvedAt;

            // Only add likes for 3 days after approval
            if (timeSinceApproval < THREE_DAYS_MS && timeSinceApproval >= 0) {
                // Calculate expected likes based on time passed
                const hoursPassed = timeSinceApproval / ONE_HOUR_MS;
                const avgLikesPerHour = ((LIKES_PER_DAY_MIN + LIKES_PER_DAY_MAX) / 2) / 24;

                // Add some randomness using a seeded approach based on request id
                const seed = request.id % 100;
                const randomMultiplier = 0.8 + (seed / 100) * 0.4; // 0.8 to 1.2

                const expectedLikes = Math.floor(hoursPassed * avgLikesPerHour * randomMultiplier);
                const currentAmin = updatedRequest.aminCount || 0;

                // Only increase, never decrease
                if (expectedLikes > currentAmin) {
                    updatedRequest.aminCount = expectedLikes;
                    hasChanges = true;
                }
            }
        }

        return updatedRequest;
    });

    return { updated, hasChanges };
}
// ========================================

export default function DuaKosesi() {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDeleteToast, setShowDeleteToast] = useState(false);

    // Load duas from localStorage
    const [duas, setDuas] = useState(() => {
        const saved = localStorage.getItem('duaKosesiCount');
        if (saved) {
            const parsed = JSON.parse(saved);
            return INITIAL_DUAS.map(d => ({ ...d, count: parsed[d.id] || d.count, amined: parsed[`amin_${d.id}`] || false }));
        }
        return INITIAL_DUAS.map(d => ({ ...d, amined: false }));
    });

    // Load my requests from localStorage
    const [myRequests, setMyRequests] = useState(() => {
        const saved = localStorage.getItem('myDuaRequests');
        return saved ? JSON.parse(saved) : [];
    });

    const aminSound = React.useMemo(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'), []);

    const handleAmin = (id) => {
        const updated = duas.map(d => {
            if (d.id === id && !d.amined) {
                if ("vibrate" in navigator) navigator.vibrate(50);
                aminSound.currentTime = 0;
                aminSound.play().catch(() => { });
                return { ...d, count: d.count + 1, amined: true };
            }
            return d;
        });
        setDuas(updated);

        const persistData = {};
        updated.forEach(d => {
            persistData[d.id] = d.count;
            persistData[`amin_${d.id}`] = d.amined;
        });
        localStorage.setItem('duaKosesiCount', JSON.stringify(persistData));
    };

    const handleSubmitRequest = (text) => {
        const newRequest = {
            id: Date.now(),
            text: text,
            status: 'pending', // 'pending' | 'approved' | 'rejected'
            date: new Date().toISOString(),
            aminCount: 0,
            approvedAt: null
        };

        const updated = [newRequest, ...myRequests];
        setMyRequests(updated);
        localStorage.setItem('myDuaRequests', JSON.stringify(updated));

        setShowForm(false);
        setShowSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
    };

    // Run simulation engine on mount and periodically
    useEffect(() => {
        const runSimulation = () => {
            const result = runSimulationEngine(myRequests);
            if (result.hasChanges) {
                setMyRequests(result.updated);
                localStorage.setItem('myDuaRequests', JSON.stringify(result.updated));
            }
        };

        // Run immediately on mount
        runSimulation();

        // Run every minute in test mode, every hour in production
        const interval = IS_TEST_MODE ? 10 * 1000 : 60 * 60 * 1000; // 10 sec or 1 hour
        const timer = setInterval(runSimulation, interval);

        return () => clearInterval(timer);
    }, [myRequests.length]); // Re-run when requests count changes

    const handleDeleteRequest = (id) => {
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
                <div>
                    <h1 className="text-3xl font-serif font-bold text-islamic-green dark:text-islamic-gold">Dua Köşesi</h1>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Birbirimize gıyaben dua edelim.</p>
                </div>
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
                            <p className="font-bold">Duanız Gönderildi!</p>
                            <p className="text-sm text-emerald-100">Onaylandıktan sonra yayınlanacak.</p>
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
                        <p className="font-medium">Dua isteği silindi</p>
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
                <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Gelen Dua İstekleri</h3>
                {duas.map((dua) => (
                    <Card key={dua.id} className="rounded-[2.5rem] border-none shadow-sm dark:bg-white/5 overflow-hidden group">
                        <CardContent className="p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-[1.25rem] bg-islamic-green/10 dark:bg-islamic-gold/10 flex items-center justify-center text-islamic-green dark:text-islamic-gold">
                                    <Heart size={24} className={cn(dua.amined && "fill-current animate-pulse")} />
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
                                    <span className="text-xs font-bold">{dua.count} Kişi Amin Dedi</span>
                                </div>
                                <Button
                                    onClick={() => handleAmin(dua.id)}
                                    disabled={dua.amined}
                                    className={cn(
                                        "rounded-full px-8 h-12 font-bold transition-all active:scale-95 shadow-lg",
                                        dua.amined
                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            : "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] hover:opacity-90"
                                    )}
                                >
                                    {dua.amined ? "Âmin" : "Âmin De"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
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

    const handleSubmit = () => {
        if (text.trim().length < 10) return;

        setIsSubmitting(true);
        // Simulate a small delay for better UX
        setTimeout(() => {
            onSubmit(text.trim());
            setIsSubmitting(false);
        }, 500);
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
