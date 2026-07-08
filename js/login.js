import { signIn, signInWithGoogle, auth } from './auth.js';
import { showError, showSuccess, showLoading, hideLoading } from './ui-helpers.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, redirect to account page
        window.location.href = 'account.html';
    }
});

// Toggle password visibility
window.togglePasswordVisibility = function(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button') || 
                       loginForm?.querySelector('button[type="submit"]');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMe = document.getElementById('remember-me');
    
    // Check for redirect message in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectMessage = urlParams.get('redirectMessage');
    
    if (redirectMessage) {
        showSuccess(decodeURIComponent(redirectMessage));
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check for registration success message
    const newUser = urlParams.get('newUser');
    if (newUser) {
        showSuccess({
            title: '¡Bienvenido a TuZona!',
            message: 'Tu cuenta ha sido creada exitosamente. Por favor inicia sesión.',
            duration: 5000
        });
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (loginForm && loginButton) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const rememberMeChecked = rememberMe ? rememberMe.checked : false;
            
            // Reset previous error states
            loginForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            
            // Basic validation
            if (!email) {
                showError('Por favor ingresa tu correo electrónico');
                emailInput.focus();
                return;
            }
            
            if (!password) {
                showError('Por favor ingresa tu contraseña');
                passwordInput.focus();
                return;
            }
            
            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.match(emailRegex)) {
                showError('Por favor ingresa un correo electrónico válido');
                emailInput.classList.add('is-invalid');
                emailInput.focus();
                return;
            }
            
            try {
                // Show loading state
                loginButton.disabled = true;
                loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
                
                // Attempt to sign in
                const result = await signIn(email, password, rememberMeChecked);
                
                if (result.success) {
                    // Show success message
                    showSuccess({
                        title: '¡Bienvenido de nuevo!',
                        message: 'Inicio de sesión exitoso. Redirigiendo...',
                        duration: 2000
                    });
                    
                    // Redirect to account page after a short delay
                    setTimeout(() => {
                        const redirectTo = urlParams.get('redirect') || 'account.html';
                        window.location.href = redirectTo;
                    }, 1500);
                    
                } else {
                    throw new Error(result.error || 'Error al iniciar sesión');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                
                // Handle specific Firebase errors
                let errorMessage = 'Error al iniciar sesión';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No existe una cuenta con este correo electrónico';
                        emailInput.classList.add('is-invalid');
                        emailInput.focus();
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Contraseña incorrecta';
                        passwordInput.classList.add('is-invalid');
                        passwordInput.focus();
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Demasiados intentos fallidos. Por favor, inténtalo de nuevo más tarde o restablece tu contraseña.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'Esta cuenta ha sido deshabilitada. Por favor, contacta al soporte.';
                        break;
                    case 'auth/email-not-verified':
                        errorMessage = 'Por favor verifica tu correo electrónico antes de iniciar sesión';
                        emailInput.classList.add('is-invalid');
                        break;
                    default:
                        errorMessage = error.message || 'Error al iniciar sesión';
                }
                
                showError(errorMessage);
                
            } finally {
                // Reset button state
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.innerHTML = 'Iniciar Sesión';
                }
            }
        });
        
        // Add real-time validation feedback
        const formInputs = loginForm.querySelectorAll('input');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.checkValidity()) {
                    input.classList.remove('is-invalid');
                }
            });
        });
    }

    // Google sign-in
    const googleButton = document.getElementById('google-login-button');
    if (googleButton) {
        googleButton.addEventListener('click', async () => {
            googleButton.disabled = true;
            googleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
            try {
                const result = await signInWithGoogle();
                if (result.success) {
                    showSuccess('¡Inicio de sesión con Google exitoso!');
                    setTimeout(() => { window.location.href = 'account.html'; }, 1000);
                } else {
                    throw new Error(result.error || 'Error al iniciar sesión con Google');
                }
            } catch (error) {
                console.error('Google sign-in error:', error);
                showError(error.message || 'Error al iniciar sesión con Google');
                googleButton.disabled = false;
                googleButton.innerHTML = '<i class="fab fa-google"></i> Continuar con Google';
            }
        });
    }
});
