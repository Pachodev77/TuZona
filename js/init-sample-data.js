// This script initializes sample data for testing the TuZona application

// Sample user data
const sampleUser = {
    id: 'user_12345',
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    phone: '+57 300 123 4567',
    location: 'Medellín, Antioquia',
    joinDate: new Date('2023-01-15').toISOString(),
    stats: {
        activeAds: 3,
        pendingAds: 1,
        totalViews: 1245,
        unreadMessages: 2,
        rating: 4.5,
        reviews: 8
    },
    recentActivity: [
        {
            id: 'act_1',
            type: 'view',
            message: 'Tu anuncio "Apartamento en El Poblado" tiene 24 visitas nuevas',
            time: 'Hace 2 horas',
            icon: 'eye',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'act_2',
            type: 'message',
            message: 'Nuevo mensaje sobre "iPhone 12 Pro Max"',
            time: 'Ayer',
            icon: 'comment',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'act_3',
            type: 'approval',
            message: 'Tu anuncio "Moto deportiva 2023" ha sido aprobado',
            time: 'Hace 2 días',
            icon: 'check-circle',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
    ],
    favorites: [],
    messages: [
        {
            id: 'msg_1',
            from: 'Carlos Gómez',
            subject: 'Consulta sobre Apartamento en El Poblado',
            preview: 'Hola, ¿el apartamento incluye parqueadero?',
            read: false,
            date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'msg_2',
            from: 'TuZona',
            subject: 'Tu anuncio ha sido publicado',
            preview: '¡Felicidades! Tu anuncio está activo',
            read: true,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
    ]
};

// Sample ads data
const sampleAds = [
    {
        id: 'ad_1',
        title: 'Apartamento en El Poblado',
        description: 'Hermoso apartamento de 85m² en el corazón de El Poblado, 3 habitaciones, 2 baños, parqueadero cubierto.',
        price: 850000000,
        category: 'Inmuebles',
        subcategory: 'Apartamentos',
        location: 'El Poblado, Medellín',
        status: 'active',
        views: 124,
        created: new Date('2023-03-15').toISOString(),
        seller: {
            id: 'user_12345',
            name: 'Juan Pérez',
            phone: '+57 300 123 4567',
            joinDate: '2023-01-15'
        },
        images: [
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            'https://images.unsplash.com/photo-1484154218962-a197dfb1d2af?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        ],
        features: {
            rooms: 3,
            bathrooms: 2,
            area: 85,
            parking: true,
            furnished: true
        }
    },
    {
        id: 'ad_2',
        title: 'iPhone 12 Pro Max 256GB',
        description: 'iPhone 12 Pro Max en perfecto estado, 256GB, color grafito, con todos sus accesorios originales y garantía hasta diciembre 2023.',
        price: 4200000,
        category: 'Celulares',
        subcategory: 'iPhone',
        location: 'Laureles, Medellín',
        status: 'active',
        views: 87,
        created: new Date('2023-04-05').toISOString(),
        seller: {
            id: 'user_12345',
            name: 'Juan Pérez',
            phone: '+57 300 123 4567',
            joinDate: '2023-01-15'
        },
        images: [
            'https://images.unsplash.com/photo-1603921326210-6edd2d60ca68?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        ],
        features: {
            brand: 'Apple',
            model: 'iPhone 12 Pro Max',
            storage: '256GB',
            color: 'Grafito',
            condition: 'Usado - Como nuevo'
        }
    },
    {
        id: 'ad_3',
        title: 'Moto deportiva 2023',
        description: 'Moto deportiva modelo 2023, 600cc, solo 5000 km, mantenimiento al día, papeles en regla, sin siniestros.',
        price: 28000000,
        category: 'Vehículos',
        subcategory: 'Motos',
        location: 'Sabaneta, Antioquia',
        status: 'pending',
        views: 45,
        created: new Date('2023-05-20').toISOString(),
        seller: {
            id: 'user_12345',
            name: 'Juan Pérez',
            phone: '+57 300 123 4567',
            joinDate: '2023-01-15'
        },
        images: [
            'https://images.unsplash.com/photo-1558981806-5fbe1a1f3188?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        ],
        features: {
            brand: 'Kawasaki',
            model: 'Ninja 650',
            year: 2023,
            kilometers: 5000,
            color: 'Verde limón',
            engine: '600cc',
            type: 'Deportiva'
        }
    },
    {
        id: 'ad_4',
        title: 'Sofá cama de dos plazas',
        description: 'Sofá cama en excelente estado, color gris, tela resistente, medidas 180x90cm, entrega en Medellín.',
        price: 850000,
        category: 'Hogar',
        subcategory: 'Muebles',
        location: 'Belén, Medellín',
        status: 'inactive',
        views: 23,
        created: new Date('2023-02-10').toISOString(),
        seller: {
            id: 'user_12345',
            name: 'Juan Pérez',
            phone: '+57 300 123 4567',
            joinDate: '2023-01-15'
        },
        images: [
            'https://images.unsplash.com/photo-1555041463-a8d8e1f6a7e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        ],
        features: {
            color: 'Gris',
            material: 'Tela',
            condition: 'Buen estado',
            dimensions: '180x90x80 cm',
            type: 'Sofá cama'
        }
    }
];

// Initialize data in localStorage
localStorage.setItem('currentUser', JSON.stringify(sampleUser));
localStorage.setItem('sampleAds', JSON.stringify(sampleAds));

console.log('Datos de muestra inicializados correctamente');
console.log('Usuario de prueba cargado. Correo: juan@ejemplo.com');
console.log('4 anuncios de muestra cargados (3 activos, 1 inactivo, 1 pendiente)');

// Redirect to account page after initialization
setTimeout(() => {
    window.location.href = 'account.html';
}, 2000);
