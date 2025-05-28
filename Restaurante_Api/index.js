const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
require('dotenv').config();

// Importar middlewares
const errorHandler = require('./middlewares/errorMiddleware');
const { initDb } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares básicos
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(methodOverride('_method'));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'mi-secreto-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de motor de plantillas EJS
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
    title: 'GastroAPI - Descubre los mejores restaurantes',
    user: req.session.user
  });
});

// Rutas de API
app.use('/api/auth', authRoutes);

// Ruta de salud del API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GastroAPI funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Ruta para documentación de API
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Documentación de GastroAPI',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Registrar nuevo usuario',
        'POST /api/auth/login': 'Iniciar sesión',
        'POST /api/auth/logout': 'Cerrar sesión',
        'GET /api/auth/me': 'Obtener perfil del usuario',
        'PUT /api/auth/profile': 'Actualizar perfil',
        'PUT /api/auth/change-password': 'Cambiar contraseña'
      },
      restaurantes: {
        'GET /api/restaurantes': 'Listar restaurantes con filtros',
        'POST /api/restaurantes': 'Crear restaurante',
        'GET /api/restaurantes/:id': 'Obtener restaurante por ID',
        'PUT /api/restaurantes/:id': 'Actualizar restaurante',
        'DELETE /api/restaurantes/:id': 'Eliminar restaurante',
        'GET /api/restaurantes/search': 'Buscar restaurantes',
        'GET /api/restaurantes/categorias': 'Obtener categorías',
        'GET /api/restaurantes/cercanos': 'Restaurantes cercanos'
      },
      resenas: {
        'POST /api/resenas': 'Crear reseña',
        'GET /api/resenas/restaurante/:restauranteId': 'Reseñas por restaurante',
        'GET /api/resenas/mis-resenas': 'Mis reseñas',
        'PUT /api/resenas/:id': 'Actualizar reseña',
        'DELETE /api/resenas/:id': 'Eliminar reseña'
      },
      tickets: {
        'POST /api/tickets/comprar': 'Comprar tickets',
        'GET /api/tickets/mis-tickets': 'Mis tickets',
        'GET /api/tickets/:codigo/validate': 'Validar ticket',
        'POST /api/tickets/:codigo/usar': 'Usar ticket'
      }
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado'
    });
  }
  
  res.status(404).render('error', {
    title: 'Página no encontrada',
    error: {
      status: 404,
      message: 'La página que buscas no existe'
    }
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Función para iniciar el servidor
async function startServer() {
  try {
    // Inicializar base de datos
    await initDb();
    console.log('📦 Base de datos inicializada correctamente');

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
      console.log(`📚 Documentación API: http://0.0.0.0:${PORT}/api/docs`);
      console.log(`❤️ Estado del servidor: http://0.0.0.0:${PORT}/api/health`);
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

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rechazada no manejada:', reason);
  process.exit(1);
});

// Iniciar aplicación
startServer();

module.exports = app;