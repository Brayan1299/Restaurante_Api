const express = require('express');
const router = express.Router();
const EventoController = require('../controllers/eventoController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');
const { validateEvent, validateId } = require('../middlewares/validationMiddleware');

// Rutas públicas
router.get('/', EventoController.obtenerTodos);
router.get('/:id', validateId, EventoController.obtenerPorId);
router.get('/restaurante/:restauranteId', validateId, EventoController.obtenerPorRestaurante);

// Rutas que requieren autenticación
router.post('/', 
  authenticateToken, 
  requireRole(['admin', 'restaurant_owner']), 
  validateEvent, 
  EventoController.crear
);

router.put('/:id', 
  authenticateToken, 
  requireRole(['admin', 'restaurant_owner']), 
  validateId, 
  validateEvent, 
  EventoController.actualizar
);

router.delete('/:id', 
  authenticateToken, 
  requireRole(['admin']), 
  validateId, 
  EventoController.eliminar
);

module.exports = router;