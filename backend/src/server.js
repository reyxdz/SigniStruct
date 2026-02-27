const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const signatureRoutes = require('./routes/signatureRoutes');
const documentSigningRoutes = require('./routes/documentSigningRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const multiSignerRoutes = require('./routes/multiSignerRoutes');
const signingRequestRoutes = require('./routes/signingRequestRoutes');
const { initializeDatabaseSchema } = require('./utils/databaseInit');
const { initializeEmailServices, setupEmailBackgroundJobs } = require('./config/emailConfig');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/signistruct');
    console.log('MongoDB connected successfully');
    
    // Initialize database schema and create indexes
    await initializeDatabaseSchema();
    
    // Initialize email services
    await initializeEmailServices();
    
    // Setup background jobs for email reminders, expiration, and cleanup
    setupEmailBackgroundJobs();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/documents', documentSigningRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/multi-signer', multiSignerRoutes);
app.use('/api/signing-requests', signingRequestRoutes);

// Sample route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
