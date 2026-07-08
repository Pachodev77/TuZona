# TuZona - Clasificados en Colombia

TuZona es una aplicación web de clasificados y anuncios para las regiones de Colombia, inspirada en sitios como OLX y Craigslist. Permite a los usuarios publicar, buscar y encontrar productos y servicios en diferentes categorías y regiones del país.

## Características

- Interfaz limpia y moderna, totalmente responsiva (móvil y escritorio)
- Búsqueda por categorías y regiones de Colombia
- Anuncios destacados y recientes en la página principal
- Filtrado de búsqueda por texto y región
- Autenticación (email/contraseña y Google), perfiles y favoritos
- Mensajería entre compradores y vendedores en tiempo real
- Modo oscuro y gestión de cuenta

## Tecnologías

- HTML5 + CSS3 (Flexbox, Grid, variables CSS)
- JavaScript Vanilla (ES6 modules)
- Firebase (Authentication, Firestore, Storage) vía CDN
- Cloudinary para subida de imágenes (preset sin firmar)
- Express como servidor estático de desarrollo

## Estructura del proyecto

```
tuzona/
├── index.html              # Página principal (destacados / recientes)
├── search.html             # Resultados de búsqueda
├── category.html           # Anuncios por categoría
├── region.html             # Anuncios por región
├── ad.html                 # Detalle de un anuncio
├── publish.html            # Crear / editar anuncio
├── account.html            # Panel del usuario (mis anuncios, favoritos, mensajes)
├── profile.html            # Edición de perfil público
├── settings.html           # Configuración de cuenta
├── favorites.html          # Anuncios guardados
├── messages.html           # Mensajería
├── login.html / register.html / forgot-password.html
├── help.html
├── css/
│   └── styles.css          # Estilos principales
├── js/
│   ├── firebase-config.js  # Inicialización única de Firebase (singleton)
│   ├── app.js              # Lógica de la página principal
│   ├── main.js             # Modo oscuro + UI de autenticación en el header
│   ├── ui-helpers.js       # Utilidades compartidas (formatPrice, formatRelativeDate, createAdCard, alertas)
│   ├── auth.js             # Registro / login / logout / Google
│   ├── publish.js, category.js, search.js, region.js, ad.js
│   ├── account.js, account-sections.js, settings.js
│   ├── favorites.js, messages.js, login.js, register.js
│   ├── image-uploader.js, cloudinary-config.js
│   └── services/           # Capa de datos Firestore
│       ├── ad-service.js
│       ├── user-service.js
│       ├── favorites-service.js
│       ├── message-service.js
│   └── user-service.js (perfil de usuario)
├── server.js               # Servidor estático de desarrollo (Express)
├── firebase.json, firestore.rules, firestore.indexes.json, .firebaserc
└── package.json
```

## Modelo de datos (Firestore)

- `ads/{id}`: título, precio, ubicación, categoría, imágenes, vendedor, `featured`, `status`, `createdAt`, `views`.
- `users/{uid}`: perfil con `settings`, `stats`, `preferences`, `socialLinks`.
- `favorites/{uid}/ads/{adId}`: anuncios guardados por usuario.
- `conversations/{id}` y `conversations/{id}/messages`: mensajes entre usuarios.

## Cómo ejecutar

Servidor de desarrollo local (Express):

```bash
npm install
npm start          # http://localhost:3001
```

O con un servidor estático cualquiera:

```bash
python -m http.server 8000
```

Despliegue en Firebase Hosting:

```bash
firebase deploy
```

## Personalización

- Estilos: `css/styles.css`
- Lógica y datos: módulos en `js/` y `js/services/`
- Configuración de Firebase: `js/firebase-config.js`
- Configuración de Cloudinary: `js/cloudinary-config.js` (solo `cloudName`, `uploadPreset` y `folder`; la subida usa un preset sin firmar)

## Licencia

Este proyecto está bajo la Licencia MIT.
