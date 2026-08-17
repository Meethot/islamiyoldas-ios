import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    increment,
    limit,
    getDoc,
    getDocs,
    deleteDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'prayers';

/**
 * Adds a new prayer request to Firestore.
 * @param {string} text - The content of the prayer request.
 * @param {string} lang - The language code (e.g., 'tr', 'en', 'ar').
 * @returns {Promise<string>} - The ID of the newly created document.
 */
export async function addPrayer(text, lang = 'tr') {
    if (!text || text.trim().length < 10) {
        throw new Error("Dua metni en az 10 karakter olmalıdır.");
    }

    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            text: text.trim(),
            aminCount: 0,
            status: 'pending',
            timestamp: serverTimestamp(),
            randomIndex: Math.floor(Math.random() * 10000000),
            platform: 'mobile',
            lang: lang.split('-')[0] || 'en'
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding prayer:", error);
        throw error;
    }
}

/**
 * Subscribes to approved prayers ordered by newest first.
 * @param {function} callback - Function called with the array of prayers.
 * @param {Date} [startDate] - Optional filter for prayers since a specific time.
 * @returns {function} - Unsubscribe function.
 */
export function getApprovedPrayers(callback, startDate) {
    let q;
    if (startDate) {
        q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', 'approved'),
            where('timestamp', '>=', startDate),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
    } else {
        q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', 'approved'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
    }

    return onSnapshot(q, (snapshot) => {
        const prayers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Timestamp to Date object if needed, or keeping it as is/string
            date: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
        }));
        callback(prayers);
    }, (error) => {
        console.error("Error getting approved prayers:", error);
        // Fallback or empty list on error
        callback([]);
    });
}

/**
 * Fetches prayers approved in the last 24 hours (newest first).
 * Fills the remaining slots with random approved prayers.
 * @param {number} count - Number of prayers to fetch.
 * @param {string} lang - Language code to filter prayers by.
 * @returns {Promise<Array>} - Array of prayer objects.
 */
export async function getRandomApprovedPrayers(count = 6, lang = 'en') {
    const normalizedLang = lang?.split('-')[0] || 'en';
    const colRef = collection(db, COLLECTION_NAME);
    const results = [];
    const seenIds = new Set();
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    try {
        // En güvenli sorgu: Sadece status ve timestamp kullanıyoruz. (Karmaşık indeks hatası almamak için)
        // Son onaylanan 150 duayı çekip, dil filtresini ve rastgeleliği kod tarafında (memory) yapıyoruz.
        const qSafe = query(
            colRef,
            where('status', '==', 'approved'),
            orderBy('timestamp', 'desc'),
            limit(60)
        );
        
        const snap = await getDocs(qSafe);
        const allDocs = [];
        snap.docs.forEach(d => {
            const data = d.data();
            // Dil filtresi (memory)
            if ((data.lang || 'en') === normalizedLang) {
                // Tazelik ölçüsü ONAY anı; yoksa (eski kayıtlar) gönderim anına düşer.
                // Onay elle ve toplu yapıldığı için gönderim anına bakmak yeni
                // onaylanan duaları daha yayına girer girmez "eski" sayıyordu.
                // İkisi de yoksa `date` ile aynı yedeğe (şimdi) düşülür — eski
                // davranışla birebir aynı kalsın diye.
                const freshMs = (data.approvedAt?.toDate?.() || data.timestamp?.toDate?.())?.getTime();
                allDocs.push({
                    id: d.id,
                    ...data,
                    date: data.timestamp?.toDate?.().toISOString() || new Date().toISOString(),
                    _freshAt: Number.isFinite(freshMs) ? freshMs : Date.now()
                });
            }
        });

        // Son 24 saat içinde onaylananlar ve daha eskiler olarak ayır
        const recentDocs = [];
        const olderDocs = [];
        allDocs.forEach(d => {
            const dTime = d._freshAt;
            if (dTime >= twentyFourHoursAgo.getTime()) {
                recentDocs.push(d);
            } else {
                olderDocs.push(d);
            }
        });

        // Her iki listeyi de kendi içinde rastgele karıştır (Adaletli görünüm için)
        recentDocs.sort(() => Math.random() - 0.5);
        olderDocs.sort(() => Math.random() - 0.5);

        // Önce son 24 saat içindekileri ekle
        recentDocs.forEach(d => {
            if (results.length < count && !seenIds.has(d.id)) {
                results.push(d);
                seenIds.add(d.id);
            }
        });

        // Kalan boşlukları karıştırılmış eskilerle doldur
        olderDocs.forEach(d => {
            if (results.length < count && !seenIds.has(d.id)) {
                results.push(d);
                seenIds.add(d.id);
            }
        });

    } catch (error) {
        console.error("Error fetching prayers:", error);
    }

    return results;
}

/**
 * Atomically increments the 'aminCount' for a prayer.
 * @param {string} prayerId - The ID of the prayer document.
 */
export async function incrementAmin(prayerId) {
    if (!prayerId) return;

    try {
        const prayerRef = doc(db, COLLECTION_NAME, prayerId);
        await updateDoc(prayerRef, {
            aminCount: increment(1)
        });
    } catch (error) {
        console.error("Error incrementing amin:", error);
        // Optimistic UI handles the immediate feedback, this is just sync
    }
}

