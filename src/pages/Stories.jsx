import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, BookOpen, X, Headphones, Sparkles, Heart, SkipBack, SkipForward, RotateCcw, RotateCw, Loader2, AlertCircle, ChevronRight, Gauge } from 'lucide-react';
import HintCoach from '@/components/HintCoach';
import { readSeenHints, markHintSeen } from '@/lib/hints';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import StoryCard from '@/components/StoryCard';
import { useStoryImage, resolveStoryImage } from '@/lib/storyImages';
import { getAllStoryProgress, getResumeTime, saveStoryProgress, markStoryDone, progressPercent } from '@/lib/storyProgress';
import { useHaptics } from '@/hooks/useMobile';
import { useStoryTimings } from '@/lib/storyTimings';
import {
    setNowPlaying, clearNowPlaying, addNowPlayingListeners, loadArtwork,
    setMediaSessionMetadata, setMediaSessionState, setMediaSessionHandlers, clearMediaSession,
} from '@/lib/nowPlaying';
import StoryKaraokeText from '@/components/StoryKaraokeText';
import StoryWaveform from '@/components/StoryWaveform';
import { useTranslation } from 'react-i18next';
import { isPremium } from '@/services/creditService';
import { analytics } from '@/services/analyticsService';

import { STORIES } from '@/data/spiritualData';
import { STORIES_DE } from '@/data/spiritualDataDE';
import { STORIES_RU } from '@/data/spiritualDataRU';
import { STORIES_AR } from '@/data/spiritualDataAR';

const STORIES_MAP = { de: STORIES_DE, ru: STORIES_RU, ar: STORIES_AR };

const CATEGORY_IDS = [
    { id: 'prophets', icon: BookOpen },
    { id: 'companions', icon: Heart },
    { id: 'moral', icon: Sparkles },
];

// Tek seferlik ipuçları (HintCoach). Karartma/engelleme yok; hedefler `data-tour` ile
// işaretli, hedef DOM'da yoksa ipucu sessizce iptal olur. Ortak kayıt: src/lib/hints.js
const LIST_HINTS = [
    { id: 'stories:card', target: 'story-card', titleKey: 'tour.card.title', bodyKey: 'tour.card.body', icon: Headphones },
];

// Sıra bilinçli: önce oynatıcı kartındaki üç hedef (hepsi aynı ekranda), metin ipucu
// en sonda — yoksa sayfa metne kayıp kontroller için geri yukarı dönmek zorunda kalırdı.
const PLAYER_HINTS = [
    { id: 'stories:play', target: 'story-play', titleKey: 'tour.play.title', bodyKey: 'tour.play.body', icon: Play },
    { id: 'stories:seek', target: 'story-seek', titleKey: 'tour.seek.title', bodyKey: 'tour.seek.body', icon: RotateCw },
    { id: 'stories:speed', target: 'story-speed', titleKey: 'tour.speed.title', bodyKey: 'tour.speed.body', icon: Gauge },
    // Kelime takibi yalnız Türkçe metne dayalı dillerde var (tr/en/az) — diğerlerinde gösterme
    { id: 'stories:karaoke', target: 'story-text', titleKey: 'tour.karaoke.title', bodyKey: 'tour.karaoke.body', icon: Sparkles, needsKaraoke: true },
];

/** Zincirde sırada bekleyen ilk görülmemiş ipucu */
const nextHint = (chain, seen, after = -1) => chain.findIndex((h, i) => i > after && !seen[h.id]);

