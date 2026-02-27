// Use react-pdf's pdfjs instance to ensure version compatibility
import { pdfjs } from 'react-pdf';

// Configure worker from react-pdf's bundled version
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

console.log('[PDF Setup] Worker configured from react-pdf bundle');

export default pdfjs;

