const express = require('express');
const router = express.Router();
const { searchUsers, getUserProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   GET /api/users/search
// @desc    Search users by email or name
// @access  Private
router.get('/search', verifyToken, searchUsers);

// @route   GET /api/users/:userId/profile
// @desc    Get user profile with signature
// @access  Private
router.get('/:userId/profile', verifyToken, getUserProfile);

module.exports = router;
