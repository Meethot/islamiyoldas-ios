/**
 * Hikaye kapak görsellerini uygulama için hazırlar.
 *
 * Kaynak dosya adı ya hikaye başlığı ("Hz. Yusuf'un Sabrı.jpg", "hz-yusuf.png",
 * "yusuf.jpeg") ya da doğrudan id ("1.jpg") olabilir. Eşleşme Türkçe karakter,
 * kesme işareti ve büyük/küçük harf duyarsızdır.
 *
 * Yaptığı işlem: ortadan kare kırp -> 400x400 -> JPEG q80
 * Çıktı: public/images/stories/{id}.jpg
 *
 * Kullanım:
 *   node scripts/hikaye-gorsel-hazirla.mjs <kaynak_klasor>
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, copyFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORIES } from '../src/data/spiritualData.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = path.join(ROOT, 'public/images/stories');
const SIZE = 400;
const QUALITY = 65; // 88px kartta q80'den farkı görünmüyor, dosya ~%25 küçük
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.heic', '.webp', '.tif', '.tiff', '.bmp']);

const srcDir = process.argv[2];
if (!srcDir) {
    console.error('Kullanım: node scripts/hikaye-gorsel-hazirla.mjs <kaynak_klasor>');
    process.exit(1);
}

// "Hz. Yusuf'un Sabrı" -> "hz yusufun sabri"
const normalize = (s) => s
    .toLocaleLowerCase('tr')
    .replace(/[''`´]/g, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const STOPWORDS = new Set(['hz', 've', 'bir', 'nin', 'nun', 'un', 'in']);
const tokens = (s) => normalize(s).split(' ').filter((w) => w && !STOPWORDS.has(w));

// id -> başlık (tüm kategoriler)
const stories = Object.values(STORIES).flat();

const matchStory = (fileBase) => {
    const asId = fileBase.trim();
    if (/^\d+$/.test(asId)) return stories.find((s) => String(s.id) === asId) || null;

    const fileNorm = normalize(fileBase);
    const exact = stories.find((s) => normalize(s.title) === fileNorm);
    if (exact) return exact;

    // en çok ortak anlamlı kelimeye sahip başlık.
    // Türkçe ekleri yutmak için önek eşleşmesi: "eyup" ~ "eyupun"
    const fileTokens = tokens(fileBase);
    const similar = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));
    let best = null;
    let bestScore = 0;
    for (const story of stories) {
        const score = tokens(story.title).filter((w) => fileTokens.some((f) => similar(w, f))).length;
        if (score > bestScore) { bestScore = score; best = story; }
        else if (score === bestScore && score > 0) { best = null; } // belirsiz eşleşme
    }
    return bestScore > 0 ? best : null;
};

mkdirSync(DEST, { recursive: true });
const tmp = mkdtempSync(path.join(tmpdir(), 'story-img-'));
const sips = (...args) => execFileSync('sips', args, { stdio: ['ignore', 'ignore', 'pipe'] });

const files = readdirSync(srcDir).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
if (!files.length) {
    console.error(`Klasörde görsel yok: ${srcDir}`);
    process.exit(1);
}

const used = new Map();
const unmatched = [];
let totalKb = 0;

for (const file of files) {
    const base = path.basename(file, path.extname(file));
    const story = matchStory(base);
    if (!story) { unmatched.push(file); continue; }
    if (used.has(story.id)) {
        console.log(`atlandı  "${file}" -> id ${story.id} zaten "${used.get(story.id)}" ile dolu`);
        continue;
    }

    const src = path.join(srcDir, file);
    const work = path.join(tmp, `work${path.extname(file)}`);
    copyFileSync(src, work);

    const info = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', work]).toString();
    const w = Number(info.match(/pixelWidth:\s*(\d+)/)[1]);
    const h = Number(info.match(/pixelHeight:\s*(\d+)/)[1]);
    const side = Math.min(w, h);

    sips('-c', String(side), String(side), work);            // ortadan kare kırp
    sips('-z', String(SIZE), String(SIZE), work);            // 400x400
    const out = path.join(DEST, `${story.id}.jpg`);
    sips('-s', 'format', 'jpeg', '-s', 'formatOptions', String(QUALITY), work, '--out', out);

    const kb = Math.round(statSync(out).size / 1024);
    totalKb += kb;
    used.set(story.id, file);
    console.log(`hazır    ${String(story.id).padStart(2)}.jpg  ${w}x${h} -> ${SIZE}x${SIZE}  ${kb} KB   ← ${file}   (${story.title})`);
}

rmSync(tmp, { recursive: true, force: true });

const missing = stories.filter((s) => !used.has(s.id));
console.log('-----');
console.log(`hazırlanan: ${used.size}/${stories.length}   toplam ${totalKb} KB`);
if (unmatched.length) console.log(`eşleşmeyen dosyalar: ${unmatched.join(', ')}`);
if (missing.length) console.log(`görseli olmayan hikayeler: ${missing.map((s) => `${s.id}=${s.title}`).join(' | ')}`);
console.log('sonraki adım: npm run build && npx cap sync');
