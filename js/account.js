console.log('=== ACCOUNT.JS LOADED ===');
console.log('Script is running from:', window.location.href);

import { getCurrentUserProfile } from '/js/services/user-service.js';
import { AdService } from '/js/services/ad-service.js';
import { auth, db } from '/js/firebase-config.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

// User Data Management
class UserDataManager {
    constructor() {
        this.currentUser = null;
        this.ads = [];
        this.favorites = [];
        this.messages = [];
        this.settings = {};
        this.helpSections = [];
        
        this.initAuthStateListener();
    }
    
    initAuthStateListener() {
        console.log('Setting up auth state listener...');
        auth.onAuthStateChanged(async (user) => {
            console.log('Auth state changed. User:', user ? 'Logged in' : 'Not logged in');
            if (user) {
                console.log('User UID:', user.uid);
            }
            if (user) {
                try {
                    // Load user data from Firestore
                    console.log('Loading user profile...');
                    this.currentUser = await getCurrentUserProfile();
                    
                    // Load user's ads
                    console.log('Loading user ads for user:', user.uid);
                    this.ads = await AdService.getUserAds(user.uid);
                    console.log('Ads loaded:', this.ads);
                    
                    // Debug: Log the first ad to check its structure
                    if (this.ads && this.ads.length > 0) {
                        console.log('First ad sample:', JSON.stringify(this.ads[0]));
                    }
                    
                    // Initialize empty arrays for favorites and messages since the functions don't exist
                    this.favorites = [];
                    this.messages = [];
                    this.settings = this.currentUser.settings || {};
                    
                    // Update the UI with the number of ads
                    this.updateAdCounters();
                    
                    // Initialize UI
                    this.initEventListeners();
                    this.initDashboard();
                    this.displayUserData();
                    
                    // Display user's ads if on the ads page
                    if (window.location.hash === '#ads') {
                        this.displayMyAds();
                    }
                } catch (error) {
                    console.error('Error initializing user data:', error);
                    this.showAlert('Error al cargar los datos del usuario', 'error');
                }
            } else {
                // User is signed out, redirect to login
                window.location.href = 'login.html';
            }
        });
    }

    async displayMyAds(filter = 'all') {
        console.log('Displaying my ads with filter:', filter);
        const myAdsList = document.getElementById('my-ads-list');
        const adsLoading = document.getElementById('ads-loading');
        const noAdsMessage = document.getElementById('no-ads-message');
        
        if (!myAdsList) {
            console.error('Element with ID "my-ads-list" not found');
            return;
        }
        
        // Show loading state
        myAdsList.innerHTML = '';
        if (adsLoading) adsLoading.classList.remove('d-none');
        if (noAdsMessage) noAdsMessage.classList.add('d-none');
        
        try {
            // Get current user
            const user = auth.currentUser;
            if (!user) {
                myAdsList.innerHTML = [
                    '<div class="no-ads text-center py-5">',
                    '    <i class="fas fa-user-lock fa-3x text-muted mb-3"></i>',
                    '    <h4>Debes iniciar sesión</h4>',
                    '    <p class="text-muted">Inicia sesión para ver tus anuncios publicados</p>',
                    '    <a href="login.html" class="btn btn-primary mt-2">Iniciar sesión</a>',
                    '</div>'
                ].join('');
                return;
            }
            
            console.log('Fetching ads for user:', user.uid);
            const ads = await AdService.getUserAds(user.uid);
            console.log('Fetched ads:', ads);
            
            // Hide loading state
            if (adsLoading) adsLoading.classList.add('d-none');
            
            // Filter ads based on the selected filter
            let filteredAds = [...ads];
            if (filter !== 'all') {
                filteredAds = ads.filter(ad => ad.status === filter);
            }
            
            // Show message if no ads found
            if (filteredAds.length === 0) {
                console.log('No ads found with filter:', filter);
                if (noAdsMessage) {
                    noAdsMessage.classList.remove('d-none');
                    // Update message based on filter
                    const message = noAdsMessage.querySelector('h4');
                    if (message) {
                        message.textContent = filter === 'all' 
                            ? 'No tienes anuncios publicados' 
                            : `No tienes anuncios ${this.getFilterLabel(filter)}`;
                    }
                }
                return;
            }
            
            // Sort by creation date (newest first)
            filteredAds.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            });
            
