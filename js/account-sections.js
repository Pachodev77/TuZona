import { auth, onAuthStateChanged } from './firebase-config.js';
import { getFavorites } from './services/favorites-service.js';
import { getConversations } from './services/message-service.js';
import { formatPrice } from './ui-helpers.js';

const otherParticipant = (conv, uid) => {
    const otherUid = (conv.participants || []).find(u => u !== uid);
    const info = conv.participantInfo?.[otherUid] || {};
    return info.name || 'Usuario';
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        // Favorites
        const favSection = document.getElementById('favorites');
        if (favSection) {
            try {
                const favs = await getFavorites(user.uid);
                if (!favs.length) {
                    favSection.innerHTML = `
                        <div class="section-header"><h2>Mis Favoritos</h2></div>
                        <p>No tienes anuncios guardados en favoritos.</p>`;
                } else {
                    favSection.innerHTML = `
                        <div class="section-header"><h2>Mis Favoritos</h2></div>
                        <div class="ads-container">
                            ${favs.slice(0, 5).map(f => `
                                <div class="ad-list-item">
                                    <div class="ad-list-image">
                                        <img src="${f.image || 'images/placeholder.jpg'}" alt="${f.title}" onerror="this.src='images/placeholder.jpg'">
                                    </div>
                                    <div class="ad-list-details">
                                        <h3><a href="ad.html?id=${f.adId}">${f.title}</a></h3>
                                        <p class="ad-list-price">${formatPrice(f.price)}</p>
                                        <div class="ad-list-meta"><span><i class="fas fa-map-marker-alt"></i> ${f.location || ''}</span></div>
                                    </div>
                                </div>`).join('')}
                        </div>
                        <a href="favorites.html" class="btn btn-outline">Ver todos</a>`;
                }
            } catch (error) {
                console.error('Error al cargar favoritos en el dashboard:', error);
            }
        }

        // Messages
        const msgSection = document.getElementById('messages');
        if (msgSection) {
            try {
                const convs = await getConversations(user.uid);
                if (!convs.length) {
                    msgSection.innerHTML = `
                        <div class="section-header"><h2>Mensajes</h2></div>
                        <p>No tienes mensajes nuevos.</p>`;
                } else {
                    msgSection.innerHTML = `
                        <div class="section-header"><h2>Mensajes</h2></div>
                        <div class="ads-container">
                            ${convs.slice(0, 5).map(c => `
                                <div class="ad-list-item">
                                    <div class="ad-list-details">
                                        <h3><a href="messages.html?conv=${c.id}">${otherParticipant(c, user.uid)}</a></h3>
                                        <p>${c.lastMessage || 'Inicia la conversación'}</p>
                                        <small>${c.adTitle || ''}</small>
                                    </div>
                                </div>`).join('')}
                        </div>
                        <a href="messages.html" class="btn btn-outline">Ver todos</a>`;
                }
            } catch (error) {
                console.error('Error al cargar mensajes en el dashboard:', error);
            }
        }
    });
});
