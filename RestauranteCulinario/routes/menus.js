
const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateToken } = require('../middleware/auth');
const { validateCreateMenu } = require('../utils/validators');
const { handleValidationErrors } = require('../middleware/validation');

router.get('/', menuController.getAll);
router.get('/categories', menuController.getCategories);
router.get('/stats', menuController.getStats);
router.get('/restaurant/:restaurant_id', menuController.getByRestaurant);
router.get('/:id', menuController.getById);

router.use(authenticateToken);

router.post('/', validateCreateMenu, handleValidationErrors, menuController.create);
router.put('/:id', handleValidationErrors, menuController.update);
router.delete('/:id', menuController.delete);

module.exports = router;
