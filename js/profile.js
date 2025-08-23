import { getCurrentUserProfile, updateUserProfile, uploadProfilePicture } from './profile-service.js';
import { showError, showSuccess } from './ui-helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize profile form
    const profileForm = document.getElementById('profile-form');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    const cancelEditBtn = document.getElementById('cancel-edit');
    
    // Load user profile data
    const loadProfile = async () => {
        try {
            const profile = await getCurrentUserProfile();
            if (profile) {
                // Populate form fields
                document.getElementById('full-name').value = profile.displayName || '';
                document.getElementById('email').value = profile.email || '';
                document.getElementById('phone').value = profile.phone || '';
                document.getElementById('location').value = profile.location || '';
                document.getElementById('about').value = profile.about || '';
                
                // Set avatar if exists
                if (profile.avatarUrl) {
                    avatarPreview.src = profile.avatarUrl;
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showError('Error al cargar el perfil. Por favor, intenta de nuevo.');
        }
    };
    
    // Handle profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                displayName: document.getElementById('full-name').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                location: document.getElementById('location').value.trim(),
                about: document.getElementById('about').value.trim(),
                updatedAt: new Date().toISOString()
            };
            
            try {
                await updateUserProfile(formData);
                showSuccess('Perfil actualizado correctamente');
            } catch (error) {
                console.error('Error updating profile:', error);
                showError('Error al actualizar el perfil. Por favor, intenta de nuevo.');
            }
        });
    }
    
    // Handle avatar upload
    if (avatarUpload) {
        avatarUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showError('La imagen no debe pesar más de 2MB');
                return;
            }
            
            try {
                // Show loading state
                const originalSrc = avatarPreview.src;
                avatarPreview.src = 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQACgABACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkEAAoAAgAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkEAAoAAwAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkEAAoABAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQACgAFACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQACgAGACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCIBWWGQRgD66xxUlWqr3ig+NggjpICg1HnVwlEixPoejkkqVqZLBwtC8VuFksU9FOgRChAXDxUIfRs6bR47ri8HBEsoSQ1tOyAAAAAElFTkSuQmCC';
                
                // Upload image
                const avatarUrl = await uploadProfilePicture(file);
                
                // Update profile with new avatar
                await updateUserProfile({ avatarUrl });
                
                // Update preview
                avatarPreview.src = avatarUrl;
                showSuccess('Foto de perfil actualizada correctamente');
            } catch (error) {
                console.error('Error uploading avatar:', error);
                showError('Error al actualizar la foto de perfil');
                avatarPreview.src = originalSrc;
            }
        });
    }
    
    // Handle cancel button
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            loadProfile(); // Reset form to saved values
        });
    }
    
    // Initialize profile data
    loadProfile();
});

// Export functions that might be used in other files
export { loadProfile };
