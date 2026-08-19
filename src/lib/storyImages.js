import { useEffect, useState } from 'react';

// Hikaye görselleri: public/images/stories/{id}.jpg (yoksa .webp denenir).
// Dosya yoksa kart tema-dolgusuna düşer, bozuk görsel ikonu çıkmaz.
const EXTENSIONS = ['jpg', 'webp'];

// key -> çözülmüş url veya null (görsel yok). Kategori değişimlerinde tekrar denenmesin.
const resolvedCache = new Map();
// aynı görseli iki bileşen aynı anda aramasın
const inFlight = new Map();
// bir görsel çözülünce onu bekleyen TÜM bileşenler haberdar olsun
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

// key = story.image (özel yol) veya story.id (dosya adı kuralı)
const candidatesForKey = (key) => {
    if (key === undefined || key === null) return [];
    if (typeof key === 'string' && !/^\d+$/.test(key)) return [key];
    return EXTENSIONS.map((ext) => `/images/stories/${key}.${ext}`);
};

const probe = (url) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
});

const resolveKey = (key) => {
    if (resolvedCache.has(key)) return Promise.resolve(resolvedCache.get(key));
    if (inFlight.has(key)) return inFlight.get(key);

    const task = (async () => {
        for (const url of candidatesForKey(key)) {
            const ok = await probe(url);
            if (ok) {
                resolvedCache.set(key, url);
                return url;
            }
        }
        resolvedCache.set(key, null);
        return null;
    })().finally(() => {
        inFlight.delete(key);
        notify();
    });

    inFlight.set(key, task);
    return task;
};

// Kapak yolunu bekleyerek çöz (kilit ekranı kartı için — render'a bağlı değil)
export const resolveStoryImage = (story) => {
    const key = story?.image ?? story?.id;
    if (key === undefined || key === null) return Promise.resolve(null);
    return resolveKey(key);
};

export function useStoryImage(story) {
    const key = story?.image ?? story?.id;
    const [, bump] = useState(0);
    const src = resolvedCache.get(key) ?? null;

    // Başka bir bileşen aynı görseli çözerse bu bileşen de güncellensin
    useEffect(() => {
        const onResolved = () => bump((v) => v + 1);
        listeners.add(onResolved);
        return () => listeners.delete(onResolved);
    }, []);

    useEffect(() => {
        if (key === undefined || key === null) return;
        resolveKey(key);
    }, [key]);

    return src;
}
