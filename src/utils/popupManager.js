let queue = [];
let activePopupId = null;
let isProcessingDelay = false;
const listeners = new Set();

/**
 * Bildirimleri tüm dinleyicilere iletir.
 */
function notifyListeners() {
    listeners.forEach((listener) => listener(activePopupId));
}

/**
 * Kuyruktaki bir sonraki popup'ı işler.
 */
function processQueue() {
    if (activePopupId === null && queue.length > 0 && !isProcessingDelay) {
        // En eski isteği (FIFO) al
        activePopupId = queue.shift();
        notifyListeners();
    }
}

/**
 * Global Popup (Modal) Yöneticisi
 * Aynı anda birden fazla popup'ın üst üste binmesini (çakışmasını) engeller.
 */
export const PopupManager = {
    /**
     * Bir popup'ın gösterilmesi için sıraya girer.
     * @param {string} id - Popup'ın benzersiz kimliği (örn: 'review_prompt')
     */
    requestShow: (id) => {
        // Eğer zaten bu id aktifse veya kuyruktaysa tekrar ekleme
        if (activePopupId !== id && !queue.includes(id)) {
            queue.push(id);
            processQueue();
        }
    },

    /**
     * Aktif popup'ı kapatır ve sıradakine geçer.
     * @param {string} id - Kapatılan popup'ın kimliği
     */
    dismiss: (id) => {
        if (activePopupId === id) {
            activePopupId = null;
            notifyListeners(); // Kapanma animasyonunu hemen başlat
            
            // Sıradaki popup'ı göstermeden önce 0.5 saniye (500ms) bekle
            isProcessingDelay = true;
            setTimeout(() => {
                isProcessingDelay = false;
                processQueue();
            }, 500);
        } else if (queue.includes(id)) {
            // Eğer henüz ekranda değilse ama kuyruktan iptal edilmek isteniyorsa
            queue = queue.filter(item => item !== id);
        }
    },

    /**
     * Belirli bir popup'ın durumunu dinlemek için abone olur.
     * @param {function} listener - Durum değiştiğinde çağrılacak fonksiyon
     * @returns {function} Aboneliği iptal etme fonksiyonu (cleanup)
     */
    subscribe: (listener) => {
        listeners.add(listener);
        // İlk bağlantı anında mevcut durumu bildir
        listener(activePopupId);
        return () => {
            listeners.delete(listener);
        };
    },

    /**
     * O an ekranda açık olan popup'ın IDsini döndürür.
     */
    getActivePopupId: () => activePopupId,
    
    /**
     * Kuyruktaki tüm popupları siler ve aktif olanı kapatır (Acil durumlar için)
     */
    clearAll: () => {
        queue = [];
        activePopupId = null;
        notifyListeners();
    }
};
