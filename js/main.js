document.addEventListener('DOMContentLoaded', () => {
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