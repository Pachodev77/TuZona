document.addEventListener('DOMContentLoaded', () => {
    const publishForm = document.getElementById('publish-form');

    // Function to get ads from localStorage
    const getAds = () => {
        const adsJSON = localStorage.getItem('sampleAds');
        // If no ads in localStorage, return the default ads array
        if (!adsJSON) {
            return [
                {
                    id: 1,
                    title: 'iPhone 13 Pro Max 256GB - Excelente estado',
                    price: '3.500.000',
                    location: 'Bogotá, Chapinero',
                    date: 'Hoy',
                    image: 'https://images.unsplash.com/photo-1632679965721-ec38161daeec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                    category: 'Celulares',
                    featured: true
                },
                {
                    id: 2,
                    title: 'Apartamento en arriendo - 3 habitaciones - Modelia',
                    price: '1.800.000',
                    location: 'Bogotá, Modelia',
                    date: 'Ayer',
                    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                    category: 'Inmuebles',
                    featured: true
                },
                {
                    id: 3,
                    title: 'Mazda 3 2020 - Full equipo - 25.000 km',
                    price: '85.000.000',
                    location: 'Medellín, El Poblado',
                    date: 'Hoy',
                    image: 'https://images.unsplash.com/photo-1609525316023-35bdbd0e60e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                    category: 'Vehículos',
                    featured: true
                },
                {
                    id: 4,
                    title: 'Portátil HP Pavilion - 16GB RAM - 512GB SSD',
                    price: '2.800.000',
                    location: 'Cali, San Fernando',
                    date: 'Hace 2 días',
                    image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80',
                    category: 'Computación',
                    featured: false
                },
                {
                    id: 5,
                    title: 'Sofá en L - Color gris - Excelente estado',
                    price: '1.200.000',
                    location: 'Barranquilla, Norte',
                    date: 'Hoy',
                    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                    category: 'Hogar',
                    featured: false
                },
                {
                    id: 6,
                    title: 'Bicicleta Specialized - Talla M - 18 velocidades',
                    price: '2.100.000',
                    location: 'Bogotá, Usaquén',
                    date: 'Ayer',
                    image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1022&q=80',
                    category: 'Deportes',
                    featured: true
                },
                {
                    id: 7,
                    title: 'Cámara Canon EOS 90D - Kit 18-55mm',
                    price: '4.500.000',
                    location: 'Medellín, Laureles',
                    date: 'Hoy',
                    image: 'https://images.unsplash.com/photo-1510127033411-de2b20e8de46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                    category: 'Electrónica',
                    featured: false
                },
                {
                    id: 8,
                    title: 'Zapatos deportivos Nike Air Max - Talla 42',
                    price: '350.000',
                    location: 'Cali, Granada',
                    date: 'Hace 3 días',
                    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                    category: 'Moda',
                    featured: false
                }
            ];
        }
        return JSON.parse(adsJSON);
    };

    // Function to save ads to localStorage
    const saveAds = (ads) => {
        localStorage.setItem('sampleAds', JSON.stringify(ads));
    };

    publishForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = e.target.title.value;
        const price = e.target.price.value;
        const description = e.target.description.value;
        const category = e.target.category.value;
        const condition = e.target.condition.value;
        const region = e.target.region.value;
        const sellerName = e.target['seller-name'].value;
        const sellerPhone = e.target['seller-phone'].value;
        const image = e.target.image.value;

        const newAd = {
            id: Date.now(), // Simple unique ID
            title,
            price,
            description,
            category,
            condition,
            location: region, // For simplicity, we'll just use the region as the location
            seller: {
                name: sellerName,
                phone: sellerPhone
            },
            date: 'Hoy',
            image,
            featured: false // New ads are not featured by default
        };

        const ads = getAds();
        ads.push(newAd);
        saveAds(ads);

        // Set current user
        localStorage.setItem('currentUser', sellerName);

        alert('¡Anuncio publicado con éxito!');
        window.location.href = 'index.html';
    });
});