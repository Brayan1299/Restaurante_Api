const { body, param, query } = require('express-validator');

// Validaciones para autenticación
const validateRegister = [
    body('name')
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('email')
        .notEmpty()
        .withMessage('El email es requerido')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail()
        .isLength({ max: 150 })
        .withMessage('El email no puede exceder 150 caracteres'),

    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),

    body('phone')
        .optional()
        .isMobilePhone('es-ES')
        .withMessage('Debe ser un número de teléfono válido'),

    body('preferences')
        .optional()
        .isObject()
        .withMessage('Las preferencias deben ser un objeto válido')
];

const validateLogin = [
    body('email')
        .notEmpty()
        .withMessage('El email es requerido')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
];

const validateUpdateProfile = [
    body('name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('phone')
        .optional()
        .isMobilePhone('es-ES')
        .withMessage('Debe ser un número de teléfono válido'),

    body('preferences')
        .optional()
        .isObject()
        .withMessage('Las preferencias deben ser un objeto válido')
];

const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),

    body('newPassword')
        .isLength({ min: 8, max: 128 })
        .withMessage('La nueva contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número')
];

const validatePasswordReset = [
    body('email')
        .if(body('token').not().exists())
        .notEmpty()
        .withMessage('El email es requerido')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),

    body('token')
        .if(body('newPassword').exists())
        .notEmpty()
        .withMessage('El token es requerido'),

    body('newPassword')
        .if(body('token').exists())
        .isLength({ min: 8, max: 128 })
        .withMessage('La nueva contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número')
];

// Validaciones para restaurantes
const validateCreateRestaurant = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('cuisine_type')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El tipo de cocina debe tener entre 2 y 100 caracteres'),
    body('address')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('La dirección debe tener entre 5 y 500 caracteres'),
    body('city')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('La ciudad debe tener entre 2 y 100 caracteres'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[+]?[0-9\s\-()]+$/)
        .withMessage('Formato de teléfono inválido'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('price_range')
        .isIn(['$', '$$', '$$$', '$$$$'])
        .withMessage('Rango de precio debe ser $, $$, $$$ o $$$$'),
    body('opening_hours')
        .optional()
        .isObject()
        .withMessage('Horarios debe ser un objeto válido')
];

const validateUpdateRestaurant = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('cuisine_type')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El tipo de cocina debe tener entre 2 y 100 caracteres'),
    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('La dirección debe tener entre 5 y 500 caracteres'),
    body('city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('La ciudad debe tener entre 2 y 100 caracteres'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[+]?[0-9\s\-()]+$/)
        .withMessage('Formato de teléfono inválido'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('price_range')
        .optional()
        .isIn(['$', '$$', '$$$', '$$$$'])
        .withMessage('Rango de precio debe ser $, $$, $$$ o $$$$'),
    body('opening_hours')
        .optional()
        .isObject()
        .withMessage('Horarios debe ser un objeto válido')
];

// Validaciones para reseñas
const validateCreateReview = [
    body('restaurant_id')
        .isInt({ min: 1 })
        .withMessage('ID de restaurante debe ser un número entero positivo'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('La calificación debe ser entre 1 y 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('El comentario no puede exceder 1000 caracteres'),
    body('visit_date')
        .optional()
        .isISO8601()
        .withMessage('Fecha de visita debe ser una fecha válida')
];

const validateUpdateReview = [
    body('rating')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('La calificación debe ser entre 1 y 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('El comentario no puede exceder 1000 caracteres'),
    body('visit_date')
        .optional()
        .isISO8601()
        .withMessage('Fecha de visita debe ser una fecha válida')
];

// Validaciones para elementos del menú
const validateCreateMenuItem = [
    body('restaurant_id')
        .notEmpty()
        .withMessage('El ID del restaurante es requerido')
        .isInt({ min: 1 })
        .withMessage('El ID del restaurante debe ser un número entero positivo'),

    body('category')
        .notEmpty()
        .withMessage('La categoría es requerida')
        .isLength({ min: 2, max: 100 })
        .withMessage('La categoría debe tener entre 2 y 100 caracteres'),

    body('name')
        .notEmpty()
        .withMessage('El nombre del elemento es requerido')
        .isLength({ min: 2, max: 150 })
        .withMessage('El nombre debe tener entre 2 y 150 caracteres'),

    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),

    body('price')
        .notEmpty()
        .withMessage('El precio es requerido')
        .isFloat({ min: 0.01, max: 9999.99 })
        .withMessage('El precio debe ser un número entre 0.01 y 9999.99'),

    body('is_available')
        .optional()
        .isBoolean()
        .withMessage('La disponibilidad debe ser un valor booleano'),

    body('allergens')
        .optional()
        .isArray()
        .withMessage('Los alérgenos deben ser un array'),

    body('nutritional_info')
        .optional()
        .isObject()
        .withMessage('La información nutricional debe ser un objeto válido')
];

const validateUpdateMenuItem = [
    body('category')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('La categoría debe tener entre 2 y 100 caracteres'),

    body('name')
        .optional()
        .isLength({ min: 2, max: 150 })
        .withMessage('El nombre debe tener entre 2 y 150 caracteres'),

    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),

    body('price')
        .optional()
        .isFloat({ min: 0.01, max: 9999.99 })
        .withMessage('El precio debe ser un número entre 0.01 y 9999.99'),

    body('is_available')
        .optional()
        .isBoolean()
        .withMessage('La disponibilidad debe ser un valor booleano'),

    body('allergens')
        .optional()
        .isArray()
        .withMessage('Los alérgenos deben ser un array'),

    body('nutritional_info')
        .optional()
        .isObject()
        .withMessage('La información nutricional debe ser un objeto válido')
];

// Validaciones para recomendaciones
const validateUpdatePreferences = [
    body('preferences')
        .notEmpty()
        .withMessage('Las preferencias son requeridas')
        .isObject()
        .withMessage('Las preferencias deben ser un objeto válido'),

    body('preferences.favorite_cuisines')
        .optional()
        .isArray()
        .withMessage('Los tipos de cocina favoritos deben ser un array'),

    body('preferences.preferred_price_ranges')
        .optional()
        .isArray()
        .withMessage('Los rangos de precio preferidos deben ser un array'),

    body('preferences.preferred_cities')
        .optional()
        .isArray()
        .withMessage('Las ciudades preferidas deben ser un array'),

    body('preferences.dietary_restrictions')
        .optional()
        .isArray()
        .withMessage('Las restricciones dietéticas deben ser un array'),

    body('preferences.disliked_cuisines')
        .optional()
        .isArray()
        .withMessage('Los tipos de cocina no preferidos deben ser un array')
];

const validateRecommendationFeedback = [
    body('restaurant_id')
        .notEmpty()
        .withMessage('El ID del restaurante es requerido')
        .isInt({ min: 1 })
        .withMessage('El ID del restaurante debe ser un número entero positivo'),

    body('liked')
        .notEmpty()
        .withMessage('La valoración es requerida')
        .isBoolean()
        .withMessage('La valoración debe ser un valor booleano'),

    body('reason')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La razón no puede exceder 255 caracteres')
];

// Validaciones para parámetros de consulta comunes
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero mayor a 0'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un número entre 1 y 100')
];

