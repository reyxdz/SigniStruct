const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    console.log('🔐 Auth Middleware Check');
    console.log('  Authorization Header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('  Token Length:', token ? token.length : 0);

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded');
    console.log('  User ID in Token:', decoded.id);
    console.log('  Token Payload Keys:', Object.keys(decoded));

    req.user = { id: decoded.id };
    req.userId = decoded.id; // Keep for backward compatibility
    
    console.log('  req.user.id set to:', req.user.id);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken: authMiddleware };
