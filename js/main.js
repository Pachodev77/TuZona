import { auth, onAuthStateChanged } from './auth.js';

// Handle Dark Mode
const initDarkMode = () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            icon.classList.replace('fa-sun', 'fa-moon');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
        }
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
