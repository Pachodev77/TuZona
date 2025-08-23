// User Service
// Handles user-related operations like creating, updating, and retrieving user profiles

// Import Firebase services
const { 
    collection, doc, getDoc, setDoc, updateDoc, deleteDoc, 
    query, where, getDocs, serverTimestamp, orderBy 
} = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');

const { 
    getStorage, ref, uploadBytes, getDownloadURL 
} = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js');

// Import Firebase initialization
import initializeFirebase from '../firebase-config.js';

// Initialize Firebase services
let db, firebaseAuth, storage;

// Initialize when the module loads
(async () => {
    try {
        const firebase = await initializeFirebase();
        db = firebase.db;
        firebaseAuth = firebase.auth;
        storage = firebase.storage;
    } catch (error) {
        console.error('Failed to initialize Firebase in user-service:', error);
    }
})();

/**
 * Get the current user's profile
 * @returns {Promise<Object|null>} The current user's profile or null if not authenticated
 */
export const getCurrentUserProfile = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) return null;

    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        } else {
            // Create a new user profile if it doesn't exist
            return createUserProfile(user);
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

/**
 * Create a new user profile
 * @param {Object} user - The Firebase Auth user object
 * @param {Object} [additionalData={}] - Additional user data to include
 * @returns {Promise<Object>} The created user profile
 */
export const createUserProfile = async (user, additionalData = {}) => {
    if (!user) throw new Error('User is required');

    const userData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        photoURL: user.photoURL || 'https://via.placeholder.com/150',
        phoneNumber: user.phoneNumber || '',
        emailVerified: user.emailVerified || false,
        isAdmin: false,
        isBanned: false,
        location: '',
        about: '',
        settings: {
            publicProfile: true,
            showEmail: false,
            showPhone: true,
            notifications: true,
            emailNotifications: true,
            theme: 'light',
            language: 'es'
        },
        stats: {
            activeAds: 0,
            totalAds: 0,
            totalViews: 0,
            unreadMessages: 0,
            rating: 0,
            reviews: 0
        },
        preferences: {
            categories: [],
            locations: [],
            notificationFrequency: 'daily'
        },
        socialLinks: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        ...additionalData
    };

    try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, userData);
        return { id: user.uid, ...userData };
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw new Error('Error al crear el perfil del usuario');
    }
};

/**
 * Update a user's profile
 * @param {string} userId - The user's ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} Object with success status and updated user data
 */
export const updateUserProfile = async (userId, updates) => {
    if (!userId) throw new Error('User ID is required');

    try {
        const userRef = doc(db, 'users', userId);
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        await updateDoc(userRef, updateData);

        // Get the updated user data
        const updatedDoc = await getDoc(userRef);
        return {
            success: true,
            user: { id: updatedDoc.id, ...updatedDoc.data() }
        };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return {
            success: false,
            error: error.message || 'Error al actualizar el perfil'
        };
    }
};

/**
 * Upload a user's avatar
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Object with success status and the download URL
 */
export const uploadUserAvatar = async (file, userId) => {
    if (!file || !userId) {
        throw new Error('File and user ID are required');
    }

    try {
        const fileExt = file.name.split('.').pop();
        const filePath = `users/${userId}/avatar.${fileExt}`;
        const storageRef = ref(storage, filePath);
        
        // Upload the file
        await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update user profile with the new avatar URL
        await updateUserProfile(userId, { photoURL: downloadURL });
        
        return {
            success: true,
            photoURL: downloadURL
        };
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return {
            success: false,
            error: error.message || 'Error al subir la imagen de perfil'
        };
    }
};

/**
 * Update user settings
 * @param {string} userId - The user's ID
 * @param {Object} settings - The settings to update
 * @returns {Promise<Object>} Object with success status
 */
export const updateUserSettings = async (userId, settings) => {
    if (!userId) throw new Error('User ID is required');

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            'settings': settings,
            'updatedAt': serverTimestamp()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error updating user settings:', error);
        return {
            success: false,
            error: error.message || 'Error al actualizar la configuración'
        };
    }
};

/**
 * Delete a user's account
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Object with success status
 */
export const deleteUserAccount = async (userId) => {
    if (!userId) throw new Error('User ID is required');

    try {
        const user = firebaseAuth.currentUser;
        
        // Delete user document
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        
        // Delete user's authentication
        if (user) {
            await user.delete();
        }
        
        // TODO: Delete other user-related data (ads, messages, etc.)
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting user account:', error);
        return {
            success: false,
            error: error.message || 'Error al eliminar la cuenta'
        };
    }
};

/**
 * Check if a username is available
 * @param {string} username - The username to check
 * @returns {Promise<boolean>} True if the username is available
 */
export const isUsernameAvailable = async (username) => {
    if (!username) return false;

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.empty;
    } catch (error) {
        console.error('Error checking username availability:', error);
        return false;
    }
};

/**
 * Get a user's public profile
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} The user's public profile or null if not found
 */
export const getUserPublicProfile = async (userId) => {
    if (!userId) return null;

    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) return null;
        
        const userData = userDoc.data();
        
        // Only return public information
        return {
            id: userDoc.id,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            about: userData.about,
            location: userData.location,
            stats: userData.stats,
            socialLinks: userData.socialLinks,
            settings: {
                publicProfile: userData.settings?.publicProfile ?? true
            }
        };
    } catch (error) {
        console.error('Error getting public profile:', error);
        return null;
    }
};
