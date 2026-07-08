/**
 * categories.js — Lista estática de categorías para categories.html.
 *
 * La lista de categorías vive aquí en un único lugar (igual que el footer),
 * para que el catálogo y la navegación puedan reutilizarla sin duplicados.
 * Las categorías con `nav: true` son las que aparecen también en la barra
 * de navegación principal (Vehículos, Inmuebles, etc.).
 */

const CATEGORIES = [
    { name: 'Vehículos',     icon: 'fa-car',         desc: 'Carros, motos y más' },
    { name: 'Inmuebles',     icon: 'fa-home',        desc: 'Casas, apartamentos y lotes' },
    { name: 'Celulares',     icon: 'fa-mobile-alt',  desc: 'Smartphones y accesorios' },
    { name: 'Computación',   icon: 'fa-laptop',      desc: 'Laptops, PC y componentes' },
    { name: 'Moda',          icon: 'fa-tshirt',      desc: 'Ropa, calzado y accesorios' },
    { name: 'Electrónica',   icon: 'fa-tv',          desc: 'TV, audio y video' },
    { name: 'Hogar y Muebles', icon: 'fa-couch',     desc: 'Muebles y electrodomésticos' },
    { name: 'Deportes',      icon: 'fa-football-ball', desc: 'Equipamiento deportivo' },
    { name: 'Juegos y Juguetes', icon: 'fa-gamepad', desc: 'Consolas y juguetes' },
    { name: 'Servicios',     icon: 'fa-briefcase',   desc: 'Servicios profesionales' },
    { name: 'Empleos',       icon: 'fa-users',       desc: 'Ofertas de trabajo' },
    { name: 'Animales',      icon: 'fa-paw',         desc: 'Mascotas y animales' }
];

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    grid.innerHTML = CATEGORIES.map(cat => `
        <a href="category.html?category=${encodeURIComponent(cat.name)}" class="catalog-card">
            <div class="icon-circle"><i class="fas ${cat.icon}"></i></div>
            <h3>${cat.name}</h3>
            <p>${cat.desc}</p>
        </a>
    `).join('');
}

document.addEventListener('DOMContentLoaded', renderCategories);

export { CATEGORIES };
