import { db, doc, getDoc, setDoc, updateDoc } from './firebase-config.js';
import { auth } from './firebase-config.js';

// Default user profile data
const defaultProfile = {
    displayName: '',
    email: '',
    phone: '',
    location: '',
    about: '',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

/**
 * Get the current user's profile
 * @returns {Promise<Object>} User profile data
 */
export const getCurrentUserProfile = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('No user is signed in');
            return null;
        }

        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        } else {
            // Create a new profile if it doesn't exist
            const newProfile = {
                ...defaultProfile,
                email: user.email || '',
                displayName: user.displayName || user.email?.split('@')[0] || 'Usuario'
            };
            await setDoc(userRef, newProfile);
            return { id: user.uid, ...newProfile };
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

/**
 * Update the current user's profile
 * @param {Object} updates - The fields to update
 * @returns {Promise<boolean>} True if successful
 */
export const updateUserProfile = async (updates) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is signed in');
        }

        const userRef = doc(db, 'users', user.uid);
        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await updateDoc(userRef, updateData, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

/**
 * Upload a profile picture
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The download URL of the uploaded image
 */
export const uploadProfilePicture = async (file) => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // In a real app, you would upload to Firebase Storage here
        // For now, we'll just return a placeholder or data URL
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error;
    }
};

/**
 * Update the user's password
 * @param {string} newPassword - The new password
 * @returns {Promise<boolean>} True if successful
 */
export const updatePassword = async (newPassword) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is signed in');
        }

        await user.updatePassword(newPassword);
        return true;
    } catch (error) {
        console.error('Error updating password:', error);
        throw error;
    }
};
