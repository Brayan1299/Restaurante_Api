
const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors, validateIdParam, validatePagination } = require('../middleware/validation');

const restaurantValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
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
    body('price_range')
        .isIn(['$', '$$', '$$$', '$$$$'])
        .withMessage('El rango de precio debe ser $, $$, $$$ o $$$$'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email inválido'),
    handleValidationErrors
];

router.get('/', validatePagination, restaurantController.getAll);
router.get('/search', restaurantController.search);
router.get('/stats', restaurantController.getStats);
router.get('/top-rated', restaurantController.getTopRated);
router.get('/cuisine-types', restaurantController.getCuisineTypes);
router.get('/cities', restaurantController.getCities);
router.get('/price/:price_range', validatePagination, restaurantController.getByPriceRange);
router.get('/:id', validateIdParam(), restaurantController.getById);

router.post('/', authenticateToken, restaurantValidation, restaurantController.create);
router.put('/:id', authenticateToken, validateIdParam(), restaurantController.update);
router.delete('/:id', authenticateToken, validateIdParam(), restaurantController.delete);

module.exports = router;
