import { getCurrentUserProfile, updateUserProfile, uploadUserAvatar } from './services/user-service.js';
import { AdService } from './services/ad-service.js';
import { signOut, auth } from './auth.js';
import { showError, showSuccess } from './ui-helpers.js';

// In-memory cache of the user's ads (used by filters and delete)
let currentAds = [];
let currentFilter = 'all';
let initialized = false;

// Redirect to login if not authenticated; otherwise bootstrap the dashboard
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    if (initialized) return;
    initialized = true;
    await initAccount(user);
});

async function initAccount(user) {
    let profile = { email: user.email, displayName: user.displayName, photoURL: user.photoURL };
    try {
        profile = await getCurrentUserProfile();
    } catch (error) {
        console.error('Error loading profile:', error);
    }

    renderProfile(profile);
    setupProfileForm(profile);
    setupAvatarUpload();
    setupLogout();
    setupTabs();
    setupFilters();

    try {
        currentAds = await AdService.getUserAds(user.uid);
        renderStats(currentAds);
        renderMyAds();
    } catch (error) {
        console.error('Error loading ads:', error);
        showError('Error al cargar tus anuncios');
    }
}

function renderProfile(profile) {
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const avatarEl = document.getElementById('avatar-preview');

    if (nameEl) nameEl.textContent = profile.displayName || profile.email?.split('@')[0] || 'Usuario';
    if (emailEl) emailEl.textContent = profile.email || '';
    if (avatarEl && profile.photoURL) avatarEl.src = profile.photoURL;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };
    setVal('profile-name', profile.displayName);
    setVal('profile-email', profile.email);
    setVal('profile-phone', profile.phoneNumber);
    setVal('profile-location', profile.location);
}

function renderStats(ads) {
    const total = ads.length;
    const active = ads.filter(ad => ad.status === 'active').length;
    const pending = ads.filter(ad => ad.status === 'pending').length;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('total-ads', total);
    set('active-ads', active);
    set('pending-ads', pending);
}

function setupProfileForm(profile) {
    const form = document.getElementById('profile-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const data = {
            displayName: document.getElementById('profile-name').value.trim(),
            phoneNumber: document.getElementById('profile-phone').value.trim(),
            location: document.getElementById('profile-location').value.trim(),
            updatedAt: new Date().toISOString()
        };

        try {
            await updateUserProfile(user.uid, data);
            showSuccess('Perfil actualizado correctamente');
            renderProfile({ ...profile, ...data });
        } catch (error) {
            console.error('Error updating profile:', error);
            showError('Error al actualizar el perfil');
        }
    });
}

function setupAvatarUpload() {
    const input = document.getElementById('avatar-upload');
    if (!input) return;

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showError('El archivo es demasiado grande. El tamaño máximo es 2MB.');
            return;
        }
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            showError('Formato no válido. Sube una imagen JPG o PNG.');
            return;
        }

        const user = auth.currentUser;
        if (!user) return;

        try {
            const url = await uploadUserAvatar(file, user.uid);
            const preview = document.getElementById('avatar-preview');
            if (preview) preview.src = url;
            showSuccess('Foto de perfil actualizada');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showError('Error al subir la imagen');
        }
    });
}

function setupLogout() {
    const btn = document.getElementById('logout-button');
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error signing out:', error);
            showError('Error al cerrar sesión');
        }
    });
}

function activateTab(hash) {
    const navLinks = document.querySelectorAll('.account-nav a');
    const sections = document.querySelectorAll('.dashboard-section');

    const target = hash ? document.querySelector(hash) : null;
    if (!target) return false;

    sections.forEach(s => s.classList.remove('active'));
    navLinks.forEach(l => l.classList.remove('active'));

    target.classList.add('active');
    const matchingLink = document.querySelector(`.account-nav a[href="${hash}"]`);
    if (matchingLink) matchingLink.classList.add('active');

    return true;
}

