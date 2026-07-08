import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { formatRelativeDate, createAdCard } from './ui-helpers.js';

// DOM Elements
const categoryAdsContainer = document.getElementById('category-ads');
const categoryTitle = document.getElementById('category-title');
const regionSelect = document.getElementById('region');
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-btn');

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
                date: formatRelativeDate(adData.createdAt?.toDate() || new Date())
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