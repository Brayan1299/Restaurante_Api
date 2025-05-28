const express = require('express');
const router = express.Router();
const ResenaController = require('../controllers/resenaController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');
const { validateReview, validateId } = require('../middlewares/validationMiddleware');

// Rutas públicas
router.get('/restaurante/:restauranteId', validateId, ResenaController.obtenerPorRestaurante);
router.get('/recientes', ResenaController.obtenerRecientes);
router.get('/:id', validateId, ResenaController.obtenerPorId);

// Rutas que requieren autenticación
router.post('/', 
  authenticateToken, 
  validateReview, 
  ResenaController.crear
);

router.get('/mis-resenas', 
  authenticateToken, 
  ResenaController.obtenerMisResenas
);

router.put('/:id', 
  authenticateToken, 
  validateId, 
  validateReview, 
  ResenaController.actualizar
);

router.delete('/:id', 
  authenticateToken, 
  validateId, 
  ResenaController.eliminar
);

// Rutas administrativas
router.get('/admin/buscar', 
  authenticateToken, 
  requireRole(['admin']), 
  ResenaController.buscarConFiltros
);

router.put('/:id/verificar', 
  authenticateToken, 
  requireRole(['admin']), 
  validateId, 
  ResenaController.verificar
);

router.get('/estadisticas/:restauranteId', 
  validateId, 
  ResenaController.obtenerEstadisticas
);

module.exports = router;