/**
 * Updates the text content of a prayer request.
 * @param {string} prayerId - The ID of the prayer document.
 * @param {string} newText - The new content of the prayer.
 */
export async function updatePrayer(prayerId, newText) {
    if (!prayerId || !newText || newText.trim().length < 10) {
        throw new Error("Geçersiz dua metni.");
    }

    try {
        const prayerRef = doc(db, COLLECTION_NAME, prayerId);

        // SECURITY: We only update the 'text' field to comply with Firestore rules
        await updateDoc(prayerRef, {
            text: newText.trim()
        });
    } catch (error) {
        console.error("Error updating prayer:", error);
        throw error;
    }
}

/**
 * Deletes a prayer request from Firestore.
 * @param {string} prayerId - The ID of the prayer document.
 */
export async function deletePrayer(prayerId) {
    if (!prayerId) {
        throw new Error("Geçersiz dua ID.");
    }

    try {
        const prayerRef = doc(db, COLLECTION_NAME, prayerId);
        await deleteDoc(prayerRef);
    } catch (error) {
        console.error("Error deleting prayer:", error);
        throw error;
    }
}

/**
 * Fetches a single prayer document by ID.
 * @param {string} prayerId 
 * @returns {Promise<Object|null>}
 */
export async function getPrayer(prayerId) {
    if (!prayerId) return null;
    try {
        const docRef = doc(db, COLLECTION_NAME, prayerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching prayer:", error);
        return null;
    }
}

/**
 * Synchronizes the status of a list of prayer IDs.
 * Checks Firestore for each ID. If the document exists, returns its current status.
 * If the document is missing (deleted by admin), returns 'rejected'.
 * 
 * @param {string[]} prayerIds - Array of prayer IDs to check.
 * @returns {Promise<Object>} - A map of { [prayerId]: { status: 'pending' | 'approved' | 'rejected', aminCount: number } }
 */
export async function syncPrayersStatus(prayerIds) {
    if (!prayerIds || prayerIds.length === 0) return {};

    const statusMap = {}; // { [id]: { status, aminCount } }
    const uniqueIds = [...new Set(prayerIds)].filter(id => typeof id === 'string' && id.length > 5); // Filter out fake IDs if any

    // NOT — neden toplu (documentId 'in') sorgu KULLANILMIYOR:
    // Canlı Firestore kuralı `allow list: if resource.data.status == 'approved'`.
    // Firestore'da kurallar filtre değildir; status kısıtı içermeyen bir sorgu
    // (kendi duanın pending/rejected durumunu öğrenmek tam da bunu gerektirir)
    // komple reddedilir. Tekil okuma ise `allow get: if true` ile serbest.
    // Yani gruplama denendi, kural gereği her seferinde reddedilip tekil yola
    // düşüyordu — sadece boşa giden bir istek ekliyordu. Bilerek tekil bırakıldı.
    await Promise.all(uniqueIds.map(async (id) => {
        try {
            const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));

            if (docSnap.exists()) {
                const data = docSnap.data();
                statusMap[id] = {
                    status: data.status,
                    aminCount: data.aminCount || 0
                };
            } else if (docSnap.metadata?.fromCache !== true) {
                // Sunucudan geldi ve doküman yok → admin silmiş.
                statusMap[id] = { status: 'rejected', aminCount: 0 };
            }
            // ÖNBELLEKTEN gelip "yok" diyorsa (cihaz çevrimdışı) hiçbir şey yazma:
            // dua sunucuda duruyor olabilir, yanlışlıkla "reddedildi" damgalamayalım.
        } catch (error) {
            console.error(`Error syncing status for ${id}:`, error);
            // Hata → statusMap'e yazma; çağıran taraf yereldeki durumu korur.
        }
    }));

    return statusMap;
}

/**
 * Requests deletion for an approved prayer.
 * Updates the status to 'delete_requested'.
 * @param {string} prayerId - The ID of the prayer document.
 */
export async function requestDeletePrayer(prayerId) {
    if (!prayerId) {
        throw new Error("Geçersiz dua ID.");
    }

    try {
        const prayerRef = doc(db, COLLECTION_NAME, prayerId);
        await updateDoc(prayerRef, {
            status: 'delete_requested'
        });
    } catch (error) {
        console.error("Error requesting deletion:", error);
        throw error;
    }
}
/**
 * Listens to a single prayer document in real-time.
 * @param {string} prayerId 
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export function listenToPrayer(prayerId, callback) {
    if (!prayerId) return () => { };
    const docRef = doc(db, COLLECTION_NAME, prayerId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error listening to prayer:", error);
    });
}

/**
 * Reports a prayer to the 'reports' collection
 * @param {string} prayerId 
 * @param {string} reason 
 */
export async function reportPrayer(prayerId, reason = 'inappropriate') {
    if (!prayerId || typeof prayerId !== 'string') return;
    try {
        const reportsRef = collection(db, 'reports');
        await addDoc(reportsRef, {
            prayerId,
            reason,
            timestamp: serverTimestamp(),
            status: 'pending_review'
        });
    } catch (e) {
        console.error("Error reporting prayer:", e);
    }
}
