import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';

/**
 * Android donanım geri tuşunu geçici olarak yakalar.
 *
 * Uygulamada başka `backButton` dinleyicisi yok; bu hook olmadan sayfa
 * üstünde açılan bir katman (ör. dua tabakası) geri tuşuyla kapanmaz,
 * kullanıcı doğrudan uygulamadan çıkar.
 *
 * `onBack` bir ref'te tutulur: çağıran taraf fonksiyonu memoize etmese bile
 * dinleyici her render'da sökülüp takılmaz (o aralıkta basılan geri tuşu
 * Capacitor varsayılanına düşerdi).
 *
 * @param {boolean} active Dinleyici kurulsun mu
 * @param {() => void} onBack Geri tuşuna basılınca çalışır
 */
export function useHardwareBack(active, onBack) {
    const handlerRef = useRef(onBack);
    useEffect(() => { handlerRef.current = onBack; }, [onBack]);

    useEffect(() => {
        if (!active) return;
        let handle;
        let cancelled = false;
        App.addListener('backButton', () => handlerRef.current?.())
            .then(h => { if (cancelled) h.remove(); else handle = h; })
            .catch(() => { /* web / plugin yok */ });
        return () => { cancelled = true; handle?.remove(); };
    }, [active]);
}
