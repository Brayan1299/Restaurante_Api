const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');
const { validateCreateReview, validateUpdateReview } = require('../utils/validators');
const { handleValidationErrors } = require('../middleware/validation');

router.get('/', validatePagination, reviewController.getAll);
router.get('/my-reviews', authenticateToken, reviewController.getMyReviews);
router.get('/restaurant/:restaurant_id', validateIdParam('restaurant_id'), validatePagination, reviewController.getByRestaurant);
router.get('/user/:user_id', validateIdParam('user_id'), validatePagination, reviewController.getByUser);
router.get('/stats', reviewController.getStats);
router.get('/most-helpful', reviewController.getMostHelpful);
router.get('/:id', validateIdParam(), reviewController.getById);

router.use(authenticateToken);

router.get('/my-reviews', reviewController.getByUser);
router.get('/can-review/:restaurant_id', reviewController.canUserReview);
router.post('/', validateCreateReview, handleValidationErrors, reviewController.create);
router.put('/:id', validateUpdateReview, handleValidationErrors, reviewController.update);
router.delete('/:id', reviewController.delete);

module.exports = router;