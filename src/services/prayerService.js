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
            lang: lang.split('-')[0] || 'tr'
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
 * Fetches a random set of approved prayers using randomIndex, filtered by language.
 * @param {number} count - Number of prayers to fetch.
 * @param {string} lang - Language code to filter prayers by.
 * @returns {Promise<Array>} - Array of prayer objects.
 */
export async function getRandomApprovedPrayers(count = 6, lang = 'tr') {
    const normalizedLang = lang?.split('-')[0] || 'tr';
    const startAt = Math.floor(Math.random() * 10000000);
    const colRef = collection(db, COLLECTION_NAME);
    const results = [];
    const seenIds = new Set();

    try {
        // Query 1: Forward from random point, filtered by lang
        const q1 = query(
            colRef,
            where('status', '==', 'approved'),
            where('lang', '==', normalizedLang),
            where('randomIndex', '>=', startAt),
            orderBy('randomIndex'),
            limit(count)
        );
        const snap1 = await getDocs(q1);
        snap1.docs.forEach(d => {
            results.push({ id: d.id, ...d.data(), date: d.data().timestamp?.toDate?.().toISOString() || new Date().toISOString() });
            seenIds.add(d.id);
        });

        // Fallback: If we got fewer than needed, wrap around from 0
        if (results.length < count) {
            const remaining = count - results.length;
            const q2 = query(
                colRef,
                where('status', '==', 'approved'),
                where('lang', '==', normalizedLang),
                where('randomIndex', '>=', 0),
                orderBy('randomIndex'),
                limit(remaining + seenIds.size)
            );
            const snap2 = await getDocs(q2);
            snap2.docs.forEach(d => {
                if (!seenIds.has(d.id) && results.length < count) {
                    results.push({ id: d.id, ...d.data(), date: d.data().timestamp?.toDate?.().toISOString() || new Date().toISOString() });
                    seenIds.add(d.id);
                }
            });
        }
    } catch (error) {
        console.error("Error fetching random prayers:", error);
        try {
            const fallbackQ = query(
                colRef,
                where('status', '==', 'approved'),
                where('lang', '==', normalizedLang),
                orderBy('timestamp', 'desc'),
                limit(count)
            );
            const fallbackSnap = await getDocs(fallbackQ);
            fallbackSnap.docs.forEach(d => {
                if (!seenIds.has(d.id)) {
                    results.push({ id: d.id, ...d.data(), date: d.data().timestamp?.toDate?.().toISOString() || new Date().toISOString() });
                }
            });
        } catch (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
        }
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

    // Note: Firestore 'in' query is limited to 10-30 items depending on usage.
    // For simplicity and robustness with small user lists, we'll fetch individually or in batches.
    // Given usage limits, parallel getDoc is fine for typical user history (< 50 items).

    await Promise.all(uniqueIds.map(async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                statusMap[id] = {
                    status: data.status,
                    aminCount: data.aminCount || 0
                };
            } else {
                // Document missing = Deleted by Admin -> 'rejected'
                statusMap[id] = { status: 'rejected', aminCount: 0 };
            }
        } catch (error) {
            console.error(`Error syncing status for ${id}:`, error);
            // On error, keep existing status (don't override) or handle gracefully
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
