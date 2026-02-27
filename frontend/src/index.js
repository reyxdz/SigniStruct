// MUST be the first import - sets up PDF.js worker before anything else loads
import './pdfWorkerSetup';

import React from 'react';
import ReactDOM from 'react-dom/client';
import * as pdfjsModule from 'pdfjs-dist';
import App from './App';
import './index.css';

// Double-check configuration
pdfjsModule.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.js`;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