            // Generate HTML for each ad
            filteredAds.forEach(ad => {
                const adElement = document.createElement('div');
                adElement.className = 'ad-item mb-3 p-3 border rounded';
                
                // Format the creation date
                let formattedDate = 'fecha desconocida';
                if (ad.createdAt) {
                    try {
                        formattedDate = new Date(ad.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    } catch (e) {
                        console.error('Error formatting date:', e);
                    }
                }
                
                // Get the first image URL or use a placeholder
                let imageUrl = 'images/placeholder.jpg';
                if (ad.images && ad.images.length > 0) {
                    imageUrl = Array.isArray(ad.images) ? ad.images[0] : ad.images;
                }
                
                adElement.innerHTML = `
                    <div class="row">
                        <div class="col-md-3">
                            <img src="${imageUrl}" 
                                 alt="${ad.title || 'Anuncio sin título'}" 
                                 class="img-fluid rounded"
                                 onerror="this.onerror=null; this.src='images/placeholder.jpg'">
                        </div>
                        <div class="col-md-7">
                            <h4>${ad.title || 'Anuncio sin título'}</h4>
                            <p class="text-muted">${ad.description || 'Sin descripción'}</p>
                            <div class="d-flex gap-2 mb-2">
                                <span class="badge bg-primary">${ad.category || 'Sin categoría'}</span>
                                <span class="badge bg-${ad.status === 'active' ? 'success' : 'secondary'}">
                                    ${this.getStatusLabel(ad.status)}
                                </span>
                            </div>
                            <div class="text-muted small">
                                <i class="far fa-calendar-alt me-1"></i> Publicado el ${formattedDate}
                            </div>
                        </div>
                        <div class="col-md-2 d-flex flex-column justify-content-between">
                            <div class="text-end">
                                <span class="h4 text-primary">$${ad.price ? ad.price.toLocaleString('es-ES') : '0'}</span>
                            </div>
                            <div class="d-grid gap-2">
                                <a href="ad.html?id=${ad.id}" class="btn btn-sm btn-outline-primary">Ver</a>
                                <a href="publish.html?edit=${ad.id}" class="btn btn-sm btn-outline-secondary">Editar</a>
                                <button class="btn btn-sm btn-outline-danger delete-ad" data-ad-id="${ad.id}">Eliminar</button>
                            </div>
                        </div>
                    </div>
                `;
                myAdsList.appendChild(adElement);
            });
            
            // Initialize delete buttons
            this.initAdActionButtons();
            
        } catch (error) {
            console.error('Error loading ads:', error);
            this.showAlert('Error al cargar los anuncios', 'error');
            
            // Hide loading state in case of error
            if (adsLoading) adsLoading.classList.add('d-none');
        }
    }
    
    // Helper function to get status label
    getStatusLabel(status) {
        const statusLabels = {
            'active': 'Activo',
            'pending': 'Pendiente',
            'sold': 'Vendido',
            'inactive': 'Inactivo'
        };
        return statusLabels[status] || 'Desconocido';
    }
    
    // Helper function to get filter label
    getFilterLabel(filter) {
        const filterLabels = {
            'active': 'activos',
            'pending': 'pendientes',
            'sold': 'vendidos',
            'inactive': 'inactivos'
        };
        return filterLabels[filter] || '';
    }
    
    // Initialize event listeners for ad actions
    initAdActionButtons() {
        // Delete button click handler
        document.querySelectorAll('.delete-ad').forEach(button => {
            button.addEventListener('click', async (e) => {
                const adId = e.currentTarget.dataset.adId;
                if (!adId) return;
                
                if (confirm('¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.')) {
                    try {
                        await AdService.deleteAd(adId);
                        this.displayMyAds(); // Refresh the list
                        this.showAlert('Anuncio eliminado correctamente', 'success');
                    } catch (error) {
                        console.error('Error deleting ad:', error);
                        this.showAlert('Error al eliminar el anuncio', 'error');
                    }
                }
            });
        });
    }
    
    // Show alert message
    showAlert(message, type = 'info') {
        // Implementation of showAlert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('.alerts-container') || document.body;
        container.prepend(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }
    
    // Other methods...
    initEventListeners() {
        // Initialize any event listeners here
    }
    
    initDashboard() {
        // Initialize dashboard components
    }
    
    updateAdCounters() {
        console.log('Updating ad counters...');
        
        if (!this.ads || !Array.isArray(this.ads)) {
            console.error('No ads array available');
            return;
        }
        
        // Calculate the counts
        const totalAds = this.ads.length;
        const activeAds = this.ads.filter(ad => ad.status === 'active').length;
        const pendingAds = this.ads.filter(ad => ad.status === 'pending').length;
        
        console.log(`Counts - Total: ${totalAds}, Active: ${activeAds}, Pending: ${pendingAds}`);
        
        // Get the DOM elements
        const totalElement = document.getElementById('total-ads');
        const activeElement = document.getElementById('active-ads');
        const pendingElement = document.getElementById('pending-ads');
        
        console.log('DOM Elements:', { totalElement, activeElement, pendingElement });
        
        // Update the DOM if elements exist
        if (totalElement) {
            totalElement.textContent = totalAds;
            console.log('Updated total ads:', totalAds);
        }
        
        if (activeElement) {
            activeElement.textContent = activeAds;
            console.log('Updated active ads:', activeAds);
        }
        
        if (pendingElement) {
            pendingElement.textContent = pendingAds;
            console.log('Updated pending ads:', pendingAds);
        }
    }
    
    displayUserData() {
        console.log('Displaying user data...');
        // Display user data in the UI
        if (!this.currentUser) {
            console.log('No current user, skipping displayUserData');
            return;
        }
        
        // Update user name and email
        if (this.currentUser.displayName) {
            const nameElements = document.querySelectorAll('.user-name');
            nameElements.forEach(el => {
                el.textContent = this.currentUser.displayName;
            });
        }
        
        if (this.currentUser.email) {
            const emailElements = document.querySelectorAll('.user-email');
            emailElements.forEach(el => {
                el.textContent = this.currentUser.email;
            });
        }
        
        // Update ad counters in the dashboard
        this.updateAdCounters();
        
        // Update stats
        const activeAds = this.ads ? this.ads.filter(ad => ad.status === 'active').length : 0;
        const pendingAds = this.ads ? this.ads.filter(ad => ad.status === 'pending').length : 0;
        const totalAds = this.ads ? this.ads.length : 0;
        
        // Update the counters in the UI
        const totalAdsElement = document.getElementById('total-ads');
        const activeAdsElement = document.getElementById('active-ads');
        const pendingAdsElement = document.getElementById('pending-ads');
        
        if (totalAdsElement) totalAdsElement.textContent = totalAds;
        if (activeAdsElement) activeAdsElement.textContent = activeAds;
        if (pendingAdsElement) pendingAdsElement.textContent = pendingAds;
    }
}

// Export UserDataManager as default
export default UserDataManager;

// Initialize the user data manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userDataManager = new UserDataManager();
});
