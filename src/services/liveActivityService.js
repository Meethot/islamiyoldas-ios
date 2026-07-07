import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * "Son Teklif" Live Activity köprüsü (iOS 16.1+).
 * Native taraf: ios/App/App/LiveActivityPlugin.swift
 * Kilit ekranı + Dynamic Island'da geri sayım gösterir; sayaç native akar,
 * uygulama kapansa bile devam eder. Android/web'de sessizce no-op.
 */
const LiveActivity = Capacitor.getPlatform() === 'ios' ? registerPlugin('LiveActivity') : null;

/**
 * Geri sayımı başlatır. Var olan aktiviteyi kapatıp yenisini açar (native tarafta).
 * @param {number} endTimestamp — teklifin bitiş anı (Date.now() ms)
 * @param {{title?: string, message?: string}} texts — i18n metinleri
 * @returns {Promise<boolean>} başlatıldı mı
 */
export async function startOfferLiveActivity(endTimestamp, texts = {}) {
    if (!LiveActivity) return false;
    try {
        const res = await LiveActivity.startOfferCountdown({
            endTimestamp,
            title: texts.title || 'Son Teklif',
            message: texts.message || '',
        });
        if (!res?.started) console.log('[LiveActivity] başlatılmadı:', res?.reason);
        return !!res?.started;
    } catch (e) {
        // Asla uygulamayı etkilemesin — eski iOS, izin kapalı vb.
        console.warn('[LiveActivity] start hatası:', e?.message || e);
        return false;
    }
}

/** Aktif geri sayım aktivitelerini kapatır (satın alma / süre bitişi). */
export async function endOfferLiveActivity() {
    if (!LiveActivity) return;
    try {
        await LiveActivity.endOfferCountdown();
    } catch (e) {
        console.warn('[LiveActivity] end hatası:', e?.message || e);
    }
}
