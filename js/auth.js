// Firebase Authentication Module
// Handles user authentication using Firebase Authentication

import { auth, db } from './firebase-config.js';
import { createUserProfile } from './services/user-service.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendEmailVerification as firebaseSendEmailVerification,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile as firebaseUpdateProfile,
    updateEmail as firebaseUpdateEmail,
    updatePassword as firebaseUpdatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

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

const getErrorMessage = (code) => ERROR_MESSAGES[code] || ERROR_MESSAGES['default'];

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
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;

        const userProfile = await createUserProfile(user, userData);

        try {
            if (firebaseSendEmailVerification) {
                await firebaseSendEmailVerification(user);
            }
        } catch (verificationError) {
            console.warn('No se pudo enviar el correo de verificación:', verificationError);
        }

        return { success: true, user: userProfile };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: getErrorMessage(error.code) };
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

        return { success: false, error: errorMessage };
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
        return { success: false, error: 'Error al cerrar sesión' };
    }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendPasswordResetEmail = async (email) => {
    try {
        await firebaseSendPasswordResetEmail(auth, email);
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

        return { success: false, error: errorMessage };
    }
};

/**
 * Update the current user's profile (display name / photo)
 * @param {Object} profile - { displayName?, photoURL? }
 */
export const updateProfile = async (profile) => {
    try {
        if (auth.currentUser) {
            await firebaseUpdateProfile(auth.currentUser, profile);
        }
        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
};

/**
 * Change the current user's password (re-authenticating first)
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export const changePassword = async (currentPassword, newPassword) => {
    try {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error('auth/user-not-found');

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await firebaseUpdatePassword(user, newPassword);
        return { success: true };
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
};

/**
 * Sign in (or sign up) with a Google account.
 * Creates the Firestore profile document if it does not exist yet.
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export const signInWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Ensure the user has a profile document
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            try {
                await createUserProfile(user);
            } catch (profileError) {
                console.warn('No se pudo crear el perfil de Google:', profileError);
            }
        }

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }
        };
    } catch (error) {
        console.error('Google sign-in error:', error);
        let errorMessage = 'No se pudo iniciar sesión con Google';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Ventana de Google cerrada antes de completar el inicio de sesión';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Solicitud de inicio de sesión cancelada';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = 'Ya existe una cuenta con este correo usando otro método de inicio de sesión';
        }
        return { success: false, error: errorMessage };
    }
};

// Export the Firebase instances so other modules can reuse them
export { auth, db, onAuthStateChanged };
