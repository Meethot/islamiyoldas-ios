/**
 * Abdest, gusül ve teyemmüm adımlarının hüküm ve görsel eşlemesi.
 *
 * Eşleme adımın `id` alanına bağlıdır, İNDEKSE DEĞİL. İndeks tabanlı olsaydı
 * bir dil dosyasında sıra kayınca rozet, görsel ve "kısa mod" sessizce başka
 * adıma bağlanırdı — dua ve sure listelerinde aynı varsayım iki kez yanıldı.
 * `id`'ler altı dil dosyasına da yazıldı ve testle doğrulanıyor.
 *
 * Bir adımın `id`'si tabloda yoksa meta null döner: rozet ve görsel çıkmaz,
 * kart yine de düzgün çizilir.
 */

export const RANK = { FARZ: 'farz', SUNNET: 'sunnet', MUSTEHAB: 'mustehab' };

/**
 * `rank: null` → bilgi adımı, fıkhî bir derecesi yok, rozet gösterilmez
 * (ör. "Gusül ne zaman gerekir?").
 *
 * `short` → abdest sihirbazının "Kısa · farzlar" modunda görünen adımlar.
 * Rank'tan TÜRETİLMEZ: niyet Hanefi'de sünnettir ama kısa modda durur, çünkü
 * niyetsiz bir abdest akışı yeni başlayana anlamsız görünür. Açık bayrak,
 * sessiz kural yok.
 *
 * NOT: niyet Hanefi'de sünnet, Şafii'de farzdır. Rozet Hanefi'ye göre yazılır;
 * fark adımın kendi ipuçlarında belirtilir.
 */
const STEPS = {
    // ── Abdest ──────────────────────────────────────────────────────────
    'wudu-niyet': { rank: RANK.SUNNET, image: null, short: true },
    'wudu-besmele': { rank: RANK.SUNNET, image: null },
    'wudu-eller': { rank: RANK.SUNNET, image: 'abdest-01-eller' },
    'wudu-misvak': { rank: RANK.MUSTEHAB, image: 'abdest-02-misvak' },
    'wudu-agiz': { rank: RANK.SUNNET, image: 'abdest-03-agiz' },
    'wudu-burun': { rank: RANK.SUNNET, image: 'abdest-04-burun' },
    'wudu-yuz': { rank: RANK.FARZ, image: 'abdest-05-yuz', short: true },
    'wudu-sag-kol': { rank: RANK.FARZ, image: 'abdest-06-kol', short: true },
    'wudu-sol-kol': { rank: RANK.FARZ, image: 'abdest-06-kol', short: true },
    'wudu-bas-mesh': { rank: RANK.FARZ, image: 'abdest-07-bas-mesh', short: true },
    'wudu-kulak': { rank: RANK.SUNNET, image: 'abdest-08-kulak' },
    'wudu-boyun': { rank: RANK.MUSTEHAB, image: 'abdest-09-boyun' },
    'wudu-sag-ayak': { rank: RANK.FARZ, image: 'abdest-10-ayak', short: true },
    'wudu-sol-ayak': { rank: RANK.FARZ, image: 'abdest-10-ayak', short: true },
    'wudu-bitis-dua': { rank: RANK.MUSTEHAB, image: null },

    // ── Gusül ───────────────────────────────────────────────────────────
    // Farz olan üçtür: ağza su, burna su, suyun tüm bedene ulaşması.
    'gusul-ne-zaman': { rank: null, image: null },
    'gusul-niyet': { rank: RANK.SUNNET, image: null },
    // Avret mahalli adımında görsel YOK — mahremiyet.
    'gusul-eller-avret': { rank: RANK.SUNNET, image: null },
    'gusul-abdest': { rank: RANK.SUNNET, image: null },
    'gusul-agiz': { rank: RANK.FARZ, image: 'gusul-01-agiz-burun' },
    'gusul-burun': { rank: RANK.FARZ, image: 'gusul-01-agiz-burun' },
    'gusul-beden': { rank: RANK.FARZ, image: 'gusul-02-beden' },

    // ── Teyemmüm ────────────────────────────────────────────────────────
    // Niyet teyemmümde FARZDIR (abdestten farkı burada).
    'tey-ne-zaman': { rank: null, image: null },
    'tey-niyet-vurus': { rank: RANK.FARZ, image: 'teyemmum-01-toprak' },
    'tey-yuz': { rank: RANK.FARZ, image: 'teyemmum-02-mesh' },
    'tey-kollar': { rank: RANK.FARZ, image: 'teyemmum-02-mesh' },
};

/** Bir adımın metadata'sı; tanınmayan adımda null. */
export function wuduMeta(step) {
    const id = step && typeof step === 'object' ? step.id : step;
    return (typeof id === 'string' && STEPS[id]) || null;
}

/** Görsel yolu — dosya yoksa `<img onError>` gizler, kart bozulmaz. */
export function stepImage(meta) {
    return meta?.image ? `/images/abdest/${meta.image}.webp` : null;
}

export const WUDU_STEPS = STEPS;
