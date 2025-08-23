// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBd-B3w6KanW3fk7vy5eAwtXO-bxXXl9eY",
    authDomain: "tuzona-6df14.firebaseapp.com",
    projectId: "tuzona-6df14",
    storageBucket: "tuzona-6df14.appspot.com",
    messagingSenderId: "826985285220",
    appId: "1:826985285220:web:aad7f544961ecfdf2d4171"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const publishForm = document.getElementById('publish-form');
    
    // Check if user is logged in
    const checkAuth = () => {
        return new Promise((resolve, reject) => {
            const user = auth.currentUser;
            if (user) {
                resolve(user);
            } else {
                window.location.href = 'login.html';
                reject(new Error('User not authenticated'));
            }
        });
    };

    // Function to show error message
    const showError = (message) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = message;
        publishForm.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    };

    // Function to show success message
    const showSuccess = (message) => {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.textContent = message;
        publishForm.prepend(successDiv);
        setTimeout(() => successDiv.remove(), 5000);
    };

    publishForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            // Show loading state
            const submitBtn = publishForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';

            // Get current user
            const user = await checkAuth();
            if (!user) return;

            // Get form values
            const title = e.target.title.value;
            const price = parseFloat(e.target.price.value.replace(/\./g, '').replace(',', '.'));
            const description = e.target.description.value;
            const category = e.target.category.value;
            const condition = e.target.condition.value;
            const location = e.target.region.value;
            const sellerName = e.target['seller-name'].value;
            const sellerPhone = e.target['seller-phone'].value;
            const images = [];

            // Get image URLs (if any)
            const imageInputs = document.querySelectorAll('.image-upload-preview img');
            for (const img of imageInputs) {
                if (img.src && !img.src.includes('placeholder')) {
                    images.push(img.src);
                }
            }

            // Create ad data object
            const adData = {
                title,
                price,
                description,
                category,
                condition,
                location,
                images,
                seller: {
                    id: user.uid,
                    name: sellerName,
                    phone: sellerPhone,
                    email: user.email || ''
                },
                status: 'active',
                views: 0,
                featured: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Save ad to Firestore
            const docRef = await addDoc(collection(db, 'ads'), adData);
            
            // Show success message
            showSuccess('¡Anuncio publicado exitosamente!');
            
            // Reset form
            e.target.reset();
            
            // Clear image previews
            document.querySelectorAll('.image-upload-preview').forEach(preview => {
                preview.innerHTML = '';
            });
            
            // Redirect to the ad page
            setTimeout(() => {
                window.location.href = `ad.html?id=${docRef.id}`;
            }, 1500);

        } catch (error) {
            console.error('Error publishing ad:', error);
            showError(`Error al publicar el anuncio: ${error.message}`);
        } finally {
            // Reset button state
            const submitBtn = publishForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Publicar Anuncio';
            }
        }
        // This code block has been removed as it was duplicate functionality
    });
});