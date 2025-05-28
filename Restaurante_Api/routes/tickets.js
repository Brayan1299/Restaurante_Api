const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');
const { validateTicketPurchase, validateId } = require('../middlewares/validationMiddleware');

// Rutas públicas
router.get('/:codigo/validate', TicketController.validar);

// Rutas que requieren autenticación
router.post('/comprar', 
  authenticateToken, 
  validateTicketPurchase, 
  TicketController.comprar
);

router.get('/mis-tickets', 
  authenticateToken, 
  TicketController.misTickets
);

router.post('/:codigo/usar', 
  authenticateToken, 
  requireRole(['admin', 'staff']), 
  TicketController.usar
);

router.get('/:id/qr', 
  authenticateToken, 
  validateId, 
  TicketController.generarQR
);

// Rutas administrativas
router.get('/admin/todos', 
  authenticateToken, 
  requireRole(['admin']), 
  TicketController.obtenerTodos
);

router.get('/admin/estadisticas', 
  authenticateToken, 
  requireRole(['admin']), 
  TicketController.obtenerEstadisticas
);

router.put('/:id/cancelar', 
  authenticateToken, 
  validateId, 
  TicketController.cancelar
);

module.exports = router;