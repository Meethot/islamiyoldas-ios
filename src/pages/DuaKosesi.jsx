import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Heart, Send, RefreshCw, ChevronLeft,
    MessageCircle, X, Clock, Check, AlertCircle, History, Trash2, Users, Sparkles, Pencil, Coins, Film
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { addPrayer, getRandomApprovedPrayers, incrementAmin, updatePrayer, deletePrayer, syncPrayersStatus, getPrayer, requestDeletePrayer, listenToPrayer } from '@/services/prayerService';
import { getAppDate, getTodayString } from '@/lib/testDate';
import Swal from 'sweetalert2';
import { getCredits, addCredit, spendCredits, isPremium, CREDIT_COSTS } from '@/services/creditService';
import { initAdMob, showRewardedAd } from '@/services/adService';
import { useTranslation } from 'react-i18next';
import { getFakePrayersByLang, normalizeLang } from '@/data/fakePrayers';
import CreditPaywallModal from '@/components/CreditPaywallModal';



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

// ========== CONSTANTS & FILTERS ==========
const BLOCKED_WORDS = [
    "amk", "aq", "piç", "yavşak", "sik", "yarak",
    "amcık", "amcik", "orospu", "kahpe", "sürtük", "göt", "götveren", "gavat", "pezevenk",
    "ibne", "puşt", "kıç", "salak", "aptal", "mal", "gerizekalı", "beyinsiz", "angut",
    "hıyar", "sığır", "öküz", "ayı", "şerefsiz", "haysiyetsiz", "it",
    "zıkkım", "zevzek", "zibidi", "dümbük", "lavuk", "keko", "kaşar", "fahişe",
    "ulan", "denyo", "ezik", "dangalak", "ahmak", "kafasız", "bok", "kaka", "salako",
    "manyak", "sapık"
];
// =========================================
// Fake prayers are now loaded from src/data/fakePrayers.js per language