const validateSearchQuery = [
    query('q')
        .notEmpty()
        .withMessage('El término de búsqueda es requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres')
];

const validateRatingRange = [
    query('min_rating')
        .optional()
        .isFloat({ min: 1, max: 5 })
        .withMessage('La calificación mínima debe ser un número entre 1 y 5'),

    query('max_rating')
        .optional()
        .isFloat({ min: 1, max: 5 })
        .withMessage('La calificación máxima debe ser un número entre 1 y 5')
];

const validatePriceRange = [
    query('min_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio mínimo debe ser un número mayor o igual a 0'),

    query('max_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio máximo debe ser un número mayor o igual a 0')
];

// Validaciones para parámetros de ID
const validateIdParam = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
];

const validateRestaurantIdParam = [
    param('restaurant_id')
        .isInt({ min: 1 })
        .withMessage('El ID del restaurante debe ser un número entero positivo')
];

const validateUserIdParam = [
    param('user_id')
        .isInt({ min: 1 })
        .withMessage('El ID del usuario debe ser un número entero positivo')
];

const validateCreateMenu = [
    body('restaurant_id')
        .isInt({ min: 1 })
        .withMessage('ID de restaurante debe ser un número entero positivo'),
    body('category')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('La categoría debe tener entre 2 y 100 caracteres'),
    body('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('El precio debe ser un número positivo'),
    body('is_available')
        .optional()
        .isBoolean()
        .withMessage('Disponibilidad debe ser true o false'),
    body('allergens')
        .optional()
        .isArray()
        .withMessage('Alérgenos debe ser un array'),
    body('nutritional_info')
        .optional()
        .isObject()
        .withMessage('Información nutricional debe ser un objeto')
];

const validateTicketPurchase = [
    body('restaurant_id')
        .isInt({ min: 1 })
        .withMessage('ID de restaurante debe ser un número entero positivo'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('El monto debe ser mayor a 0'),
    body('expires_at')
        .optional()
        .isISO8601()
        .withMessage('Fecha de expiración debe ser una fecha válida')
];

module.exports = {
    // Autenticación
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateChangePassword,
    validatePasswordReset,

    // Restaurantes
    validateCreateRestaurant,
    validateUpdateRestaurant,

    // Reseñas
    validateCreateReview,
    validateUpdateReview,

    // Menús
    validateCreateMenuItem,
    validateUpdateMenuItem,

    // Recomendaciones
    validateUpdatePreferences,
    validateRecommendationFeedback,

    // Consultas comunes
    validatePagination,
    validateSearchQuery,
    validateRatingRange,
    validatePriceRange,

    // Parámetros
    validateIdParam,
    validateRestaurantIdParam,
    validateUserIdParam,

    //Menu
    validateCreateMenu,

    //Ticket
    validateTicketPurchase
};