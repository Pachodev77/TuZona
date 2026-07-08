import { db, auth, onAuthStateChanged } from './firebase-config.js';
import {
    doc,
    getDoc,
    updateDoc,
    increment
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { isFavorite, toggleFavorite } from './services/favorites-service.js';
import { getOrCreateConversation } from './services/message-service.js';

const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD4KICA8dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMS4xZW0iPlR1Wm9uYSBDbGFzaWZpY2Fkb3M8L3RleHQ+Cjwvc3ZnPg==';

document.addEventListener('DOMContentLoaded', () => {
    const adDetailContainer = document.getElementById('ad-detail-container');
    adDetailContainer.innerHTML = '<p>Cargando anuncio...</p>';

    const urlParams = new URLSearchParams(window.location.search);
    const adId = urlParams.get('id');

    if (!adId) {
        adDetailContainer.innerHTML = '<p class="no-results">ID de anuncio no proporcionado.</p>';
        return;
    }

    // Wait for auth state before rendering so isOwner is accurate
    onAuthStateChanged(auth, async (currentUser) => {
        try {
            const adDoc = await getDoc(doc(db, 'ads', adId));

            if (!adDoc.exists()) {
                throw new Error('Anuncio no encontrado');
            }

            const ad = { id: adDoc.id, ...adDoc.data() };

            // Increment the view counter (best-effort)
            try {
                await updateDoc(doc(db, 'ads', adId), { views: increment(1) });
            } catch (viewError) {
                console.warn('No se pudo incrementar el contador de vistas:', viewError);
            }

            const formattedPrice = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(ad.price || 0);

            const formattedDate = ad.createdAt?.toDate
                ? new Date(ad.createdAt.toDate()).toLocaleDateString('es-CO')
                : 'Fecha no disponible';

            const images = (ad.images && ad.images.length > 0) ? ad.images : [];
            const mainImage = images[0] || defaultImage;

            const thumbnailsHTML = images.map((img, index) => `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${img || defaultImage}"
                         alt="${ad.title} - Imagen ${index + 1}"
                         onerror="this.onerror=null; this.src='${defaultImage}'">
                </div>`).join('');

            const isOwner = currentUser && ad.seller?.id === currentUser.uid;

            adDetailContainer.innerHTML = `
                <section class="ad-detail">
                    <div class="ad-detail-gallery">
                        <div class="main-image">
                            <img src="${mainImage}"
                                 alt="${ad.title}"
                                 id="main-ad-image"
                                 onerror="this.onerror=null; this.src='${defaultImage}'">
                        </div>
                        ${images.length > 1 ? `<div class="thumbnails">${thumbnailsHTML}</div>` : ''}
                    </div>
                    <div class="ad-detail-info">
                        <h1 class="ad-detail-title">${ad.title}</h1>
                        <div class="ad-detail-price">${formattedPrice}</div>
                        <div class="ad-detail-location"><i class="fas fa-map-marker-alt"></i> ${ad.location || 'Ubicación no especificada'}</div>
                        <div class="ad-detail-meta">
                            <span><strong>Categoría:</strong> ${ad.category || 'No especificada'}</span>
                            <span><strong>Condición:</strong> ${ad.condition || 'No especificada'}</span>
                            <span><strong>Publicado:</strong> ${formattedDate}</span>
                            <span><strong>Vistas:</strong> ${ad.views || 0}</span>
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
                            ${isOwner
                                ? `<a href="publish.html?edit=${ad.id}" class="btn btn-outline"><i class="fas fa-edit"></i> Editar anuncio</a>`
                                : `<button id="favorite-btn" class="btn" type="button"><i class="far fa-heart"></i> Guardar en favoritos</button>
                                   <button id="contact-btn" class="btn btn-primary" type="button"><i class="fas fa-envelope"></i> Contactar al vendedor</button>`
                            }
                        </div>
                    </div>
                </section>
            `;

            // Thumbnail navigation
            if (images.length > 1) {
                const thumbnails = document.querySelectorAll('.thumbnail');
                const mainImg = document.getElementById('main-ad-image');
                thumbnails.forEach(thumb => {
                    thumb.addEventListener('click', () => {
                        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                        mainImg.src = thumb.querySelector('img').src;
                    });
                });
            }

            // Favorite toggle
            const favoriteBtn = document.getElementById('favorite-btn');
            if (favoriteBtn) {
                const refreshFavoriteUI = (fav) => {
                    favoriteBtn.innerHTML = fav
                        ? '<i class="fas fa-heart"></i> Quitar de favoritos'
                        : '<i class="far fa-heart"></i> Guardar en favoritos';
                    favoriteBtn.classList.toggle('btn-primary', fav);
                };

                if (currentUser) {
                    try {
                        refreshFavoriteUI(await isFavorite(currentUser.uid, ad.id));
                    } catch (e) { console.warn(e); }
                }

                favoriteBtn.addEventListener('click', async () => {
                    const user = auth.currentUser;
                    if (!user) {
                        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
                        return;
                    }
                    try {
                        const nowFav = await toggleFavorite(user.uid, ad);
                        refreshFavoriteUI(nowFav);
                    } catch (error) {
                        console.error('Error al actualizar favorito:', error);
                    }
                });
            }

            // Contact seller -> open/create conversation and go to messages
            const contactBtn = document.getElementById('contact-btn');
            if (contactBtn) {
                contactBtn.addEventListener('click', async () => {
                    const user = auth.currentUser;
                    if (!user) {
                        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
                        return;
                    }
                    if (!ad.seller?.id) {
                        alert('Este anuncio no tiene un vendedor asociado.');
                        return;
                    }

                    // Disable button while creating conversation
                    contactBtn.disabled = true;
                    contactBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Abriendo chat...';

                    try {
                        const convId = await getOrCreateConversation({
                            buyerId: user.uid,
                            buyerName: user.displayName || user.email,
                            sellerId: ad.seller.id,
                            sellerName: ad.seller.name || 'Vendedor',
                            adId: ad.id,
                            adTitle: ad.title,
                            adImage: images[0] || ''
                        });
                        window.location.href = `messages.html?conv=${convId}`;
                    } catch (error) {
                        console.error('Error al iniciar conversación:', error);
                        contactBtn.disabled = false;
                        contactBtn.innerHTML = '<i class="fas fa-envelope"></i> Contactar al vendedor';
                        alert('No se pudo iniciar la conversación. Inténtalo de nuevo.');
                    }
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
});
