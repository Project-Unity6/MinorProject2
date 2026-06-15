const express = require('express');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Booking = require('../models/Booking');

const router = express.Router();

/**
 * Helper to validate vehicle plate format (standard Indian format MH01AB1234)
 */
const validateVehicleNumber = (num) => {
  if (!num) return true;
  const cleanNum = num.replace(/[^A-Z0-9]/ig, '').toUpperCase();
  const regex = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$|^[A-Z]{2}\d{2}\d{4}$/;
  return regex.test(cleanNum);
};

/**
 * GET /api/users/me
 * Get current user profile with stats
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    // Get booking stats
    const totalBookings = await Booking.countDocuments({ userId: user._id });
    const completedBookings = await Booking.find({
      userId: user._id,
      status: 'COMPLETED',
    });

    const totalHoursParked = completedBookings.reduce(
      (sum, b) => sum + (b.durationMinutes || 0) / 60,
      0
    );
    const totalAmountSpent = completedBookings.reduce(
      (sum, b) => sum + (b.totalCost || 0),
      0
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        pin_code: user.pinCode,
        vehicle_number: user.vehicleNumber,
        role: user.role,
      },
      stats: {
        total_bookings: totalBookings,
        total_hours_parked: Math.round(totalHoursParked * 10) / 10,
        total_amount_spent: Math.round(totalAmountSpent * 100) / 100,
        most_visited_lots: [],
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/users/me
 * Update current user profile with validations
 */
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, address, pin_code, vehicle_number } = req.body;
    const user = req.user;

    if (name) {
      if (name.trim().length === 0) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      user.name = name.trim();
    }

    if (address !== undefined) {
      user.address = address ? address.trim() : null;
    }

    if (pin_code !== undefined) {
      const pinStr = pin_code ? String(pin_code).trim() : '';
      if (pinStr && !/^\d{6}$/.test(pinStr)) {
        return res.status(400).json({ error: 'PIN Code must be a 6-digit number (e.g. 400001)' });
      }
      user.pinCode = pinStr || null;
    }

    if (vehicle_number !== undefined) {
      const vStr = vehicle_number ? String(vehicle_number).trim() : '';
      const cleanVehicle = vStr.replace(/[^A-Z0-9]/ig, '').toUpperCase();
      if (vStr && !validateVehicleNumber(cleanVehicle)) {
        return res.status(400).json({ error: 'Please enter a valid vehicle number (e.g. MH01AB1234)' });
      }
      user.vehicleNumber = cleanVehicle || null;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        pin_code: user.pinCode,
        vehicle_number: user.vehicleNumber,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
