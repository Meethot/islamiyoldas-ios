import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, ChevronLeft, Sparkles, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const INITIAL_DUAS = [
    { id: 1, text: "Annem çok hasta, şifa bekliyoruz. Dualarınızda ona da yer ayırır mısınız?", count: 128 },
    { id: 2, text: "Üzerimde çok büyük bir borç yükü var, hayırlı bir kapı açılması için dua bekliyorum.", count: 84 },
    { id: 3, text: "Yarın çok kritik bir sınavım var, zihin açıklığı için dua eder misiniz?", count: 215 },
    { id: 4, text: "Ruhum çok daralıyor, iç huzur ve inşirah için dualarınıza talibim.", count: 156 },
    { id: 5, text: "Evladım hayırlı bir yola girsin, kötü alışkanlıklardan kurtulsun diye dua bekliyorum.", count: 312 },
    { id: 6, text: "Yalnızlık ve kimsesizlik hissinden kurtulmak için kalpten bir dua istiyorum.", count: 97 }
];

export default function DuaKosesi() {
    const navigate = useNavigate();
    const [duas, setDuas] = useState(() => {
        const saved = localStorage.getItem('duaKosesiCount');
        if (saved) {
            const parsed = JSON.parse(saved);
            return INITIAL_DUAS.map(d => ({ ...d, count: parsed[d.id] || d.count, amined: parsed[`amin_${d.id}`] || false }));
        }
        return INITIAL_DUAS.map(d => ({ ...d, amined: false }));
    });

    const aminSound = React.useMemo(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'), []);

    const handleAmin = (id) => {
        const updated = duas.map(d => {
            if (d.id === id && !d.amined) {
                // Sound & Haptic
                if ("vibrate" in navigator) navigator.vibrate(50);
                aminSound.currentTime = 0;
                aminSound.play().catch(() => { });

                return { ...d, count: d.count + 1, amined: true };
            }
            return d;
        });
        setDuas(updated);

        // Persist
        const persistData = {};
        updated.forEach(d => {
            persistData[d.id] = d.count;
            persistData[`amin_${d.id}`] = d.amined;
        });
        localStorage.setItem('duaKosesiCount', JSON.stringify(persistData));
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
            <div className="bg-white dark:bg-white/5 border border-islamic-gold/20 p-6 rounded-[2.5rem] text-center shadow-lg">
                <p className="text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-4">Sen de dua kardeşliğine katılmak ister misin?</p>
                <Button className="w-full h-14 bg-transparent border-2 border-dashed border-islamic-gold text-islamic-gold rounded-2xl hover:bg-islamic-gold/5 font-bold gap-2">
                    <Send size={18} />
                    Dua İsteği Gönder
                </Button>
            </div>
        </div>
    );
}
