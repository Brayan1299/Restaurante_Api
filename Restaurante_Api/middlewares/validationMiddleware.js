const { body, param, query } = require('express-validator');

// Validaciones para registro de usuario
const validateRegister = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
    
  body('telefono')
    .optional()
    .isMobilePhone('es-CO')
    .withMessage('Número de teléfono inválido'),
    
  body('role')
    .optional()
    .isIn(['user', 'admin', 'restaurant_owner'])
    .withMessage('Rol inválido')
];

// Validaciones para inicio de sesión
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Validaciones para actualizar perfil
const validateUpdateProfile = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
    
  body('telefono')
    .optional()
    .isMobilePhone('es-CO')
    .withMessage('Número de teléfono inválido'),
    
  body('preferencias')
    .optional()
    .isObject()
    .withMessage('Las preferencias deben ser un objeto válido')
];

// Validaciones para cambio de contraseña
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial')
];

// Validaciones para restaurante
const validateRestaurant = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
    
  body('direccion')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La dirección debe tener entre 10 y 500 caracteres'),
    
  body('telefono')
    .optional()
    .isMobilePhone('es-CO')
    .withMessage('Número de teléfono inválido'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
    
  body('categoria')
    .isIn([
      'Italiana', 'Mexicana', 'Japonesa', 'Peruana', 'Colombiana', 
      'Francesa', 'China', 'Vegetariana', 'Fusión', 'Mediterránea',
      'India', 'Tailandesa', 'Árabe', 'Americana', 'Brasileña'
    ])
    .withMessage('Categoría inválida'),
    
  body('precio_promedio')
    .optional()
    .isIn(['$', '$$', '$$$', '$$$$'])
    .withMessage('Rango de precio inválido'),
    
  body('latitud')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
    
  body('longitud')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida')
];

// Validaciones para menú
const validateMenu = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
    
  body('precio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
    
  body('categoria')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La categoría debe tener entre 2 y 100 caracteres'),
    
  body('restaurante_id')
    .isInt({ min: 1 })
    .withMessage('ID de restaurante inválido')
];

// Validaciones para reseña
const validateReview = [
  body('calificacion')
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser un número entre 1 y 5'),
    
  body('comentario')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('El comentario debe tener entre 10 y 1000 caracteres'),
    
  body('restaurante_id')
    .isInt({ min: 1 })
    .withMessage('ID de restaurante inválido'),
    
  body('fecha_visita')
    .optional()
    .isDate()
    .withMessage('Fecha de visita inválida')
];

// Validaciones para evento
const validateEvent = [
  body('titulo')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('El título debe tener entre 5 y 255 caracteres'),
    
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
    
  body('fecha_inicio')
    .isISO8601()
    .withMessage('Fecha de inicio inválida')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La fecha de inicio debe ser futura');
      }
      return true;
    }),
    
  body('precio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
    
  body('capacidad_maxima')
    .isInt({ min: 1 })
    .withMessage('La capacidad máxima debe ser un número positivo'),
    
  body('ubicacion')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('La ubicación debe tener entre 5 y 255 caracteres'),
    
  body('restaurante_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de restaurante inválido')
];

// Validaciones para compra de ticket
const validateTicketPurchase = [
  body('evento_id')
    .isInt({ min: 1 })
    .withMessage('ID de evento inválido'),
    
  body('cantidad')
    .isInt({ min: 1, max: 10 })
    .withMessage('La cantidad debe ser entre 1 y 10 tickets'),
    
  body('datos_comprador')
    .optional()
    .isObject()
    .withMessage('Datos del comprador inválidos')
];

// Validaciones para parámetros de ID
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID inválido')
];

// Validaciones para consultas de búsqueda
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres'),
    
  query('categoria')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Categoría inválida'),
    
  query('precio_promedio')
    .optional()
    .isIn(['$', '$$', '$$$', '$$$$'])
    .withMessage('Rango de precio inválido'),
    
  query('calificacion_min')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Calificación mínima inválida'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite inválido (1-100)'),
    
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset inválido')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateRestaurant,
  validateMenu,
  validateReview,
  validateEvent,
  validateTicketPurchase,
  validateId,
  validateSearch
};