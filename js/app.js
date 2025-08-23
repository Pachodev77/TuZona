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
const featuredAdsContainer = document.getElementById('featured-ads');
const recentAdsContainer = document.getElementById('recent-ads');
const searchInput = document.querySelector('.search-bar input');
const regionSelect = document.getElementById('region');
const searchButton = document.querySelector('.search-btn');

// Format price with Colombian Peso format
const formatPrice = (price) => {
    return `$${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

// Create ad card HTML
const createAdCard = (ad) => {
    // Use the first image from the images array if available, otherwise fall back to the image property
    const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaW4gaW1hZ2VuPC90ZXh0Pgo8L3N2Zz4=';
    const imageUrl = (ad.images && ad.images.length > 0) ? ad.images[0] : (ad.image || defaultImage);
    
    return `
        <a href="ad.html?id=${ad.id}" class="ad-card" data-id="${ad.id}">
            <div class="ad-image">
                <img src="${imageUrl}" 
                     alt="${ad.title}" 
                     onerror="this.onerror=null; this.src='${defaultImage}'">
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
const displayAds = () => {
    const sampleAds = getAds();
    // Clear existing ads
    featuredAdsContainer.innerHTML = '';
    recentAdsContainer.innerHTML = '';
    
    // Filter featured and recent ads
    const featuredAds = sampleAds.filter(ad => ad.featured);
    const recentAds = [...sampleAds].sort((a, b) => {
        if (a.date === 'Hoy' && b.date !== 'Hoy') return -1;
        if (a.date === 'Ayer' && b.date === 'Hace 2 días') return -1;
        return 0;
    });
    
    // Add featured ads to the DOM
    if (featuredAds.length > 0) {
        featuredAds.forEach(ad => {
            featuredAdsContainer.innerHTML += createAdCard(ad);
        });
    } else {
        featuredAdsContainer.innerHTML = '<p class="no-results">No hay anuncios destacados en este momento.</p>';
    }
    
    // Add recent ads to the DOM
    if (recentAds.length > 0) {
        recentAds.forEach(ad => {
            recentAdsContainer.innerHTML += createAdCard(ad);
        });
    } else {
        recentAdsContainer.innerHTML = '<p class="no-results">No hay anuncios recientes.</p>';
    }
    
    
};

// Filter ads based on search query and region
const filterAds = () => {
    const query = searchInput.value;
    const region = regionSelect.value;
    window.location.href = `search.html?query=${query}&region=${region}`;
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Display initial ads
    displayAds();
    
    // Search button click
    searchButton.addEventListener('click', filterAds);
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filterAds();
        }
    });
    
    // Region change
    regionSelect.addEventListener('change', filterAds);
});

// Mobile menu toggle (for smaller screens)
const setupMobileMenu = () => {
    const mainNav = document.querySelector('.main-nav');
    
    // Only proceed if the navigation exists on the page
    if (!mainNav) return;
    
    const navList = mainNav.querySelector('ul');
    if (!navList) return;
    
    // Check if menu toggle already exists
    let menuToggle = mainNav.querySelector('.mobile-menu-toggle');
    
    if (!menuToggle) {
        // Create menu toggle button if it doesn't exist
        menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        
        // Add mobile menu toggle button
        mainNav.insertBefore(menuToggle, navList);
        
        // Toggle menu on click
        menuToggle.addEventListener('click', () => {
            const isVisible = navList.style.display === 'flex';
            navList.style.display = isVisible ? 'none' : 'flex';
        });
    }
    
    // Handle window resize
    const handleResize = () => {
        if (!navList) return;
        
        if (window.innerWidth > 768) {
            navList.style.display = 'flex';
        } else if (window.innerWidth <= 768) {
            navList.style.display = 'none';
        }
    };
    
    // Only add the resize event listener if we haven't already
    if (!window._mobileMenuInitialized) {
        window.addEventListener('resize', handleResize);
        window._mobileMenuInitialized = true;
    }
    
    // Initial check
    handleResize();
};

// Initialize mobile menu when DOM is loaded
document.addEventListener('DOMContentLoaded', setupMobileMenu);
