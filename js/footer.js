/**
 * footer.js — Inyector centralizado del footer de TuZona.
 *
 * El footer vive en un único lugar (esta función) y se inyecta en cualquier
 * página que contenga `<footer id="site-footer" class="footer"></footer>`.
 * Así, para cambiar un enlace o texto del footer basta con editar este archivo
 * y el cambio se refleja en todas las páginas, sin inconsistencias ni duplicados.
 *
 * Uso: en el HTML poner el marcador vacío y cargar este script como módulo:
 *   <footer class="footer" id="site-footer"></footer>
 *   <script type="module" src="js/footer.js"></script>
 */

const footerHTML = `
<div class="container">
    <div class="footer-content">
        <div class="footer-section">
            <h3>TuZona</h3>
            <p>El mejor lugar para comprar y vender en Colombia</p>
        </div>
        <div class="footer-section">
            <h4>Explorar</h4>
            <ul>
                <li><a href="index.html">Inicio</a></li>
                <li><a href="categories.html">Categorías</a></li>
                <li><a href="regions.html">Regiones</a></li>
                <li><a href="trending.html">Tendencias</a></li>
            </ul>
        </div>
        <div class="footer-section">
            <h4>Cuenta</h4>
            <ul>
                <li><a href="account.html">Mi cuenta</a></li>
                <li><a href="account.html#ads">Mis anuncios</a></li>
                <li><a href="messages.html">Mensajes</a></li>
                <li><a href="favorites.html">Favoritos</a></li>
            </ul>
        </div>
        <div class="footer-section">
            <h4>Contacto</h4>
            <ul>
                <li><a href="help.html">Centro de ayuda</a></li>
                <li><a href="terms.html">Términos de uso</a></li>
                <li><a href="privacy.html">Política de privacidad</a></li>
                <li><a href="contact.html">Contáctanos</a></li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} TuZona - Todos los derechos reservados</p>
        <div class="social-links">
            <a href="#" aria-label="Facebook"><i class="fab fa-facebook"></i></a>
            <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
        </div>
    </div>
</div>`;

/**
 * Inyecta el HTML del footer dentro del marcador #site-footer.
 * Es idempotente: si ya hay contenido o no existe el marcador, no hace nada.
 */
function renderFooter() {
    const host = document.getElementById('site-footer');
    if (host && !host.childElementCount) {
        host.innerHTML = footerHTML;
    }
}

// Ejecutar lo antes posible y también al cargar el DOM por si el script
// se incluye sin defer/module al final del body.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFooter);
} else {
    renderFooter();
}

export { renderFooter, footerHTML };
