import React, { useEffect, useState, useRef, useCallback, useId } from 'react';
import { motion } from 'framer-motion';
import { Cake, Volume2, Pause, Loader2, Share2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { getVerifiedVerse } from '@/services/VerseLookupService';
import { birthdayToVerseRef, arabicFontPx, translationFontPx } from '@/lib/birthdayVerse';
import BirthdayStoryCard from '@/components/BirthdayStoryCard';

// Fetch recitation audio (Mishary Alafasy) — same pattern as AiPrescriptionCard.
async function fetchVerseAudio(surah, verse) {
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/ar.alafasy`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data?.audio || null;
    } catch {
        return null;
    }
}

function storeLink() {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') return 'https://apps.apple.com/app/id6759666173';
    if (platform === 'android') return 'https://play.google.com/store/apps/details?id=com.islamiyoldas.app';
    return 'https://islamiyoldas.com';
}

export default function BirthdayVerseCard({ day, month }) {
    const { t, i18n } = useTranslation('misc');
    const lang = i18n.language;
    const ref = birthdayToVerseRef(day, month);
    const storyId = `birthday-story-${useId().replace(/[:]/g, '')}`;
    const [verseData, setVerseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const audioRef = useRef(null);

    const isAr = !!lang && lang.startsWith('ar');
    const monthLong = new Date(2000, month - 1, 1).toLocaleDateString(lang, { month: 'long' });
    const monthCaps = monthLong.toLocaleUpperCase(lang);
    const dateLabel = new Date(2000, month - 1, day).toLocaleDateString(lang, { day: 'numeric', month: 'long' });
    // Arabic script must not be letter-spaced (breaks joining) or uppercased (no-op).
    const appName = t('birthdayCard.appName');
    const wordmark = isAr ? appName : appName.toLocaleUpperCase(lang);

    const arabic = verseData?.arabic || '';
    const translation = verseData?.translation || '';
    const source = verseData?.source ? (isAr ? verseData.source : verseData.source.toLocaleUpperCase(lang)) : '';
    const arabicPx = arabicFontPx(arabic, 30);
    const transPx = translationFontPx(translation, 15);

    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!ref) { setLoading(false); return; }
            const [v, audio] = await Promise.all([
                getVerifiedVerse({ surah: ref.surah, verse: ref.verse }, lang),
                fetchVerseAudio(ref.surah, ref.verse)
            ]);
            if (!mounted) return;
            setVerseData(v);
            setAudioUrl(audio);
            setLoading(false);
        }
        load();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [day, month, lang]);

    useEffect(() => {
        return () => {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        };
    }, []);

    const toggleAudio = useCallback(() => {
        if (!audioUrl) return;
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }
        setAudioLoading(true);
        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.addEventListener('ended', () => setIsPlaying(false));
            audioRef.current.addEventListener('error', () => { setAudioLoading(false); setIsPlaying(false); });
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play()
            .then(() => { setIsPlaying(true); setAudioLoading(false); })
            .catch(() => setAudioLoading(false));
    }, [audioUrl, isPlaying]);

    const handleShare = useCallback(async () => {
        if (!verseData || sharing) return;
        setSharing(true);
        try {
            if (audioRef.current) audioRef.current.pause();
            // Ensure Arabic/serif webfonts are painted before html2canvas snapshots.
            if (document.fonts?.ready) await document.fonts.ready;
            const { shareStoryCard } = await import('@/lib/share');
            const caption = t('birthdayCard.shareText', {
                date: dateLabel,
                source: verseData.source,
                translation: verseData.translation,
                link: storeLink()
            });
            await shareStoryCard(storyId, caption, t('birthdayCard.heading', { date: dateLabel }));
        } catch { /* user cancel / capture error — silent */ }
        finally { setSharing(false); }
    }, [verseData, sharing, dateLabel, storyId, t]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm mx-auto"
            >
                {/* Chat card — same identity as the share image, sized to be readable */}
                <div className="relative overflow-hidden rounded-[26px] border border-islamic-gold/25 shadow-xl bg-gradient-to-b from-[#04140c] to-[#0a3f26]">
                    {/* Ambient gold glow */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-islamic-gold/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10 px-6 pt-7 pb-6 flex flex-col items-center text-center">
                        {/* Wordmark */}
                        <div className={`text-[10px] font-bold text-islamic-gold/70 ${isAr ? '' : 'tracking-[0.3em]'}`}>{wordmark}</div>

                        {/* Date medallion */}
                        <div className="mt-3 w-[86px] h-[86px] rounded-full border-2 border-islamic-gold/80 flex flex-col items-center justify-center bg-islamic-gold/[0.06]">
                            <Cake className="w-4 h-4 text-islamic-gold" strokeWidth={1.7} />
                            <span className="font-serif text-[26px] font-bold leading-none text-[#EBD9A3] mt-0.5">{day}</span>
                            <span className={`text-[9px] font-semibold text-stone-100/90 mt-0.5 ${isAr ? '' : 'tracking-[0.14em]'}`}>{monthCaps}</span>
                        </div>

                        {loading ? (
                            <div className="mt-6 w-full h-28 animate-pulse bg-white/5 rounded-2xl" />
                        ) : (
                            <>
                                {/* Verse framed by a light mihrab arch */}
                                <div className="relative mt-6 w-full px-1">
                                    <div className="absolute -inset-x-1 -top-3 bottom-0 border border-islamic-gold/20 rounded-t-[38px] rounded-b-2xl pointer-events-none" />
                                    <div className="relative flex flex-col items-center px-3 py-4">
                                        <p dir="rtl" className="font-arabic text-[#EBD9A3] leading-[2]" style={{ fontSize: arabicPx }}>
                                            {arabic}
                                        </p>

                                        {/* Divider ornament */}
                                        <div className="flex items-center justify-center gap-2.5 my-4 text-islamic-gold">
                                            <span className="h-px w-9 bg-current opacity-55" />
                                            <span className="w-2 h-2 bg-current rotate-45" />
                                            <span className="h-px w-9 bg-current opacity-55" />
                                        </div>

                                        <p
                                            dir={lang.startsWith('ar') ? 'rtl' : 'ltr'}
                                            className="font-serif italic text-stone-100/90 leading-relaxed"
                                            style={{ fontSize: transPx }}
                                        >
                                            “{translation}”
                                        </p>
                                    </div>
                                </div>

                                {/* Source */}
                                <p className={`mt-5 text-[10px] font-bold text-islamic-gold/70 ${isAr ? '' : 'tracking-[0.16em]'}`}>{source}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                    {audioUrl && (
                        <button
                            onClick={toggleAudio}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${isPlaying
                                ? 'bg-amber-500/15 dark:bg-emerald-500/20 text-amber-700 dark:text-emerald-400 border border-amber-500/30 dark:border-emerald-500/30'
                                : 'bg-transparent text-islamic-green dark:text-islamic-gold border border-islamic-green/30 dark:border-islamic-gold/30'}`}
                        >
                            {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            {isPlaying ? t('prescription.pause') : t('prescription.listen')}
                        </button>
                    )}
                    <button
                        onClick={handleShare}
                        disabled={sharing || !verseData}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-islamic-gold text-[#032e18] active:scale-95 transition-all disabled:opacity-60"
                    >
                        {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                        {t('birthdayCard.share')}
                    </button>
                </div>
            </motion.div>

            {/* Hidden 1080x1920 story graphic — captured on share (never moved into view) */}
            {verseData && (
                <BirthdayStoryCard id={storyId} day={day} month={month} verseData={verseData} />
            )}
        </>
    );
}
