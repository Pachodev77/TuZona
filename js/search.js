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

    const displaySearchResults = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('query')?.toLowerCase() || '';
        const region = urlParams.get('region')?.toLowerCase() || '';

        const ads = getAds();

        const filteredAds = ads.filter(ad => {
            const titleMatch = ad.title.toLowerCase().includes(query);
            const descriptionMatch = ad.description.toLowerCase().includes(query);
            const categoryMatch = ad.category.toLowerCase().includes(query);
            const regionMatch = region ? ad.location.toLowerCase().includes(region) : true;

            return (titleMatch || descriptionMatch || categoryMatch) && regionMatch;
        });

        searchTitle.textContent = `Resultados para "${query}" ${region ? 'en ' + region : ''}`;

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
        const query = searchInput.value;
        const region = regionSelect.value;
        window.location.href = `search.html?query=${query}&region=${region}`;
    };

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    displaySearchResults();
});