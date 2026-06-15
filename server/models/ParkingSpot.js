const mongoose = require('mongoose');

const parkingSpotSchema = new mongoose.Schema(
  {
    lotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
    },
    spotCode: {
      type: String,
      required: [true, 'Spot code is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'],
      default: 'AVAILABLE',
    },
    currentBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
parkingSpotSchema.index({ lotId: 1, status: 1 });
parkingSpotSchema.index({ lotId: 1, spotCode: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSpot', parkingSpotSchema);
