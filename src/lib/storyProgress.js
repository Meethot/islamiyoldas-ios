// Hikaye dinleme ilerlemesi (localStorage). Kritik veri değil, yedeklenmez.
const KEY = 'story_progress_v1';
const DONE_RATIO = 0.9;   // %90'ı dinlendiyse tamamlandı say
const MIN_RESUME = 10;    // ilk 10 sn'de kaldıysa baştan başlat
const TAIL_MARGIN = 15;   // sona 15 sn kala kaldıysa da baştan başlat

const read = () => {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const write = (data) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
        // kota dolu / private mode — ilerleme kaybı kritik değil
    }
};

export const getAllStoryProgress = () => read();

// { t: kalınan saniye, d: toplam süre, done: bool } veya null
export const getStoryProgress = (id) => read()[id] || null;

export const saveStoryProgress = (id, time, duration) => {
    if (id === undefined || id === null) return;
    if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) return;

    const data = read();
    const done = (data[id]?.done ?? false) || time >= duration * DONE_RATIO;
    data[id] = { t: done ? 0 : Math.floor(time), d: Math.floor(duration), done, at: Date.now() };
    write(data);
};

export const markStoryDone = (id, duration) => {
    if (id === undefined || id === null) return;
    const data = read();
    data[id] = { t: 0, d: Math.floor(duration) || data[id]?.d || 0, done: true, at: Date.now() };
    write(data);
};

// Devam edilecek saniye; baştan başlanacaksa 0
export const getResumeTime = (id, duration) => {
    const entry = getStoryProgress(id);
    if (!entry || entry.done) return 0;
    const limit = Number.isFinite(duration) && duration > 0 ? duration - TAIL_MARGIN : Infinity;
    if (entry.t < MIN_RESUME || entry.t >= limit) return 0;
    return entry.t;
};

// Kartta gösterilecek yüzde (0-100)
export const progressPercent = (entry) => {
    if (!entry) return 0;
    if (entry.done) return 100;
    if (!entry.d) return 0;
    return Math.min(100, Math.round((entry.t / entry.d) * 100));
};
