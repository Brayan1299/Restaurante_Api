const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');
const { validateMenu, validateId } = require('../middlewares/validationMiddleware');

// Rutas públicas
router.get('/restaurante/:restauranteId', validateId, MenuController.obtenerPorRestaurante);
router.get('/:id', validateId, MenuController.obtenerPorId);

// Rutas que requieren autenticación
router.post('/', 
  authenticateToken, 
  requireRole(['admin', 'restaurant_owner']), 
  validateMenu, 
  MenuController.crear
);

router.put('/:id', 
  authenticateToken, 
  requireRole(['admin', 'restaurant_owner']), 
  validateId, 
  validateMenu, 
  MenuController.actualizar
);

router.delete('/:id', 
  authenticateToken, 
  requireRole(['admin', 'restaurant_owner']), 
  validateId, 
  MenuController.eliminar
);

// Búsqueda de elementos del menú
router.get('/restaurante/:restauranteId/buscar', 
  validateId, 
  MenuController.buscar
);

module.exports = router;