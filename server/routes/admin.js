const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Booking = require('../models/Booking');

const router = express.Router();

/**
 * POST /api/admin/parking-lots
 * Create a new parking lot (Admin only)
 */
router.post('/parking-lots', requireAdmin, async (req, res) => {
  try {
    const { name, address, city, pin_code, latitude, longitude, total_spots, hourly_rate } = req.body;

    if (!name || !address || !city || !pin_code || !total_spots || !hourly_rate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!/^\d{6}$/.test(pin_code)) {
      return res.status(400).json({ error: 'PIN Code must be a 6-digit number (e.g. 400001)' });
    }

    // Create lot
    const lot = await ParkingLot.create({
      name,
      address,
      city,
      pinCode: pin_code,
      latitude: latitude || null,
      longitude: longitude || null,
      totalSpots: total_spots,
      hourlyRate: hourly_rate,
    });

    // Create spots
    const spots = [];
    for (let i = 1; i <= total_spots; i++) {
      const section = String.fromCharCode(65 + Math.floor((i - 1) / 50));
      const number = ((i - 1) % 50) + 1;
      const spotCode = `${section}-${String(number).padStart(2, '0')}`;

      spots.push({
        lotId: lot._id,
        spotCode,
        status: 'AVAILABLE',
      });
    }
    await ParkingSpot.insertMany(spots);

    res.status(201).json({
      id: lot._id,
      name: lot.name,
      address: lot.address,
      city: lot.city,
      pin_code: lot.pinCode,
      total_spots: lot.totalSpots,
      hourly_rate: lot.hourlyRate,
      is_active: lot.isActive,
      created_at: lot.createdAt,
      updated_at: lot.updatedAt,
    });
  } catch (error) {
    console.error('Create lot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/admin/parking-lots/:lotId
 * Update a parking lot (Admin only)
 */
router.put('/parking-lots/:lotId', requireAdmin, async (req, res) => {
  try {
    const { name, address, city, pin_code, hourly_rate } = req.body;

    if (pin_code && !/^\d{6}$/.test(pin_code)) {
      return res.status(400).json({ error: 'PIN Code must be a 6-digit number (e.g. 400001)' });
    }

    const lot = await ParkingLot.findById(req.params.lotId);
    if (!lot) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }

    lot.name = name || lot.name;
    lot.address = address || lot.address;
    lot.city = city || lot.city;
    lot.pinCode = pin_code || lot.pinCode;
    lot.hourlyRate = hourly_rate !== undefined ? hourly_rate : lot.hourlyRate;
    await lot.save();

    res.json({
      id: lot._id,
      name: lot.name,
      address: lot.address,
      city: lot.city,
      pin_code: lot.pinCode,
      total_spots: lot.totalSpots,
      hourly_rate: lot.hourlyRate,
      is_active: lot.isActive,
      created_at: lot.createdAt,
      updated_at: lot.updatedAt,
    });
  } catch (error) {
    console.error('Update lot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/analytics/overview
 * Get admin analytics overview
 */
router.get('/analytics/overview', requireAdmin, async (req, res) => {
  try {
    // Total bookings
    const totalBookings = await Booking.countDocuments();

    // Today's bookings
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: todayStart },
    });

    // Total revenue
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Today's revenue
    const todayRevenueResult = await Booking.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: todayStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalCost' } } },
    ]);
    const todayRevenue =
      todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;

    // Occupancy
    const totalSpots = await ParkingSpot.countDocuments();
    const occupiedSpots = await ParkingSpot.countDocuments({
      status: 'OCCUPIED',
    });
    const occupancyRate =
      totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 10000) / 100 : 0;

    // Active users (users with active bookings)
    const activeUsers = await Booking.distinct('userId', { status: 'ACTIVE' });

    res.json({
      total_bookings: {
        all_time: totalBookings,
        today: todayBookings,
      },
      total_revenue: {
        all_time: Math.round(totalRevenue * 100) / 100,
        today: Math.round(todayRevenue * 100) / 100,
      },
      occupancy_rate: {
        current: occupancyRate,
        by_lot: [],
      },
      active_users: activeUsers.length,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/analytics/reports
 * Get detailed analytics reports (real data from DB)
 */
router.get('/analytics/reports', requireAdmin, async (req, res) => {
  try {
    // Revenue by city — join bookings with lots
    const revenueByCity = await Booking.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $lookup: {
          from: 'parkinglots',
          localField: 'lotId',
          foreignField: '_id',
          as: 'lot',
        },
      },
      { $unwind: '$lot' },
      {
        $group: {
          _id: '$lot.city',
          total_revenue: { $sum: '$totalCost' },
          booking_count: { $sum: 1 },
        },
      },
      { $sort: { total_revenue: -1 } },
      { $limit: 10 },
    ]);

    // Bookings by hour-of-day
    const bookingsByHour = await Booking.aggregate([
      {
        $group: {
          _id: { $hour: '$startTime' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Bucket bookings into time ranges
    const hourBuckets = [
      { label: '06:00 - 10:00 (Morning Rush)', min: 6, max: 10, count: 0 },
      { label: '10:00 - 14:00 (Late Morning)', min: 10, max: 14, count: 0 },
      { label: '14:00 - 18:00 (Afternoon)', min: 14, max: 18, count: 0 },
      { label: '18:00 - 22:00 (Evening Peak)', min: 18, max: 22, count: 0 },
      { label: '22:00 - 06:00 (Overnight)', min: 22, max: 6, count: 0 },
    ];

    bookingsByHour.forEach((b) => {
      const hour = b._id;
      for (const bucket of hourBuckets) {
        if (bucket.min < bucket.max) {
          if (hour >= bucket.min && hour < bucket.max) {
            bucket.count += b.count;
            break;
          }
        } else {
          // Overnight wraps around (22-6)
          if (hour >= bucket.min || hour < bucket.max) {
            bucket.count += b.count;
            break;
          }
        }
      }
    });

    const totalBucketBookings = hourBuckets.reduce((s, b) => s + b.count, 0);
    const bookingTimeDistribution = hourBuckets.map((b) => ({
      time: b.label,
      count: b.count,
      share: totalBucketBookings > 0 ? Math.round((b.count / totalBucketBookings) * 100) : 0,
    }));

    // Top lots by revenue
    const topLots = await Booking.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $group: {
          _id: '$lotId',
          total_revenue: { $sum: '$totalCost' },
          booking_count: { $sum: 1 },
        },
      },
      { $sort: { total_revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'parkinglots',
          localField: '_id',
          foreignField: '_id',
          as: 'lot',
        },
      },
      { $unwind: '$lot' },
      {
        $project: {
          lot_name: '$lot.name',
          city: '$lot.city',
          total_revenue: 1,
          booking_count: 1,
        },
      },
    ]);

    // Per-lot occupancy breakdown
    const allLots = await ParkingLot.find({ isActive: true }).lean();
    const occupancyByLot = await Promise.all(
      allLots.map(async (lot) => {
        const occupied = await ParkingSpot.countDocuments({
          lotId: lot._id,
          status: { $in: ['OCCUPIED', 'RESERVED'] },
        });
        return {
          lot_name: lot.name,
          city: lot.city,
          total_spots: lot.totalSpots,
          occupied,
          occupancy_percent:
            lot.totalSpots > 0
              ? Math.round((occupied / lot.totalSpots) * 100)
              : 0,
        };
      })
    );

    res.json({
      revenue_by_city: revenueByCity.map((r) => ({
        city: r._id,
        total_revenue: Math.round(r.total_revenue * 100) / 100,
        booking_count: r.booking_count,
      })),
      booking_time_distribution: bookingTimeDistribution,
      top_lots: topLots.map((t) => ({
        lot_name: t.lot_name,
        city: t.city,
        total_revenue: Math.round(t.total_revenue * 100) / 100,
        booking_count: t.booking_count,
      })),
      occupancy_by_lot: occupancyByLot,
    });
  } catch (error) {
    console.error('Reports analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/bookings
 * Get all bookings (Admin only)
 */
router.get('/bookings', requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('lotId', 'name city')
      .populate('spotId', 'spotCode')
      .lean();

    const formattedBookings = bookings.map((b) => ({
      id: b._id,
      user_id: b.userId?._id || b.userId,
      user_name: b.userId?.name || 'Unknown User',
      user_email: b.userId?.email || 'N/A',
      lot_id: b.lotId?._id || b.lotId,
      lot_name: b.lotId?.name || 'N/A',
      lot_city: b.lotId?.city || 'N/A',
      spot_id: b.spotId?._id || b.spotId,
      spot_code: b.spotId?.spotCode || 'N/A',
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
    console.error('Get admin bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

