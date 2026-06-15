const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lot name is required'],
      trim: true,
      maxlength: 200,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: 100,
    },
    pinCode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    totalSpots: {
      type: Number,
      required: [true, 'Total spots is required'],
      min: 1,
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search
parkingLotSchema.index({ city: 1 });
parkingLotSchema.index({ pinCode: 1 });
parkingLotSchema.index({ name: 'text', city: 'text' });

module.exports = mongoose.model('ParkingLot', parkingLotSchema);
