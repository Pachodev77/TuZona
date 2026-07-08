// Favorites Service
// Manages a user's saved ads in Firestore using the
// favorites/{userId}/ads/{adId} subcollection.

import { db, auth } from '../firebase-config.js';
import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

const favoritesCol = (userId) => collection(db, 'favorites', userId, 'ads');
const favoriteDoc = (userId, adId) => doc(db, 'favorites', userId, 'ads', adId);

/**
 * Save an ad to the user's favorites.
 * @param {string} userId
 * @param {Object} ad - The full ad document (must include id)
 */
export const addFavorite = async (userId, ad) => {
    const snapshot = {
        adId: ad.id,
        title: ad.title || '',
        price: ad.price || 0,
        location: ad.location || '',
        category: ad.category || '',
        condition: ad.condition || '',
        image: Array.isArray(ad.images) && ad.images.length ? ad.images[0] : (ad.image || ''),
        sellerId: ad.seller?.id || '',
        sellerName: ad.seller?.name || '',
        savedAt: new Date().toISOString()
    };
    await setDoc(favoriteDoc(userId, ad.id), snapshot);
    return { success: true };
};

/**
 * Remove an ad from the user's favorites.
 * @param {string} userId
 * @param {string} adId
 */
export const removeFavorite = async (userId, adId) => {
    await deleteDoc(favoriteDoc(userId, adId));
    return { success: true };
};

/**
 * Toggle an ad's favorite state.
 * @returns {Promise<boolean>} The new favorite state (true = now favorite)
 */
export const toggleFavorite = async (userId, ad) => {
    const ref = favoriteDoc(userId, ad.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
        await deleteDoc(ref);
        return false;
    }
    await addFavorite(userId, ad);
    return true;
};

/**
 * Check whether an ad is in the user's favorites.
 * @returns {Promise<boolean>}
 */
export const isFavorite = async (userId, adId) => {
    const ref = favoriteDoc(userId, adId);
    const snap = await getDoc(ref);
    return snap.exists();
};

/**
 * Get all favorite ads for a user (most recently saved first).
 * @returns {Promise<Array>}
 */
export const getFavorites = async (userId) => {
    const q = query(favoritesCol(userId), orderBy('savedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};
