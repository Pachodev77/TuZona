// Firebase Authentication Module
// Handles user authentication using Firebase Authentication

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut, 
    sendEmailVerification as firebaseSendEmailVerification, 
    sendPasswordResetEmail as firebaseSendPasswordResetEmail, 
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile as firebaseUpdateProfile, 
    updateEmail as firebaseUpdateEmail,
    updatePassword as firebaseUpdatePassword, 
    reauthenticateWithCredential,
    EmailAuthProvider, 
    GoogleAuthProvider, 
    signInWithPopup 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { app } from './firebase-config';

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Error messages mapping
const ERROR_MESSAGES = {
    'auth/email-already-in-use': 'Este correo electrónico ya está en uso. Por favor, utiliza otro.',
    'auth/invalid-email': 'El correo electrónico proporcionado no es válido.',
    'auth/operation-not-allowed': 'Esta operación no está permitida.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, inténtalo de nuevo más tarde.',
    'auth/requires-recent-login': 'Esta operación es sensible y requiere autenticación reciente. Por favor, inicia sesión nuevamente.',
    'default': 'Se produjo un error inesperado. Por favor, inténtalo de nuevo.'
};

/**
 * Get the current authenticated user
 * @returns {Object|null} The current user object or null if not authenticated
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};

/**
 * Check if a user is authenticated
 * @returns {Promise<boolean>} True if user is authenticated
 */
export const isAuthenticated = () => {
    return new Promise((resolve) => {
        const unsubscribe = firebaseOnAuthStateChanged(auth, (user) => {
            unsubscribe(); // Unsubscribe immediately
            resolve(!!user);
        });
    });
};

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {Object} userData - Additional user data to store
 * @returns {Promise<Object>} Object with success status and user data or error message
 */
export const signUp = async (email, password, userData = {}) => {
    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        
        // Prepare user profile data
        const userProfile = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || 'https://via.placeholder.com/150',
            phoneNumber: userData.phoneNumber || '',
            isAdmin: false,
            isBanned: false,
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            ...userData
        };
        
        // Save user profile to Firestore
        await setDoc(doc(db, 'users', user.uid), userProfile);
        
        // Send email verification
        await sendEmailVerification();
        
        return {
            success: true,
            user: userProfile
        };
    } catch (error) {
        console.error('Sign up error:', error);
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
};

/**
 * Sign in with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return {
            success: true,
            user: {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                emailVerified: userCredential.user.emailVerified
            }
        };
    } catch (error) {
        console.error('Error signing in:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Correo o contraseña incorrectos';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos fallidos. Intenta de nuevo más tarde';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Esta cuenta ha sido deshabilitada';
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Sign out the current user
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error);
        return {
            success: false,
            error: 'Error al cerrar sesión'
        };
    }
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
    const user = await getCurrentUser();
    return !!user;
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendPasswordResetEmail = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        let errorMessage = 'Error al enviar el correo de restablecimiento de contraseña';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No hay ninguna cuenta registrada con este correo electrónico';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El correo electrónico no es válido';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos. Por favor, inténtalo de nuevo más tarde';
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
};