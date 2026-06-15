const Booking = require('../models/Booking');
const ParkingSpot = require('../models/ParkingSpot');

/**
 * Checks all active bookings that have a start time in the past
 * and updates their corresponding parking spot status from RESERVED to OCCUPIED.
 */
const activateDueReservations = async () => {
  try {
    const now = new Date();
    // Find all active bookings with start time in the past
    const bookingsToActivate = await Booking.find({
      status: 'ACTIVE',
      startTime: { $lte: now }
    });

    if (bookingsToActivate.length === 0) return;

    const spotIdsToUpdate = bookingsToActivate.map(b => b.spotId);
    
    // Update all matching RESERVED spots to OCCUPIED
    await ParkingSpot.updateMany(
      {
        _id: { $in: spotIdsToUpdate },
        status: 'RESERVED'
      },
      {
        status: 'OCCUPIED'
      }
    );
  } catch (error) {
    console.error('Error in activateDueReservations helper:', error);
  }
};

module.exports = {
  activateDueReservations
};
