const express = require('express');
const FileController = require('../controllers/fileController');
const router = express.Router();

/**
 * GET /api/files/:fileId
 * Streams a file to the client directly from MongoDB GridFS
 */
router.get('/:fileId', FileController.serveFile);

module.exports = router;
