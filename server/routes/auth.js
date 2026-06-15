const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper to validate vehicle plate format (standard Indian format MH01AB1234)
 */
const validateVehicleNumber = (num) => {
  if (!num) return true; // Optional during signup
  const cleanNum = num.replace(/[^A-Z0-9]/ig, '').toUpperCase();
  const regex = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$|^[A-Z]{2}\d{2}\d{4}$/;
  return regex.test(cleanNum);
};

/**
 * POST /api/auth/register
 * Register a new user with production-level validations
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, address, pin_code, vehicle_number } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate PIN code
    if (pin_code && !/^\d{6}$/.test(pin_code)) {
      return res.status(400).json({ error: 'PIN Code must be a 6-digit number (e.g. 400001)' });
    }

    // Validate vehicle number
    const vNumber = vehicle_number ? vehicle_number.replace(/[^A-Z0-9]/ig, '').toUpperCase() : '';
    if (vehicle_number && !validateVehicleNumber(vNumber)) {
      return res.status(400).json({ error: 'Please enter a valid vehicle number (e.g. MH01AB1234)' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      hashedPassword,
      address: address || null,
      pinCode: pin_code || null,
      vehicleNumber: vNumber || null,
      role: 'USER',
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vehicle_number: user.vehicleNumber,
        pin_code: user.pinCode,
        address: user.address
      },
      access_token: token,
      refresh_token: token,
      token_type: 'bearer',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vehicle_number: user.vehicleNumber,
        pin_code: user.pinCode,
        address: user.address
      },
      access_token: token,
      refresh_token: token,
      token_type: 'bearer',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
