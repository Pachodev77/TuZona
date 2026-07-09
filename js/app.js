// Reuse the single Firebase instance configured in firebase-config.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { formatRelativeDate, createAdCard } from './ui-helpers.js';

// Function to get ads from Firestore
const getAds = async (featured = false, limitCount = 20) => {
    try {
        const adsRef = collection(db, 'ads');
        let q;
        
        if (featured) {
            // Featured ads (no composite index required: filter then sort client-side)
            q = query(adsRef, where('featured', '==', true));
        } else {
            // Recent ads
            q = query(adsRef, orderBy('createdAt', 'desc'), limit(limitCount));
        }
        
        const querySnapshot = await getDocs(q);
        const ads = [];
        
        querySnapshot.forEach((doc) => {
            const adData = doc.data();
            // Add the document ID and formatted date
            ads.push({
                id: doc.id,
                ...adData,
                date: formatRelativeDate(adData.createdAt?.toDate() || new Date())
            });
        });

        // Sort featured ads client-side (avoids needing a composite index)
        if (featured) {
            ads.sort((a, b) => {
                const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return tb - ta;
            });
            return ads.slice(0, limitCount);
        }
        
        return ads;
    } catch (error) {
        console.error('Error fetching ads:', error);
        return [];
    }
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
        // Hide featured section by default while loading — shown only if there are featured ads
        if (featuredContainer) {
            const featuredSection = featuredContainer.closest('section');
            if (featuredSection) featuredSection.style.display = 'none';
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
            const featuredSection = featuredContainer.closest('section');
            if (featuredAds.length > 0) {
                featuredContainer.innerHTML = featuredAds.map(createAdCard).join('');
                if (featuredSection) featuredSection.style.display = '';
            } else {
                // No featured ads — hide the entire section
                if (featuredSection) featuredSection.style.display = 'none';
                else featuredContainer.innerHTML = '';
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



