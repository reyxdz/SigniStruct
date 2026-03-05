const express = require('express');
const router = express.Router();
const { searchUsers } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   GET /api/users/search
// @desc    Search users by email or name
// @access  Private
router.get('/search', verifyToken, searchUsers);

module.exports = router;
