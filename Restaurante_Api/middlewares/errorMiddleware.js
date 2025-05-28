
// Middleware de manejo de errores para GastroAPI
const logger = require('../utils/logger');

// Middleware de manejo de errores centralizados
const errorHandler = (error, req, res, next) => {
  let message = error.message || 'Error interno del servidor';
  let statusCode = error.statusCode || 500;

  // Log del error
  logger.error(`Error ${statusCode}: ${message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: error.stack
  });

  // Errores de validación de MongoDB/MySQL
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Datos de entrada inválidos';
  }

  // Error de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  // Error de JWT expirado
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Error de duplicado (MySQL)
  if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'El recurso ya existe';
  }

  // Error de referencia (MySQL)
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referencia inválida';
  }

  // Respuesta de error
  const errorResponse = {
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      error: error 
    })
  };

  res.status(statusCode).json(errorResponse);
};

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
