// Function to get ads from localStorage
const getAds = () => {
    let ads = [];
    const adsJSON = localStorage.getItem('sampleAds');

    if (adsJSON) {
        ads = JSON.parse(adsJSON);
    } else {
        ads = [
            {
                id: 1,
                title: 'iPhone 13 Pro Max 256GB - Excelente estado',
                price: '3.500.000',
                location: 'Bogotá, Chapinero',
                date: 'Hoy',
                image: 'https://images.unsplash.com/photo-1632679965721-ec38161daeec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                category: 'Celulares',
                featured: true
            },
            {
                id: 2,
                title: 'Apartamento en arriendo - 3 habitaciones - Modelia',
                price: '1.800.000',
                location: 'Bogotá, Modelia',
                date: 'Ayer',
                image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                category: 'Inmuebles',
                featured: true
            },
            {
                id: 3,
                title: 'Mazda 3 2020 - Full equipo - 25.000 km',
                price: '85.000.000',
                location: 'Medellín, El Poblado',
                date: 'Hoy',
                image: 'https://images.unsplash.com/photo-1609525316023-35bdbd0e60e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                category: 'Vehículos',
                featured: true
            },
            {
                id: 4,
                title: 'Portátil HP Pavilion - 16GB RAM - 512GB SSD',
                price: '2.800.000',
                location: 'Cali, San Fernando',
                date: 'Hace 2 días',
                image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80',
                category: 'Computación',
                featured: false
            },
            {
                id: 5,
                title: 'Sofá en L - Color gris - Excelente estado',
                price: '1.200.000',
                location: 'Barranquilla, Norte',
                date: 'Hoy',
                image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                category: 'Hogar',
                featured: false
            },
            {
                id: 6,
                title: 'Bicicleta Specialized - Talla M - 18 velocidades',
                price: '2.100.000',
                location: 'Bogotá, Usaquén',
                date: 'Ayer',
                image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1022&q=80',
                category: 'Deportes',
                featured: true
            },
            {
                id: 7,
                title: 'Cámara Canon EOS 90D - Kit 18-55mm',
                price: '4.500.000',
                location: 'Medellín, Laureles',
                date: 'Hoy',
                image: 'https://images.unsplash.com/photo-1510127033411-de2b20e8de46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                category: 'Electrónica',
                featured: false
            },
            {
                id: 8,
                title: 'Zapatos deportivos Nike Air Max - Talla 42',
                price: '350.000',
                location: 'Cali, Granada',
                date: 'Hace 3 días',
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                category: 'Moda',
                featured: false
            }
        ];
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

// DOM Elements
const categoryAdsContainer = document.getElementById('category-ads');
const categoryTitle = document.getElementById('category-title');
const regionSelect = document.getElementById('region');
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-btn');

// Format price with Colombian Peso format
const formatPrice = (price) => {
    return `$${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

// Create ad card HTML
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

// Display ads in the DOM
const displayCategoryAds = () => {
    const sampleAds = getAds();
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        categoryTitle.textContent = `Resultados para ${category}`;
        const filteredAds = sampleAds.filter(ad => ad.category === category);

        categoryAdsContainer.innerHTML = '';
        if (filteredAds.length > 0) {
            filteredAds.forEach(ad => {
                categoryAdsContainer.innerHTML += createAdCard(ad);
            });
        } else {
            categoryAdsContainer.innerHTML = '<p class="no-results">No hay anuncios en esta categoría.</p>';
        }
    } else {
        categoryTitle.textContent = 'Categoría no encontrada';
        categoryAdsContainer.innerHTML = '<p class="no-results">Por favor, selecciona una categoría válida.</p>';
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    displayCategoryAds();

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

    regionSelect.addEventListener('change', () => {
        const region = regionSelect.value;
        if (region) {
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('category');
            window.location.href = `search.html?query=${category}&region=${region}`;
        }
    });
});