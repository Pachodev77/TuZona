import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { db } from '../firebase-config.js';

export class AdService {
    // Save a new ad to Firestore
    static async createAd(adData) {
        try {
            const docRef = await addDoc(collection(db, 'ads'), {
                ...adData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active',
                views: 0
            });
            console.log('Ad created with ID: ', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error creating ad: ', error);
            throw error;
        }
    }

    // Get all ads for the current user
    static async getUserAds(userId) {
        try {
            const q = query(collection(db, 'ads'), where('seller.id', '==', userId));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting user ads: ', error);
            throw error;
        }
    }

    // Get a single ad by ID
    static async getAdById(adId) {
        try {
            const docRef = doc(db, 'ads', adId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                throw new Error('No such ad found!');
            }
        } catch (error) {
            console.error('Error getting ad: ', error);
            throw error;
        }
    }

    // Update an existing ad
    static async updateAd(adId, adData) {
        try {
            const adRef = doc(db, 'ads', adId);
            await updateDoc(adRef, {
                ...adData,
                updatedAt: new Date().toISOString()
            });
            console.log('Ad updated successfully');
        } catch (error) {
            console.error('Error updating ad: ', error);
            throw error;
        }
    }

    // Delete an ad
    static async deleteAd(adId) {
        try {
            await deleteDoc(doc(db, 'ads', adId));
            console.log('Ad deleted successfully');
        } catch (error) {
            console.error('Error deleting ad: ', error);
            throw error;
        }
    }

    // Get all active ads
    static async getActiveAds() {
        try {
            const q = query(collection(db, 'ads'), where('status', '==', 'active'));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting active ads: ', error);
            throw error;
        }
    }
}

// Make it available globally
window.AdService = AdService;
