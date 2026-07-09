/**
 * trending.js — Página de Tendencias.
 *
 * Muestra los anuncios más populares usando el AdService existente:
 * primero los destacados (featured) y luego los más vistos (views).
 * Reutiliza createAdCard de ui-helpers para mantener la consistencia visual.
 */

import { AdService } from './services/ad-service.js';
import { createAdCard, initSlideshows } from './ui-helpers.js';

const container = document.getElementById('trending-ads');

document.addEventListener('DOMContentLoaded', async () => {
    if (!container) return;

    try {
        const ads = await AdService.getActiveAds();

        if (!ads.length) {
            container.innerHTML = `
                <div class="state-message">
                    <i class="fas fa-box-open"></i>
                    <p>Aún no hay anuncios para mostrar.</p>
                </div>`;
            return;
        }

        // Ordenar: primero destacados, luego por vistas (desc) y por fecha (desc).
        ads.sort((a, b) => {
            const fa = a.featured ? 1 : 0;
            const fb = b.featured ? 1 : 0;
            if (fa !== fb) return fb - fa;
            const va = Number(a.views) || 0;
            const vb = Number(b.views) || 0;
            if (va !== vb) return vb - va;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        container.innerHTML = ads.map(createAdCard).join('');
        initSlideshows();
    } catch (error) {
        console.error('Error al cargar tendencias:', error);
        container.innerHTML = `
            <div class="state-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar los anuncios. Por favor, recarga la página.</p>
            </div>`;
    }
});
