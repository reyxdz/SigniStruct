// PDF.js configuration module
// This ensures the worker is configured globally and available to all PDF components
import * as pdfjs from 'pdfjs-dist';

// Set the worker source - this MUST be done before any PDF loading
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.js`;

console.log('[PDF Config] Worker source set to:', pdfjs.GlobalWorkerOptions.workerSrc);

export default pdfjs;
