// Import Firebase services from the config file
import { auth, db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';


document.addEventListener('DOMContentLoaded', () => {
    const publishForm = document.getElementById('publish-form');

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

    // Guard: redirect if not logged in (waits for Firebase to initialize)
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
        }
    });

    publishForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const submitBtn = publishForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';

        try {
            // Get form values
            const title = e.target.title.value;
            const price = parseFloat(e.target.price.value.replace(/\./g, '').replace(',', '.'));
            const description = e.target.description.value;
            const category = e.target.category.value;
            const condition = e.target.condition.value;
            // Use getElementById to avoid conflict with header's #region select
            const location = document.getElementById('ad-region').value;
            const sellerName = e.target['seller-name'].value;
            const sellerPhone = e.target['seller-phone'].value;
            const images = [];

            // Basic validation
            if (!title || !price || !category || !condition || !location) {
                showError('Por favor completa todos los campos obligatorios.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            // Images are already uploaded to Cloudinary by the ImageUploader widget.
            // Just collect their URLs from the preview elements.
            const imageInputs = document.querySelectorAll('.preview-item img[data-file]');
            for (const img of imageInputs) {
                try {
                    const fileData = JSON.parse(img.dataset.file);
                    if (fileData && fileData.url && fileData.url.startsWith('http')) {
                        images.push(fileData.url);
                    } else if (img.src && img.src.startsWith('http')) {
                        images.push(img.src);
                    }
                } catch (error) {
                    console.error('Error collecting image URL:', error);
                }
            }

            // Build ad document
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

            showSuccess('¡Anuncio publicado exitosamente!');
            e.target.reset();
            document.querySelectorAll('.preview-item').forEach(el => el.remove());

            setTimeout(() => {
                window.location.href = `ad.html?id=${docRef.id}`;
            }, 1500);

        } catch (error) {
            console.error('Error publishing ad:', error);
            showError(`Error al publicar el anuncio: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Publicar Anuncio';
        }
    });
});