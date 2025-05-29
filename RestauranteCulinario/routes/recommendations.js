
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/cuisine/:cuisine_type', recommendationController.getByCuisine);
router.get('/location/:city', recommendationController.getByLocation);
router.get('/trending', recommendationController.getTrending);
router.get('/price-range/:price_range', recommendationController.getByPriceRange);
router.get('/rating', recommendationController.getByRating);
router.get('/stats', recommendationController.getStats);
router.get('/similar/:restaurant_id', recommendationController.getSimilar);

router.use(authenticateToken);

router.get('/personalized', recommendationController.getPersonalized);
router.get('/collaborative', recommendationController.getCollaborative);
router.get('/mixed', recommendationController.getMixed);
router.put('/preferences', recommendationController.updatePreferences);
router.post('/feedback', recommendationController.saveFeedback);

module.exports = router;
