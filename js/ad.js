// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    const adDetailContainer = document.getElementById('ad-detail-container');
    const loadingMessage = document.createElement('p');
    loadingMessage.textContent = 'Cargando anuncio...';
    adDetailContainer.appendChild(loadingMessage);

    // Get ad ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const adId = urlParams.get('id');

    if (!adId) {
        adDetailContainer.innerHTML = '<p class="no-results">ID de anuncio no proporcionado.</p>';
        return;
    }

    try {
        // Get the ad from Firestore
        const adDoc = await getDoc(doc(db, 'ads', adId));
        
        if (!adDoc.exists()) {
            throw new Error('Anuncio no encontrado');
        }
        
        const ad = { id: adDoc.id, ...adDoc.data() };

        // Format the price as currency
        const formattedPrice = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(ad.price || 0);

        // Format the date
        const formattedDate = ad.createdAt?.toDate ? 
            new Date(ad.createdAt.toDate()).toLocaleDateString('es-CO') : 
            'Fecha no disponible';

        // Use the images array if available, otherwise fall back to the single image
        const images = (ad.images && ad.images.length > 0) ? ad.images : [];
        const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD4KICA8dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMS4xZW0iPlR1Wm9uYSBDbGFzaWZpY2Fkb3M8L3RleHQ+Cjwvc3ZnPg==';
        const mainImage = images[0] || defaultImage;
        
        // Create image gallery HTML
        const thumbnailsHTML = images.map((img, index) => {
            const imageSource = img || defaultImage;
            return `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${imageSource}" 
                     alt="${ad.title} - Imagen ${index + 1}" 
                     onerror="this.onerror=null; this.src='${defaultImage}'">
            </div>`;
        }).join('');
        
        adDetailContainer.innerHTML = `
            <section class="ad-detail">
                <div class="ad-detail-gallery">
                    <div class="main-image">
                        <img src="${mainImage}" 
                             alt="${ad.title}" 
                             id="main-ad-image" 
                             onerror="this.onerror=null; this.src='${defaultImage}'">
                    </div>
                    ${images.length > 1 ? `
                    <div class="thumbnails">
                        ${thumbnailsHTML}
                    </div>` : ''}
                </div>
                <div class="ad-detail-info">
                    <h1 class="ad-detail-title">${ad.title}</h1>
                    <div class="ad-detail-price">${formattedPrice}</div>
                    <div class="ad-detail-location"><i class="fas fa-map-marker-alt"></i> ${ad.location || 'Ubicación no especificada'}</div>
                    <div class="ad-detail-meta">
                        <span><strong>Categoría:</strong> ${ad.category || 'No especificada'}</span>
                        <span><strong>Condición:</strong> ${ad.condition || 'No especificada'}</span>
                        <span><strong>Publicado:</strong> ${formattedDate}</span>
                    </div>
                    <div class="ad-detail-description">
                        <h3>Descripción</h3>
                        <p>${ad.description || 'Sin descripción disponible'}</p>
                    </div>
                    <div class="ad-detail-seller">
                        <h3>Información del vendedor</h3>
                        <p><strong>Nombre:</strong> ${ad.seller?.name || 'No especificado'}</p>
                        ${ad.seller?.phone ? `<p><strong>Teléfono:</strong> ${ad.seller.phone}</p>` : ''}
                        ${ad.seller?.email ? `<p><strong>Email:</strong> ${ad.seller.email}</p>` : ''}
                    </div>
                    <div class="ad-detail-actions">
                        ${ad.seller?.phone ? `<a href="tel:${ad.seller.phone}" class="btn btn-primary"><i class="fas fa-phone"></i> Llamar al vendedor</a>` : ''}
                        <a href="#" class="btn"><i class="fas fa-heart"></i> Guardar en favoritos</a>
                    </div>
                </div>
            </section>
        `;
        
        // Add event listeners for thumbnail clicks
        if (images.length > 1) {
            const thumbnails = document.querySelectorAll('.thumbnail');
            const mainImage = document.getElementById('main-ad-image');
            
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    // Update active thumbnail
                    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    
                    // Update main image
                    const imgSrc = thumb.querySelector('img').src;
                    mainImage.src = imgSrc;
                });
            });
        }
    } catch (error) {
        console.error('Error loading ad:', error);
        adDetailContainer.innerHTML = `
            <div class="alert alert-danger">
                <p>Error al cargar el anuncio: ${error.message}</p>
                <a href="index.html" class="btn btn-primary">Volver al inicio</a>
            </div>
        `;
    }
});