function setupTabs() {
    const navLinks = document.querySelectorAll('.account-nav a');
    const sections = document.querySelectorAll('.dashboard-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // External links (e.g. settings.html) should navigate normally
            if (!href || !href.startsWith('#')) return;
            e.preventDefault();

            activateTab(href);
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Activate the tab from the URL hash, or fall back to dashboard
    const hash = window.location.hash;
    if (!hash || !activateTab(hash)) {
        const dashboard = document.getElementById('dashboard');
        if (dashboard) dashboard.classList.add('active');
        const dashLink = document.querySelector('.account-nav a[href="#dashboard"]');
        if (dashLink) dashLink.classList.add('active');
    }
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('.ad-filters .btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            renderMyAds(button.dataset.filter);
        });
    });
}

function renderMyAds(filter = currentFilter) {
    currentFilter = filter;
    const list = document.getElementById('my-ads-list');
    const empty = document.getElementById('no-ads-message');
    if (!list) return;

    list.innerHTML = '';
    if (empty) empty.style.display = 'none';

    let filtered = [...currentAds];
    if (filter !== 'all') filtered = filtered.filter(ad => ad.status === filter);

    if (filtered.length === 0) {
        if (empty) {
            empty.style.display = 'block';
            const h4 = empty.querySelector('h4');
            if (h4) h4.textContent = filter === 'all'
                ? 'No tienes anuncios publicados'
                : `No tienes anuncios ${filterLabel(filter)}`;
        }
        return;
    }

    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    filtered.forEach(ad => {
        const el = document.createElement('div');
        el.className = 'ad-item';
        const imageUrl = (ad.images && ad.images.length) ? ad.images[0] : 'images/placeholder.jpg';
        const date = ad.createdAt
            ? new Date(ad.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'fecha desconocida';
        const statusClass = `tag-${ad.status || 'inactive'}`;

        el.innerHTML = `
            <div class="ad-item-image">
                <img src="${imageUrl}" alt="${ad.title || ''}"
                     onerror="this.onerror=null; this.src='images/placeholder.jpg'">
            </div>
            <div class="ad-item-body">
                <h4>${ad.title || 'Anuncio sin título'}</h4>
                <p class="ad-item-desc">${ad.description || 'Sin descripción'}</p>
                <div class="ad-item-tags">
                    <span class="tag tag-category">${ad.category || 'Sin categoría'}</span>
                    <span class="tag ${statusClass}">${statusLabel(ad.status)}</span>
                </div>
                <div class="ad-item-date"><i class="far fa-calendar-alt"></i> ${date}</div>
            </div>
            <div class="ad-item-footer">
                <div class="ad-item-price">$${ad.price ? ad.price.toLocaleString('es-ES') : '0'}</div>
                <div class="ad-item-actions">
                    <a href="ad.html?id=${ad.id}" class="btn btn-sm">Ver</a>
                    <a href="publish.html?edit=${ad.id}" class="btn btn-sm btn-outline">Editar</a>
                    <button class="btn btn-sm btn-outline delete-ad" data-ad-id="${ad.id}">Eliminar</button>
                </div>
            </div>`;
        list.appendChild(el);
    });

    list.querySelectorAll('.delete-ad').forEach(button => {
        button.addEventListener('click', async () => {
            const adId = button.dataset.adId;
            if (!adId) return;
            if (!confirm('¿Estás seguro de que quieres eliminar este anuncio?')) return;
            try {
                await AdService.deleteAd(adId);
                currentAds = currentAds.filter(a => a.id !== adId);
                renderStats(currentAds);
                renderMyAds();
                showSuccess('Anuncio eliminado correctamente');
            } catch (error) {
                console.error('Error deleting ad:', error);
                showError('Error al eliminar el anuncio');
            }
        });
    });
}

function statusLabel(status) {
    return ({
        active: 'Activo',
        pending: 'Pendiente',
        sold: 'Vendido',
        inactive: 'Inactivo'
    })[status] || 'Desconocido';
}

function filterLabel(filter) {
    return ({
        active: 'activos',
        pending: 'pendientes',
        sold: 'vendidos',
        inactive: 'inactivos'
    })[filter] || '';
}
