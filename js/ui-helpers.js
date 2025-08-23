/**
 * UI Helpers for TuZona application
 * Provides functions for showing/hiding loading states and displaying alerts
 */

/**
 * Show an error message in the alerts container
 * @param {string} message - The error message to display
 * @param {HTMLElement|string} [element=document.body] - The element to append the alert to
 * @param {number} [duration=5000] - Duration in milliseconds to show the error (0 = until dismissed)
 * @returns {HTMLElement} The created alert element
 */
export function showError(message, element = document.body, duration = 5000) {
    return showAlert('error', 'Error', message, element, duration);
}

/**
 * Show a success message in the alerts container
 * @param {string} message - The success message to display
 * @param {HTMLElement|string} [element=document.body] - The element to append the alert to
 * @param {number} [duration=3000] - Duration in milliseconds to show the success message (0 = until dismissed)
 * @returns {HTMLElement} The created alert element
 */
export function showSuccess(message, element = document.body, duration = 3000) {
    return showAlert('success', '¡Éxito!', message, element, duration);
}

/**
 * Show a loading state on a button
 * @param {HTMLElement|string} button - The button element or its ID
 * @param {string} [loadingText='Procesando...'] - Text to show while loading
 * @returns {Object} An object with a reset function to restore the button's original state
 */
export function showLoading(button, loadingText = 'Procesando...') {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn) return { reset: () => {} };
    
    // Save original state if not already saved
    if (!btn.dataset.originalHTML) {
        btn.dataset.originalHTML = btn.innerHTML;
    }
    
    const originalDisabled = btn.disabled;
    
    // Set loading state
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    
    // Return function to reset button
    return {
        reset: (newText) => {
            btn.innerHTML = newText || btn.dataset.originalHTML;
            btn.disabled = originalDisabled;
            delete btn.dataset.originalHTML;
        }
    };
}

/**
 * Hide loading state on a button
 * @param {HTMLElement|string} button - The button element or its ID
 * @param {string} [newText] - Optional new text to set on the button
 */
export function hideLoading(button, newText) {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn) return;
    
    if (btn.dataset.originalHTML) {
        btn.innerHTML = newText || btn.dataset.originalHTML;
        delete btn.dataset.originalHTML;
    } else if (newText) {
        btn.textContent = newText;
    }
    
    btn.disabled = false;
    
    // Remove loading spinner if present
    const spinner = btn.querySelector('.fa-spinner, .spinner-border');
    if (spinner) {
        spinner.remove();
    }
}

/**
 * Show an alert in the alerts container
 * @private
 * @param {string} type - The type of alert (success, error, info, warning)
 * @param {string} title - The title of the alert
 * @param {string} message - The message to display
 * @param {HTMLElement|string} [element=document.body] - The element to append the alert to
 * @param {number} [duration=0] - Duration in milliseconds to show the alert (0 = until dismissed)
 * @returns {HTMLElement} The created alert element
 */
function showAlert(type, title, message, element = document.body, duration = 0) {
    // If element is a string, treat it as a selector
    const container = typeof element === 'string' ? document.querySelector(element) : element;
    if (!container) return null;
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.role = 'alert';
    
    // Set alert content
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle alert-icon"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle alert-icon"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle alert-icon"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle alert-icon"></i>';
    }
    
    alert.innerHTML = `
        ${icon}
        <div class="alert-content">
            <div class="alert-title">${title}</div>
            <div class="alert-message">${message}</div>
        </div>
        <button type="button" class="alert-close" aria-label="Cerrar">&times;</button>
    `;
    
    // Add close button functionality
    const closeButton = alert.querySelector('.alert-close');
    const closeAlert = () => {
        alert.style.opacity = '0';
        setTimeout(() => {
            if (alert.parentNode === container) {
                container.removeChild(alert);
            }
        }, 300);
    };
    
    closeButton.addEventListener('click', closeAlert);
    
    // Auto-close after duration if specified
    if (duration > 0) {
        setTimeout(closeAlert, duration);
    }
    
    // Add to container and show
    container.insertBefore(alert, container.firstChild);
    
    // Trigger reflow to enable CSS transition
    // eslint-disable-next-line no-void
    void alert.offsetHeight;
    
    return alert;
}

/**
 * Toggle password visibility
 * @param {string} inputId - The ID of the password input field
 */
export function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const icon = input.nextElementSibling?.querySelector('i');
    if (!icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

/**
 * Format a date to a readable string
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Debounce a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if user is authenticated
 */
export function isAuthenticated() {
    return new Promise((resolve) => {
        import('./auth.js').then(({ auth, onAuthStateChanged }) => {
            onAuthStateChanged(auth, (user) => {
                resolve(!!user);
            });
        });
    });
}

/**
 * Redirect to login if not authenticated
 * @param {string} [redirectTo='login.html'] - The URL to redirect to if not authenticated
 * @returns {Promise<boolean>} True if authenticated, false if redirected to login
 */
export async function requireAuth(redirectTo = 'login.html') {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
        // Store the current URL to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

/**
 * Get current user data
 * @returns {Promise<Object|null>} The current user object or null if not authenticated
 */
export function getCurrentUser() {
    return new Promise((resolve) => {
        import('./auth.js').then(({ auth, onAuthStateChanged }) => {
            onAuthStateChanged(auth, (user) => {
                resolve(user);
            });
        });
    });
}
