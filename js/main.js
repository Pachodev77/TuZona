import { auth, onAuthStateChanged } from './auth.js';

// Handle Dark Mode
const initDarkMode = () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('.toggle-icon');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    };

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        applyTheme(next);
    });
};

// Update the header auth button based on the real auth state
const initAuthUI = () => {
    const userActions = document.querySelector('.user-actions');
    if (!userActions) return;

    const loginBtn = userActions.querySelector('a[href="login.html"]');
    if (!loginBtn) return;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginBtn.innerHTML = '<i class="fas fa-user"></i> Mi cuenta';
            loginBtn.href = 'account.html';
        } else {
            loginBtn.innerHTML = '<i class="fas fa-user"></i> Iniciar sesión';
            loginBtn.href = 'login.html';
        }
    });
};

/**
 * Keeps --header-height in sync with the actual rendered header height.
 * This allows every page to use padding-top: var(--header-height) without
 * hardcoding a pixel value that breaks when the header wraps on small screens.
 */
const initHeaderHeightVar = () => {
    const header = document.querySelector('.header');
    if (!header) return;

    const update = () => {
        document.documentElement.style.setProperty(
            '--header-height',
            header.offsetHeight + 'px'
        );
    };

    // Run immediately, then watch for resize (e.g. search bar wraps on mobile)
    update();
    window.addEventListener('resize', update);

    // Also re-measure after fonts/images may have shifted the header
    window.addEventListener('load', update);
};

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initAuthUI();
    initHeaderHeightVar();
});
