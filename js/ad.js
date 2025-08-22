document.addEventListener('DOMContentLoaded', () => {
    const adDetailContainer = document.getElementById('ad-detail-container');

    // Function to get ads from localStorage
    const getAds = () => {
        const adsJSON = localStorage.getItem('sampleAds');
        if (!adsJSON) {
            return [];
        }
        return JSON.parse(adsJSON);
    };

    // Get ad ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const adId = parseInt(urlParams.get('id'));

    // Find the ad with the matching ID
    const ads = getAds();
    const ad = ads.find(ad => ad.id === adId);

    // Display ad details
    if (ad) {
        adDetailContainer.innerHTML = `
            <section class="ad-detail">
                <div class="ad-detail-image">
                    <img src="${ad.image}" alt="${ad.title}">
                </div>
                <div class="ad-detail-info">
                    <h1 class="ad-detail-title">${ad.title}</h1>
                    <div class="ad-detail-price">${ad.price}</div>
                    <div class="ad-detail-location"><i class="fas fa-map-marker-alt"></i> ${ad.location}</div>
                    <div class="ad-detail-meta">
                        <span><strong>Categoría:</strong> ${ad.category}</span>
                        <span><strong>Condición:</strong> ${ad.condition}</span>
                        <span><strong>Publicado:</strong> ${ad.date}</span>
                    </div>
                    <div class="ad-detail-description">
                        <h3>Descripción</h3>
                        <p>${ad.description}</p>
                    </div>
                    <div class="ad-detail-seller">
                        <h3>Información del vendedor</h3>
                        <p><strong>Nombre:</strong> ${ad.seller.name}</p>
                        <p><strong>Teléfono:</strong> ${ad.seller.phone}</p>
                    </div>
                    <div class="ad-detail-actions">
                        <a href="#" class="btn btn-primary"><i class="fas fa-phone"></i> Contactar al vendedor</a>
                        <a href="#" class="btn"><i class="fas fa-heart"></i> Guardar en favoritos</a>
                    </div>
                </div>
            </section>
        `;
    } else {
        adDetailContainer.innerHTML = '<p class="no-results">Anuncio no encontrado.</p>';
    }
});