# Firestore Kuralları — İnceleme Notu

**Durum: ÖNERİ. Deploy EDİLMEDİ.** Mevcut kurallar bu repoda yok (konsoldan yönetiliyor),
bu yüzden aşağıdakiler doğrulanmamış varsayımlardır. Uygulamadan önce her maddeyi
Firebase Console → Firestore → Rules ekranındaki mevcut kuralla karşılaştır.

> `firebase.json` içinde `firestore` bölümü **yok**. Bu dosya `docs/` altında olduğu için
> `firebase deploy` onu kural olarak yayınlamaz. Kasıtlı — kazara deploy riski sıfır.

## İstemcinin gerçekte yaptığı işlemler

`src/services/prayerService.js` ve `src/pages/DuaKosesi.jsx` taranarak çıkarıldı.

### `prayers` koleksiyonu

| İşlem | Nerede | Yazılan/okunan |
|---|---|---|
| create | `addPrayer()` | `{text, aminCount: 0, status: 'pending', timestamp, randomIndex, platform, lang}` |
| list | `getApprovedPrayers()`, `getRandomApprovedPrayers()` | `where('status','==','approved')` + `orderBy(timestamp)` + `limit(60‑100)` |
| get | `getPrayer()`, `syncPrayersStatus()` | Tek doküman, **id ile** (kullanıcının kendi geçmişi) |
| update | `updatePrayer()` | Yalnız `text` |
| update | `requestDeletePrayer()` | Yalnız `status: 'delete_requested'` |
| update | `incrementAmin()` | Yalnız `aminCount` (increment) |
| delete | `deletePrayer()` | Kullanıcının kendi `pending`/`rejected` duası |

### `reports` koleksiyonu

| İşlem | Nerede | Yazılan |
|---|---|---|
| create | `reportPrayer()` | `{prayerId, reason, timestamp, status: 'pending_review'}` |

## Doğrulanması gereken 5 nokta

Uygulamada **kimlik doğrulama yok** (Firebase Auth kullanılmıyor), yani her istek anonim.
Kurallar `request.auth`'a dayanamaz; alan bazlı kısıt tek savunma hattı.

**1. İstemci `status: 'approved'` ile doküman OLUŞTURABİLİYOR mu?**
Kural `create`'te `request.resource.data.status == 'pending'` şartını koşmuyorsa, herkes
duasını editör onayı olmadan doğrudan yayına sokabilir. En kritik madde.

**2. İstemci `status`'ü `'approved'` yapacak şekilde GÜNCELLEYEBİLİYOR mu?**
`updatePrayer()` yorumunda "we only update the 'text' field to comply with Firestore rules"
yazıyor — bu, kuralların alan kısıtı içerdiğini *ima ediyor* ama kanıtlamıyor.
`update`'te izin verilen alan kümesinin `text`, `aminCount`, `status:'delete_requested'`
ile sınırlı olduğunu doğrula.

**3. `list` (sorgu) yalnız `approved` ile sınırlı mı?**
`syncPrayersStatus()` kullanıcının kendi `pending` duasını **id ile** okuduğu için `get`
serbest olmak zorunda. Ama `list` serbest bırakılmışsa, biri filtre koymadan sorgu atıp
**onay bekleyen tüm duaları** okuyabilir. Doküman id'leri 20 karakter rastgele olduğundan
`get` üzerinden toplu sızıntı pratik değil; asıl risk `list`.

**4. `delete` kim tarafından yapılabiliyor?**
Dokümanlarda sahiplik alanı **yok** (`userId`/`deviceId` yazılmıyor). Bu yüzden kural
"kendi duasını silebilir" ayrımını yapamaz. `delete` istemciye açıksa, id'yi bilen herkes
**başkasının duasını silebilir**. Feed zaten id'leri istemciye veriyor → yayındaki duaların
id'si herkesçe biliniyor. Ciddi.
Çözüm seçenekleri: (a) `delete`'i tamamen kapat, silmeyi `delete_requested` akışına çevir
(kod zaten bunu destekliyor), (b) dokümana rastgele bir `ownerToken` yaz ve kuralda eşleştir.

**5. `aminCount` artışı sınırlı mı?**
Kural yalnızca `aminCount` alanının değiştiğini ve artışın `+1` olduğunu doğrulamıyorsa,
sayaç istenen değere çekilebilir. Etkisi düşük (kozmetik) ama kontrolü ucuz.

## Nasıl doğrulanır (üretim verisine dokunmadan)

Kuralları emülatöre kopyalayıp test etmek en güvenli yol:

```bash
# 1. Konsoldan mevcut kuralları kopyala → firestore.rules olarak kaydet (repoya EKLEME)
# 2. Emülatörde test et
firebase emulators:start --only firestore
```

Üretimde deneme yazması **yapma** — gerçek dua koleksiyonunu kirletir.

## Kimlik doğrulama olmadan yapılabilecek en iyi şey

Anonim Firebase Auth (`signInAnonymously`) eklenirse kurallar sahipliğe dayanabilir:
dokümana `uid` yazılır, `update`/`delete` yalnız sahibine açılır. Bu, 4. maddeyi kökten
çözer. Maliyeti sıfır, ama istemci tarafında yeni bir bağımlılık ve göç senaryosu
(mevcut duaların sahibi yok) gerektirir — ayrı bir iş olarak planlanmalı.
