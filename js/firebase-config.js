// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBd-B3w6KanW3fk7vy5eAwtXO-bxXXl9eY",
    authDomain: "tuzona-6df14.firebaseapp.com",
    projectId: "tuzona-6df14",
    storageBucket: "tuzona-6df14.appspot.com",
    messagingSenderId: "826985285220",
    appId: "1:826985285220:web:aad7f544961ecfdf2d4171",
    measurementId: "G-5MFSKGHY36"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export the Firebase services
export { app, auth, db, storage };
