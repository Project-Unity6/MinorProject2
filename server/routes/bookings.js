const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const ParkingSpot = require('../models/ParkingSpot');
const ParkingLot = require('../models/ParkingLot');
const User = require('../models/User');
const { activateDueReservations } = require('../utils/reservationHelper');

const router = express.Router();

/**
 * Helper to validate vehicle plate format (standard Indian format MH01AB1234)
 */
const validateVehicleNumber = (num) => {
  if (!num) return false;
  const cleanNum = num.replace(/[^A-Z0-9]/ig, '').toUpperCase();
  const regex = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$|^[A-Z]{2}\d{2}\d{4}$/;
  return regex.test(cleanNum);
};

/**
 * POST /api/bookings
 * Create a new booking
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { lot_id, spot_id, vehicle_number, start_time } = req.body;
    const user = req.user;

    if (!lot_id) {
      return res.status(400).json({ error: 'Lot ID is required' });
    }

    const vNumber = (vehicle_number || user.vehicleNumber || '').replace(/[^A-Z0-9]/ig, '').toUpperCase();
    if (!validateVehicleNumber(vNumber)) {
      return res.status(400).json({ error: 'Please enter a valid vehicle plate number (e.g. MH01AB1234)' });
    }

    // Fetch lot to calculate current dynamic pricing rate to lock it
    const lot = await ParkingLot.findById(lot_id);
    if (!lot) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }

    // Calculate dynamic pricing lock rate
    const total = lot.totalSpots;
    const occupied = await ParkingSpot.countDocuments({ lotId: lot._id, status: 'OCCUPIED' });
    const reserved = await ParkingSpot.countDocuments({ lotId: lot._id, status: 'RESERVED' });
    let multiplier = 1.0;
    if (total > 0) {
      const occupancyRate = (occupied + reserved) / total;
      if (occupancyRate >= 0.85) multiplier = 1.8;
      else if (occupancyRate >= 0.70) multiplier = 1.5;
      else if (occupancyRate >= 0.50) multiplier = 1.2;
      else if (occupancyRate < 0.30) multiplier = 0.8; // Low occupancy discount
      else multiplier = 1.0;
    }
    const lockedRate = Math.round(lot.hourlyRate * multiplier * 100) / 100;

    const parsedStartTime = start_time ? new Date(start_time) : new Date();
    const isFutureBooking = parsedStartTime > new Date(Date.now() + 60000); // Future booking threshold (1 minute tolerance)
    const targetStatus = isFutureBooking ? 'RESERVED' : 'OCCUPIED';

    // Find and occupy/reserve the spot atomically to prevent race conditions
    let spot;
    if (spot_id) {
      spot = await ParkingSpot.findOneAndUpdate(
        { _id: spot_id, lotId: lot_id, status: 'AVAILABLE' },
        { status: targetStatus },
        { new: true }
      );
    } else {
      spot = await ParkingSpot.findOneAndUpdate(
        { lotId: lot_id, status: 'AVAILABLE' },
        { status: targetStatus },
        { new: true }
      );
    }

    if (!spot) {
      return res.status(400).json({ error: 'This parking spot has already been booked by another user. Please select a different spot.' });
    }

    // Create booking
    let booking;
    try {
      booking = await Booking.create({
        userId: user._id,
        lotId: lot_id,
        spotId: spot._id,
        vehicleNumber: vNumber,
        bookedHourlyRate: lockedRate,
        startTime: parsedStartTime,
        status: 'ACTIVE',
      });

      // Update spot with the new booking ID
      spot.currentBookingId = booking._id;
      await spot.save();
    } catch (bookingError) {
      // Rollback the spot status if booking document creation fails
      await ParkingSpot.findByIdAndUpdate(spot._id, {
        status: 'AVAILABLE',
        currentBookingId: null
      });
      throw bookingError;
    }

    // Auto-save vehicle number to user profile if not already set
    if (!user.vehicleNumber) {
      await User.findByIdAndUpdate(user._id, { vehicleNumber: vNumber });
      req.user.vehicleNumber = vNumber;
    }

    res.status(201).json({
      id: booking._id,
      user_id: booking.userId,
      lot_id: booking.lotId,
      spot_id: booking.spotId,
      vehicle_number: booking.vehicleNumber,
      start_time: booking.startTime,
      end_time: booking.endTime,
      duration_minutes: booking.durationMinutes,
      total_cost: booking.totalCost,
      status: booking.status,
      created_at: booking.createdAt,
      updated_at: booking.updatedAt,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/bookings
 * Get user bookings
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    await activateDueReservations();
    const { status } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate('lotId', 'name address city hourlyRate')
      .populate('spotId', 'spotCode')
      .lean();

    const formattedBookings = bookings.map((b) => ({
      id: b._id,
      user_id: b.userId,
      lot_id: b.lotId?._id || b.lotId,
      lot_name: b.lotId?.name || null,
      lot_address: b.lotId?.address || null,
      lot_city: b.lotId?.city || null,
      spot_id: b.spotId?._id || b.spotId,
      spot_code: b.spotId?.spotCode || null,
      vehicle_number: b.vehicleNumber,
      bookedHourlyRate: b.bookedHourlyRate,
      start_time: b.startTime,
      end_time: b.endTime,
      duration_minutes: b.durationMinutes,
      total_cost: b.totalCost,
      status: b.status,
      payment_utr: b.paymentUtr || null,
      created_at: b.createdAt,
      updated_at: b.updatedAt,
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/bookings/:id/release
 * End/release a booking (calculates price using billable hours rounded up, min 1 hour)
 */
