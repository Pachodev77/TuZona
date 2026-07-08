import { auth, onAuthStateChanged } from './firebase-config.js';
import {
    getFavorites,
    removeFavorite
} from './services/favorites-service.js';
import { formatPrice, formatRelativeDate } from './ui-helpers.js';

let allFavorites = [];

const favoritesList = document.getElementById('favorites-list');
const emptyState = document.getElementById('empty-favorites');
const sortSelect = document.getElementById('sort-favorites');
const searchBox = document.querySelector('.favorites-container .search-box input');

const render = () => {
    const term = searchBox ? searchBox.value.trim().toLowerCase() : '';
    let list = allFavorites.filter(f =>
        !term || (f.title && f.title.toLowerCase().includes(term))
    );

    const sortBy = sortSelect ? sortSelect.value : 'recent';
    list.sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
        return new Date(b.savedAt || 0) - new Date(a.savedAt || 0);
    });

    if (!list.length) {
        favoritesList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    favoritesList.style.display = 'block';
    favoritesList.innerHTML = '';

    list.forEach(fav => {
        const el = document.createElement('div');
        el.className = 'ad-list-item';
        el.dataset.adId = fav.adId;
        el.innerHTML = `
            <div class="ad-list-image">
                <img src="${fav.image || 'images/placeholder.jpg'}" alt="${fav.title}" onerror="this.src='images/placeholder.jpg'">
                <button class="btn-icon btn-remove-favorite" title="Quitar de favoritos">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="ad-list-details">
                <h3><a href="ad.html?id=${fav.adId}">${fav.title}</a></h3>
                <p class="ad-list-price">${formatPrice(fav.price)}</p>
                <div class="ad-list-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${fav.location || 'Ubicación no especificada'}</span>
                    <span><i class="far fa-calendar-alt"></i> ${formatRelativeDate(fav.savedAt)}</span>
                </div>
            </div>
        `;
        favoritesList.appendChild(el);
    });

    document.querySelectorAll('.btn-remove-favorite').forEach(btn => {
        btn.addEventListener('click', async () => {
            const adId = btn.closest('[data-ad-id]').dataset.adId;
            const user = auth.currentUser;
            if (!user) return;
            try {
                await removeFavorite(user.uid, adId);
                allFavorites = allFavorites.filter(f => f.adId !== adId);
                render();
                showToast('Anuncio eliminado de favoritos');
            } catch (error) {
                console.error('Error al quitar favorito:', error);
            }
        });
    });
};

const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

document.addEventListener('DOMContentLoaded', () => {
    if (sortSelect) sortSelect.addEventListener('change', render);
    if (searchBox) searchBox.addEventListener('input', render);

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        favoritesList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Cargando tus favoritos...</p></div>';
        try {
            allFavorites = await getFavorites(user.uid);
            render();
        } catch (error) {
            console.error('Error al cargar favoritos:', error);
            favoritesList.innerHTML = '<p class="error">Error al cargar tus favoritos.</p>';
        }
    });
});
