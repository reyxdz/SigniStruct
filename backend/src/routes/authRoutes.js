const express = require('express');
const router = express.Router();
const { signup, signin, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes
router.get('/me', verifyToken, getMe);

module.exports = router;
