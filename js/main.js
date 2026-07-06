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

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();

    const miCuentaBtn = document.querySelector('a[href="account.html"]');
    const currentUser = localStorage.getItem('currentUser');

    if (miCuentaBtn) {
        if (currentUser) {
            miCuentaBtn.href = 'account.html';
        } else {
            miCuentaBtn.href = 'login.html';
        }
    }
});