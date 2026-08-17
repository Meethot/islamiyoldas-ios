# Firestore Kuralları — Denetim (2026-08-17)

**Durum: canlı kurallar OKUNDU ve doğrulandı.** Bu dosyanın önceki hâli varsayımlara
dayanıyordu ve bir kısmı YANLIŞ çıktı — düzeltildi.

Kurallar Firebase Rules API üzerinden salt-okunur çekildi (release `cloud.firestore`,
son güncelleme 2026-02-16). Üretim verisine hiçbir yazma yapılmadı.

> `firebase.json` içinde `firestore` bölümü yok; bu dosya `docs/` altında olduğu için
> `firebase deploy` onu kural olarak yayınlamaz.

## Canlı kurallar (özet)

```
match /prayers/{document=**} {
  allow list:   if resource.data.status == 'approved';
  allow get:    if true;
  allow create: if text.size() <= 300 && request.resource.data.status == 'pending';
  allow update: if (pending  && yalnız 'text' değişir && <=300)
                || (approved && status → 'delete_requested', yalnız 'status')
                || (approved && yalnız 'aminCount'/'amins' değişir);
  allow delete: if resource.data.status == 'pending';
}
match /userDemographics/{document=**} { allow write: if true;  allow read: if false; }
match /users/{userId}                 { allow read, write: if request.auth.uid == userId; }
```

## Güvende çıkanlar (önceki notlardaki endişeler ÇÜRÜTÜLDÜ)

| Endişe | Gerçek |
|---|---|
| İstemci `status:'approved'` ile doküman oluşturabilir mi? | **Hayır.** `create` yalnız `'pending'` kabul ediyor — moderasyon atlanamaz. |
| İstemci `status`'ü `approved` yapabilir mi? | **Hayır.** `update`'in üç dalının hiçbiri `approved` yazdırmıyor. |
| Onay bekleyen dualar sızıyor mu? | **Hayır.** `list` yalnız `approved` döndürüyor. |
| İd'yi bilen herkes başkasının duasını silebilir mi? | **Hayır.** `delete` yalnız `pending` için açık; pending dualar `list` edilemediği için id'leri de keşfedilemez (20 karakter rastgele). Onaylı dualar silinemez. |

Önceki dosyada "onaylı dualar silinebilir, biri tüm feed'i temizleyebilir" yazıyordu —
**bu yanlıştı**, kural onaylı dualarda `delete`'e hiç izin vermiyor.

## Gerçek bulgular

### 1. `userDemographics` — kimlik doğrulamasız SINIRSIZ yazma (en ciddi)

```
match /userDemographics/{document=**} { allow write: if true; }
```

Kimlik yok, boyut sınırı yok, oran sınırı yok. URL'i bilen biri (APK'dan Firebase config
çıkarılabiliyor) bu koleksiyona milyonlarca doküman yazıp **Firestore depolama ve yazma
faturasını şişirebilir**. `allow read: if false` sadece okumayı engelliyor, yazmayı değil.

Yazan tek yer: `src/pages/Onboarding.jsx:57` — onboarding cevaplarını bir kez `addDoc`
ile gönderiyor.

Önerilen kural (yalnızca oluşturma, güncelleme/silme yok, alan ve boyut kısıtlı):

```
match /userDemographics/{docId} {
  allow read, update, delete: if false;
  allow create: if request.resource.data.keys().size() <= 20
                && request.resource.data.size() < 5000;
}
```
Bu, kötüye kullanımı tamamen bitirmez ama doküman başına maliyeti sınırlar ve mevcut
tek yazma noktasını bozmaz. Tam çözüm için anonim auth veya App Check gerekir.

### 2. `aminCount` değeri sınırsız

```
(approved && yalnız 'aminCount'/'amins' değişir)
```
Artışın +1 olduğu doğrulanmıyor. Onaylı bir duanın âmin sayısı istenen değere çekilebilir.
Zarar kozmetik (sahte sosyal kanıt), maliyeti yok. Sıkılaştırma:

```
&& request.resource.data.aminCount == resource.data.aminCount + 1
```
> Dikkat: istemci `increment(1)` kullanıyor, bu kuralla uyumlu. Ama `amins` dizisi de
> aynı dalda; o alan kullanılmıyorsa kuraldan çıkarılabilir.

### 3. `users/{userId}` bölümü ölü

`request.auth != null` şartı var ama uygulamada **Firebase Auth hiç kullanılmıyor**.
Hiçbir istemci bu kuralı sağlayamaz. Zararsız; ileride auth eklenirse hazır.

## Bu denetimin ortaya çıkardığı KOD düzeltmeleri (yapıldı)

1. **`syncPrayersStatus` toplu sorgusu geri alındı** (`prayerService.js`).
   `documentId() in` bir **list** işlemidir; `allow list: if status == 'approved'`
   kuralı, status kısıtı içermeyen sorguyu komple reddediyor. Optimizasyon her
   seferinde reddedilip tekil okumaya düşüyordu — yani sadece boşa giden bir istek
   ekliyordu. Tekil `getDoc` (`allow get: if true`) doğru yol. Çevrimdışı koruması
   (`metadata.fromCache`) korundu.

2. **Reddedilen dua geçmişten silinemiyordu** (`DuaKosesi.jsx`).
   İstemci `rejected` durumunda da `deletePrayer()` çağırıyordu; kural yalnız
   `pending` için izin verdiğinden istek `PERMISSION_DENIED` ile patlıyor, `throw`
   yerel temizliği de engelliyordu. Kullanıcı "ONAYLANMADI" kartını listesinden
   hiçbir zaman kaldıramıyordu. Artık `rejected` yalnızca yerelden siliniyor.

## Yapılacak

- [ ] `userDemographics` kuralını sıkılaştır (yukarıdaki blok) — **kural deploy'u gerekir**
- [ ] (Opsiyonel) `aminCount` artışını +1 ile sınırla
- [ ] Kuralları repoya al (`firestore.rules` + `firebase.json`'a `firestore` bölümü) ki
      sürüm takibi olsun — şu an yalnız konsolda, değişiklik geçmişi görünmüyor
