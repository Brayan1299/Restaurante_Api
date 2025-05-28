const express = require('express');
const router = express.Router();
const RestauranteController = require('../controllers/restauranteController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');
const { validateRestaurant, validateId, validateSearch } = require('../middlewares/validationMiddleware');

// Rutas públicas
router.get('/', RestauranteController.obtenerTodos);
router.get('/search', validateSearch, RestauranteController.buscar);
router.get('/categorias', RestauranteController.obtenerCategorias);
router.get('/cercanos', RestauranteController.obtenerCercanos);
router.get('/:id', validateId, RestauranteController.obtenerPorId);

// Rutas que requieren autenticación
router.post('/', 
  authenticateToken, 
  requireRole(['admin', 'restaurant_owner']), 
  validateRestaurant, 
  RestauranteController.crear
);

router.put('/:id', 
  authenticateToken, 
  requireRole(['admin', 'restaurant_owner']), 
  validateId, 
  validateRestaurant, 
  RestauranteController.actualizar
);

router.delete('/:id', 
  authenticateToken, 
  requireRole(['admin']), 
  validateId, 
  RestauranteController.eliminar
);

router.put('/:id/calificacion', 
  authenticateToken, 
  requireRole(['admin']), 
  validateId, 
  RestauranteController.actualizarCalificacion
);

module.exports = router;