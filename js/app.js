// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBd-B3w6KanW3fk7vy5eAwtXO-bxXXl9eY",
    authDomain: "tuzona-6df14.firebaseapp.com",
    projectId: "tuzona-6df14",
    storageBucket: "tuzona-6df14.appspot.com",
    messagingSenderId: "826985285220",
    appId: "1:826985285220:web:aad7f544961ecfdf2d4171"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to get ads from Firestore
const getAds = async (featured = false, limitCount = 20) => {
    try {
        const adsRef = collection(db, 'ads');
        let q;
        
        if (featured) {
            // Get featured ads
            q = query(adsRef, 
                where('featured', '==', true),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
        } else {
            // Get recent ads
            q = query(adsRef, 
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
        }
        
        const querySnapshot = await getDocs(q);
        const ads = [];
        
        querySnapshot.forEach((doc) => {
            const adData = doc.data();
            // Format the price for display
            if (typeof adData.price === 'number') {
                adData.price = adData.price.toLocaleString('es-CO');
            }
            // Add the document ID and formatted date
            ads.push({
                id: doc.id,
                ...adData,
                date: formatDate(adData.createdAt?.toDate() || new Date())
            });
        });
        
        return ads;
    } catch (error) {
        console.error('Error fetching ads:', error);
        return [];
    }
};

// Helper function to format date
const formatDate = (date) => {
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

// Format price with Colombian Peso format
const formatPrice = (price) => {
    return `$${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

// Create ad card HTML
const createAdCard = (ad) => {
    // Use the first image if available, otherwise use a placeholder
    const imageUrl = Array.isArray(ad.images) && ad.images.length > 0 
        ? ad.images[0] 
        : 'images/placeholder.jpg';
        
    return `
        <div class="ad-card">
            <div class="ad-image">
                <img src="${imageUrl}" alt="${ad.title}" onerror="this.src='images/placeholder.jpg'">
                <div class="ad-price">$${formatPrice(ad.price)}</div>
            </div>
            <div class="ad-details">
                <h3>${ad.title}</h3>
                <p class="ad-location"><i class="fas fa-map-marker-alt"></i> ${ad.location || 'Ubicación no especificada'}</p>
                <p class="ad-date">${ad.date || 'Fecha no disponible'}</p>
                <a href="ad.html?id=${ad.id}" class="btn btn-outline btn-block">Ver detalles</a>
            </div>
        </div>
    `;
};

// Display ads in the DOM
const displayAds = async () => {
    // Get container references
    const featuredContainer = document.getElementById('featured-ads');
    const recentContainer = document.getElementById('recent-ads');
    
    // Check if at least one container exists
    if (!featuredContainer && !recentContainer) {
        console.warn('No ad containers found in the DOM');
        return;
    }

    try {
        // Show loading states for existing containers
        if (featuredContainer) {
            featuredContainer.innerHTML = '<div class="loading">Cargando anuncios destacados...</div>';
        }
        if (recentContainer) {
            recentContainer.innerHTML = '<div class="loading">Cargando anuncios recientes...</div>';
        }
        
        // Fetch featured and recent ads in parallel
        const [featuredAds, recentAds] = await Promise.all([
            featuredContainer ? getAds(true, 6) : Promise.resolve([]),  // Only fetch if container exists
            recentContainer ? getAds(false, 12) : Promise.resolve([])    // Only fetch if container exists
        ]);

        // Display featured ads if container exists
        if (featuredContainer) {
            if (featuredAds.length > 0) {
                featuredContainer.innerHTML = '';
                featuredAds.forEach(ad => {
                    featuredContainer.innerHTML += createAdCard(ad);
                });
            } else {
                featuredContainer.innerHTML = '<p class="no-ads">No hay anuncios destacados en este momento.</p>';
            }
        }

        // Display recent ads if container exists
        if (recentContainer) {
            if (recentAds.length > 0) {
                recentContainer.innerHTML = '';
                recentAds.forEach(ad => {
                    recentContainer.innerHTML += createAdCard(ad);
                });
            } else {
                recentContainer.innerHTML = '<p class="no-ads">No hay anuncios recientes.</p>';
            }
        }
    } catch (error) {
        console.error('Error displaying ads:', error);
        if (featuredContainer) {
            featuredContainer.innerHTML = '<p class="error">Error al cargar los anuncios destacados. Por favor, recarga la página.</p>';
        }
        if (recentContainer) {
            recentContainer.innerHTML = '<p class="error">Error al cargar los anuncios recientes. Por favor, recarga la página.</p>';
        }
    }
};    

// DOM Elements
const featuredAdsContainer = document.getElementById('featured-ads');
const recentAdsContainer = document.getElementById('recent-ads');
const searchInput = document.querySelector('.search-bar input');
const regionSelect = document.getElementById('region');
const searchButton = document.querySelector('.search-btn');

// Filter ads based on search query and region
const filterAds = () => {
    const query = searchInput.value;
    const region = regionSelect.value;
    
    if (region) {
        // If a region is selected, show all ads from that region
        window.location.href = `search.html?region=${region}`;
    } else if (query) {
        // If only search query is provided, perform a regular search
        window.location.href = `search.html?query=${query}`;
    } else {
        // If nothing is selected, show all ads
        window.location.href = 'search.html';
    }
};

// Event Listeners
const initApp = () => {
    // Check if we're on the homepage
    const isHomePage = document.querySelector('.featured-ads') !== null;
    
    // Only run these if we're on the homepage
    if (isHomePage) {
        // Initialize Firebase
        initializeApp(firebaseConfig);
        
        // Display ads after a small delay to ensure DOM is ready
        setTimeout(() => {
            displayAds().catch(error => {
                console.error('Failed to load ads:', error);
            });
        }, 100);
        
        // Search functionality
        const searchButton = document.querySelector('.search-btn');
        const searchInput = document.querySelector('.search-bar input');
        const regionSelect = document.getElementById('region');
        
        if (searchButton) {
            searchButton.addEventListener('click', filterAds);
        }
        
        // Search on Enter key
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    filterAds();
                }
            });
        }
        
        // Filter by region
        if (regionSelect) {
            regionSelect.addEventListener('change', () => {
                if (regionSelect.value) {
                    filterAds();
                }
            });
        }
    }
};

// Run when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOMContentLoaded has already fired
    initApp();
}

// Mobile menu toggle (for smaller screens)
const setupMobileMenu = () => {
    const mainNav = document.querySelector('.main-nav');
    
    // Only proceed if the navigation exists on the page
    if (!mainNav) return;
    
    const navContainer = mainNav.querySelector('.container');
    if (!navContainer) return;
    
    const navList = navContainer.querySelector('ul');
    if (!navList) return; // Exit if no navigation list found
    
    // Check if menu toggle already exists
    let menuToggle = mainNav.querySelector('.mobile-menu-toggle');
    
    if (!menuToggle) {
        // Create menu toggle button if it doesn't exist
        menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        
        // Add mobile menu toggle button to the navigation
        mainNav.insertBefore(menuToggle, navContainer);
        
        // Toggle menu on click
        menuToggle.addEventListener('click', () => {
            const isVisible = navList.style.display === 'flex';
            navList.style.display = isVisible ? 'none' : 'flex';
        });
        
        // Initial state for mobile
        if (window.innerWidth <= 768) {
            navList.style.display = 'none';
        }
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
