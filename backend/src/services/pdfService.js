const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const { PDFDocument, rgb } = require('pdf-lib');

/**
 * PDF Service
 * Handles PDF operations: validation, hashing, and signature addition
 */

class PDFService {
  /**
   * Validate if file is a valid PDF
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<boolean>} True if valid PDF
   */
  static async validatePDF(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(fileBuffer);
      
      // Basic validation
      return pdfData.numpages > 0;
    } catch (error) {
      console.error('PDF validation error:', error.message);
      return false;
    }
  }

  /**
   * Generate SHA-256 hash of PDF file
   * @param {string} filePath - Path to the PDF file
   * @returns {string} SHA-256 hash of the file
   */
  static generatePDFHash(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`PDF hash generation failed: ${error.message}`);
    }
  }

  /**
   * Get PDF metadata
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<Object>} PDF metadata
   */
  static async getPDFMetadata(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(fileBuffer);
      
      return {
        numPages: pdfData.numpages,
        title: pdfData.info?.Title || 'Untitled',
        author: pdfData.info?.Author || 'Unknown',
        creationDate: pdfData.info?.CreationDate || new Date(),
        fileSize: fileBuffer.length,
        hash: this.generatePDFHash(filePath)
      };
    } catch (error) {
      throw new Error(`PDF metadata extraction failed: ${error.message}`);
    }
  }

  /**
   * Add signature to PDF
   * Adds a visual representation of the signature to the document
   * @param {string} inputPath - Path to input PDF
   * @param {string} outputPath - Path to save signed PDF
   * @param {Object} signatureData - Signature placement and data
   *   - signatureImage: Base64 encoded signature image
   *   - x, y: Coordinates on the page
   *   - width, height: Dimensions of signature
   *   - page: Page number (0-based)
   *   - signerName: Name of signer
   *   - timestamp: Timestamp of signature
   * @returns {Promise<Object>} Object with success status and file hash
   */
  static async addSignatureToPDF(inputPath, outputPath, signatureData) {
    try {
      // Read the input PDF
      const inputBuffer = fs.readFileSync(inputPath);
      const pdfDoc = await PDFDocument.load(inputBuffer);

      const {
        signatureImage,
        x = 50,
        y = 50,
        width = 150,
        height = 50,
        page = 0,
        signerName = 'Unknown Signer',
        timestamp = new Date()
      } = signatureData;

      // Get the specified page
      const pages = pdfDoc.getPages();
      if (page >= pages.length) {
        throw new Error(`Page ${page} does not exist in PDF`);
      }

      const targetPage = pages[page];
      const { height: pageHeight } = targetPage.getSize();

      // Convert signature image if it's base64
      let signatureBytes;
      if (typeof signatureImage === 'string' && signatureImage.startsWith('data:')) {
        // Data URL format
        const base64Data = signatureImage.split(',')[1];
        signatureBytes = Buffer.from(base64Data, 'base64');
      } else if (typeof signatureImage === 'string') {
        // Base64 string
        signatureBytes = Buffer.from(signatureImage, 'base64');
      } else {
        // Buffer
        signatureBytes = signatureImage;
      }

      // Try to embed image (PNG/JPG)
      let signature;
      try {
        const imageType = this._detectImageType(signatureBytes);
        if (imageType === 'png') {
          signature = await pdfDoc.embedPng(signatureBytes);
        } else if (imageType === 'jpg') {
          signature = await pdfDoc.embedJpg(signatureBytes);
        } else {
          // Fallback: add signature as text
          targetPage.drawText(`Signed by: ${signerName}`, {
            x,
            y: pageHeight - y - 20,
            size: 12,
            color: rgb(0, 0, 0)
          });
          targetPage.drawText(`Date: ${new Date(timestamp).toLocaleString()}`, {
            x,
            y: pageHeight - y - 40,
            size: 10,
            color: rgb(0.5, 0.5, 0.5)
          });
        }
      } catch (err) {
        // Fallback: add signature as text if image embedding fails
        targetPage.drawText(`Signed by: ${signerName}`, {
          x,
          y: pageHeight - y - 20,
          size: 12,
          color: rgb(0, 0, 0)
        });
        targetPage.drawText(`Date: ${new Date(timestamp).toLocaleString()}`, {
          x,
          y: pageHeight - y - 40,
          size: 10,
          color: rgb(0.5, 0.5, 0.5)
        });
      }

      // Draw the signature image if successfully embedded
      if (signature) {
        targetPage.drawImage(signature, {
          x,
          y: pageHeight - y - height,
          width,
          height
        });
      }

      // Add signature metadata as text (for audit trail)
      targetPage.drawText(`Signature Hash: ${this._truncateHash(signatureData.signatureHash || '')}`, {
        x,
        y: pageHeight - y - height - 30,
        size: 8,
        color: rgb(0.7, 0.7, 0.7)
      });

      // Write the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, signedPdfBytes);

      return {
        success: true,
        outputPath,
        fileHash: crypto.createHash('sha256').update(signedPdfBytes).digest('hex'),
        numPages: pages.length,
        signedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to add signature to PDF: ${error.message}`);
    }
  }

  /**
   * Extract signature placement information from PDF
   * Used for verification and audit purposes
   * @param {string} filePath - Path to PDF
   * @returns {Promise<Array>} Array of pages with their dimensions
   */
  static async getPDFDimensions(filePath) {
    try {
      const inputBuffer = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(inputBuffer);
      const pages = pdfDoc.getPages();

      return pages.map((page, index) => {
        const { width, height } = page.getSize();
        return {
          pageNumber: index,
          width,
          height
        };
      });
    } catch (error) {
      throw new Error(`Failed to get PDF dimensions: ${error.message}`);
    }
  }

  /**
   * Merge multiple PDF documents
   * Useful for combining documents with signatures
   * @param {Array<string>} filePaths - Paths to PDF files to merge
   * @param {string} outputPath - Path to save merged PDF
   * @returns {Promise<Object>} Success status and file info
   */
  static async mergePDFs(filePaths, outputPath) {
    try {
      const mergedPdf = await PDFDocument.create();

      for (const filePath of filePaths) {
        const inputBuffer = fs.readFileSync(filePath);
        const sourcePdf = await PDFDocument.load(inputBuffer);
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        
        copiedPages.forEach(page => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfBytes = await mergedPdf.save();
      fs.writeFileSync(outputPath, mergedPdfBytes);

      return {
        success: true,
        outputPath,
        fileSize: mergedPdfBytes.length,
        numPages: mergedPdf.getPageCount(),
        hash: crypto.createHash('sha256').update(mergedPdfBytes).digest('hex')
      };
    } catch (error) {
      throw new Error(`PDF merge failed: ${error.message}`);
    }
  }

  /**
   * Validate PDF file extension and MIME type
   * @param {string} filename - Original filename
   * @param {string} mimeType - MIME type from upload
   * @returns {boolean} True if valid PDF file
   */
  static validatePDFFile(filename, mimeType) {
    const validExtensions = ['.pdf'];
    const validMimeTypes = ['application/pdf'];

    const ext = path.extname(filename).toLowerCase();
    const isValidExt = validExtensions.includes(ext);
    const isValidMime = validMimeTypes.includes(mimeType);

    return isValidExt && isValidMime;
  }

  /**
   * Helper: Detect image type from buffer
   * @private
   */
  static _detectImageType(buffer) {
    // PNG signature: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'png';
    }
    // JPEG signature: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'jpg';
    }
    return 'unknown';
  }

  /**
   * Helper: Truncate hash for display
   * @private
   */
  static _truncateHash(hash) {
    if (!hash) return 'N/A';
    return hash.substring(0, 16) + '...';
  }
}

module.exports = PDFService;
