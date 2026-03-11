const User = require('../models/User');
const UserSignature = require('../models/UserSignature');
const RSAService = require('../services/rsaService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, password, confirmPassword } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !address || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Validate Philippine phone number
    const phoneRegex = /^(639|09)\d{9}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid Philippine phone number' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      address,
      password: hashedPassword,
    });

    await user.save();

    // ==================== NEW: Phase 8.2 - RSA Key Generation ====================
    console.log(`[AUTH] Generating RSA certificate for user ${user._id}...`);
    
    let certificateInfo = null;
    try {
      // Generate RSA key pair and create user certificate
      // Use password as encryption key for private key
      certificateInfo = await RSAService.createUserCertificate(
        user._id,
        password, // Encrypt private key with user's password
        {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        }
      );

      console.log(`[AUTH] RSA certificate created successfully: ${certificateInfo.certificate.certificate_id}`);
    } catch (certError) {
      console.error('[AUTH] Certificate generation error:', certError);
      console.error('[AUTH] User created but certificate generation failed - this should be retried');
      // Note: We still return success because user account is created
      // Certificate generation should be retried via a separate endpoint if needed
    }
    // ==================== END Phase 8.2 ====================

    // Generate token (include email for assigned documents query)
    const token = generateToken(user._id, user.email);

    const response = {
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
      }
    };

    // Include certificate info if generation was successful
    if (certificateInfo && certificateInfo.success) {
      response.certificate = {
        certificate_id: certificateInfo.certificate.certificate_id,
        fingerprint: certificateInfo.certificate.fingerprint_sha256,
        status: certificateInfo.certificate.status,
        valid_until: certificateInfo.certificate.not_after,
        message: 'RSA keys generated and stored securely'
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/signin
// @access  Public
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Sign-in attempt for email:', email);

    // Validation
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found for email:', email.toLowerCase());
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('User found:', user.email);

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log('Password check result:', isPasswordCorrect);
    
    if (!isPasswordCorrect) {
      console.log('Password mismatch for user:', user.email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('Login successful for user:', user.email);

    // Generate token (include email for assigned documents query)
    const token = generateToken(user._id, user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error fetching user' });
  }
};

// @desc    Search users by email or name
// @route   GET /api/users/search?q={query}
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q || '';

    if (!query.trim()) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Search by email, firstName, or lastName
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
      ],
    })
      .select('_id firstName lastName email phone')
      .limit(10); // Limit results to 10

    res.status(200).json({
      success: true,
      data: users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      })),
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error searching users' });
  }
};

// @desc    Get user profile with signature
// @route   GET /api/users/:userId/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Fetch user's default signature
    let signature = null;
    try {
      signature = await UserSignature.findOne({
        user_id: userId,
        is_default: true
      });
    } catch (err) {
      console.warn('Could not fetch signature for user:', userId, err.message);
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        signature: signature ? {
          _id: signature._id,
          signature_image: signature.signature_image,
          signature_type: signature.signature_type,
          is_default: signature.is_default,
          created_at: signature.created_at
        } : null
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching user profile'
    });
  }
};
