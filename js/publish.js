// Import Firebase services from the config file
import { auth, db } from './firebase-config.js';
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { AdService } from './services/ad-service.js';

let imageUploader = null;

document.addEventListener('DOMContentLoaded', () => {
    const publishForm = document.getElementById('publish-form');
    if (!publishForm) return;

    const isEdit = new URLSearchParams(window.location.search).has('edit');
    const editId = new URLSearchParams(window.location.search).get('edit');

    // Redirect to login if not authenticated
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        // Build the image uploader (with existing images when editing)
        const initialImages = [];
        if (isEdit && editId) {
            try {
                const existing = await AdService.getAdById(editId);
                if (existing && existing.seller?.id === user.uid) {
                    if (Array.isArray(existing.images)) initialImages.push(...existing.images);
                    populateForm(existing);
                } else if (existing) {
                    alert('No tienes permiso para editar este anuncio.');
                    window.location.href = 'account.html';
                    return;
                }
            } catch (error) {
                console.error('Error al cargar el anuncio a editar:', error);
            }
        }

        if (!imageUploader) {
            imageUploader = new ImageUploader({
                maxFiles: 5,
                maxFileSize: 5,
                allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                initialImages,
                onUploadComplete: (imageUrl) => {
                    const mainImage = document.getElementById('main-image');
                    if (mainImage) mainImage.src = imageUrl;
                }
            });
            const container = document.getElementById('image-uploader-container');
            if (container) container.appendChild(imageUploader.getElement());
        }

        publishForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSubmit(user, isEdit ? editId : null);
        });
    });

    const showError = (message) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = message;
        publishForm.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    };

    const showSuccess = (message) => {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.textContent = message;
        publishForm.prepend(successDiv);
        setTimeout(() => successDiv.remove(), 5000);
    };

    const populateForm = (ad) => {
        if (!ad) return;
        const setVal = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
        setVal('title', ad.title);
        setVal('description', ad.description);
        setVal('price', ad.price);
        setVal('category', ad.category);
        setVal('condition', ad.condition);
        setVal('ad-region', ad.location);
        setVal('seller-name', ad.seller?.name);
        setVal('seller-phone', ad.seller?.phone);

        const heading = document.querySelector('.publish-form-container h2');
        if (heading) heading.textContent = 'Editar anuncio';
        const submitBtn = publishForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Guardar cambios';
    };

    const handleSubmit = async (user, adId) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const submitBtn = publishForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        try {
            const title = publishForm.title.value;
            const price = parseFloat(publishForm.price.value.replace(/\./g, '').replace(',', '.'));
            const description = publishForm.description.value;
            const category = publishForm.category.value;
            const condition = publishForm.condition.value;
            const location = document.getElementById('ad-region').value;
            const sellerName = publishForm['seller-name'].value;
            const sellerPhone = publishForm['seller-phone'].value;
            const images = [];

            if (!title || !price || !category || !condition || !location) {
                showError('Por favor completa todos los campos obligatorios.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            // Collect uploaded image URLs (existing + newly uploaded)
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
                updatedAt: serverTimestamp()
            };

            let resultId = adId;
            if (adId) {
                await AdService.updateAd(adId, adData);
                showSuccess('¡Anuncio actualizado exitosamente!');
            } else {
                adData.views = 0;
                adData.featured = false;
                adData.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, 'ads'), adData);
                resultId = docRef.id;
                showSuccess('¡Anuncio publicado exitosamente!');
                publishForm.reset();
                document.querySelectorAll('.preview-item').forEach(el => el.remove());
            }

            setTimeout(() => {
                window.location.href = `ad.html?id=${resultId}`;
            }, 1500);
        } catch (error) {
            console.error('Error saving ad:', error);
            showError(`Error al guardar el anuncio: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = adId ? 'Guardar cambios' : 'Publicar Anuncio';
        }
    };
});
