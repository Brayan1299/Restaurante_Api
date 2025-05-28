
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const restauranteRoutes = require('./routes/restaurantes');
const resenaRoutes = require('./routes/resenas');
const menuRoutes = require('./routes/menus');
const eventoRoutes = require('./routes/eventos');
const ticketRoutes = require('./routes/tickets');
const recomendacionRoutes = require('./routes/recomendaciones');

// Importar middlewares
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Configuración de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use('/api/', limiter);

// Middlewares
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'gastro-api-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas principales
app.get('/', (req, res) => {
  res.render('index', {
    title: 'GastroAPI - Sistema de Restaurantes',
    user: req.session.user || null
  });
});

// Rutas de vistas para autenticación
app.get('/auth/login', (req, res) => {
  res.render('auth/login', {
    title: 'Iniciar Sesión - GastroAPI',
    user: req.session.user || null
  });
});

app.get('/auth/register', (req, res) => {
  res.render('auth/register', {
    title: 'Registrarse - GastroAPI',
    user: req.session.user || null
  });
});

// Rutas de vistas para restaurantes
app.get('/restaurantes', (req, res) => {
  res.render('restaurantes/index', {
    title: 'Restaurantes - GastroAPI',
    user: req.session.user || null
  });
});

// Ruta de dashboard para usuarios autenticados
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.render('dashboard', {
    title: 'Dashboard - GastroAPI',
    user: req.session.user
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/restaurantes', restauranteRoutes);
app.use('/api/resenas', resenaRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/recomendaciones', recomendacionRoutes);

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GastroAPI funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      authentication: '✅ JWT implementado',
      restaurants: '✅ CRUD completo',
      reviews: '✅ Sistema de reseñas',
      tickets: '✅ Generación QR y pagos',
      payments: '✅ Mercado Pago integrado',
      notifications: '✅ Sistema de notificaciones',
      recommendations: '✅ Recomendaciones personalizadas'
    }
  });
});

// Documentación de la API
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Documentación completa de GastroAPI',
    description: 'API REST completa para sistema de restaurantes con autenticación, reseñas, tickets y pagos',
    baseUrl: `http://localhost:${process.env.PORT || 3000}`,
    endpoints: {
      general: {
        'GET /api/health': 'Estado del servidor y características',
        'GET /api/docs': 'Esta documentación'
      },
      authentication: {
        'POST /api/auth/register': 'Registrar nuevo usuario',
        'POST /api/auth/login': 'Iniciar sesión',
        'GET /api/auth/me': 'Obtener perfil del usuario autenticado',
        'PUT /api/auth/profile': 'Actualizar perfil',
        'PUT /api/auth/change-password': 'Cambiar contraseña',
        'POST /api/auth/logout': 'Cerrar sesión'
      },
      restaurants: {
        'GET /api/restaurantes': 'Listar restaurantes con filtros',
        'POST /api/restaurantes': 'Crear nuevo restaurante (requiere auth)',
        'GET /api/restaurantes/:id': 'Obtener restaurante por ID',
        'PUT /api/restaurantes/:id': 'Actualizar restaurante (requiere auth)',
        'DELETE /api/restaurantes/:id': 'Eliminar restaurante (admin)',
        'GET /api/restaurantes/search': 'Buscar restaurantes',
        'GET /api/restaurantes/categorias': 'Obtener categorías disponibles',
        'GET /api/restaurantes/cercanos': 'Restaurantes cercanos por ubicación'
      },
      reviews: {
        'POST /api/resenas': 'Crear reseña (requiere auth)',
        'GET /api/resenas/restaurante/:id': 'Reseñas de un restaurante',
        'GET /api/resenas/mis-resenas': 'Mis reseñas (requiere auth)',
        'PUT /api/resenas/:id': 'Actualizar reseña (requiere auth)',
        'DELETE /api/resenas/:id': 'Eliminar reseña (requiere auth)'
      },
      tickets: {
        'POST /api/tickets/comprar': 'Comprar tickets para eventos',
        'GET /api/tickets/mis-tickets': 'Mis tickets comprados',
        'GET /api/tickets/:codigo/validate': 'Validar ticket por código QR',
        'POST /api/tickets/:codigo/usar': 'Marcar ticket como usado'
      },
      events: {
        'GET /api/eventos': 'Listar eventos gastronómicos',
        'POST /api/eventos': 'Crear evento (requiere auth)',
        'GET /api/eventos/:id': 'Obtener evento por ID'
      },
      recommendations: {
        'GET /api/recomendaciones/personalizadas': 'Recomendaciones personalizadas',
        'GET /api/recomendaciones/populares': 'Restaurantes más populares',
        'GET /api/recomendaciones/cercanas': 'Recomendaciones cercanas'
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>',
      note: 'Incluir token JWT en el header Authorization para rutas protegidas'
    },
    database: {
      type: 'MySQL',
      tables: ['usuarios', 'restaurantes', 'resenas', 'menus', 'eventos', 'tickets', 'notificaciones'],
      note: 'Base de datos configurada con relaciones completas y índices optimizados'
    }
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

module.exports = app;
