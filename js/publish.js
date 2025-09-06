// Import Firebase services from the config file
import { auth, db, storage } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js';

// Get the current user
const user = auth.currentUser;

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

            // Get image files from the uploader
            const imageInputs = document.querySelectorAll('.preview-item img[data-file]');
            for (const img of imageInputs) {
                try {
                    const fileData = JSON.parse(img.dataset.file);
                    if (fileData && fileData.file) {
                        // Convert base64 to blob
                        const response = await fetch(fileData.url);
                        const blob = await response.blob();
                        
                        // Upload to Firebase Storage
                        const filePath = `ads/${Date.now()}_${fileData.name}`;
                        const fileRef = storageRef(storage, filePath);
                        
                        // Upload the file
                        const snapshot = await uploadBytes(fileRef, blob);
                        const downloadURL = await getDownloadURL(snapshot.ref);
                        images.push(downloadURL);
                    } else if (img.src && !img.src.includes('data:')) {
                        // If it's already a URL (from previous uploads)
                        images.push(img.src);
                    }
                } catch (error) {
                    console.error('Error processing image:', error);
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

            // Add timestamp and status to ad data
            const adWithTimestamp = {
                ...adData,
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                views: 0
            };
            
            // Save ad to Firestore
            const docRef = await addDoc(collection(db, 'ads'), adWithTimestamp);
            
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