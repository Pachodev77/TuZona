import { auth, onAuthStateChanged, changePassword, updateProfile } from './auth.js';
import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { updateUserProfile, updateUserSettings } from './services/user-service.js';

const showAlert = (message, type = 'info') => {
    const container = document.querySelector('.settings-content') || document.body;
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.textContent = message;
    container.prepend(div);
    setTimeout(() => div.remove(), 4000);
};

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching (keep existing behavior)
    const menuLinks = document.querySelectorAll('.settings-menu a');
    const sections = document.querySelectorAll('.settings-section');

    menuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-section');
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${targetId}-section`).classList.add('active');
            window.history.pushState({}, '', `#${targetId}`);
        });
    });

    const hash = window.location.hash.substring(1) || 'profile';
    const targetLink = document.querySelector(`.settings-menu a[data-section="${hash}"]`);
    if (targetLink) targetLink.click();

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Load current profile + settings
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const data = userDoc.exists() ? userDoc.data() : {};

            const nameEl = document.getElementById('name');
            const emailEl = document.getElementById('email');
            const phoneEl = document.getElementById('phone');

            if (nameEl) nameEl.value = data.displayName || user.displayName || '';
            if (emailEl) emailEl.value = data.email || user.email || '';
            if (phoneEl) phoneEl.value = data.phoneNumber || '';

            const settings = data.settings || {};
            const notifEmail = document.getElementById('notif-email');
            const notifPush = document.getElementById('notif-push');
            const privacyPublic = document.getElementById('privacy-public');
            const privacyShowEmail = document.getElementById('privacy-show-email');

            if (notifEmail) notifEmail.checked = settings.emailNotifications !== false;
            if (notifPush) notifPush.checked = settings.notifications !== false;
            if (privacyPublic) privacyPublic.checked = settings.publicProfile !== false;
            if (privacyShowEmail) privacyShowEmail.checked = settings.showEmail === true;
        } catch (error) {
            console.error('Error al cargar el perfil:', error);
        }

        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('name').value.trim();
                const phone = document.getElementById('phone').value.trim();
                try {
                    await updateUserProfile(user.uid, { displayName: name, phoneNumber: phone });
                    if (auth.currentUser) await updateProfile({ displayName: name });
                    showAlert('Perfil actualizado correctamente', 'success');
                } catch (err) {
                    showAlert('Error al actualizar el perfil', 'error');
                }
            });
        }

        // Notifications form
        const notificationsForm = document.getElementById('notifications-form');
        if (notificationsForm) {
            notificationsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const settings = {
                    emailNotifications: document.getElementById('notif-email')?.checked ?? true,
                    notifications: document.getElementById('notif-push')?.checked ?? true
                };
                try {
                    await updateUserSettings(user.uid, settings);
                    showAlert('Preferencias de notificaciones guardadas', 'success');
                } catch (err) {
                    showAlert('Error al guardar preferencias', 'error');
                }
            });
        }

        // Security form
        const securityForm = document.getElementById('security-form');
        if (securityForm) {
            securityForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                if (!currentPassword || !newPassword) {
                    showAlert('Completa ambos campos de contraseña', 'error');
                    return;
                }
                const result = await changePassword(currentPassword, newPassword);
                if (result.success) {
                    showAlert('Contraseña actualizada correctamente', 'success');
                    securityForm.reset();
                } else {
                    showAlert(result.error || 'Error al cambiar la contraseña', 'error');
                }
            });
        }

        // Privacy form
        const privacyForm = document.getElementById('privacy-form');
        if (privacyForm) {
            privacyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const settings = {
                    publicProfile: document.getElementById('privacy-public')?.checked ?? true,
                    showEmail: document.getElementById('privacy-show-email')?.checked ?? false
                };
                try {
                    await updateUserSettings(user.uid, settings);
                    showAlert('Preferencias de privacidad guardadas', 'success');
                } catch (err) {
                    showAlert('Error al guardar preferencias', 'error');
                }
            });
        }
    });
});
