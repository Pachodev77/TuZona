import { signUp, signInWithGoogle, auth, onAuthStateChanged } from './auth.js';
import { isUsernameAvailable } from './services/user-service.js';
import { showError, showSuccess } from './ui-helpers.js';

// Redirect to the account page if the user is already signed in
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'account.html';
    }
});

// Password visibility toggle for every .toggle-password button
document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        if (!input) return;
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon?.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon?.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});

// Password strength meter
const updatePasswordStrength = (password) => {
    const strengthMeter = document.getElementById('password-strength-meter');
    const strengthText = document.getElementById('password-strength-text');
    if (!strengthMeter || !strengthText) return;

    strengthMeter.className = 'strength-meter';

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    if (password.length === 0) {
        strengthMeter.style.width = '0%';
        strengthText.textContent = '';
        return;
    }

    strengthMeter.style.width = `${(strength / 5) * 100}%`;
    if (strength <= 2) {
        strengthMeter.classList.add('strength-weak');
        strengthText.textContent = 'Débil';
        strengthText.className = 'text-danger';
    } else if (strength === 3) {
        strengthMeter.classList.add('strength-good');
        strengthText.textContent = 'Media';
        strengthText.className = 'text-warning';
    } else {
        strengthMeter.classList.add('strength-strong');
        strengthText.textContent = 'Fuerte';
        strengthText.className = 'text-success';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => updatePasswordStrength(e.target.value));
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const username = document.getElementById('username').value.trim();
        const termsCheckbox = document.querySelector('input[name="terms"]');

        // Basic validation
        if (!email || !password || !confirmPassword || !username) {
            showError('Por favor completa todos los campos');
            return;
        }
        if (!termsCheckbox || !termsCheckbox.checked) {
            showError('Debes aceptar los términos y condiciones');
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

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!username.match(usernameRegex)) {
            showError('El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.match(emailRegex)) {
            showError('Por favor ingresa un correo electrónrico válido');
            return;
        }

        const registerButton = document.getElementById('register-button');
        try {
            if (registerButton) registerButton.disabled = true;

            // Ensure the username is not already taken
            const available = await isUsernameAvailable(username);
            if (!available) {
                showError('El nombre de usuario ya está en uso');
                if (registerButton) registerButton.disabled = false;
                return;
            }

            const result = await signUp(email, password, {
                username: username.toLowerCase(),
                displayName: username
            });

            if (result.success) {
                showSuccess('¡Registro exitoso! Redirigiendo...');
                setTimeout(() => {
                    window.location.href = 'account.html';
                }, 1500);
            } else {
                throw new Error(result.error || 'Error al registrar el usuario');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError(error.message || 'Error al procesar el registro');
        } finally {
            if (registerButton) registerButton.disabled = false;
        }
    });

    // Google sign-up
    const googleSignupBtn = document.getElementById('google-signup');
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', async () => {
            try {
                googleSignupBtn.disabled = true;
                googleSignupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
                const result = await signInWithGoogle();
                if (result.success) {
                    window.location.href = 'account.html';
                } else {
                    throw new Error(result.error || 'No se pudo registrar con Google');
                }
            } catch (error) {
                console.error('Google sign-up error:', error);
                showError(error.message || 'No se pudo registrar con Google');
                googleSignupBtn.disabled = false;
                googleSignupBtn.innerHTML = '<i class="fab fa-google"></i> Google';
            }
        });
    }
});
