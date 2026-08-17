# Hikaye kapak görselleri

Dosya adı = hikayenin `id`'si. Uygulama önce `.jpg`, bulamazsa `.webp` dener;
ikisi de yoksa karta tema-dolgusu (gradyan + kategori ikonu) düşer — bozuk görsel çıkmaz.

## Nasıl eklenir (önerilen yol)

1. Ham fotoğrafları bir klasöre at. **Dosya adı hikaye başlığı olabilir** —
   `Hz. Yusuf'un Sabrı.jpg`, `hz-eyup.png`, `mevlana.heic`, `gul-ve-diken.webp`
   hepsi eşleşir (Türkçe karakter / kesme işareti / büyük-küçük harf duyarsız, ekleri yutar).
   İstersen doğrudan id de kullanabilirsin: `1.jpg`. Çözünürlük fark etmez, script küçültür.
2. `node scripts/hikaye-gorsel-hazirla.mjs ~/Desktop/klasor-adin`
   → ortadan kare kırpar, 400×400 yapar, JPEG q80'e sıkıştırır, buraya `{id}.jpg` olarak yazar.
   Eşleşmeyen dosyaları ve görseli eksik kalan hikayeleri sonunda listeler.
3. `npm run build && npx cap sync`

Elle koyacaksan: **kare, 400×400 px, JPEG q80, dosya başına ≤ 50 KB.**

## Boyut

15 görsel ≈ **0,5–0,6 MB** toplam. Uygulama boyutuna etkisi ihmal edilebilir
(karşılaştırma: `public/data` içindeki şehir listesi tek başına 3,5 MB).
Sıfır MB isteniyorsa alternatif: görselleri Firebase Storage'a yükle (sesler zaten orada)
ve veri dosyasındaki story nesnesine tam adres ver — `image: "https://.../1.jpg"`.
Kod https adresini olduğu gibi kullanır, ama o zaman görseller **offline çalışmaz**.

## Tasarım notu

Kartta alt kısma koyu gradyan, ortaya play butonu biniyor → görselin **tam ortasına ve
alt şeridine** yazı/ince detay koyma. Kırpma merkezden yapılır (`object-cover`).

## ⚠️ İçerik kuralı

Peygamber ve sahabe **tasviri yapılmayacak**. Görseller sembolik/atmosferik olmalı:
manzara, gökyüzü, çöl, deniz, gemi silüeti, hat/geometrik desen, ışık, doğa.
İnsan yüzü kullanma.

## Dosya listesi

| Dosya | Hikaye | Görsel fikri |
|---|---|---|
| `1.jpg`  | Hz. Yusuf'un Sabrı        | Çöl kuyusu, kum, tek ışık huzmesi |
| `2.jpg`  | Hz. Eyüp'ün Şifası        | Çölde su kaynağı, şifa/pınar |
| `3.jpg`  | Hz. İbrahim ve Ateş       | Ateş közü + serin yeşil zıtlığı |
| `4.jpg`  | Hz. Musa ve Deniz         | Yarılan deniz, dalga duvarı |
| `5.jpg`  | Hz. Nuh'un Gemisi         | Fırtınalı denizde ahşap gemi silüeti |
| `6.jpg`  | Hz. Ebubekir'in Sadakati  | Sevr mağarası ağzı, örümcek ağı |
| `7.jpg`  | Hz. Ömer'in Adaleti       | Terazi, taş kemer |
| `8.jpg`  | Hz. Osman'ın Hayası       | Açık Mushaf, hat detayı |
| `9.jpg`  | Hz. Ali'nin İlmi          | Kitap + kandil ışığı |
| `10.jpg` | Bilal-i Habeşi'nin Ezanı  | Minare silüeti, şafak |
| `11.jpg` | Mevlana ve Şems           | Semazen etek silüeti / dönen ışık |
| `12.jpg` | Behlül Dane'nin Sarayı    | Boş taht salonu, mermer |
| `13.jpg` | Kuşlar ve Tevekkül        | Gökyüzünde kuş sürüsü |
| `14.jpg` | Bir Damla Bal             | Bal damlası, altın doku |
| `15.jpg` | Gül ve Diken              | Gül + diken makro |

`id` tüm dillerde aynı (tr/en/de/ru/ar) → tek görsel seti yeterli.
