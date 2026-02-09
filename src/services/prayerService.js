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
    limit
} from 'firebase/firestore';

const COLLECTION_NAME = 'prayers';

/**
 * Adds a new prayer request to Firestore.
 * @param {string} text - The content of the prayer request.
 * @returns {Promise<string>} - The ID of the newly created document.
 */
export async function addPrayer(text) {
    if (!text || text.trim().length < 10) {
        throw new Error("Dua metni en az 10 karakter olmalıdır.");
    }

    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            text: text.trim(),
            aminCount: 0,
            status: 'pending', // 'pending' | 'approved' | 'rejected'
            timestamp: serverTimestamp(),
            platform: 'mobile' // Optional: track source
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
 * @returns {function} - Unsubscribe function.
 */
export function getApprovedPrayers(callback) {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'approved'),
        orderBy('timestamp', 'desc'),
        limit(50) // Limit to last 50 approved prayers for performance
    );

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
