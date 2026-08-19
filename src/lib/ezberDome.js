/**
 * Ezber kubbesi — bitiş ekranındaki taş yerleşimi ve yıldız geometrisi.
 *
 * Kubbe, ezberlenen sureleri gösterir: her sure bir taş. Konumlar ELLE
 * yazılmaz, sure sayısından üretilir — bugün 12 sure var, listeye 30 sure
 * eklenince kompozisyon kendi kendine dizilir.
 *
 * Yıldız formu: sekiz köşeli Selçuklu karosu ("kesme yıldız"). Ezberlenen taş
 * dolu gövde + merkezde sekizgen oyuk; ezberlenmeyen aynı formun boş konturu.
 * Oyuklar ters sarımlı alt yolla açılır (nonzero) — üste ikinci bir şekil
 * boyamak SVG'de delik açmaz, aksine parlak leke yapar.
 */

/** Çizim alanı (viewBox) ve kubbe yayının elipsi. */
export const DOME_VIEW = { w: 346, h: 236 };
const CX = 173;
const CY = 200;          // yayın merkezi = etek hizası
const RX = 152;
const RY = 162;
const Y_TOP = 60;        // en üst taş sırası
const Y_BOTTOM = 192;    // en alt taş sırası
const EDGE = 16;         // taşın kemere değmemesi için kenar payı

const rad = (deg) => (deg * Math.PI) / 180;
const fmt = (n) => Number(n.toFixed(3));

function point(r, deg) {
    return [fmt(r * Math.cos(rad(deg))), fmt(r * Math.sin(rad(deg)))];
}

function toPath(points) {
    return `M ${points.map(([x, y]) => `${x},${y}`).join(' L ')} Z`;
}

/** n köşeli yıldız: dış yarıçap R, iç vadi R*ratio. */
function starPoints(n, R, ratio, a0 = -90) {
    const out = [];
    for (let i = 0; i < n; i++) {
        out.push(point(R, a0 + (i * 360) / n));
        out.push(point(R * ratio, a0 + ((i + 0.5) * 360) / n));
    }
    return out;
}

/** Düzgün çokgen. `reverse` ters sarım verir — nonzero'da delik açar. */
function polygonPoints(n, r, a0 = 0, reverse = false) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(point(r, a0 + (i * 360) / n));
    return reverse ? out.reverse() : out;
}

const RATIO = 0.617;                       // Selçuklu karosunun sivrilik oranı

/** Ezberlenen taş: dış faset konturu + dolu gövde + sekizgen oyuk. */
export const STAR_SOLID = {
    facet: toPath(starPoints(8, 11.3, RATIO)),
    body: `${toPath(starPoints(8, 8.0, RATIO))} ${toPath(polygonPoints(8, 2.7, 22.5, true))}`,
};

/** Ezberlenmemiş taş: aynı formun boş konturu (kullanıcı seçimi 2026-08-18). */
export const STAR_HOLLOW = toPath(starPoints(8, 10.4, RATIO));

/** Yayın y yüksekliğindeki yarı genişliği. */
function halfWidthAt(y) {
    const dy = (CY - y) / RY;
    const k = 1 - dy * dy;
    return k <= 0 ? 0 : RX * Math.sqrt(k) - EDGE;
}

/** Taş sayısına göre aralık — çok taş varsa sıklaşır, az taşta ferah durur. */
function spacingFor(n) {
    if (n <= 12) return 40;
    if (n <= 20) return 36;
    if (n <= 30) return 34;
    if (n <= 42) return 30;
    return 27;
}

/**
 * n taşı kubbe yayının içine dizer.
 *
 * Sıralar yukarıdan aşağı genişler (yayın kendi eğrisi); her sıraya o
 * yükseklikte kaç taş sığıyorsa o kadar konur, kalan taş kalmayana dek
 * devam edilir. Dönen dizi ekrana çizim sırasıyla aynıdır: 0. eleman ilk
 * ezberlenen sure.
 */
export function buildDomeSlots(total) {
    const n = Math.max(0, Math.floor(total) || 0);
    if (!n) return { slots: [], scale: 1 };

    const step = spacingFor(n);
    const scale = Math.min(1, step / 34);

    // Kaç sıra gerekiyor: sığdıkça sıra ekle
    const rowsFor = (rowCount) => {
        const ys = [];
        for (let i = 0; i < rowCount; i++) {
            const t = rowCount === 1 ? 0.5 : i / (rowCount - 1);
            ys.push(Y_TOP + t * (Y_BOTTOM - Y_TOP));
        }
        return ys.map(y => ({ y, cap: Math.max(1, Math.floor((2 * halfWidthAt(y)) / step) + 1) }));
    };

    let rows = [];
    for (let r = 1; r <= 8; r++) {
        rows = rowsFor(r);
        const cap = rows.reduce((a, b) => a + b.cap, 0);
        if (cap >= n) break;
    }

    // Taşları sıralara dağıt: her sıra kapasitesine kadar, üstten aşağı
    const capTotal = rows.reduce((a, b) => a + b.cap, 0);
    let left = n;
    const counts = rows.map((row, i) => {
        const share = i === rows.length - 1 ? left : Math.min(row.cap, Math.round((row.cap / capTotal) * n));
        const take = Math.max(0, Math.min(row.cap, share, left));
        left -= take;
        return take;
    });
    // Yuvarlama artığı kaldıysa alttan yukarı doğru yerleştir
    for (let i = rows.length - 1; i >= 0 && left > 0; i--) {
        const room = rows[i].cap - counts[i];
        const add = Math.min(room, left);
        counts[i] += add;
        left -= add;
    }

    const slots = [];
    rows.forEach((row, i) => {
        const c = counts[i];
        if (!c) return;
        const span = (c - 1) * step;
        const x0 = CX - span / 2;
        for (let k = 0; k < c; k++) slots.push({ x: fmt(x0 + k * step), y: fmt(row.y) });
    });

    return { slots: slots.slice(0, n), scale };
}

/** Kubbe kemerleri — üç iç içe yay (uygulamanın mihrap motifi). */
export const DOME_ARCHES = [
    'M21 214 L21 200 A152 162 0 0 1 325 200 L325 214',
    'M35 214 L35 200 A138 148 0 0 1 311 200 L311 214',
    'M49 214 L49 200 A124 134 0 0 1 297 200 L297 214',
];
