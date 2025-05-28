const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { 
  validateRegister, 
  validateLogin, 
  validateUpdateProfile,
  validateChangePassword
} = require('../middlewares/validationMiddleware');

// Rutas de autenticación API
router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, validateUpdateProfile, AuthController.updateProfile);
router.put('/change-password', authenticateToken, validateChangePassword, AuthController.changePassword);
router.post('/refresh', authenticateToken, AuthController.refreshToken);
router.get('/verify', authenticateToken, AuthController.verifyToken);

module.exports = router;