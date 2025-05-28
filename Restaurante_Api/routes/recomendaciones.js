const express = require('express');
const router = express.Router();
const RecomendacionController = require('../controllers/recomendacionController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Rutas que requieren autenticación
router.get('/personalizadas', 
  authenticateToken, 
  RecomendacionController.obtenerPersonalizadas
);

router.get('/populares', 
  RecomendacionController.obtenerPopulares
);

router.get('/cercanas', 
  authenticateToken, 
  RecomendacionController.obtenerCercanas
);

router.get('/similares/:restauranteId', 
  RecomendacionController.obtenerSimilares
);

module.exports = router;