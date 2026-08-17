import { useEffect, useState } from 'react';

// Hikaye görselleri: public/images/stories/{id}.jpg (yoksa .webp denenir).
// Dosya yoksa kart tema-dolgusuna düşer, bozuk görsel ikonu çıkmaz.
const EXTENSIONS = ['jpg', 'webp'];

// key -> çözülmüş url veya null (görsel yok). Kategori değişimlerinde tekrar denenmesin.
const resolvedCache = new Map();

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

export function useStoryImage(story) {
    const key = story?.image || story?.id;
    // Kaynak render sırasında cache'ten türetilir; state sadece async çözüm gelince tetikler.
    const [, bump] = useState(0);
    const src = resolvedCache.get(key) ?? null;

    useEffect(() => {
        if (resolvedCache.has(key)) return undefined;

        let cancelled = false;
        (async () => {
            for (const url of candidatesForKey(key)) {
                const ok = await probe(url);
                if (cancelled) return;
                if (ok) {
                    resolvedCache.set(key, url);
                    bump((v) => v + 1);
                    return;
                }
            }
            resolvedCache.set(key, null);
            if (!cancelled) bump((v) => v + 1);
        })();

        return () => { cancelled = true; };
    }, [key]);

    return src;
}
