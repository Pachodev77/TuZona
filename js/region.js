import { AdService } from './services/ad-service.js';
import { formatRelativeDate, createAdCard } from './ui-helpers.js';

// DOM Elements
const regionAdsContainer = document.getElementById('region-ads');
const regionTitle = document.getElementById('region-title');
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-btn');
const regionSelect = document.getElementById('region');

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const region = urlParams.get('region') || '';

    if (regionSelect && region) regionSelect.value = region;

    if (!region) {
        regionTitle.textContent = 'Región no encontrada';
        regionAdsContainer.innerHTML = '<p class="no-results">Por favor, selecciona una región válida.</p>';
        return;
    }

    regionTitle.textContent = `Resultados para ${region}`;
    regionAdsContainer.innerHTML = '<div class="loading">Cargando anuncios...</div>';

    try {
        const ads = await AdService.getActiveAds();
        const filtered = ads.filter(ad =>
            (ad.location || '').toLowerCase().includes(region.toLowerCase())
        );

        if (!filtered.length) {
            regionAdsContainer.innerHTML = '<p class="no-results">No hay anuncios en esta región.</p>';
        } else {
            regionAdsContainer.innerHTML = filtered.map(createAdCard).join('');
        }
    } catch (error) {
        console.error('Error al cargar anuncios de la región:', error);
        regionAdsContainer.innerHTML = '<p class="error">Error al cargar los anuncios. Por favor, recarga la página.</p>';
    }

    const performSearch = () => {
        const query = searchInput ? searchInput.value : '';
        const selRegion = regionSelect ? regionSelect.value : region;
        window.location.href = `search.html?query=${encodeURIComponent(query)}&region=${encodeURIComponent(selRegion)}`;
    };

    if (searchButton) searchButton.addEventListener('click', performSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
});