export default function Stories() {
    const { t, i18n } = useTranslation('stories');
    const navigate = useNavigate();
    const lang = (i18n.language || 'en').split('-')[0];
    // Seslendirme yalnızca Türkçe kayıtlarda var (Firebase). Çevrilmiş hikayelere de aynı
    // kaydı id ile bağlıyoruz — dosya kopyalanmadığı için uygulama boyutu artmıyor.
    const activeStories = React.useMemo(() => {
        const merged = { ...STORIES, ...(STORIES_MAP[lang] || {}) };
        if (!STORIES_MAP[lang]) return merged;

        const audioById = new Map(Object.values(STORIES).flat().map(s => [s.id, s.audioUrl]));
        const withAudio = {};
        for (const [category, list] of Object.entries(merged)) {
            withAudio[category] = list.map(s => (audioById.get(s.id) ? { ...s, audioUrl: audioById.get(s.id) } : s));
        }
        return withAudio;
    }, [lang]);
    const [activeCategory, setActiveCategory] = useState('prophets');
    const [selectedStory, setSelectedStory] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [isBuffering, setIsBuffering] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const audioRef = React.useRef(null);
    const dragControls = useDragControls();
    const selectedImage = useStoryImage(selectedStory);
    // Kayıt her dilde aynı olduğu için dalga formu (p) her yerde geçerli. Kelime zamanları (w)
    // Türkçe metne ait — çevrilmiş metinlerde indeksler tutmaz, o yüzden takip sadece
    // temel metni kullanan dillerde (tr/en/az) açık.
    const karaokeEnabled = !STORIES_MAP[lang];
    const storyTimings = useStoryTimings(selectedStory);
    const { selection, success } = useHaptics();
    const [progressMap, setProgressMap] = useState(() => getAllStoryProgress());
    const lastSavedRef = React.useRef(0);
    const autoPlayRef = React.useRef(false);
    // Kilit ekranı olay dinleyicileri güncel durumu görsün
    const isPlayingRef = React.useRef(false);
    isPlayingRef.current = isPlaying;
    // await'lerden sonra "hâlâ aynı hikayede miyiz" kontrolü için
    const currentStoryRef = React.useRef(null);
    // Ana oynatıcı kartı ekrandan çıkınca alttan mini oynatıcı gelir
    const playerCardRef = React.useRef(null);
    const scrollAreaRef = React.useRef(null);
    const [showMiniPlayer, setShowMiniPlayer] = useState(false);

    const refreshProgress = React.useCallback(() => setProgressMap(getAllStoryProgress()), []);

    // ── Tek seferlik ipuçları ─────────────────────────────────────────────
    // Listede bir ipucu, oynatıcı ilk açıldığında kısa bir zincir. Ekran karartılmaz.
    const [seenHints, setSeenHints] = useState(readSeenHints);
    // Sıra değil KİMLİK saklanır: liste ve oynatıcı zincirleri farklı, index taşınırsa
    // ekran değişiminde bir kare yanlış ipucu render edilirdi.
    const [hintId, setHintId] = useState(null);
    const hintTimerRef = React.useRef(null);
    const playerChain = React.useMemo(
        () => PLAYER_HINTS.filter(h => !h.needsKaraoke || karaokeEnabled),
        [karaokeEnabled]
    );
    const hintChain = selectedStory ? playerChain : LIST_HINTS;

    // Ekranda duran ipucunun kimliği — ekran değişince "görüldü" yazmak için
    const shownHintRef = React.useRef(null);
    React.useEffect(() => { shownHintRef.current = hintId; }, [hintId]);

    React.useEffect(() => {
        setHintId(null);                        // ekran değişti: açık ipucunu kapat
        // Taze oku ve `seenHints`'i deps'e KOYMA: bir ipucu kapanınca kayıt değişir,
        // bu effect yeniden koşarsa zinciri baştan başlatıp sıradakini ezer.
        const chain = selectedStory ? playerChain : LIST_HINTS;
        const first = nextHint(chain, readSeenHints());
        // Oynatıcıda modal yay animasyonu + kapak yüklemesi bitsin
        const timer = first === -1 ? null
            : setTimeout(() => setHintId(chain[first].id), selectedStory ? 900 : 700);
        return () => {
            if (timer) clearTimeout(timer);
            clearTimeout(hintTimerRef.current);
            // Balon kullanıcı kapatmadan düştü. "Görüldü" yazılmazsa bağlam geri
            // gelince aynı ipucu baştan çıkar (kullanıcı raporu 2026-08-18).
            const shown = shownHintRef.current;
            if (shown && chain.some(h => h.id === shown)) {
                setSeenHints(markHintSeen(shown));
                shownHintRef.current = null;
            }
        };
    }, [selectedStory, playerChain]);

    // Zincirde yoksa (ekran değişti) hiç gösterme
    const hintIndex = hintId ? hintChain.findIndex(h => h.id === hintId) : -1;
    const activeHint = hintIndex >= 0 ? hintChain[hintIndex] : null;

    const closeHint = React.useCallback((markSeen = true) => {
        const index = hintId ? hintChain.findIndex(h => h.id === hintId) : -1;
        if (index < 0) return;
        // markHintSeen TEST modunda hiçbir şey yazmaz (bkz. lib/hints.js)
        const nextSeen = markSeen ? markHintSeen(hintChain[index].id) : seenHints;
        setSeenHints(nextSeen);
        setHintId(null);
        const nextIdx = nextHint(hintChain, nextSeen, index);
        if (nextIdx >= 0) {
            clearTimeout(hintTimerRef.current);
            // Kısa geçiş: uzun boşluk "tur bitti" hissi veriyordu
            hintTimerRef.current = setTimeout(() => setHintId(hintChain[nextIdx].id), 180);
        }
    }, [hintChain, hintId, seenHints]);

    // Kapatırken/hikaye değiştirirken kalınan yeri yaz
    const persistPosition = React.useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !selectedStory) return;
        saveStoryProgress(selectedStory.id, audio.currentTime, audio.duration);
        refreshProgress();
    }, [selectedStory, refreshProgress]);

    const closePlayer = React.useCallback(() => {
        persistPosition();
        setSelectedStory(null);
        setShowMiniPlayer(false); // yeniden açılışta bir an görünmesin
    }, [persistPosition]);

    React.useEffect(() => {
        currentStoryRef.current = selectedStory;
        const audio = audioRef.current;
        if (selectedStory && audio) {
            audio.src = selectedStory.audioUrl || '';
            audio.load();
            audio.volume = 1.0;
            setIsPlaying(false);
            setCurrentTime(0);
            setSpeed(1); // Reset speed on new story
            setIsBuffering(false);
            setAudioError(false);
            lastSavedRef.current = 0;
        }
        return () => {
            if (audio) {
                audio.pause();
                audio.src = '';
                audio.playbackRate = 1.0;
            }
        };
    }, [selectedStory]);

    const togglePlay = () => {
        if (!audioRef.current || !selectedStory.audioUrl) return;

        selection();
        const next = !isPlaying;
        if (isPlaying) {
            audioRef.current.pause();
            persistPosition();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
        setIsPlaying(next);

        // Kilit ekranı kartı (Android'de ön plan servisi sesin kesilmesini de engeller)
        pushNowPlaying(next);
    };

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setCurrentTime(audio.currentTime);

        // 5 saniyede bir kalınan yeri kaydet
        if (selectedStory && Math.abs(audio.currentTime - lastSavedRef.current) >= 5) {
            lastSavedRef.current = audio.currentTime;
            saveStoryProgress(selectedStory.id, audio.currentTime, audio.duration);
        }
    };

    const handleLoadedMetadata = () => {
        const audio = audioRef.current;
        if (!audio || !selectedStory) return;
        setDuration(audio.duration);

        // Kaldığı yerden devam
        const resumeAt = getResumeTime(selectedStory.id, audio.duration);
        if (resumeAt > 0) {
            audio.currentTime = resumeAt;
            setCurrentTime(resumeAt);
            lastSavedRef.current = resumeAt;
        }

        // Önceki hikaye bitip otomatik geçildiyse çalmaya devam et
        if (autoPlayRef.current) {
            autoPlayRef.current = false;
            audio.play().then(() => { setIsPlaying(true); pushNowPlaying(true); }).catch(() => setIsPlaying(false));
        } else {
            pushNowPlaying(isPlayingRef.current);
        }
    };

    const handleEnded = async () => {
        setIsPlaying(false);
        setCurrentTime(0);
        pushNowPlaying(false); // kilit ekranı "çalıyor"da kalmasın
        const ended = selectedStory;
        if (!ended) return;

        markStoryDone(ended.id, audioRef.current?.duration);
        refreshProgress();
        success();
        analytics.storyCompleted(ended.title, 100);

        // Hikaye bittiğinde reklam göster (Premium değilse ve süre dolduysa otomatik gösterilir)
        try {
            const { showInterstitialAd } = await import('@/services/adService');
            await showInterstitialAd();
        } catch { /* reklam başarısız olursa akış devam etsin */ }

        // Reklam sırasında kullanıcı kapattıysa ya da başka hikayeye geçtiyse karışma
        if (currentStoryRef.current?.id !== ended.id) return;

        // Sıradaki hikayeye geç. Ücretsiz kullanıcıda sadece ilk hikaye açık → geçme.
        const list = activeStories[activeCategory] || [];
        const index = list.findIndex(s => s.id === ended.id);
        const next = index >= 0 ? list[index + 1] : null;
        if (next && isPremium()) {
            autoPlayRef.current = true;
            setSelectedStory(next);
            analytics.storyStarted(next.title, next.duration || 0);
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
            pushNowPlaying(isPlayingRef.current);
        }
    };

    // Listedeki gibi: sadece ilk hikaye ücretsiz
    const goToIndex = (targetIndex) => {
        const currentStories = activeStories[activeCategory] || [];
        const target = currentStories[targetIndex];
        if (!target) return;
        if (targetIndex > 0 && !isPremium()) { navigate('/premium'); return; }
        selection();
        persistPosition();
        setSelectedStory(target);
        analytics.storyStarted(target.title, target.duration || 0);
    };

    const handleNext = () => {
        const currentStories = activeStories[activeCategory] || [];
        const currentIndex = currentStories.findIndex(s => s.id === selectedStory.id);
        if (currentIndex !== -1 && currentIndex < currentStories.length - 1) {
            goToIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        const currentStories = activeStories[activeCategory] || [];
        const currentIndex = currentStories.findIndex(s => s.id === selectedStory.id);
        if (currentIndex > 0) {
            goToIndex(currentIndex - 1);
        }
    };

    const SPEEDS = [1, 1.5, 2];
    const cycleSpeed = () => {
        const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
        if (audioRef.current) audioRef.current.playbackRate = next;
        selection();
        setSpeed(next);
        pushNowPlaying(isPlayingRef.current); // kilit ekranı sayacı hıza göre aksın
    };

    // Podcast standardı: 15 sn geri / ileri
    const skipBy = (seconds) => {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(audio.duration)) return;
        selection();
        const target = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration);
        audio.currentTime = target;
        setCurrentTime(target);
        pushNowPlaying(isPlayingRef.current);
    };

    // Kilit ekranından/kulaklıktan gelen komutlar tek yerde: hem WebView medya oturumu
    // hem native köprü aynı fonksiyonları çağırsın, iki yol ayrışmasın.
    const remotePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.play().then(() => { setIsPlaying(true); pushNowPlaying(true); }).catch(() => {});
    };

    const remotePause = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        setIsPlaying(false);
        persistPosition();
        pushNowPlaying(false);
    };

    // Android'de kullanıcı bildirimi kaydırdı: sesi durdur, kartı YENİDEN KURMA
    const remoteStop = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        setIsPlaying(false);
        persistPosition();
        setMediaSessionState({ isPlaying: false, duration: audio.duration, position: audio.currentTime });
    };

    const seekTo = (time) => {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(time) || !Number.isFinite(audio.duration)) return;
        audio.currentTime = Math.min(Math.max(time, 0), audio.duration);
        setCurrentTime(audio.currentTime);
        pushNowPlaying(isPlayingRef.current);
    };

    // Handler'lar efekt içinde bir kez kayıt olur; güncel fonksiyonlara ref üzerinden ulaşır
    const remoteRef = React.useRef(null);
    remoteRef.current = { play: remotePlay, pause: remotePause, stop: remoteStop, skip: skipBy, seek: seekTo };

    // iOS'ta kilit ekranı kartını WebView'in medya oturumu yönetir (native köprü tek başına
    // yetmiyor, WebKit üzerine yazıyor). Başlık + kapak buradan gider.
    React.useEffect(() => {
        if (!selectedStory) return;
        setMediaSessionMetadata({
            title: selectedStory.title,
            artist: 'İslami Yoldaş',
            album: selectedStory.category || '',
            artworkUrl: selectedImage,
        });
    }, [selectedStory, selectedImage]);

    // Kilit ekranı kartı: hikaye adı + kendi kapağı + oynat/duraklat/±15
    const pushNowPlaying = React.useCallback(async (playing) => {
        const audio = audioRef.current;
        if (!selectedStory || !audio) return;

        // Önce WebView oturumu (senkron) — kilit ekranındaki durum anında doğru olsun
        setMediaSessionState({
            isPlaying: playing,
            duration: audio.duration,
            position: audio.currentTime,
            playbackRate: audio.playbackRate,
        });

        const story = selectedStory;
        const card = {
            title: story.title,
            artist: 'İslami Yoldaş',
            album: story.category || '',
            duration: Number.isFinite(audio.duration) ? audio.duration : 0,
            currentTime: audio.currentTime || 0,
            isPlaying: playing,
            playbackRate: audio.playbackRate || 1,
            skipInterval: 15,
            // Android bildirim aksiyonlarının metinleri (iOS'ta sistem kendi dilini kullanır)
            labels: {
                play: t('mediaPlay'),
                pause: t('mediaPause'),
                back: t('back15'),
                forward: t('forward15'),
            },
        };

        // Metin kartı BEKLEMEDEN gitsin: kapak çözümü gecikir/başarısız olursa bile
        // başlık ve tuşlar doğru kurulur (Android bildirimi buna bağlı).
        setNowPlaying(card);

        const cover = selectedImage || await resolveStoryImage(story);
        const artwork = await loadArtwork(cover);
        // Bu arada hikaye değiştiyse/kapatıldıysa eski kapağı yollama
        if (!artwork || currentStoryRef.current?.id !== story.id) return;
        setNowPlaying({ ...card, currentTime: audio.currentTime || 0, isPlaying: !audio.paused, artwork });
    }, [selectedStory, selectedImage, t]);

    // Oynatıcı açıkken kilit ekranı kontrolleri
    React.useEffect(() => {
        if (!selectedStory) return undefined;

        let removeListeners = () => {};
        let cancelled = false;

        // WebView oturumu (iOS kilit ekranı tuşlarının gerçekte gittiği yer).
        // Verilmeyen eylemler null'lanır → Kur'an sayfasından kalan handler ölür.
        setMediaSessionHandlers({
            play: () => remoteRef.current?.play(),
            pause: () => remoteRef.current?.pause(),
            stop: () => remoteRef.current?.pause(),
            seekbackward: (d) => remoteRef.current?.skip(-(d?.seekOffset || 15)),
            seekforward: (d) => remoteRef.current?.skip(d?.seekOffset || 15),
            seekto: (d) => remoteRef.current?.seek(d?.seekTime),
        });

        addNowPlayingListeners({
            remotePlay: () => remoteRef.current?.play(),
            remotePause: () => remoteRef.current?.pause(),
            // skipBy zaten kartı günceller, burada tekrar çağırma
            remoteSkipForward: () => remoteRef.current?.skip(15),
            remoteSkipBackward: () => remoteRef.current?.skip(-15),
            // Android bildirimindeki ilerleme çubuğu (iOS'ta bu iş mediaSession seekto ile oluyor)
            remoteSeek: (d) => remoteRef.current?.seek(d?.seconds),
            remoteStop: () => remoteRef.current?.stop(),
        }).then((cleanup) => {
            // Kayıt tamamlanmadan hikaye kapandıysa dinleyiciyi hemen sök (sızıntı olmasın)
            if (cancelled) cleanup();
            else removeListeners = cleanup;
        });

        return () => {
            cancelled = true;
            removeListeners();
            clearMediaSession();
            clearNowPlaying();
        };
    }, [selectedStory]);

    const retryAudio = () => {
        const audio = audioRef.current;
        if (!audio || !selectedStory?.audioUrl) return;
        setAudioError(false);
        setIsBuffering(true);
        audio.src = selectedStory.audioUrl;
        audio.load();
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const playedPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    // Kart görünürken mini oynatıcı gizli, kaybolunca görünür
    React.useEffect(() => {
        const card = playerCardRef.current;
        const root = scrollAreaRef.current;
        if (!selectedStory || !card || !root) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => setShowMiniPlayer(!entry.isIntersecting),
            { root, threshold: 0.35 }
        );
        observer.observe(card);
        return () => observer.disconnect();
    }, [selectedStory]);

    // Oynatıcıda "Sıradaki" şeridi
    const playerList = activeStories[activeCategory] || [];
    const playerIndex = selectedStory ? playerList.findIndex(s => s.id === selectedStory.id) : -1;
    const nextStory = playerIndex >= 0 ? playerList[playerIndex + 1] : null;
    const nextLocked = !!nextStory && !isPremium();


    return (
        <div className="space-y-4 p-5 pb-24 dark:bg-[#032e18]">

            {/* Category Selection */}
            <div className="glass-panel rounded-3xl p-2 grid grid-cols-3 gap-1">
                {CATEGORY_IDS.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                        <motion.button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "relative px-3 py-3 overflow-hidden rounded-2xl font-bold text-xs uppercase tracking-wider transition-all",
                                isActive
                                    ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-[#F0E8D5] dark:hover:bg-white/5"
                            )}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Icon className={cn("w-5 h-5 mx-auto mb-1", isActive && "drop-shadow-md")} />
                            <span className="text-[10px]">{t(`categories.${cat.id}`)}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Story Grid */}
            <div className="grid gap-3">
                {(activeStories[activeCategory] || []).map((story, index) => {
                    const isFree = index === 0;
                    const isLocked = !isFree && !isPremium();
                    const entry = progressMap[story.id];
                    return (
                        <div key={story.id} className="relative">
                            <div data-tour={index === 0 ? 'story-card' : undefined}>
                                <StoryCard
                                    story={story}
                                    category={activeCategory}
                                    locked={isLocked}
                                    progress={entry ? { done: entry.done, percent: progressPercent(entry) } : null}
                                    onClick={() => {
                                        if (isLocked) { navigate('/premium'); return; }
                                        selection();
                                        setSelectedStory(story);
                                        analytics.storyStarted(story.title, story.duration || 0);
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Deep Reading/Listening View (Mobile Simulation) */}
            <AnimatePresence>
                {selectedStory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                        onClick={closePlayer}
                    >
                        <motion.div
                            drag="y"
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.2 }}
                            onDragEnd={(event, info) => {
                                if (info.offset.y > 100 || info.velocity.y > 500) {
                                    closePlayer();
                                }
                            }}
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-[420px] h-full max-h-[90vh] bg-[#FFFDF6] dark:bg-[#032e18] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col border border-white/5 ring-4 ring-black/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className="p-4 flex items-center justify-between border-b dark:border-white/10 bg-cream-bg/40 dark:bg-black/20 shrink-0 cursor-grab active:cursor-grabbing touch-none"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <Button variant="ghost" size="icon" aria-label={t('nowListening')} onClick={closePlayer} className="rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                                    <X className="w-6 h-6 text-islamic-green dark:text-islamic-gold" />
                                </Button>
                                <div className={cn(
                                    "flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full transition-colors duration-300",
                                    isPlaying
                                        ? "bg-islamic-gold/10 ring-1 ring-islamic-gold/25"
                                        : "bg-black/[0.04] dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10"
                                )}>
                                    {/* Çalarken canlanan mini ekolayzer */}
                                    <span className="flex items-end gap-[2px] h-3">
                                        {[0, 1, 2].map((bar) => (
                                            <span
                                                key={bar}
                                                className={cn(
                                                    "w-[3px] rounded-full transition-all duration-300",
                                                    isPlaying
                                                        ? "bg-islamic-green dark:bg-islamic-gold motion-reduce:h-1/2"
                                                        : "bg-gray-300 dark:bg-white/25 h-[5px]"
                                                )}
                                                style={isPlaying ? {
                                                    height: '100%',
                                                    animation: `music-bar ${0.7 + bar * 0.15}s ease-in-out ${bar * 0.12}s infinite`,
                                                } : undefined}
                                            />
                                        ))}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-300",
                                        isPlaying ? "text-islamic-green dark:text-islamic-gold" : "text-gray-400 dark:text-white/40"
                                    )}>
                                        {isPlaying ? t('nowListening') : t('paused')}
                                    </span>
                                </div>
                                <div className="w-10 flex justify-center">
                                    {/* Optional Handle Indicator */}
                                    <div className="w-8 h-1 bg-gray-300 dark:bg-white/20 rounded-full md:hidden opacity-50" />
                                </div>
                            </div>

                            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar">
                                {/* Audio Player Card */}
                                <div ref={playerCardRef} className={cn(
                                    // koyu yüzey: gündüz modunda da yeşil kalmalı (islamic-green token'ı light'ta amber)
                                    "bg-gradient-to-br from-[#044D29] to-[#033a1f] rounded-[2rem] p-6 mb-8 shadow-xl relative overflow-hidden group/card ring-1 ring-white/10 transition-transform duration-200",
                                    speed > 1 && "ring-islamic-gold/50"
                                )}>
                                    {/* Kapak görselinden yumuşak zemin */}
                                    {selectedImage && (
                                        <img
                                            src={selectedImage}
                                            alt=""
                                            aria-hidden="true"
                                            className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-25 pointer-events-none"
                                        />
                                    )}
                                    {/* Hız: 1× → 1.5× → 2× */}
                                    <div data-tour="story-speed" className="absolute top-4 right-4 z-20">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            aria-label={t('speedAria')}
                                            className={cn(
                                                "h-8 w-12 px-0 rounded-full font-bold text-[11px] tabular-nums transition-all border border-white/10 active:scale-95 select-none",
                                                speed > 1
                                                    ? "bg-islamic-gold text-[#032e18]"
                                                    : "bg-black/25 text-white/70 hover:text-white hover:bg-black/40"
                                            )}
                                            onClick={cycleSpeed}
                                        >
                                            {speed}×
                                        </Button>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-44 h-44 max-w-[70vw] bg-white/10 rounded-[1.75rem] flex items-center justify-center mb-6 overflow-hidden backdrop-blur-md shadow-2xl shadow-black/40 border border-white/10">
                                            {selectedImage ? (
                                                <img src={selectedImage} alt={selectedStory.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Headphones className="w-12 h-12 text-islamic-gold" />
                                            )}
                                        </div>
                                        <h1 className="text-xl font-serif font-bold text-white mb-6 text-center leading-tight">{selectedStory.title}</h1>

                                        {/* Hidden Audio Element */}
                                        <audio
                                            ref={audioRef}
                                            onTimeUpdate={handleTimeUpdate}
                                            onLoadedMetadata={handleLoadedMetadata}
                                            onEnded={handleEnded}
                                            onWaiting={() => setIsBuffering(true)}
                                            onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
                                            onCanPlay={() => setIsBuffering(false)}
                                            onPause={() => setIsPlaying(false)}
                                            onError={() => {
                                                const audio = audioRef.current;
                                                // hikaye değişiminde src boşaltılıyor — o error'u yut
                                                if (!audio || !selectedStory?.audioUrl || audio.src !== selectedStory.audioUrl) return;
                                                setIsBuffering(false);
                                                setIsPlaying(false);
                                                setAudioError(true);
                                            }}
                                        />

                                        {/* Ses dalgası + sürükleyerek atlama */}
                                        <div data-tour="story-seek" className="w-full mb-5">
                                            <StoryWaveform
                                                peaks={storyTimings?.p}
                                                percent={playedPercent}
                                                duration={duration}
                                                currentTime={currentTime}
                                                onSeek={handleSeek}
                                                label={selectedStory.title}
                                            />
                                            {!storyTimings?.p?.length && (
                                                <div className="relative h-8 flex items-center group/seek">
                                                    <div className="absolute inset-x-0 h-1.5 bg-black/25 rounded-full overflow-hidden">
                                                        <div className="h-full bg-islamic-gold" style={{ width: `${playedPercent}%` }} />
                                                    </div>
                                                    <div
                                                        className="absolute w-3.5 h-3.5 bg-[#FFFDF6] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.35)] pointer-events-none ring-2 ring-islamic-gold transition-transform group-active/seek:scale-125"
                                                        style={{ left: `${playedPercent}%`, transform: 'translateX(-50%)' }}
                                                    />
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max={duration || 0}
                                                        value={currentTime}
                                                        onChange={handleSeek}
                                                        aria-label={selectedStory.title}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mt-2 px-0.5">
                                                <span className="text-[11px] font-mono font-medium text-white/75 tabular-nums">
                                                    {formatTime(currentTime)}
                                                </span>
                                                <span className="text-[11px] font-mono text-white/40 tabular-nums">
                                                    −{formatTime(Math.max(0, duration - currentTime))}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Playback Controls */}
                                        {audioError ? (
                                            <div className="w-full flex flex-col items-center gap-3 mb-4">
                                                <p className="flex items-center gap-2 text-[13px] font-bold text-white/80">
                                                    <AlertCircle className="w-4 h-4 text-islamic-gold" /> {t('audioError')}
                                                </p>
                                                <Button
                                                    onClick={retryAudio}
                                                    className="h-10 px-5 rounded-full bg-islamic-gold text-[#032e18] font-bold text-[13px] hover:bg-[#d6a549] active:scale-95"
                                                >
                                                    {t('retry')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-4 w-full relative mb-2">
                                                {/* Önceki hikaye — en düşük kademe */}
                                                <button
                                                    type="button"
                                                    aria-label={t('nextUp')}
                                                    onClick={handlePrev}
                                                    className="w-9 h-9 rounded-full text-white/45 hover:text-white active:scale-95 transition-all flex items-center justify-center"
                                                >
                                                    <SkipBack className="w-[18px] h-[18px] fill-current" />
                                                </button>

                                                {/* -15 sn — orta kademe, hafif cam zemin */}
                                                <button
                                                    type="button"
                                                    aria-label={t('back15')}
                                                    onClick={() => skipBy(-15)}
                                                    className="relative w-12 h-12 rounded-full bg-white/[0.07] ring-1 ring-white/10 text-white/90 hover:bg-white/[0.12] active:scale-95 transition-all flex items-center justify-center"
                                                >
                                                    <RotateCcw className="w-6 h-6" strokeWidth={1.5} />
                                                    <span className="absolute text-[8px] font-bold tabular-nums mt-0.5">15</span>
                                                </button>

                                                {/* Play/Pause — tek vurgu, ölçülü altın hale */}
                                                <button
                                                    type="button"
                                                    data-tour="story-play"
                                                    onClick={togglePlay}
                                                    aria-label={selectedStory.title}
                                                    className="w-[68px] h-[68px] shrink-0 rounded-full bg-gradient-to-b from-islamic-gold to-[#d6a549] text-[#032e18] flex items-center justify-center shadow-[0_8px_22px_-10px_rgba(212,175,55,0.55),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-[#f0d98a]/40 hover:brightness-105 active:scale-95 transition-all"
                                                >
                                                    {isBuffering ? (
                                                        <Loader2 className="w-7 h-7 animate-spin" />
                                                    ) : isPlaying ? (
                                                        <div className="flex items-end gap-1 h-5">
                                                            <div className="w-1.5 h-full bg-[#032e18] rounded-full animate-[music-bar_0.6s_ease-in-out_infinite] motion-reduce:animate-none" />
                                                            <div className="w-1.5 h-full bg-[#032e18] rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.1s] motion-reduce:animate-none" />
                                                        </div>
                                                    ) : (
                                                        <Play className="w-7 h-7 fill-current ml-1" />
                                                    )}
                                                </button>

                                                {/* +15 sn */}
                                                <button
                                                    type="button"
                                                    aria-label={t('forward15')}
                                                    onClick={() => skipBy(15)}
                                                    className="relative w-12 h-12 rounded-full bg-white/[0.07] ring-1 ring-white/10 text-white/90 hover:bg-white/[0.12] active:scale-95 transition-all flex items-center justify-center"
                                                >
                                                    <RotateCw className="w-6 h-6" strokeWidth={1.5} />
                                                    <span className="absolute text-[8px] font-bold tabular-nums mt-0.5">15</span>
                                                </button>

                                                {/* Sonraki hikaye */}
                                                <button
                                                    type="button"
                                                    aria-label={t('nextUp')}
                                                    onClick={handleNext}
                                                    className="w-9 h-9 rounded-full text-white/45 hover:text-white active:scale-95 transition-all flex items-center justify-center"
                                                >
                                                    <SkipForward className="w-[18px] h-[18px] fill-current" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#033a1f]/80 to-transparent pointer-events-none" />
                                </div>

                                {/* Sıradaki hikaye */}
                                {nextStory && (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="w-full -mt-5 mb-8 flex items-center gap-3 rounded-2xl px-4 py-3 bg-black/[0.03] dark:bg-white/5 hover:bg-black/[0.06] dark:hover:bg-white/10 active:scale-[0.985] transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic-green dark:focus-visible:ring-islamic-gold"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400">{t('nextUp')}</p>
                                            <p className="text-[13px] font-serif font-bold text-gray-800 dark:text-white truncate mt-0.5">{nextStory.title}</p>
                                        </div>
                                        {nextLocked && (
                                            <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-islamic-gold/15 text-islamic-gold tracking-wider">PREMIUM</span>
                                        )}
                                        <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" />
                                    </button>
                                )}

                                {/* Article Text */}
                                <div className="space-y-6">
                                    <article className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-lg font-serif px-1 pb-10">
                                        <StoryKaraokeText
                                            key={selectedStory.id}
                                            content={selectedStory.content}
                                            timings={karaokeEnabled ? storyTimings : null}
                                            audioRef={audioRef}
                                            isPlaying={isPlaying}
                                        />
                                    </article>
                                </div>

                                <div className="h-28" />
                            </div>

                            {/* Mini oynatıcı — ana kart yukarı kayınca alttan gelir */}
                            <AnimatePresence>
                                {showMiniPlayer && !audioError && (
                                    <motion.div
                                        initial={{ y: 90, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 90, opacity: 0 }}
                                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                                        className="absolute inset-x-0 bottom-0 px-4 pt-2.5 pb-4 bg-gradient-to-b from-[#054527] to-[#03301b] backdrop-blur-md border-t border-white/10 shadow-[0_-10px_30px_-14px_rgba(0,0,0,0.75)]"
                                    >
                                        <StoryWaveform
                                            compact
                                            peaks={storyTimings?.p}
                                            percent={playedPercent}
                                            duration={duration}
                                            currentTime={currentTime}
                                            onSeek={handleSeek}
                                            label={selectedStory.title}
                                        />
                                        {!storyTimings?.p?.length && (
                                            <div className="relative h-6 flex items-center group/mini">
                                                <div className="absolute inset-x-0 h-1 bg-black/30 rounded-full overflow-hidden">
                                                    <div className="h-full bg-islamic-gold" style={{ width: `${playedPercent}%` }} />
                                                </div>
                                                <div
                                                    className="absolute w-3 h-3 bg-[#FFFDF6] rounded-full ring-2 ring-islamic-gold shadow pointer-events-none transition-transform group-active/mini:scale-125"
                                                    style={{ left: `${playedPercent}%`, transform: 'translateX(-50%)' }}
                                                />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={duration || 0}
                                                    value={currentTime}
                                                    onChange={handleSeek}
                                                    aria-label={selectedStory.title}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mt-2">
                                            {/* Ne çaldığı görünsün */}
                                            <div className="w-9 h-9 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/15 bg-white/10">
                                                {selectedImage
                                                    ? <img src={selectedImage} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center"><Headphones className="w-4 h-4 text-islamic-gold" /></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-serif font-bold text-white truncate leading-tight">
                                                    {selectedStory.title}
                                                </p>
                                                <p className="text-[10px] font-mono text-white/50 tabular-nums mt-0.5">
                                                    {formatTime(currentTime)} <span className="text-white/25">/</span> −{formatTime(Math.max(0, duration - currentTime))}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    aria-label={t('back15')}
                                                    onClick={() => skipBy(-15)}
                                                    className="relative w-9 h-9 rounded-full bg-white/[0.07] ring-1 ring-white/10 text-white/85 active:scale-95 transition-transform flex items-center justify-center"
                                                >
                                                    <RotateCcw className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                                    <span className="absolute text-[7px] font-bold tabular-nums mt-0.5">15</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={togglePlay}
                                                    aria-label={selectedStory.title}
                                                    className="w-12 h-12 rounded-full bg-gradient-to-b from-islamic-gold to-[#d6a549] text-[#032e18] flex items-center justify-center shadow-[0_6px_18px_-8px_rgba(212,175,55,0.6),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-[#f0d98a]/40 active:scale-95 transition-transform"
                                                >
                                                    {isBuffering
                                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                                        : isPlaying
                                                            ? <Pause className="w-5 h-5 fill-current" />
                                                            : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                                                </button>

                                                <button
                                                    type="button"
                                                    aria-label={t('forward15')}
                                                    onClick={() => skipBy(15)}
                                                    className="relative w-9 h-9 rounded-full bg-white/[0.07] ring-1 ring-white/10 text-white/85 active:scale-95 transition-transform flex items-center justify-center"
                                                >
                                                    <RotateCw className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                                    <span className="absolute text-[7px] font-bold tabular-nums mt-0.5">15</span>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tek seferlik ipuçları — karartmaz, engellemez (portal ile modalın üstünde) */}
            {activeHint && (
                <HintCoach
                    key={activeHint.id}
                    targetId={activeHint.target}
                    titleKey={activeHint.titleKey}
                    bodyKey={activeHint.bodyKey}
                    icon={activeHint.icon}
                    ns="stories"
                    step={Math.max(0, hintChain.indexOf(activeHint))}
                    total={hintChain.length}
                    onClose={closeHint}
                />
            )}
        </div>
    );
}
