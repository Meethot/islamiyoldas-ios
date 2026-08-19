/**
 * Uygulama içi ipuçlarının (HintCoach) ortak durumu.
 *
 * Her ipucu kullanıcı başına BİR KEZ gösterilir; hangilerinin gösterildiği tek bir
 * localStorage anahtarında tutulur. Test bayrağı da burada — birden çok sayfada
 * ipucu olduğu için tek yerden açılıp kapanmalı.
 */

// ⚠️ TEST — CANLIYA ÇIKMADAN `false` YAP.
// true iken "görüldü" kaydı ne okunur ne yazılır: ipuçları her seferinde çıkar.
// false yapıldığında kayıt temiz olduğu için herkes ipucunu normal şekilde bir kez görür.
export const HINT_TEST_MODE = true;

const STORE_KEY = 'app_hints_seen';

export function readSeenHints() {
    if (HINT_TEST_MODE) return {};
    try {
        const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

export function markHintSeen(id) {
    if (HINT_TEST_MODE || !id) return readSeenHints();
    const next = { ...readSeenHints(), [id]: true };
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
        // kota dolu / gizli mod: ipucu yine kapanır, sadece kalıcı olmaz
    }
    return next;
}