function getRandomDuas(pool, count) {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

// Generate fresh fake duas per language (called on init and when cache expires)
function generateFakeDuas(lang = 'tr') {
    const pool = getFakePrayersByLang(lang);
    const cacheKey = `fakeDuasSelection_${lang}`;
    const seenKey = `fakeDuasSeenIds_${lang}`;
    const countsKey = `fakeDuasCounts_${lang}`;

    const savedCounts = localStorage.getItem(countsKey);
    const cachedSelection = localStorage.getItem(cacheKey);
    const seenIdsRaw = localStorage.getItem(seenKey);
    let seenIds = [];

    try { seenIds = seenIdsRaw ? JSON.parse(seenIdsRaw) : []; } catch { seenIds = []; }

    if (cachedSelection) {
        try {
            const { ids, timestamp } = JSON.parse(cachedSelection);
            const now = getAppDate().getTime();
            const twentyFourHours = 24 * 60 * 60 * 1000;

            if (now - timestamp < twentyFourHours && Array.isArray(ids) && ids.length > 0) {
                const cachedDuas = ids
                    .map(id => pool.find(d => d.id === id))
                    .filter(Boolean);

                if (cachedDuas.length > 0) {
                    if (savedCounts) {
                        const parsed = JSON.parse(savedCounts);
                        return cachedDuas.map(d => ({
                            ...d,
                            count: parsed[d.id] || d.count
                        }));
                    }
                    return cachedDuas;
                }
            }
        } catch (e) {
            console.error('Error parsing cached duas:', e);
        }
    }

    const seenSet = new Set(seenIds);
    let available = pool.filter(d => !seenSet.has(d.id));

    if (available.length === 0) {
        seenIds = [];
        localStorage.setItem(seenKey, JSON.stringify([]));
        available = pool;
    }

    const randomSet = getRandomDuas(available, Math.min(6, available.length));

    const newSeenIds = [...seenIds, ...randomSet.map(d => d.id)];
    localStorage.setItem(seenKey, JSON.stringify(newSeenIds));

    localStorage.setItem(cacheKey, JSON.stringify({
        ids: randomSet.map(d => d.id),
        timestamp: getAppDate().getTime()
    }));

    if (savedCounts) {
        const parsed = JSON.parse(savedCounts);
        return randomSet.map(d => ({
            ...d,
            count: parsed[d.id] || d.count
        }));
    }
    return randomSet;
}
// ======================================

export default function DuaKosesi() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('dua');
    const currentLang = normalizeLang(i18n.language);
    const [showForm, setShowForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDeleteToast, setShowDeleteToast] = useState(false);
    const [editingPrayer, setEditingPrayer] = useState(null); // Track which prayer is being edited
    const [credits, setCredits] = useState(() => getCredits());
    const [showCreditAnim, setShowCreditAnim] = useState(false);
    const [isAdLoading, setIsAdLoading] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

    // AdMob init
    useEffect(() => { initAdMob(); }, []);

    // Sync statuses when History is opened
    useEffect(() => {
        if (showHistory && myRequests.length > 0) {
            const sync = async () => {
                const ids = myRequests.map(r => r.id);
                // Only sync real IDs (string), ignore fake IDs (number) if any
                const realIds = ids.filter(id => typeof id === 'string');

                if (realIds.length === 0) return;

                const statusMap = await syncPrayersStatus(realIds);

                // If any status or aminCount changed, update state and storage
                let hasChanges = false;
                const updatedRequests = myRequests.map(req => {
                    const freshData = statusMap[req.id];

                    if (freshData) {
                        let { status: newStatus, aminCount: newAminCount } = freshData;
                        const currentAmin = req.aminCount || 0;

                        // DELETION FEEDBACK LOGIC:
                        // If local status was 'delete_requested' AND remote status is 'rejected' (doc missing),
                        // this means the admin APPROVED the deletion request.
                        // We should show "TALEBİNİZLE SİLİNDİ" (deletion_approved) instead of "ONAYLANMADI" (rejected).
                        if (req.status === 'delete_requested' && newStatus === 'rejected') {
                            newStatus = 'deletion_approved';
                        }

                        // Check if status OR aminCount changed
                        if (newStatus !== req.status || newAminCount !== currentAmin) {
                            hasChanges = true;
                            return { ...req, status: newStatus, aminCount: newAminCount };
                        }
                    }
                    return req;
                });

                if (hasChanges) {
                    setMyRequests(updatedRequests);
                    localStorage.setItem('myDuaRequests', JSON.stringify(updatedRequests));
                }
            };
            sync();
        }
    }, [showHistory]);

    // Live Data from Firestore
    const [realDuas, setRealDuas] = useState([]);
    const [freshSticky, setFreshSticky] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // Increment to trigger re-fetch

    // Fake Data (Simulated) - each dua shown only once, never repeated
    const [fakeDuas, setFakeDuas] = useState(() => generateFakeDuas(currentLang));

    // Re-check on every mount/focus: if cache is stale, regenerate
    useEffect(() => {
        const checkStale = () => {
            const cachedSelection = localStorage.getItem(`fakeDuasSelection_${currentLang}`);
            if (!cachedSelection) return;
            try {
                const { timestamp } = JSON.parse(cachedSelection);
                const now = getAppDate().getTime();
                if (now - timestamp >= 24 * 60 * 60 * 1000) {
                    setFakeDuas(generateFakeDuas(currentLang));
                }
            } catch { /* ignore */ }
        };
        checkStale();
        // Also check when app returns from background
        const onFocus = () => checkStale();
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') checkStale();
        });
        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', checkStale);
        };
    }, []);

    // My Requests (Local History)
    const [myRequests, setMyRequests] = useState(() => {
        const saved = localStorage.getItem('myDuaRequests');
        return saved ? JSON.parse(saved) : [];
    });

    /**
     * STICKY REAL-TIME LISTENER
     * This effect monitors the user's OWN last prayer in real-time.
     * If the admin approves it or changes it, the user sees it INSTANTLY.
     */
    useEffect(() => {
        const stickyJson = localStorage.getItem('myLastStickyPrayer');
        if (!stickyJson) return;

        try {
            const sticky = JSON.parse(stickyJson);
            if (sticky.id && typeof sticky.id === 'string') {
                // Subscribe to real-time updates for THIS specific document
                const unsubscribe = listenToPrayer(sticky.id, (freshData) => {
                    if (freshData) {
                        setFreshSticky(freshData);
                        // Persist fresh data (like status/aminCount) to localStorage immediately
                        localStorage.setItem('myLastStickyPrayer', JSON.stringify(freshData));
                    } else {
                        // Document deleted by admin?
                        setFreshSticky(null);
                    }
                });
                return () => unsubscribe();
            } else {
                // It was a local dummy prayer, just set it
                setFreshSticky(sticky);
            }
        } catch (e) {
            console.error("Error setting up sticky listener:", e);
        }
    }, [myRequests]); // Re-run if history changes (e.g. user submits new)

    // COMPOSE FINAL FEED REACTIVELY
    const allDuas = React.useMemo(() => {
        let final = [...realDuas];

        if (freshSticky) {
            // Safely parse timestamp
            let stickyTime;
            if (freshSticky.timestamp && typeof freshSticky.timestamp.toDate === 'function') {
                stickyTime = freshSticky.timestamp.toDate().getTime();
            } else if (freshSticky.timestamp && typeof freshSticky.timestamp.seconds === 'number') {
                stickyTime = freshSticky.timestamp.seconds * 1000;
            } else {
                stickyTime = new Date(freshSticky.timestamp).getTime();
            }

            const now = getAppDate().getTime();
            const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

            // Visibility Rules:
            // 1. Must be < 24h old
            // 2. Must be APPROVED by admin
            if (stickyTime > twentyFourHoursAgo && freshSticky.status === 'approved') {
                // Deduplicate: Is it already in the public list?
                final = final.filter(d => d.id !== freshSticky.id);
                // Unshift with isSticky flag
                final.unshift({ ...freshSticky, isSticky: true });
            }
        }

        const combined = [...final, ...fakeDuas];
        return combined.slice(0, 6);
    }, [realDuas, fakeDuas, freshSticky]);

    // Local tracking of "amined" prayers to prevent double clicks (per session/device)
    const [aminedPrayers, setAminedPrayers] = useState(() => {
        const saved = localStorage.getItem('aminedPrayers');
        return saved ? JSON.parse(saved) : {};
    });

    // Fetch random approved prayers (one-shot, re-runs on refreshKey)
    useEffect(() => {
        const fetchRandom = async () => {
            try {
                const data = await getRandomApprovedPrayers(6, currentLang);
                setRealDuas(data);
            } catch (err) {
                console.error("Error fetching random prayers:", err);
                setRealDuas([]);
            }
        };
        fetchRandom();
    }, [refreshKey]);

    // Refresh feed function — only re-fetches Firestore data, fake duas stay cached for 24h
    const refreshFeed = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const handleAmin = async (id) => {
        if (aminedPrayers[id]) return;

        // Optimistically update UI
        triggerHaptics();
        playClickSound();

        // +1 Amin Kredisi kazandır
        const newCredits = addCredit(CREDIT_COSTS.AMIN_REWARD);
        setCredits(newCredits);
        setShowCreditAnim(true);
        setTimeout(() => setShowCreditAnim(false), 1200);

        // Mark as amined locally
        const newAmined = { ...aminedPrayers, [id]: true };
        setAminedPrayers(newAmined);
        localStorage.setItem('aminedPrayers', JSON.stringify(newAmined));

        // OPTIMISTIC UPDATE: Update realDuas state instantly
        // This ensures the count increments on screen immediately without waiting for Firestore
        setRealDuas(prev => prev.map(d => {
            if (d.id === id) {
                return { ...d, aminCount: (d.aminCount || 0) + 1 };
            }
            return d;
        }));

        // STICKY SYNC: If this is my sticky prayer, update localStorage immediately
        const stickyJson = localStorage.getItem('myLastStickyPrayer');
        if (stickyJson) {
            try {
                let sticky = JSON.parse(stickyJson);
                if (sticky.id === id) {
                    // Update count locally
                    sticky.aminCount = (sticky.aminCount || 0) + 1;
                    localStorage.setItem('myLastStickyPrayer', JSON.stringify(sticky));
                }
            } catch (e) {
                console.error("Error updating sticky amin count:", e);
            }
        }

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
        // Anti-Spam Check: Limit to 2 prayers per day
        const today = getTodayString();
        const lastPrayerDate = localStorage.getItem('lastPrayerDate');
        let dailyCount = parseInt(localStorage.getItem('dailyPrayerCount') || '0', 10);

        if (lastPrayerDate !== today) {
            // New day, reset count
            dailyCount = 0;
            localStorage.setItem('lastPrayerDate', today);
        }

        if (dailyCount >= 2) {
            Swal.fire({
                title: `<span class="text-[#D4AF37] font-serif tracking-wide">${t('dailyLimitTitle')}</span>`,
                html: `
            <div class="text-[#FFFDF5]/80 font-serif leading-relaxed">
              <p class="mb-3 text-lg">${t('dailyLimitMsg')}</p>
              <p class="text-sm opacity-70">${t('dailyLimitSub')}</p>
            </div>
          `,
                icon: 'info',
                iconColor: '#D4AF37', // islamic-gold
                background: '#032e18', // islamic-dark-green (Standard app background)
                showConfirmButton: true,
                confirmButtonText: t('dailyLimitBtn'),
                // User said "green button" looked off. Gold button on Dark Green bg looks premium.
                // Using islamic-gold for action.
                confirmButtonColor: '#D4AF37',
                buttonsStyling: true,
                customClass: {
                    popup: 'rounded-[2rem] border border-[#D4AF37]/20 shadow-2xl', // Gold border
                    confirmButton: 'rounded-full px-8 py-3 font-bold text-[#021a0f]' // Dark text on Gold button
                },
                backdrop: `
            rgba(0,0,0,0.85)
            left top
            no-repeat
          `
            });
            return;
        }

        // Profanity Filter
        const lowerText = text.toLowerCase();
        const hasBlockedWord = BLOCKED_WORDS.some(word => lowerText.includes(word));

        if (hasBlockedWord) {
            Swal.fire({
                title: `<span class="text-[#D4AF37] font-serif tracking-wide">${t('profanityTitle')}</span>`,
                html: `
                    <div class="text-[#FFFDF5]/80 font-serif leading-relaxed">
                        <p class="mb-3 text-lg">${t('profanityMsg')}</p>
                        <p class="text-sm opacity-70">${t('profanitySub')}</p>
                    </div>
                `,
                icon: 'warning',
                iconColor: '#D4AF37',
                background: '#032e18',
                showConfirmButton: true,
                confirmButtonText: t('profanityBtn'),
                confirmButtonColor: '#D4AF37',
                customClass: {
                    popup: 'rounded-[2rem] border border-[#D4AF37]/20 shadow-2xl',
                    confirmButton: 'rounded-full px-8 py-3 font-bold text-[#021a0f]'
                },
                backdrop: 'rgba(0,0,0,0.85)'
            });
            return;
        }

        // Kredi kontrolü ve düşümü (Premium bypass)
        if (!isPremium()) {
            if (!spendCredits(CREDIT_COSTS.POST_DUA)) {
                return; // Paywall zaten butonda gösterildi
            }
            setCredits(getCredits());
        }

        try {
            const id = await addPrayer(text, currentLang);

            // Increment daily count on success
            const newCount = dailyCount + 1;
            localStorage.setItem('dailyPrayerCount', newCount.toString());

            // Save as sticky prayer (24h retention)
            const stickyObject = {
                id: id,
                text: text,
                status: 'pending', // Sticky starts as pending
                timestamp: getAppDate().toISOString(),
                aminCount: 0,
                isSticky: true
            };
            localStorage.setItem('myLastStickyPrayer', JSON.stringify(stickyObject));

            // Add to local history
            const newRequest = {
                ...stickyObject,
                date: getAppDate().toISOString()
            };

            const updated = [newRequest, ...myRequests];
            setMyRequests(updated);
            localStorage.setItem('myDuaRequests', JSON.stringify(updated));

            setShowForm(false);
            refreshFeed(); // Refresh feed to show fresh random set
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch (error) {
            console.error("Failed to submit prayer:", error);
            alert(t('submitError'));
        }
    };

    const handleDeleteRequest = async (id) => {
        try {
            const request = myRequests.find(r => r.id === id);
            if (!request) return;

            // Scenario 1: Deletion Pending (Already requested)
            if (request.status === 'delete_requested') {
                // Do nothing or maybe allow canceling request? For now, do nothing.
                return;
            }

            // Scenario 2: Approved Prayer -> Request Deletion
            if (request.status === 'approved') {
                const result = await Swal.fire({
                    title: `<span class="text-[#D4AF37] font-serif tracking-wide">${t('deleteRequestTitle')}</span>`,
                    html: `
                    <div class="text-[#FFFDF5]/80 font-serif leading-relaxed">
                      <p class="mb-3">${t('deleteRequestMsg')}</p>
                      <p class="text-sm opacity-70">${t('deleteRequestSub')}</p>
                    </div>
                  `,
                    icon: 'warning',
                    iconColor: '#D4AF37',
                    background: '#032e18',
                    showCancelButton: true,
                    confirmButtonText: t('deleteRequestConfirm'),
                    cancelButtonText: t('deleteRequestCancel'),
                    confirmButtonColor: '#d33', // Red for delete action
                    cancelButtonColor: '#374151',
                    customClass: {
                        popup: 'rounded-[2rem] border border-[#D4AF37]/20 shadow-2xl',
                        confirmButton: 'rounded-xl px-6 py-3 font-bold',
                        cancelButton: 'rounded-xl px-6 py-3 font-medium text-gray-300'
                    }
                });

                if (result.isConfirmed) {
                    await requestDeletePrayer(id);

                    // Update local state to show "Deletion Requested"
                    const updated = myRequests.map(r =>
                        r.id === id ? { ...r, status: 'delete_requested' } : r
                    );
                    setMyRequests(updated);
                    localStorage.setItem('myDuaRequests', JSON.stringify(updated));

                    // Show success toast
                    Swal.fire({
                        title: t('deleteRequestSuccess'),
                        text: t('deleteRequestSuccessMsg'),
                        icon: 'success',
                        background: '#032e18',
                        color: '#FFFDF5',
                        confirmButtonColor: '#D4AF37',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
                return;
            }

            // Scenario 3: Pending Prayer -> Direct Delete
            if (request.status === 'pending' || request.status === 'rejected') {
                await deletePrayer(id);
            }

            // Remove from local state (Only for true deletes)
            const updated = myRequests.filter(r => r.id !== id);
            setMyRequests(updated);
            localStorage.setItem('myDuaRequests', JSON.stringify(updated));

            // Remove from sticky if it was sticky
            const stickyJson = localStorage.getItem('myLastStickyPrayer');
            if (stickyJson) {
                const sticky = JSON.parse(stickyJson);
                if (sticky.id === id) {
                    localStorage.removeItem('myLastStickyPrayer');
                }
            }

            setShowDeleteToast(true);
            setTimeout(() => setShowDeleteToast(false), 3000);
        } catch (error) {
            console.error("Failed to delete prayer:", error);
            alert(t('deleteError'));
        }
    };

    const handleEditRequest = (id, currentText) => {
        // 1. Set the prayer being edited
        setEditingPrayer({ id, text: currentText });

        // 2. Close history, open form
        setShowHistory(false);
        setShowForm(true);
    };

    const handleUpdateRequest = async (newText) => {
        if (!editingPrayer) return;

        try {
            // 1. Update DB
            await updatePrayer(editingPrayer.id, newText);

            // 2. Update local history state
            const updatedRequests = myRequests.map(req =>
                req.id === editingPrayer.id ? { ...req, text: newText } : req
            );
            setMyRequests(updatedRequests);
            localStorage.setItem('myDuaRequests', JSON.stringify(updatedRequests));

            // 3. Update sticky prayer if this was the one
            const stickyJson = localStorage.getItem('myLastStickyPrayer');
            if (stickyJson) {
                const sticky = JSON.parse(stickyJson);
                if (sticky.id === editingPrayer.id) {
                    const updatedSticky = { ...sticky, text: newText };
                    localStorage.setItem('myLastStickyPrayer', JSON.stringify(updatedSticky));
                }
            }

            // 4. Reset state & UI
            setEditingPrayer(null);
            setShowForm(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);

        } catch (error) {
            console.error("Failed to update prayer:", error);
            alert(t('updateError'));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        <Clock size={12} />
                        {t('statusPending')}
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        <Check size={12} />
                        {t('statusApproved')}
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-900/80 text-red-200 text-[10px] font-bold uppercase tracking-wider rounded-full border border-red-700/50 shadow-sm">
                        <AlertCircle size={12} />
                        {t('statusRejected')}
                    </span>
                );
            case 'delete_requested':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-900/40 text-yellow-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-yellow-700/30">
                        <History size={12} />
                        {t('statusDeleteRequested')}
                    </span>
                );
            case 'deletion_approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-500/20 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-gray-500/30">
                        <Trash2 size={12} />
                        {t('statusDeletionApproved')}
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#032e18] pb-32">
            <div className="max-w-md mx-auto py-8 px-4 space-y-6">
                {/* Featured Quote with Integrated Back Button */}
                <div className="bg-emerald-900 shadow-xl rounded-[2.5rem] p-8 relative overflow-hidden text-center group">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="absolute top-6 left-6 bg-black/20 hover:bg-black/30 text-white backdrop-blur-md rounded-full z-20 transition-all shadow-sm border border-white/10"
                    >
                        <ChevronLeft size={24} />
                    </Button>

                    {/* Amin Kumbarası Badge */}
                    {!isPremium() && (
                        <div className="absolute top-6 right-6 z-20">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-islamic-gold/30 shadow-lg">
                                <Coins size={14} className="text-islamic-gold" />
                                <span className="text-sm font-bold text-islamic-gold">{credits}</span>
                            </div>
                            <AnimatePresence>
                                {showCreditAnim && (
                                    <motion.span
                                        initial={{ opacity: 1, y: 0 }}
                                        animate={{ opacity: 0, y: -20 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1 }}
                                        className="absolute -top-4 right-0 text-sm font-black text-emerald-400"
                                    >
                                        +1
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-islamic-gold/10 to-transparent" />
                    <Sparkles className="mx-auto text-islamic-gold mb-4 opacity-50 group-hover:scale-110 transition-transform duration-700" size={32} />
                    <p className="font-serif italic text-emerald-50 text-xl leading-relaxed relative z-10">
                        {t('headerQuote')}
                    </p>
                    <p className="text-islamic-gold/60 text-xs mt-4 font-bold uppercase tracking-widest relative z-10">{t('headerSource')}</p>
                </div>

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
                                <p className="font-bold">{t('successTitle')}</p>
                                <p className="text-sm text-emerald-100">{t('successDesc')}</p>
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
                            <p className="font-medium">{t('deleteToast')}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Prayer Feed */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('feedTitle')}</h3>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('live', 'Canlı')}</span>
                        </div>
                    </div>{
                        allDuas.length === 0 ? (
                            <div className="text-center py-10 opacity-60">
                                <p className="text-sm text-gray-400">{t('emptyFeed')}</p>
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
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest">
                                                            {dua.isSticky ? t('yourPrayer') : t('brotherSays')}
                                                        </p>
                                                        {dua.isSticky && (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-islamic-gold/20 text-islamic-gold text-[8px] font-black rounded-full uppercase tracking-tighter">
                                                                {t('pinned')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-900 dark:text-white font-serif text-lg leading-relaxed italic">
                                                        "{dua.text}"
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-white/5">
                                                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                                    <MessageCircle size={16} />
                                                    <span className="text-xs font-bold">{t('peopleSaidAmin', { count: dua.aminCount || dua.count || 0 })}</span>
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
                                                    {isAmined ? t('amin') : t('amin')}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )
                    }
                </div >

                {/* Add Own Dua - Floating Action Style */}
                <div className="bg-white dark:bg-white/5 border border-islamic-gold/20 p-6 rounded-[2.5rem] text-center shadow-lg space-y-3">
                    <p className="text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-4">{t('joinQuestion')}</p>

                    <Button
                        onClick={() => {
                            if (!isPremium() && credits < CREDIT_COSTS.POST_DUA) {
                                setShowPaywall(true);
                                return;
                            }
                            setShowForm(true);
                        }}
                        className="w-full h-14 bg-transparent border-2 border-dashed border-islamic-gold text-islamic-gold rounded-2xl hover:bg-islamic-gold/5 font-bold gap-2"
                    >
                        <Send size={18} />
                        {t('sendRequest')}
                    </Button>

                    {/* Reklam İzle - Kredi Kazan */}
                    {!isPremium() && (
                        <Button
                            onClick={async () => {
                                setIsAdLoading(true);
                                try {
                                    const adResult = await showRewardedAd();
                                    if (adResult?.rewarded) {
                                        const newCreds = addCredit(CREDIT_COSTS.AD_REWARD);
                                        setCredits(newCreds);
                                        setShowCreditAnim(true);
                                        setTimeout(() => setShowCreditAnim(false), 1200);
                                        Swal.fire({
                                            title: `<span class="text-emerald-400 font-serif">${t('adSuccessTitle')}</span>`,
                                            html: `<p class="text-[#FFFDF5]/80 font-serif">${t('adSuccessTotalMsg', { reward: CREDIT_COSTS.AD_REWARD, credits: newCreds })}</p>`,
                                            icon: 'success',
                                            iconColor: '#10b981',
                                            background: '#032e18',
                                            confirmButtonText: t('adSuccessBtn'),
                                            confirmButtonColor: '#D4AF37',
                                            customClass: {
                                                popup: 'rounded-[2rem] border border-emerald-500/20 shadow-2xl',
                                                confirmButton: 'rounded-full px-8 py-3 font-bold text-[#021a0f]'
                                            },
                                            backdrop: 'rgba(0,0,0,0.85)',
                                            timer: 2500
                                        });
                                    }
                                } catch {
                                    Swal.fire({
                                        title: `<span class="text-red-400 font-serif">${t('adFailTitle')}</span>`,
                                        html: `<p class="text-[#FFFDF5]/60 font-serif">${t('adFailMsg')}</p>`,
                                        icon: 'error',
                                        iconColor: '#ef4444',
                                        background: '#032e18',
                                        confirmButtonText: t('adSuccessBtn'),
                                        confirmButtonColor: '#D4AF37',
                                        customClass: {
                                            popup: 'rounded-[2rem] border border-red-500/20 shadow-2xl',
                                            confirmButton: 'rounded-full px-8 py-3 font-bold text-[#021a0f]'
                                        },
                                        backdrop: 'rgba(0,0,0,0.85)'
                                    });
                                } finally {
                                    setIsAdLoading(false);
                                }
                            }}
                            disabled={isAdLoading}
                            className="w-full h-12 bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 border border-emerald-500/30 text-emerald-400 rounded-2xl font-bold gap-2 hover:from-emerald-600/30 hover:to-emerald-700/30 disabled:opacity-50 transition-all"
                        >
                            <Film size={16} />
                            {isAdLoading ? t('adLoading') : t('watchAd', { reward: CREDIT_COSTS.AD_REWARD })}
                        </Button>
                    )}
                    {
                        myRequests.length > 0 && (
                            <Button
                                onClick={() => setShowHistory(true)}
                                variant="ghost"
                                className="w-full h-12 text-gray-500 dark:text-gray-400 rounded-2xl font-medium gap-2 hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                                <History size={18} />
                                {t('myRequests')} ({myRequests.length})
                            </Button>
                        )
                    }
                </div >

                {/* Prayer Request Form Modal */}
                < AnimatePresence >
                    {showForm && (
                        <DuaIstegiFormu
                            t={t}
                            initialText={editingPrayer ? editingPrayer.text : ''}
                            mode={editingPrayer ? 'edit' : 'create'}
                            onSubmit={editingPrayer ? handleUpdateRequest : handleSubmitRequest}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingPrayer(null); // Reset edit state on cancel
                            }}
                        />
                    )}
                </AnimatePresence >

                {/* History Modal */}
                < AnimatePresence >
                    {showHistory && (
                        <DuaIstekleriGecmisi
                            t={t}
                            requests={myRequests}
                            onDelete={handleDeleteRequest}
                            onEdit={handleEditRequest}
                            onClose={() => setShowHistory(false)}
                            getStatusBadge={getStatusBadge}
                        />
                    )}
                </AnimatePresence >

                {/* Credit Paywall Modal */}
                <CreditPaywallModal
                    isOpen={showPaywall}
                    onClose={() => setShowPaywall(false)}
                    credits={credits}
                    cost={CREDIT_COSTS.POST_DUA}
                    adReward={CREDIT_COSTS.AD_REWARD}
                    onGoPremium={() => {
                        setShowPaywall(false);
                        navigate('/premium');
                    }}
                    onEarnAmin={() => {
                        setShowPaywall(false);
                    }}
                    onWatchAd={async () => {
                        setShowPaywall(false);
                        setIsAdLoading(true);
                        try {
                            const adResult = await showRewardedAd();
                            if (adResult?.rewarded) {
                                const newCreds = addCredit(CREDIT_COSTS.AD_REWARD);
                                setCredits(newCreds);
                                Swal.fire({
                                    title: `<span class="text-emerald-400 font-serif">${t('adSuccessTitle')}</span>`,
                                    html: `<p class="text-[#FFFDF5]/80 font-serif">${t('adSuccessMsg', { reward: CREDIT_COSTS.AD_REWARD, credits: newCreds })}</p>`,
                                    icon: 'success',
                                    iconColor: '#10b981',
                                    background: '#032e18',
                                    confirmButtonText: t('adSuccessBtn'),
                                    confirmButtonColor: '#D4AF37',
                                    customClass: {
                                        popup: 'rounded-[2rem] border border-emerald-500/20 shadow-2xl',
                                        confirmButton: 'rounded-full px-8 py-3 font-bold text-[#021a0f]'
                                    },
                                    backdrop: 'rgba(0,0,0,0.85)',
                                    timer: 2500
                                });
                            }
                        } catch {
                            Swal.fire({
                                title: `<span class="text-red-400 font-serif">${t('adFailTitle')}</span>`,
                                html: `<p class="text-[#FFFDF5]/60 font-serif">${t('adFailMsg')}</p>`,
                                icon: 'error',
                                iconColor: '#ef4444',
                                background: '#032e18',
                                confirmButtonText: t('adSuccessBtn'),
                                confirmButtonColor: '#D4AF37',
                                customClass: {
                                    popup: 'rounded-[2rem] border border-red-500/20 shadow-2xl',
                                    confirmButton: 'rounded-full px-8 py-3 font-bold text-[#021a0f]'
                                },
                                backdrop: 'rgba(0,0,0,0.85)'
                            });
                        } finally {
                            setIsAdLoading(false);
                        }
                    }}
                />
            </div >
        </div>
    );
}

// Prayer Request Form Component
function DuaIstegiFormu({ onSubmit, onCancel, initialText = '', mode = 'create', t }) {
    const [text, setText] = useState(initialText);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        const trimmedText = text.trim();
        if (trimmedText.length < 10 || trimmedText.length > 200) return;

        setIsSubmitting(true);
        await onSubmit(trimmedText);
        // Parent handles closing and state reset
        setIsSubmitting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 80 || info.velocity.y > 400) {
                        onCancel();
                    }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-[#fdfaf5] dark:bg-[#032e18] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-4" />
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">
                                {mode === 'edit' ? t('formTitleEdit') : t('formTitleCreate')}
                            </h2>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {mode === 'edit' ? t('formSubEdit') : t('formSubCreate')}
                            </p>
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
                            {t('formPrivacyNote')}
                        </p>
                    </div>

                    {/* Text Area */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                {t('formLabel')}
                            </label>
                            <span className={cn(
                                "text-[10px] font-bold tracking-widest",
                                text.length > 190 ? "text-red-500" : "text-gray-400 dark:text-gray-500"
                            )}>
                                {text.length}/200
                            </span>
                        </div>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t('formPlaceholder')}
                            rows={6}
                            maxLength={200}
                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-islamic-green dark:focus:ring-islamic-gold focus:border-transparent transition-all resize-none font-serif text-lg leading-relaxed"
                        />
                        <div className="flex justify-between text-[11px] font-medium text-gray-400 dark:text-gray-500 px-1">
                            <span>{t('formCharLimit')}</span>
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
                                {mode === 'edit' ? t('formUpdating') : t('formSubmitting')}
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                {mode === 'edit' ? t('formUpdateBtn') : t('formSubmitBtn')}
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onCancel}
                        variant="ghost"
                        className="w-full h-12 text-gray-500 dark:text-gray-400 rounded-2xl font-bold"
                    >
                        {t('formCancel')}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// History Modal Component
function DuaIstekleriGecmisi({ requests, onDelete, onEdit, onClose, getStatusBadge, t }) {
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
                            <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">{t('historyTitle')}</h2>
                            <p className="text-sm text-gray-400 dark:text-gray-500">{t('historyCount', { count: requests.length })}</p>
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
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('historyEmpty')}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('historyEmptyHint')}</p>
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
                                            <div className="flex items-center gap-2">
                                                {request.status === 'pending' && (
                                                    <Button
                                                        onClick={() => onEdit(request.id, request.text)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-islamic-green dark:text-islamic-gold hover:bg-islamic-green/10 dark:hover:bg-islamic-gold/10 gap-2 h-9 px-4 rounded-xl"
                                                    >
                                                        <Pencil size={14} />
                                                        {t('historyEdit')}
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => onDelete(request.id)}
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={request.status === 'delete_requested'}
                                                    className={cn(
                                                        "gap-2 h-9 px-4 rounded-xl",
                                                        request.status === 'delete_requested'
                                                            ? "text-gray-500 bg-gray-100/10 opacity-50 cursor-not-allowed"
                                                            : "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                    )}
                                                >
                                                    <Trash2 size={14} />
                                                    {request.status === 'delete_requested' ? t('historyDeleteRequested') : t('historyDelete')}
                                                </Button>
                                            </div>
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
                        {t('historyClose')}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
