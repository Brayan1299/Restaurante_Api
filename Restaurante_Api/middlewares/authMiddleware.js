const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para verificar autenticación JWT
const authenticateToken = async (req, res, next) => {
  try {
    let token = null;
    
    // Buscar token en diferentes lugares
    if (req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1]; // Bearer token
    } else if (req.cookies.authToken) {
      token = req.cookies.authToken; // Cookie
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario aún existe
    const user = await Usuario.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido'
      });
    }
    
    // Agregar información del usuario al request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    } else {
      console.error('Error en autenticación:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }
    
    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }
    
    next();
  };
};

// Middleware para rutas opcionales de autenticación
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    
    if (req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Usuario.findById(decoded.userId);
        
        if (user) {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
          };
        }
      } catch (error) {
        // Token inválido o expirado, pero continúa sin autenticación
        req.user = null;
      }
    }
    
    next();
    
  } catch (error) {
    console.error('Error en autenticación opcional:', error);
    req.user = null;
    next();
  }
};

// Middleware para verificar si el usuario ya está autenticado (para login/register)
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};

// Middleware para verificar autenticación en rutas web
const requireAuthWeb = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  redirectIfAuthenticated,
  requireAuthWeb
};