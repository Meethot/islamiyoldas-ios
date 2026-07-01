import { useState, useEffect, useCallback } from 'react';
import { PopupManager } from '@/utils/popupManager';

/**
 * PopupManager ile entegre çalışan custom hook.
 * Belirtilen ID'ye sahip popup'ın sırası geldiğinde `isActive` true olur.
 * @param {string} myId - Popup'ın benzersiz kimliği
 */
export function usePopup(myId) {
    const [isActive, setIsActive] = useState(() => PopupManager.getActivePopupId() === myId);

    useEffect(() => {
        // Durum değişikliklerini dinle
        const unsubscribe = PopupManager.subscribe((activeId) => {
            setIsActive(activeId === myId);
        });

        return () => {
            unsubscribe();
            // Component unmount olduğunda, eğer bu popup aktifse veya kuyruktaysa kendini temizle
            PopupManager.dismiss(myId);
        };
    }, [myId]);

    // Popup'ı göstermek için sıraya gir
    const requestShow = useCallback(() => {
        PopupManager.requestShow(myId);
    }, [myId]);

    // Popup'ı kapat ve sıradakine geç
    const dismiss = useCallback(() => {
        PopupManager.dismiss(myId);
    }, [myId]);

    return { isActive, requestShow, dismiss };
}
