import { Capacitor, registerPlugin } from '@capacitor/core';

// Kilit ekranı / bildirim medya kartı
// iOS: ios/App/App/NowPlayingPlugin.swift · Android: MediaNotificationService.java
const NowPlaying = Capacitor.isNativePlatform() ? registerPlugin('NowPlaying') : null;

export const hasNowPlaying = () => !!NowPlaying && ['ios', 'android'].includes(Capacitor.getPlatform());

// Kapak görselini base64'e çevir (köprüden geçebilmesi için). Görsel başına bir kez.
const artworkCache = new Map();

export const loadArtwork = async (url) => {
    if (!url) return null;
    if (artworkCache.has(url)) return artworkCache.get(url);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('artwork fetch failed');
        const blob = await response.blob();
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        artworkCache.set(url, base64);
        return base64;
    } catch {
        artworkCache.set(url, null);
        return null;
    }
};

// Kapak base64'ü büyük (~100 KB) — her güncellemede köprüden geçmesin, değişince gönder.
// Native taraf sonuncuyu saklıyor.
let lastSentArtwork = null;

export const setNowPlaying = (info) => {
    if (!hasNowPlaying()) return Promise.resolve();

    const { artwork, ...rest } = info;
    const payload = { ...rest };
    if (artwork && artwork !== lastSentArtwork) {
        payload.artwork = artwork;
        lastSentArtwork = artwork;
    }
    return NowPlaying.setNowPlaying(payload).catch(() => {});
};

export const clearNowPlaying = () => {
    lastSentArtwork = null;
    if (!hasNowPlaying()) return Promise.resolve();
    return NowPlaying.clearNowPlaying().catch(() => {});
};

// --- WebView medya oturumu (iOS kilit ekranı kartının GERÇEK sahibi) ---
// iOS'ta sayfadaki <audio> çalarken WKWebView kendi Now Playing bilgisini yayınlar ve
// MPNowPlayingInfoCenter'a yazdıklarımızı EZER. Başlık/kapak/tuşlar bu yüzden burada da
// kurulmalı. Ayrıca eylem handler'ları sayfa geneli: temizlenmezse eski sayfanın ses
// elementini durdurmaya çalışır (kilit ekranında "pause çalışmıyor" bunun sonucu).
const MEDIA_ACTIONS = ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'seekto', 'previoustrack', 'nexttrack'];

const hasMediaSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

const absoluteUrl = (url) => {
    try {
        return new URL(url, window.location.href).href;
    } catch {
        return null;
    }
};

export const setMediaSessionMetadata = ({ title, artist, album, artworkUrl, artworkSize = '400x400' }) => {
    if (!hasMediaSession() || typeof MediaMetadata === 'undefined') return;

    const src = artworkUrl ? absoluteUrl(artworkUrl) : null;
    const artwork = src
        ? [{ src, sizes: artworkSize, type: src.endsWith('.webp') ? 'image/webp' : 'image/jpeg' }]
        : [];

    try {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title || '',
            artist: artist || '',
            album: album || '',
            artwork,
        });
    } catch { /* eski WebView: MediaMetadata yok */ }
};

export const setMediaSessionState = ({ isPlaying, duration, position, playbackRate = 1 }) => {
    if (!hasMediaSession()) return;

    try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch { /* desteklenmiyor */ }

    // Geçersiz süre/konumda setPositionState istisna atar — önce doğrula
    if (typeof navigator.mediaSession.setPositionState !== 'function') return;
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(position)) return;

    try {
        navigator.mediaSession.setPositionState({
            duration,
            position: Math.min(Math.max(position, 0), duration),
            playbackRate: Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1,
        });
    } catch { /* desteklenmiyor */ }
};

// Verilmeyen eylemler NULL'lanır: başka sayfadan kalan handler asla ayakta kalmaz
export const setMediaSessionHandlers = (handlers = {}) => {
    if (!hasMediaSession()) return;
    MEDIA_ACTIONS.forEach((action) => {
        const fn = typeof handlers[action] === 'function' ? handlers[action] : null;
        try {
            navigator.mediaSession.setActionHandler(action, fn);
        } catch { /* bu eylem bu platformda yok */ }
    });
};

export const clearMediaSession = () => {
    if (!hasMediaSession()) return;
    setMediaSessionHandlers({});
    try { navigator.mediaSession.metadata = null; } catch { /* desteklenmiyor */ }
    try { navigator.mediaSession.playbackState = 'none'; } catch { /* desteklenmiyor */ }
};

// { remotePlay, remotePause, remoteSkipForward, remoteSkipBackward } → temizleyici döner
export const addNowPlayingListeners = async (handlers) => {
    if (!hasNowPlaying()) return () => {};

    const entries = Object.entries(handlers).filter(([, fn]) => typeof fn === 'function');
    const listeners = await Promise.all(
        entries.map(([event, fn]) => NowPlaying.addListener(event, fn))
    );

    return () => listeners.forEach((listener) => listener?.remove?.());
};

