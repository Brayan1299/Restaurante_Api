const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Middleware de autenticación para todas las rutas de tickets
router.use(authenticateToken);

// Validaciones
const purchaseValidation = [
    body('restaurant_id')
        .isInt({ min: 1 })
        .withMessage('ID de restaurante debe ser un número entero positivo'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('El monto debe ser un número decimal mayor a 0'),
    handleValidationErrors
];

const ticketCodeValidation = [
    param('ticket_code')
        .notEmpty()
        .withMessage('Código de ticket es requerido'),
    handleValidationErrors
];

const statusUpdateValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID debe ser un número entero positivo'),
    body('status')
        .isIn(['pending', 'paid', 'cancelled', 'used'])
        .withMessage('Estado debe ser: pending, paid, cancelled o used'),
    handleValidationErrors
];

// Rutas públicas (solo necesitan autenticación)

// Comprar ticket
router.post('/purchase', purchaseValidation, ticketController.purchase);

// Obtener mis tickets
router.get('/my-tickets', ticketController.getMyTickets);

// Verificar ticket por código QR
router.get('/verify/:ticket_code', ticketCodeValidation, ticketController.verifyTicket);

// Webhook de Mercado Pago (sin autenticación)
router.post('/webhook', ticketController.webhook);

// Rutas administrativas (requieren permisos especiales)
// Nota: En una implementación completa, se agregaría middleware de verificación de rol admin

// Obtener estadísticas
router.get('/stats', ticketController.getStats);

// Obtener todos los tickets
router.get('/all', ticketController.getAll);

// Actualizar estado de ticket
router.put('/:id/status', statusUpdateValidation, ticketController.updateStatus);

module.exports = router;