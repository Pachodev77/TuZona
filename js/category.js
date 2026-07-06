import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

// DOM Elements
const categoryAdsContainer = document.getElementById('category-ads');
const categoryTitle = document.getElementById('category-title');
const regionSelect = document.getElementById('region');
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-btn');

// Format price with Colombian Peso format
const formatPrice = (price) => {
    if (!price) return '$0';
    return `$${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

// Helper function to format date
const formatDate = (date) => {
    if (!date) return 'Fecha no disponible';
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Create ad card HTML
const createAdCard = (ad) => {
    // Use the first image if available, otherwise use a placeholder
    const imageUrl = Array.isArray(ad.images) && ad.images.length > 0 
        ? ad.images[0] 
        : (ad.image || 'images/placeholder.jpg');

    return `
        <a href="ad.html?id=${ad.id}" class="ad-card" data-id="${ad.id}">
            <div class="ad-image">
                <img src="${imageUrl}" alt="${ad.title}" onerror="this.src='images/placeholder.jpg'">
                <div class="ad-price">${formatPrice(ad.price)}</div>
            </div>
            <div class="ad-details">
                <h3 class="ad-title">${ad.title}</h3>
                <div class="ad-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${ad.location || 'Ubicación no especificada'}
                </div>
                <div class="ad-meta">
                    <span>${ad.category}</span>
                    <span>${ad.date}</span>
                </div>
            </div>
        </a>
    `;
};

// Fetch and display ads from Firestore
const displayCategoryAds = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (!category) {
        if (categoryTitle) categoryTitle.textContent = 'Categoría no encontrada';
        if (categoryAdsContainer) categoryAdsContainer.innerHTML = '<p class="no-results">Por favor, selecciona una categoría válida.</p>';
        return;
    }

    if (categoryTitle) categoryTitle.textContent = `Resultados para ${category}`;
    if (categoryAdsContainer) categoryAdsContainer.innerHTML = '<div class="loading">Cargando anuncios...</div>';

    try {
        const adsRef = collection(db, 'ads');
        const q = query(
            adsRef, 
            where('category', '==', category)
        );
        
        const querySnapshot = await getDocs(q);
        const ads = [];
        
        querySnapshot.forEach((doc) => {
            const adData = doc.data();
            // Optional: Filter active ads here if needed: if(adData.status !== 'active') return;
            ads.push({
                id: doc.id,
                ...adData,
                date: formatDate(adData.createdAt?.toDate() || new Date())
            });
        });

        // Sort locally by date descending
        ads.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });

        if (categoryAdsContainer) {
            categoryAdsContainer.innerHTML = '';
            if (ads.length > 0) {
                ads.forEach(ad => {
                    categoryAdsContainer.innerHTML += createAdCard(ad);
                });
            } else {
                categoryAdsContainer.innerHTML = '<p class="no-results">No hay anuncios en esta categoría.</p>';
            }
        }
    } catch (error) {
        console.error('Error fetching category ads:', error);
        if (categoryAdsContainer) categoryAdsContainer.innerHTML = '<p class="error">Error al cargar los anuncios. Por favor, recarga la página.</p>';
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    displayCategoryAds();

    const performSearch = () => {
        const queryVal = searchInput?.value || '';
        const region = regionSelect?.value || '';
        window.location.href = `search.html?query=${queryVal}&region=${region}`;
    };

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const region = regionSelect.value;
            if (region) {
                const urlParams = new URLSearchParams(window.location.search);
                const category = urlParams.get('category') || '';
                window.location.href = `search.html?query=${category}&region=${region}`;
            }
        });
    }
});