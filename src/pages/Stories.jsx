import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, Clock, ChevronRight, X, Headphones, Volume2, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

import { STORIES } from '@/data/spiritualData';

const CATEGORIES = [
    { id: 'prophets', label: 'Peygamberler', icon: BookOpen },
    { id: 'companions', label: 'Sahabeler', icon: Heart },
    { id: 'moral', label: 'Kıssalar', icon: Sparkles },
];

export default function Stories() {
    const [activeCategory, setActiveCategory] = useState('prophets');
    const [selectedStory, setSelectedStory] = useState(null);

    return (
        <div className="space-y-4 p-5 pb-24 dark:bg-[#032e18]">
            <header className="mb-6 px-1">
                <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">Sesli Şifa</h2>
                <p className="text-sm text-gray-500 dark:text-emerald-100/40 italic">Maneviyatınızı dinlendirecek, ruhunuzu iyileştirecek hikayeler...</p>
            </header>

            {/* Category Selection */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all text-sm font-medium whitespace-nowrap shadow-sm",
                            activeCategory === cat.id
                                ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] border-islamic-green scale-105"
                                : "bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5"
                        )}
                    >
                        <cat.icon size={16} className={activeCategory === cat.id ? "text-islamic-gold dark:text-[#032e18]" : "text-islamic-green dark:text-islamic-gold"} />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Story Grid */}
            <div className="grid gap-5">
                {(STORIES[activeCategory] || []).map((story) => (
                    <Card
                        key={story.id}
                        className="group overflow-hidden border-none shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] rounded-[2rem] bg-white dark:bg-white/5 cursor-pointer hover:shadow-xl transition-all duration-300"
                        onClick={() => setSelectedStory(story)}
                    >
                        <div className="flex">
                            <div className="flex-1 p-6 pr-2">
                                <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white group-hover:text-islamic-green dark:group-hover:text-islamic-gold transition-colors mb-2">
                                    {story.title}
                                </h3>
                                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed italic mb-4">
                                    {story.content.substring(0, 80)}...
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-300">
                                        <Clock className="w-3 h-3" /> {story.duration}
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-islamic-green dark:text-islamic-gold">
                                        <BookOpen className="w-3 h-3" /> Oku
                                    </div>
                                </div>
                            </div>
                            <div className="w-20 bg-islamic-green/5 dark:bg-islamic-gold/10 flex items-center justify-center group-hover:bg-islamic-gold/10 dark:group-hover:bg-islamic-gold/20 transition-colors">
                                <Button
                                    className="w-12 h-12 rounded-full bg-islamic-green dark:bg-islamic-gold hover:opacity-90 text-white dark:text-[#032e18] shadow-lg transition-transform group-hover:scale-110"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStory(story);
                                    }}
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Deep Reading/Listening View */}
            {selectedStory && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
                    <div className="p-4 flex items-center justify-between border-b bg-cream-bg/40">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedStory(null)} className="rounded-full">
                            <X className="w-6 h-6 text-islamic-green" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Suan Dinleniyor</span>
                        </div>
                        <div className="w-10"></div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-8">
                        {/* Audio Player Card */}
                        <div className="bg-gradient-to-br from-islamic-green to-[#033a1f] rounded-[2.5rem] p-8 mb-10 shadow-2xl relative overflow-hidden">
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md">
                                    <Headphones className="w-10 h-10 text-islamic-gold" />
                                </div>
                                <h1 className="text-2xl font-serif font-bold text-white mb-2 text-center">{selectedStory.title}</h1>
                                <p className="text-emerald-100/60 text-xs mb-8">Seslendiren: Ruhani Yol</p>

                                {/* Progress Bar */}
                                <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                                    <div className="w-1/3 h-full bg-islamic-gold rounded-full" />
                                </div>

                                <div className="flex items-center gap-8">
                                    <Button variant="ghost" className="text-white opacity-40 hover:opacity-100"><Play className="rotate-180" /></Button>
                                    <Button className="w-16 h-16 rounded-full bg-islamic-gold hover:scale-105 transition-transform text-islamic-green shadow-xl">
                                        <Play className="w-8 h-8 fill-current" />
                                    </Button>
                                    <Button variant="ghost" className="text-white opacity-40 hover:opacity-100"><Play /></Button>
                                </div>
                            </div>
                            {/* Decoration */}
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Volume2 size={120} />
                            </div>
                        </div>

                        {/* Article Text */}
                        <div className="space-y-6">
                            <div className="h-px bg-gray-100 w-full" />
                            <article className="prose prose-sm max-w-none text-gray-800 leading-relaxed text-xl font-serif px-2">
                                <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-islamic-green first-letter:mr-3 first-letter:float-left">
                                    {selectedStory.content}
                                </p>
                            </article>
                        </div>

                        <div className="h-24" />
                    </div>
                </div>
            )}
        </div>
    );
}
