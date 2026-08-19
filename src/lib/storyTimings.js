import { useEffect, useState } from 'react';

// Kelime zaman damgaları: public/data/story-timings/{id}.json → { d: toplamMs, w: [kelimeMs...] }
// Üretim: scripts/hikaye-zamanlama.mjs (whisper.cpp + metin hizalama)
const cache = new Map();
const inFlight = new Map();

// scripts/hikaye-zamanlama.mjs ile AYNI bölme olmalı, yoksa indeksler kayar
export const splitWords = (text) => (text || '').split(/\s+/).filter(Boolean);

const load = (id) => {
    if (cache.has(id)) return Promise.resolve(cache.get(id));
    if (inFlight.has(id)) return inFlight.get(id);

    const task = fetch(`/data/story-timings/${id}.json`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
        .then((data) => {
            const valid = data && Array.isArray(data.w) && data.w.length ? data : null;
            cache.set(id, valid);
            return valid;
        })
        .finally(() => inFlight.delete(id));

    inFlight.set(id, task);
    return task;
};

export function useStoryTimings(story) {
    const id = story?.id;
    const [, bump] = useState(0);
    const timings = cache.get(id) ?? null;

    useEffect(() => {
        if (id === undefined || id === null) return;
        if (cache.has(id)) return;
        load(id).then(() => bump((v) => v + 1));
    }, [id]);

    return timings;
}

// Verilen ana karşılık gelen kelime indeksi (ikili arama). Yoksa -1.
export const wordIndexAt = (times, ms) => {
    if (!times || !times.length || ms < times[0]) return -1;
    let low = 0;
    let high = times.length - 1;
    while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (times[mid] <= ms) low = mid;
        else high = mid - 1;
    }
    return low;
};
