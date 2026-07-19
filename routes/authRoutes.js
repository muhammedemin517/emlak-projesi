const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimit');

// Kayıt (Register)
router.get('/register', authController.getRegisterPage);
router.post('/register', authLimiter, authController.registerUser);

// Giriş (Login)
router.get('/login', authController.getLoginPage);
router.post('/login', authLimiter, authController.loginUser);

// Çıkış (Logout)
router.get('/logout', authController.logout);

module.exports = router;
