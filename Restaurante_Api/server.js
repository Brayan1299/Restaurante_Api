
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const methodOverride = require('method-override');
require('dotenv').config();

// Importar configuración de base de datos
const { initializeDatabase } = require('./config/database');

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
const PORT = process.env.PORT || 5000;

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: false // Desactivar para desarrollo
}));

app.use(cors({
  origin: '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000 // máximo 1000 requests por IP para desarrollo
});
app.use('/api/', limiter);

// Middlewares básicos
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'gastro-api-secret-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // false para desarrollo
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para variables globales en vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.message = req.session.message || null;
  delete req.session.message;
  next();
});

// Ruta principal
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
    message: 'GastroAPI funcionando correctamente 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT,
    features: {
      authentication: '✅ JWT implementado',
      restaurants: '✅ CRUD completo',
      reviews: '✅ Sistema de reseñas',
      tickets: '✅ Generación QR y pagos',
      payments: '✅ Mercado Pago integrado',
      notifications: '✅ Sistema de notificaciones',
      recommendations: '✅ Recomendaciones personalizadas',
      gui: '✅ Interfaz gráfica web'
    }
  });
});

// Documentación de la API
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Documentación completa de GastroAPI',
    description: 'API REST completa para sistema de restaurantes con autenticación, reseñas, tickets y pagos',
    baseUrl: `http://localhost:${PORT}`,
    endpoints: {
      general: {
        'GET /': 'Página principal con interfaz web',
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
        'GET /api/restaurantes/categorias': 'Obtener categorías disponibles'
      },
      reviews: {
        'POST /api/resenas': 'Crear reseña (requiere auth)',
        'GET /api/resenas/restaurante/:id': 'Reseñas de un restaurante',
        'GET /api/resenas/mis-resenas': 'Mis reseñas (requiere auth)',
        'PUT /api/resenas/:id': 'Actualizar reseña (requiere auth)',
        'DELETE /api/resenas/:id': 'Eliminar reseña (requiere auth)'
      },
      tickets: {
        'POST /api/tickets/comprar': 'Comprar tickets para eventos con QR',
        'GET /api/tickets/mis-tickets': 'Mis tickets comprados',
        'GET /api/tickets/:codigo/validate': 'Validar ticket por código QR',
        'POST /api/tickets/:codigo/usar': 'Marcar ticket como usado'
      },
      events: {
        'GET /api/eventos': 'Listar eventos gastronómicos',
        'POST /api/eventos': 'Crear evento (requiere auth)',
        'GET /api/eventos/:id': 'Obtener evento por ID'
      }
    },
    architecture: {
      type: 'MVC (Model-View-Controller)',
      frontend: 'EJS Templates + Bootstrap',
      backend: 'Node.js + Express',
      database: 'MySQL',
      authentication: 'JWT + Sessions',
      payments: 'Mercado Pago API',
      qr: 'QR Code generation for tickets',
      notifications: 'Email + In-app notifications'
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado',
      path: req.originalUrl
    });
  }
  
  res.status(404).render('index', {
    title: 'Página no encontrada - GastroAPI',
    user: req.session.user || null,
    error: 'La página que buscas no existe'
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función para iniciar el servidor
async function startServer() {
  try {
    console.log('🔄 Iniciando GastroAPI...');
    
    // Inicializar base de datos
    await initializeDatabase();
    console.log('✅ Base de datos inicializada correctamente');

    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 ========================================');
      console.log('🚀 GastroAPI servidor ejecutándose en:');
      console.log(`🚀 Local:   http://localhost:${PORT}`);
      console.log(`🚀 Network: http://0.0.0.0:${PORT}`);
      console.log('🚀 ========================================');
      console.log(`📚 Documentación API: http://0.0.0.0:${PORT}/api/docs`);
      console.log(`❤️ Estado del servidor: http://0.0.0.0:${PORT}/api/health`);
      console.log(`🌐 Interfaz web: http://0.0.0.0:${PORT}`);
      console.log('🚀 ========================================\n');
    });

    // Manejo de errores del servidor
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso`);
        process.exit(1);
      } else {
        console.error('❌ Error del servidor:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promesa rechazada:', error);
  process.exit(1);
});

// Manejo de señales del sistema
process.on('SIGTERM', () => {
  console.log('🔄 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
if (require.main === module) {
  startServer();
}

module.exports = app;
