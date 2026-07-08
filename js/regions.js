/**
 * regions.js — Lista estática de los departamentos/regiones de Colombia.
 *
 * La lista de regiones es la fuente única de verdad para el catálogo de
 * regions.html. Es la misma lista de los <select> del header, centralizada
 * aquí para evitar duplicados.
 */

const REGIONS = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
    'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
    'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
    'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
    'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
    'Valle del Cauca', 'Vaupés', 'Vichada', 'Bogotá'
];

function renderRegions() {
    const grid = document.getElementById('regions-grid');
    if (!grid) return;

    grid.innerHTML = REGIONS.map(region => `
        <a href="region.html?region=${encodeURIComponent(region)}" class="catalog-card">
            <div class="icon-circle"><i class="fas fa-map-marker-alt"></i></div>
            <h3>${region}</h3>
            <p>Ver anuncios</p>
        </a>
    `).join('');
}

document.addEventListener('DOMContentLoaded', renderRegions);

export { REGIONS };