router.post('/:id/release', requireAuth, async (req, res) => {
  try {
    const { utr, paymentMethod } = req.body;
    
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'ACTIVE',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not active' });
    }

    // Calculate billable cost
    const endTime = new Date();
    const durationMinutes = Math.max(0, Math.floor((endTime - booking.startTime) / 1000 / 60));
    
    // Exact minute-based prorated billing, minimum 1 minute charge
    const billableMinutes = Math.max(1, durationMinutes);
    const totalCost = Math.round((billableMinutes / 60) * booking.bookedHourlyRate * 100) / 100;

    // Validate UPI Payment UTR
    if (paymentMethod === 'UPI' && totalCost > 0) {
      const cleanUtr = utr ? String(utr).trim() : '';
      if (!cleanUtr || !/^\d{12}$/.test(cleanUtr)) {
        return res.status(400).json({ error: 'Please enter a valid 12-digit UPI Transaction Ref (UTR) number.' });
      }

      // Check if this UTR has been used in another completed transaction
      const duplicateUtr = await Booking.findOne({ 
        paymentUtr: cleanUtr, 
        status: { $in: ['COMPLETED', 'CANCELLED'] } 
      });
      
      if (duplicateUtr) {
        return res.status(400).json({ error: 'This Transaction Ref (UTR) has already been submitted for another payment.' });
      }
      
      booking.paymentUtr = cleanUtr;
    }

    // Update booking
    booking.endTime = endTime;
    booking.durationMinutes = durationMinutes;
    booking.totalCost = totalCost;
    booking.status = 'COMPLETED';
    await booking.save();

    // Release spot back to AVAILABLE
    await ParkingSpot.findByIdAndUpdate(booking.spotId, {
      status: 'AVAILABLE',
      currentBookingId: null,
    });

    res.json({
      id: booking._id,
      user_id: booking.userId,
      lot_id: booking.lotId,
      spot_id: booking.spotId,
      vehicle_number: booking.vehicleNumber,
      start_time: booking.startTime,
      end_time: booking.endTime,
      duration_minutes: booking.durationMinutes,
      total_cost: booking.totalCost,
      status: booking.status,
      payment_utr: booking.paymentUtr,
      created_at: booking.createdAt,
      updated_at: booking.updatedAt,
    });
  } catch (error) {
    console.error('Release booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Cancel an active slot reservation
 * Free within 5 minutes, 20% of 1 hr rate penalty after 5 minutes
 */
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { utr, paymentMethod } = req.body;
    
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'ACTIVE',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Active booking not found' });
    }

    const endTime = new Date();
    const durationMinutes = Math.max(0, Math.floor((endTime - booking.startTime) / 1000 / 60));
    
    let cancellationFee = 0;
    if (durationMinutes > 5) {
      // 20% of 1 hour's rate penalty
      cancellationFee = Math.round(0.20 * booking.bookedHourlyRate * 100) / 100;
    }

    // Validate UPI Payment UTR
    if (paymentMethod === 'UPI' && cancellationFee > 0) {
      const cleanUtr = utr ? String(utr).trim() : '';
      if (!cleanUtr || !/^\d{12}$/.test(cleanUtr)) {
        return res.status(400).json({ error: 'Please enter a valid 12-digit UPI Transaction Ref (UTR) number.' });
      }

      // Check if this UTR has been used in another completed transaction
      const duplicateUtr = await Booking.findOne({ 
        paymentUtr: cleanUtr, 
        status: { $in: ['COMPLETED', 'CANCELLED'] } 
      });
      
      if (duplicateUtr) {
        return res.status(400).json({ error: 'This Transaction Ref (UTR) has already been submitted for another payment.' });
      }
      
      booking.paymentUtr = cleanUtr;
    }

    // Cancel booking transaction
    booking.endTime = endTime;
    booking.durationMinutes = durationMinutes;
    booking.totalCost = cancellationFee;
    booking.status = 'CANCELLED';
    await booking.save();

    // Release slot back to AVAILABLE
    await ParkingSpot.findByIdAndUpdate(booking.spotId, {
      status: 'AVAILABLE',
      currentBookingId: null,
    });

    res.json({
      id: booking._id,
      user_id: booking.userId,
      lot_id: booking.lotId,
      spot_id: booking.spotId,
      vehicle_number: booking.vehicleNumber,
      start_time: booking.startTime,
      end_time: booking.endTime,
      duration_minutes: booking.durationMinutes,
      total_cost: booking.totalCost,
      status: booking.status,
      payment_utr: booking.paymentUtr,
      created_at: booking.createdAt,
      updated_at: booking.updatedAt,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
