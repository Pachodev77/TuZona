const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS más permisiva
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Proxy para las solicitudes de autenticación de Firebase
app.use('/v1/accounts', createProxyMiddleware({
  target: 'https://identitytoolkit.googleapis.com',
  changeOrigin: true,
  pathRewrite: {
    '^/v1/accounts': '/v1/accounts',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Añadir la API key a la solicitud
    proxyReq.path += `?key=AIzaSyBd-B3w6KanW3fk7vy5eAwtXO-bxXXl9eY`;
  }
}));

// Ruta principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Configuración CORS habilitada para todos los orígenes');
});
