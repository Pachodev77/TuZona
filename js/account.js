import UserService from './services/user-service.js';

// User Data Management
class UserDataManager {
    // Add these new properties to the constructor
    constructor() {
        this.currentUser = null;
        this.ads = [];
        this.favorites = [];
        this.messages = [];
        this.settings = {};
        this.helpSections = [];
        
        this.initAuthStateListener();
    }
    
    async initAuthStateListener() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                try {
                    // Load user data from Firestore
                    this.currentUser = await UserService.getCurrentUserProfile();
                    this.ads = await UserService.getUserAds(user.uid);
                    this.favorites = await UserService.getUserFavorites(user.uid);
                    this.messages = await UserService.getUserMessages(user.uid);
                    this.settings = this.currentUser.settings || {};
                    
                    // Initialize UI
                    this.initEventListeners();
                    this.initDashboard();
                    this.displayUserData();
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

    // User data is now loaded in initAuthStateListener

    getAds() {
        const ads = JSON.parse(localStorage.getItem('sampleAds') || '[]');
        return ads.map(ad => ({
            ...ad,
            status: ad.status || 'active',
            views: ad.views || Math.floor(Math.random() * 100),
            created: ad.created || new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
            seller: ad.seller || { id: this.currentUser.id, name: this.currentUser.name }
        }));
    }

    async saveUserData() {
        if (!this.currentUser?.uid) return;
        
        try {
            const updates = {
                displayName: this.currentUser.displayName,
                phone: this.currentUser.phone,
                location: this.currentUser.location,
                about: this.currentUser.about,
                photoURL: this.currentUser.photoURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await UserService.updateUserProfile(this.currentUser.uid, updates);
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            this.showAlert('Error al guardar los datos del perfil', 'error');
            return false;
        }
    }

    saveAds() {
        localStorage.setItem('sampleAds', JSON.stringify(this.ads));
    }

    updateUserStats() {
        const userAds = this.ads.filter(ad => ad.seller?.id === this.currentUser.id);
        
        this.currentUser.stats = {
            activeAds: userAds.filter(ad => ad.status === 'active').length,
            pendingAds: userAds.filter(ad => ad.status === 'pending').length,
            totalViews: userAds.reduce((sum, ad) => sum + (ad.views || 0), 0),
            unreadMessages: this.currentUser.messages?.filter(m => !m.read).length || 0,
            rating: this.calculateUserRating(),
            reviews: this.currentUser.reviews?.length || 0
        };
        
        this.saveUserData();
        return this.currentUser.stats;
    }

    calculateUserRating() {
        if (!this.currentUser.reviews?.length) return 0;
        const sum = this.currentUser.reviews.reduce((acc, review) => acc + review.rating, 0);
        return Math.round((sum / this.currentUser.reviews.length) * 10) / 10;
    }

    addActivity(message, type = 'info', icon = 'info-circle') {
        this.currentUser.recentActivity.unshift({
            id: 'act_' + Date.now(),
            type,
            message,
            time: 'Hace un momento',
            icon,
            timestamp: new Date().toISOString()
        });
        
        // Keep only the 10 most recent activities
        this.currentUser.recentActivity = this.currentUser.recentActivity.slice(0, 10);
        this.saveUserData();
    }

    initEventListeners() {
        // Logout
        document.getElementById('logout')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });

        // Tab navigation
        document.querySelectorAll('.account-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('href').substring(1);
                this.switchTab(tabId);
                
                // Update URL without page reload
                window.history.pushState({}, '', `#${tabId}`);
            });
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.substring(1) || 'dashboard';
            this.switchTab(hash);
        });

        // Ad filters
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const filter = button.dataset.filter || 'all';
                this.displayMyAds(filter);
            });
        });

        // Search functionality
        const searchBox = document.querySelector('.search-box input');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.filterAds(e.target.value);
            });
        }

        // Edit profile button in sidebar
        document.querySelector('.user-profile .btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab('settings');
        });

        // Add event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            // Handle favorite button clicks
            const favoriteBtn = e.target.closest('.btn-favorite');
            if (favoriteBtn) {
                e.preventDefault();
                const adId = favoriteBtn.closest('[data-ad-id]')?.dataset.adId;
                if (adId) {
                    if (this.favorites.includes(adId)) {
                        this.removeFromFavorites(adId);
                        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
                        favoriteBtn.title = 'Añadir a favoritos';
                        favoriteBtn.classList.remove('favorited');
                        this.addActivity('Quitaste un anuncio de favoritos', 'favorite', 'heart-broken');
                    } else {
                        this.addToFavorites(adId);
                        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
                        favoriteBtn.title = 'En favoritos';
                        favoriteBtn.classList.add('favorited');
                        this.addActivity('Añadiste un anuncio a favoritos', 'favorite', 'heart');
                    }
                }
            }
        });
    }

    initDashboard() {
        this.updateUserStats();
        this.updateUnreadCount();
        this.displayUserData();
        
        // Check for hash in URL to determine which tab to show
        const hash = window.location.hash.substring(1);
        const defaultTab = hash || 'dashboard';
        this.switchTab(defaultTab);
    }

    formatPrice(price) {
        return `$${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60,
            segundo: 1
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `Hace 1 ${unit}` : `Hace ${interval} ${unit}s`;
            }
        }
        
        return 'Ahora';
    }

    displayUserData() {
        const user = this.currentUser;
        
        // Update user info
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-email').textContent = user.email;
        
        // Update stats
        const stats = this.updateUserStats();
        document.getElementById('active-ads').textContent = stats.activeAds;
        document.getElementById('total-views').textContent = stats.totalViews.toLocaleString();
        document.getElementById('unread-messages').textContent = stats.unreadMessages;
        
        // Update rating
        const ratingContainer = document.querySelector('.rating');
        if (ratingContainer) {
            ratingContainer.innerHTML = '';
            const fullStars = Math.floor(stats.rating);
            const hasHalfStar = stats.rating % 1 >= 0.5;
            
            for (let i = 1; i <= 5; i++) {
                if (i <= fullStars) {
                    ratingContainer.innerHTML += '<i class="fas fa-star"></i>';
                } else if (i === fullStars + 1 && hasHalfStar) {
                    ratingContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    ratingContainer.innerHTML += '<i class="far fa-star"></i>';
                }
            }
            
            ratingContainer.innerHTML += `<span>${stats.rating.toFixed(1)} (${stats.reviews} reseñas)</span>`;
        }
        
        // Update recent activity
        this.updateActivityTimeline();
    }

    updateActivityTimeline() {
        const activityTimeline = document.querySelector('.activity-timeline');
        if (!activityTimeline) return;
        
        // Update timestamps
        this.currentUser.recentActivity.forEach(activity => {
            activity.time = this.getTimeAgo(activity.timestamp);
        });
        
        activityTimeline.innerHTML = this.currentUser.recentActivity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-details">
                    <p>${activity.message}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    displayMyAds(filter = 'all') {
        const myAdsList = document.getElementById('my-ads-list');
        if (!myAdsList) return;
        
        const userAds = this.ads.filter(ad => ad.seller?.id === this.currentUser.id);
        let filteredAds = [...userAds];
        
        // Apply filters
        if (filter === 'active') {
            filteredAds = userAds.filter(ad => ad.status === 'active');
        } else if (filter === 'pending') {
            filteredAds = userAds.filter(ad => ad.status === 'pending');
        } else if (filter === 'inactive') {
            filteredAds = userAds.filter(ad => ad.status === 'inactive');
        }

        myAdsList.innerHTML = '';
        if (filteredAds.length > 0) {
            filteredAds.forEach(ad => {
                myAdsList.innerHTML += this.createAdCard(ad);
            });
            
            // Add event listeners to action buttons
            myAdsList.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const adId = e.target.closest('.ad-actions').dataset.adId;
                    this.editAd(adId);
                });
            });
            
            myAdsList.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const adId = e.target.closest('.ad-actions').dataset.adId;
                    if (confirm('¿Estás seguro de que quieres eliminar este anuncio?')) {
                        this.deleteAd(adId);
                    }
                });
            });
            
            myAdsList.querySelectorAll('.btn-stats').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const adId = e.target.closest('.ad-actions').dataset.adId;
                    this.showAdStats(adId);
                });
            });
            
        } else {
            myAdsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <h3>No hay anuncios ${filter === 'all' ? '' : filter}</h3>
                    <p>${filter === 'all' ? 'Aún no has publicado ningún anuncio.' : `No tienes anuncios ${filter} en este momento.`}</p>
                    <a href="publish.html" class="btn">Publicar un anuncio</a>
                </div>
            `;
        }
    }

    createAdCard(ad, isFavorite = false) {
        return `
            <div class="ad-list-item" data-ad-id="${ad.id}">
                <div class="ad-list-image">
                    <img src="${ad.images?.[0] || 'images/placeholder.jpg'}" alt="${ad.title}">
                    <span class="status-badge ${ad.status || 'active'}">
                        ${this.getStatusText(ad.status)}
                    </span>
                    ${isFavorite ? `
                        <button class="btn-icon btn-remove-favorite remove-favorite" title="Quitar de favoritos">
                            <i class="fas fa-heart"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="ad-list-details">
                    <h3>${ad.title}</h3>
                    <p class="ad-list-price">${this.formatPrice(ad.price)}</p>
                    <div class="ad-list-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${ad.location || 'Ubicación no especificada'}</span>
                        <span><i class="far fa-calendar-alt"></i> ${this.formatDate(ad.created)}</span>
                        <span><i class="fas fa-eye"></i> ${ad.views || 0} vistas</span>
                    </div>
                </div>
                <div class="ad-actions" data-ad-id="${ad.id}">
                    ${!isFavorite ? `
                        <a href="publish.html?edit=${ad.id}" class="btn-icon btn-edit" title="Editar">
                            <i class="fas fa-edit"></i>
                        </a>
                        <button class="btn-icon btn-delete" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-icon btn-stats" title="Estadísticas">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button class="btn-icon btn-favorite ${this.favorites.includes(ad.id) ? 'favorited' : ''}" 
                                title="${this.favorites.includes(ad.id) ? 'En favoritos' : 'Añadir a favoritos'}">
                            <i class="${this.favorites.includes(ad.id) ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Activo',
            'pending': 'Pendiente',
            'inactive': 'Inactivo',
            'sold': 'Vendido',
            'expired': 'Expirado'
        };
        return statusMap[status] || 'Activo';
    }

    filterAds(searchTerm) {
        const ads = document.querySelectorAll('.ad-list-item');
        const term = searchTerm.toLowerCase();
        
        ads.forEach(ad => {
            const title = ad.querySelector('h3').textContent.toLowerCase();
            const location = ad.querySelector('.ad-list-meta span:first-child').textContent.toLowerCase();
            
            if (title.includes(term) || location.includes(term)) {
                ad.style.display = 'flex';
            } else {
                ad.style.display = 'none';
            }
        });
    }

    switchTab(tabId) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const activeSection = document.getElementById(tabId);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        // Update active menu item
        document.querySelectorAll('.account-menu a').forEach(link => {
            link.parentElement.classList.remove('active');
            if (link.getAttribute('href') === `#${tabId}`) {
                link.parentElement.classList.add('active');
            }
        });
        
        // Load tab-specific content
        switch(tabId) {
            case 'dashboard':
                this.displayUserData();
                break;
            case 'my-ads':
                this.displayMyAds();
                break;
            case 'favorites':
                this.displayFavorites();
                break;
            case 'messages':
                this.displayMessages();
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'help':
                this.displayHelp();
                break;
            default:
                // For any other tab, just show it without loading specific content
                break;
        }
    }

    // Placeholder methods for future implementation
    editAd(adId) {
        // Will be implemented when publish.js is updated
        console.log('Editing ad:', adId);
        window.location.href = `publish.html?edit=${adId}`;
    }

    deleteAd(adId) {
        this.ads = this.ads.filter(ad => ad.id !== adId);
        this.saveAds();
        this.updateUserStats();
        this.displayMyAds();
        this.addActivity('Has eliminado un anuncio', 'delete', 'trash');
    }

    showAdStats(adId) {
        const ad = this.ads.find(a => a.id === adId);
        if (!ad) return;
        
        // In a real app, this would show detailed statistics for the ad
    }

    initProfileForm() {
        const profileForm = document.getElementById('profile-form');
        if (!profileForm) return;

        // Handle profile form submission
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(profileForm);
            const userData = {
                name: formData.get('fullName') || '',
                email: formData.get('email') || '',
                phone: formData.get('phone') || '',
                location: formData.get('location') || '',
                about: formData.get('about') || ''
            };
            
            // Save to localStorage (in a real app, this would be an API call)
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        });

        // Handle cancel button
        const cancelButton = document.getElementById('cancel-edit');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                // Reset form to current user data
                const userData = this.currentUser;
                document.getElementById('full-name').value = userData.name || '';
                document.getElementById('email').value = userData.email || '';
                document.getElementById('phone').value = userData.phone || '';
                document.getElementById('location').value = userData.location || '';
                document.getElementById('about').value = userData.about || '';
                
                // Reset avatar preview
                const avatarPreview = document.getElementById('avatar-preview');
                if (avatarPreview && userData.photoURL) {
                    avatarPreview.src = userData.photoURL;
                }
            });
        }
    }

    async updateUserSettings(settings) {
        if (!this.currentUser?.uid) return;
        
        try {
            await UserService.updateUserSettings(this.currentUser.uid, settings);
            this.settings = { ...this.settings, ...settings };
            this.showAlert('Configuración guardada correctamente', 'success');
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            this.showAlert('Error al guardar la configuración. Por favor, inténtalo de nuevo.', 'error');
            return false;
        }
    }

    initAvatarUpload() {
        const avatarInput = document.getElementById('avatar-upload');
        const avatarPreview = document.getElementById('avatar-preview');
        
        if (!avatarInput || !avatarPreview || !this.currentUser?.uid) return;
        
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                this.showAlert('El archivo es demasiado grande. El tamaño máximo permitido es 2MB.', 'error');
                return;
            }
            
            // Check file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                this.showAlert('Formato de archivo no válido. Por favor, sube una imagen JPG o PNG.', 'error');
                return;
            }
            
            try {
                // Show loading state
                const saveBtn = document.getElementById('save-profile');
                const originalText = saveBtn.innerHTML;
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
                
                // Upload the file to Firebase Storage
                const downloadURL = await UserService.uploadUserAvatar(file, this.currentUser.uid);
                
                // Update the user's profile with the new avatar URL
                this.currentUser.photoURL = downloadURL;
                await this.saveUserData();
                
                // Update the UI
                avatarPreview.src = downloadURL;
                const sidebarAvatar = document.querySelector('.user-avatar');
                if (sidebarAvatar) {
                    sidebarAvatar.src = downloadURL;
                }
                
                this.showAlert('Foto de perfil actualizada correctamente', 'success');
                
            } catch (error) {
                console.error('Error uploading avatar:', error);
                this.showAlert('Error al subir la imagen. Por favor, inténtalo de nuevo.', 'error');
            } finally {
                // Reset the file input
                avatarInput.value = '';
                
                // Restore button state
                const saveBtn = document.getElementById('save-profile');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalText;
                }
            }
        });
    }

    initEventListeners() {
        // Handle logout
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Handle edit profile button in dashboard
        const editProfileBtn = document.querySelector('.user-profile .btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Navigate to the settings section
                window.location.hash = 'settings';
                this.showSection('settings');
                
                // If there's a profile tab, activate it
                const profileTab = document.querySelector('.settings-menu a[href="#profile-settings"]');
                if (profileTab) {
                    document.querySelectorAll('.settings-menu a').forEach(tab => tab.classList.remove('active'));
                    document.querySelectorAll('.settings-pane').forEach(pane => pane.classList.remove('active'));
                    profileTab.classList.add('active');
                    const profilePane = document.getElementById('profile-settings');
                    if (profilePane) {
                        profilePane.classList.add('active');
                    }
                }
            });
        }
    }

    handleInitialLoad() {
        // Set default avatar if not set
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!userData.avatar) {
            userData.avatar = 'https://via.placeholder.com/150';
            localStorage.setItem('currentUser', JSON.stringify(userData));
        }
        
        // Initial section load
        this.handleHashChange();
        
        // Initial stats update
        this.updateDashboardStats();
    }

    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.showSection(hash);
        } else {
            this.showSection('dashboard');
        }
    }

    updateDashboardStats() {
        // In a real app, this would fetch data from the server
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const stats = userData.stats || {
            activeAds: 0,
            totalViews: 0,
            unreadMessages: 0
        };
        
        // Update the UI
        const activeAdsCount = document.getElementById('active-ads-count');
        const totalViewsCount = document.getElementById('total-views-count');
        const unreadMessagesCount = document.getElementById('unread-messages-count');
        
        if (activeAdsCount) activeAdsCount.textContent = stats.activeAds;
        if (totalViewsCount) totalViewsCount.textContent = stats.totalViews.toLocaleString();
        if (unreadMessagesCount) unreadMessagesCount.textContent = stats.unreadMessages;
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Add to page
        const container = document.querySelector('.alerts-container') || document.body;
        container.prepend(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 5000);
    }

    async handleLogout() {
        try {
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error signing out:', error);
            this.showAlert('Error al cerrar sesión. Por favor, inténtalo de nuevo.', 'error');
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize data manager
    const dataManager = new UserDataManager();
    
    // Initialize UI manager
    const uiManager = new UIManager();
    
    // Make managers available globally for debugging
    window.dataManager = dataManager;
    window.uiManager = uiManager;
    
    // Initialize Bootstrap tooltips if available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});