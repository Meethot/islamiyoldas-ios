/**
 * Hikaye seslerinden kelime zaman damgası üretir (okurken sarı takip için).
 *
 * Boru hattı: mp3 indir → 16 kHz wav → whisper.cpp (kelime bazlı) → ASR kelimelerini
 * gerçek hikaye metniyle hizala → public/data/story-timings/{id}.json
 *
 * Çıktı formatı: { "d": toplamSüreMs, "w": [kelime0Ms, ...], "p": [0-31 arası 140 dalga çubuğu] }
 * w[i], hikaye metninin i. kelimesinin başlangıç anı. Metin boşluğa göre bölünür —
 * istemci tarafı da AYNI bölmeyi kullanmalı (src/lib/storyTimings.js → splitWords).
 *
 * Gereksinim: brew install whisper-cpp + ggml model, ffmpeg
 * Kullanım:
 *   node scripts/hikaye-zamanlama.mjs <model_yolu> [calisma_klasoru] [id...]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORIES } from '../src/data/spiritualData.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/data/story-timings');

const model = process.argv[2];
const workDir = process.argv[3] || path.join(ROOT, '.story-audio');
const onlyIds = process.argv.slice(4).map(Number).filter(Boolean);

if (!model || !existsSync(model)) {
    console.error('Kullanım: node scripts/hikaye-zamanlama.mjs <ggml-model.bin> [calisma_klasoru] [id...]');
    process.exit(1);
}

mkdirSync(workDir, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// İstemciyle AYNI olmalı
const splitWords = (text) => text.split(/\s+/).filter(Boolean);

const normalize = (w) => w
    .toLocaleLowerCase('tr')
    .replace(/[''`´"“”«»(),.;:!?…\-—–]/g, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .trim();

// Oynatıcıdaki dalga formu: 16 kHz mono 16-bit wav'dan RMS zarfı (140 çubuk, 0-31)
const WAVE_BARS = 140;
const wavePeaks = (wavPath) => {
    const buf = readFileSync(wavPath);
    const dataIdx = buf.indexOf('data', 12, 'ascii');
    const start = dataIdx > 0 ? dataIdx + 8 : 44;
    const samples = Math.floor((buf.length - start) / 2);
    const perBar = Math.floor(samples / WAVE_BARS);
    if (perBar < 1) return [];

    const peaks = [];
    for (let bar = 0; bar < WAVE_BARS; bar++) {
        let sum = 0;
        const from = start + bar * perBar * 2;
        // her çubukta en fazla 400 örnek yeter, tüm dosyayı taramaya gerek yok
        const step = Math.max(1, Math.floor(perBar / 400));
        let count = 0;
        for (let i = 0; i < perBar; i += step) {
            const v = buf.readInt16LE(from + i * 2) / 32768;
            sum += v * v;
            count++;
        }
        peaks.push(Math.sqrt(sum / Math.max(1, count)));
    }

    // En yüksek çubuğa göre normalize et, 0-31 aralığına indir
    const max = Math.max(...peaks) || 1;
    return peaks.map(p => Math.max(1, Math.round((p / max) * 31)));
};

// En uzun ortak alt dizi → (hikaye kelimesi, ASR kelimesi) eşleşmeleri
const lcsPairs = (a, b) => {
    const n = a.length, m = b.length;
    const dp = new Uint32Array((n + 1) * (m + 1));
    const idx = (i, j) => i * (m + 1) + j;
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[idx(i, j)] = a[i] === b[j]
                ? dp[idx(i + 1, j + 1)] + 1
                : Math.max(dp[idx(i + 1, j)], dp[idx(i, j + 1)]);
        }
    }
    const pairs = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; }
        else if (dp[idx(i + 1, j)] >= dp[idx(i, j + 1)]) i++;
        else j++;
    }
    return pairs;
};

const stories = Object.values(STORIES).flat().filter(s => s.audioUrl && (!onlyIds.length || onlyIds.includes(s.id)));
console.log(`${stories.length} hikaye işlenecek\n`);

for (const story of stories) {
    const mp3 = path.join(workDir, `${story.id}.mp3`);
    const wav = path.join(workDir, `${story.id}.wav`);
    const jsonBase = path.join(workDir, `${story.id}.words`);

    if (!existsSync(mp3)) {
        execFileSync('curl', ['-sL', story.audioUrl, '-o', mp3]);
    }
    if (!existsSync(wav)) {
        execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', mp3, '-ar', '16000', '-ac', '1', '-y', wav]);
    }
    if (!existsSync(`${jsonBase}.json`)) {
        // -dtw: çapraz dikkat hizalaması ile gerçek kelime zamanı (sezgisel damgadan çok daha hassas)
        const preset = (model.match(/ggml-([a-z0-9.\-]+)\.bin$/) || [])[1];
        const args = ['-m', model, '-l', 'tr', '-f', wav, '-oj', '-of', jsonBase, '-ml', '1', '-sow'];
        if (preset) args.push('-dtw', preset);
        execFileSync('whisper-cli', args, { stdio: 'ignore' });
    }

    const asr = JSON.parse(readFileSync(`${jsonBase}.json`, 'utf8')).transcription
        .map(s => ({ text: normalize(s.text), start: s.offsets.from }))
        .filter(s => s.text);

    const words = splitWords(story.content);
    const normWords = words.map(normalize);
    const pairs = lcsPairs(normWords, asr.map(a => a.text));

    // Eşleşen kelimelere gerçek zaman, eşleşmeyenlere komşulardan doğrusal ara değer
    const times = new Array(words.length).fill(null);
    for (const [wi, ai] of pairs) times[wi] = asr[ai].start;

    const durationMs = Math.round(Number(execFileSync('ffprobe',
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).toString().trim()) * 1000);

    if (times[0] === null) times[0] = 0;
    if (times[times.length - 1] === null) times[times.length - 1] = durationMs;

    let lastKnown = 0;
    for (let i = 0; i < times.length; i++) {
        if (times[i] !== null) { lastKnown = i; continue; }
        let next = i;
        while (next < times.length && times[next] === null) next++;
        const from = times[lastKnown];
        const to = next < times.length ? times[next] : durationMs;
        const span = next - lastKnown;
        times[i] = Math.round(from + ((to - from) * (i - lastKnown)) / span);
    }

    // Monotonluk garantisi (ASR nadiren geri sıçrar)
    for (let i = 1; i < times.length; i++) if (times[i] < times[i - 1]) times[i] = times[i - 1];

    const payload = { d: durationMs, w: times, p: wavePeaks(wav) };
    writeFileSync(path.join(OUT_DIR, `${story.id}.json`), JSON.stringify(payload));

    const matchRate = Math.round((pairs.length / words.length) * 100);
    const kb = Math.round(JSON.stringify(payload).length / 1024);
    console.log(`${String(story.id).padStart(2)}  ${words.length} kelime  eşleşme %${matchRate}  ${kb} KB  ${story.title}`);
}

console.log(`\nÇıktı: ${OUT_DIR}`);
