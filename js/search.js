import { AdService } from './services/ad-service.js';
import { formatRelativeDate, createAdCard } from './ui-helpers.js';

// DOM Elements
const searchAdsContainer = document.getElementById('search-ads');
const searchTitle = document.getElementById('search-title');
const searchInput = document.getElementById('search-input');
const regionSelect = document.getElementById('region');
const searchButton = document.getElementById('search-button');

const matchesQuery = (ad, query) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
        (ad.title && ad.title.toLowerCase().includes(q)) ||
        (ad.description && ad.description.toLowerCase().includes(q)) ||
        (ad.category && ad.category.toLowerCase().includes(q))
    );
};

const matchesRegion = (ad, region) => {
    if (!region) return true;
    const location = (ad.location || '').trim().toLowerCase();
    if (!location) return false;
    const regionLower = region.trim().toLowerCase();
    return location.includes(regionLower) || regionLower.includes(location.split(',')[0] || '');
};
};

const displaySearchResults = (allAds, query = '', region = '') => {
    const filtered = allAds.filter(ad => matchesQuery(ad, query) && matchesRegion(ad, region));

    if (query && region) {
        searchTitle.textContent = `Resultados para "${query}" en ${region}`;
    } else if (query) {
        searchTitle.textContent = `Resultados para "${query}"`;
    } else if (region) {
        searchTitle.textContent = `Anuncios en ${region}`;
    } else {
        searchTitle.textContent = 'Todos los anuncios';
    }

    if (!filtered.length) {
        searchAdsContainer.innerHTML = '<p class="no-results">No se encontraron anuncios que coincidan con tu búsqueda.</p>';
        return;
    }

    searchAdsContainer.innerHTML = filtered.map(createAdCard).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('query') || '';
    const regionQuery = urlParams.get('region') || '';

    if (searchInput) searchInput.value = searchQuery;
    if (regionSelect && regionQuery) regionSelect.value = regionQuery;

    searchAdsContainer.innerHTML = '<div class="loading">Cargando anuncios...</div>';

    try {
        const ads = await AdService.getActiveAds();
        const performSearch = () => {
            const query = searchInput ? searchInput.value.trim() : searchQuery;
            const region = regionSelect ? regionSelect.value : regionQuery;
            displaySearchResults(ads, query, region);
        };

        if (searchButton) searchButton.addEventListener('click', performSearch);
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        }

        // If a region is chosen from the header, re-run the search
        if (regionSelect) {
            regionSelect.addEventListener('change', performSearch);
        }

        displaySearchResults(ads, searchQuery, regionQuery);
    } catch (error) {
        console.error('Error al buscar anuncios:', error);
        searchAdsContainer.innerHTML = '<p class="error">Error al cargar los anuncios. Por favor, recarga la página.</p>';
    }
});
