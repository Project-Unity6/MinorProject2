const express = require('express');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const { activateDueReservations } = require('../utils/reservationHelper');

const router = express.Router();

/**
 * GET /api/parking/search
 * Search for parking lots with dynamic pricing
 */
router.get('/search', async (req, res) => {
  try {
    await activateDueReservations();
    const { q, pin_code } = req.query;

    // Build filter
    const filter = { isActive: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { pinCode: { $regex: q, $options: 'i' } }
      ];
    }

    if (pin_code) {
      if (!/^\d{6}$/.test(pin_code)) {
        return res.status(400).json({ error: 'PIN Code must be a 6-digit number (e.g. 400001)' });
      }
      filter.pinCode = pin_code;
    }

    const lots = await ParkingLot.find(filter).lean();

    // Get availability for each lot and calculate dynamic pricing
    const lotsWithAvailability = await Promise.all(
      lots.map(async (lot) => {
        const spotCounts = await ParkingSpot.aggregate([
          { $match: { lotId: lot._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const counts = {};
        spotCounts.forEach((s) => {
          counts[s._id] = s.count;
        });

        const available = counts['AVAILABLE'] || 0;
        const occupied = counts['OCCUPIED'] || 0;
        const reserved = counts['RESERVED'] || 0;

        // Dynamic pricing based on occupancy
        const total = lot.totalSpots;
        let multiplier = 1.0;
        let occupancyPercent = 0;

        if (total > 0) {
          const occupancyRate = (occupied + reserved) / total;
          occupancyPercent = Math.round(occupancyRate * 1000) / 10;

          if (occupancyRate >= 0.85) multiplier = 1.8; // 80% surge
          else if (occupancyRate >= 0.70) multiplier = 1.5; // 50% surge
          else if (occupancyRate >= 0.50) multiplier = 1.2; // 20% surge
          else if (occupancyRate < 0.30) multiplier = 0.8; // 20% DISCOUNT for low occupancy!
          else multiplier = 1.0; // Standard base rate
        }

        return {
          id: lot._id,
          name: lot.name,
          address: lot.address,
          city: lot.city,
          pin_code: lot.pinCode,
          latitude: lot.latitude,
          longitude: lot.longitude,
          total_spots: lot.totalSpots,
          hourly_rate: lot.hourlyRate,
          is_active: lot.isActive,
          available_spots: available,
          occupied_spots: occupied,
          reserved_spots: reserved,
          base_rate: lot.hourlyRate,
          dynamic_rate: Math.round(lot.hourlyRate * multiplier * 100) / 100,
          price_multiplier: multiplier,
          occupancy_percent: occupancyPercent,
          created_at: lot.createdAt,
          updated_at: lot.updatedAt,
        };
      })
    );

    res.json(lotsWithAvailability);
  } catch (error) {
    console.error('Search parking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/parking/lots/:lotId/spots
 * Get parking spots for a lot
 */
router.get('/lots/:lotId/spots', async (req, res) => {
  try {
    await activateDueReservations();
    const spots = await ParkingSpot.find({ lotId: req.params.lotId }).lean();

    const formattedSpots = spots.map((spot) => ({
      id: spot._id,
      lot_id: spot.lotId,
      spot_code: spot.spotCode,
      status: spot.status,
      current_booking_id: spot.currentBookingId,
    }));

    res.json(formattedSpots);
  } catch (error) {
    console.error('Get spots error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
