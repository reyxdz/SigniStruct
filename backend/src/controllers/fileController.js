const { streamFromGridFS } = require('../utils/gridfs');
const mongoose = require('mongoose');
const Document = require('../models/Document');

class FileController {
  /**
   * Stream a file from GridFS to the client
   * GET /api/files/:fileId
   */
  static async serveFile(req, res) {
    try {
      const { fileId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return res.status(400).json({ error: 'Invalid file ID' });
      }

      // Find document to get original filename and type
      const document = await Document.findOne({ gridfs_file_id: fileId });
      
      const options = {};
      if (document) {
        options.filename = document.original_filename || 'document.pdf';
        options.contentType = document.file_type || 'application/pdf';
      }

      streamFromGridFS(fileId, res, options);
    } catch (error) {
      console.error('File serving error:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  }
}

module.exports = FileController;
