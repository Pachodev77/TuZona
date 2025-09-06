document.addEventListener('DOMContentLoaded', () => {
    const searchAdsContainer = document.getElementById('search-ads');
    const searchTitle = document.getElementById('search-title');
    const searchInput = document.getElementById('search-input');
    const regionSelect = document.getElementById('region');
    const searchButton = document.getElementById('search-button');

    // Function to get ads from localStorage
    const getAds = () => {
        let ads = [];
        const adsJSON = localStorage.getItem('sampleAds');

        if (adsJSON) {
            ads = JSON.parse(adsJSON);
        } else {
            // Default ads if localStorage is empty
            ads = []; 
        }

        // Data migration for old ads
        const migratedAds = ads.map(ad => {
            if (!ad.hasOwnProperty('description')) {
                ad.description = 'No hay descripción disponible.';
            }
            if (!ad.hasOwnProperty('condition')) {
                ad.condition = 'No especificado';
            }
            if (!ad.hasOwnProperty('seller')) {
                ad.seller = {
                    name: 'Vendedor anónimo',
                    phone: 'No disponible'
                };
            }
            return ad;
        });

        localStorage.setItem('sampleAds', JSON.stringify(migratedAds));

        return migratedAds;
    };

    const formatPrice = (price) => {
        return `$${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
    };

    const createAdCard = (ad) => {
        return `
            <a href="ad.html?id=${ad.id}" class="ad-card" data-id="${ad.id}">
                <div class="ad-image">
                    <img src="${ad.image}" alt="${ad.title}">
                    <div class="ad-price">${formatPrice(ad.price)}</div>
                </div>
                <div class="ad-details">
                    <h3 class="ad-title">${ad.title}</h3>
                    <div class="ad-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${ad.location}
                    </div>
                    <div class="ad-meta">
                        <span>${ad.category}</span>
                        <span>${ad.date}</span>
                    </div>
                </div>
            </a>
        `;
    };

    // Initialize search with URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('query') || '';
    const regionQuery = urlParams.get('region') || '';
    
    searchInput.value = searchQuery;
    if (regionSelect && regionQuery) {
        regionSelect.value = regionQuery;
    }

    const displaySearchResults = (query = '', region = '') => {
        const ads = getAds();
        
        // Filter ads based on search query and region
        const filteredAds = ads.filter(ad => {
            // If there's a query, check if it matches title, description, or category
            const matchesQuery = !query || 
                ad.title.toLowerCase().includes(query.toLowerCase()) || 
                (ad.description && ad.description.toLowerCase().includes(query.toLowerCase())) ||
                (ad.category && ad.category.toLowerCase().includes(query.toLowerCase()));
            
            // If a region is selected, check if it matches the ad's location
            let matchesRegion = true;
            if (region) {
                // Convert both to lowercase for case-insensitive comparison
                const location = ad.location ? ad.location.toLowerCase() : '';
                const regionLower = region.toLowerCase();
                
                // Check if the location includes the region or vice versa
                matchesRegion = location.includes(regionLower) || 
                              regionLower.includes(location.split(',')[0].toLowerCase());
            }
                
            return matchesQuery && matchesRegion;
        });

        // Update the search results title
        if (query && region) {
            searchTitle.textContent = `Resultados para "${query}" en ${region}`;
        } else if (query) {
            searchTitle.textContent = `Resultados para "${query}"`;
        } else if (region) {
            searchTitle.textContent = `Anuncios en ${region}`;
        } else {
            searchTitle.textContent = 'Todos los anuncios';
        }

        searchAdsContainer.innerHTML = '';
        if (filteredAds.length > 0) {
            filteredAds.forEach(ad => {
                searchAdsContainer.innerHTML += createAdCard(ad);
            });
        } else {
            searchAdsContainer.innerHTML = '<p class="no-results">No se encontraron anuncios que coincidan con tu búsqueda.</p>';
        }
    };

    const performSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        const region = regionSelect ? regionSelect.value : '';
        displaySearchResults(query, region);
    };

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Display initial results if there's a search query or region filter
    if (searchQuery || regionQuery) {
        displaySearchResults(searchQuery, regionQuery);
    }
});