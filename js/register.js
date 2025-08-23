import { signUp } from './auth.js';
import { saveUserProfile } from './user-service.js';
import { showError, showLoading, hideLoading } from './ui-helpers.js';

// Initialize Firebase Auth
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { app } from './firebase-config.js';

const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', async () => {
    const registerForm = document.getElementById('register-form');
    
    // If user is already logged in, redirect to account page
    auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'account.html';
        }
    });
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const username = document.getElementById('username').value.trim();
            
            // Basic validation
            if (!email || !password || !confirmPassword || !username) {
                showError('Por favor completa todos los campos');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('Las contraseñas no coinciden');
                return;
            }
            
            if (password.length < 6) {
                showError('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            // Username validation (alphanumeric and underscores only, 3-20 chars)
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!username.match(usernameRegex)) {
                showError('El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.match(emailRegex)) {
                showError('Por favor ingresa un correo electrónico válido');
                return;
            }
            
            try {
                showLoading(registerForm);
                
                // Create user with email and password
                const result = await signUp(email, password);
                
                if (result.success) {
                    // Create user profile in Firestore
                    const userData = {
                        uid: result.user.uid,
                        email: email,
                        username: username.toLowerCase(), // Store username in lowercase
                        displayName: username,
                        photoURL: '',
                        phoneNumber: '',
                        location: '',
                        bio: '',
                        isEmailVerified: false,
                        isAdmin: false,
                        isBanned: false,
                        lastLogin: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    // Save user profile to Firestore
                    await saveUserProfile(result.user.uid, userData);
                    
                    // Send email verification
                    // await sendEmailVerification(auth.currentUser);
                    
                    // Show success message
                    showSuccess('¡Registro exitoso! Redirigiendo...', registerForm);
                    
                    // Redirect to account page after a short delay
                    setTimeout(() => {
                        window.location.href = 'account.html';
                    }, 2000);
                    
                } else {
                    showError(result.error || 'Error al registrar el usuario');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showError(error.message || 'Error al procesar el registro');
            } finally {
                hideLoading(registerForm, 'Registrarse');
            }
        });
    }
    
    // Initialize password strength meter
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
        });
    }
});

/**
 * Update the password strength meter
 * @param {string} password - The password to evaluate
 */
function updatePasswordStrength(password) {
    const strengthMeter = document.getElementById('password-strength-meter');
    const strengthText = document.getElementById('password-strength-text');
    
    if (!strengthMeter || !strengthText) return;
    
    // Calculate password strength
    let strength = 0;
    let message = '';
    
    // Check length
    if (password.length >= 8) strength += 1;
    
    // Check for lowercase letters
    if (/[a-z]/.test(password)) strength += 1;
    
    // Check for uppercase letters
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Check for numbers
    if (/[0-9]/.test(password)) strength += 1;
    
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Update UI based on strength
    switch (strength) {
        case 0:
        case 1:
            strengthMeter.className = 'strength-meter strength-weak';
            strengthMeter.style.width = '20%';
            message = 'Débil';
            break;
        case 2:
            strengthMeter.className = 'strength-meter strength-fair';
            strengthMeter.style.width = '40%';
            message = 'Aceptable';
            break;
        case 3:
            strengthMeter.className = 'strength-meter strength-good';
            strengthMeter.style.width = '60%';
            message = 'Buena';
            break;
        case 4:
            strengthMeter.className = 'strength-meter strength-strong';
            strengthMeter.style.width = '80%';
            message = 'Fuerte';
            break;
        case 5:
            strengthMeter.className = 'strength-meter strength-very-strong';
            strengthMeter.style.width = '100%';
            message = 'Muy fuerte';
            break;
    }
    
    strengthText.textContent = message;
}

// Add showSuccess function if not already defined
if (typeof showSuccess !== 'function') {
    window.showSuccess = function(message, element = document.body) {
        // Remove any existing success messages
        const existingSuccess = element.querySelector('.alert-success');
        if (existingSuccess) {
            existingSuccess.remove();
        }
        
        const successElement = document.createElement('div');
        successElement.className = 'alert alert-success';
        successElement.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">¡Éxito!</div>
                <div class="alert-message">${message}</div>
            </div>
            <button class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Insert the success message at the top of the form
        if (element) {
            element.insertBefore(successElement, element.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (successElement.parentNode) {
                    successElement.style.opacity = '0';
                    setTimeout(() => successElement.remove(), 300);
                }
            }, 5000);
        }
    };
}
