/**
 * ParkHub Database Seeder
 * Seeds MongoDB with comprehensive demo data including:
 * - Users from the original MySQL database
 * - Extended parking lots across multiple cities
 * - Parking spots for each lot
 * - Sample completed bookings with realistic data
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const ParkingLot = require('./models/ParkingLot');
const ParkingSpot = require('./models/ParkingSpot');
const Booking = require('./models/Booking');

const connectDB = require('./config/db');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function seed() {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await ParkingLot.deleteMany({});
    await ParkingSpot.deleteMany({});
    await Booking.deleteMany({});

    // ==========================================
    // USERS (from original MySQL seed + extras)
    // ==========================================
    console.log('👤 Creating users...');

    const adminPassword = await hashPassword('admin123456');
    const userPassword = await hashPassword('password123');

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@parkhub.com',
        hashedPassword: adminPassword,
        role: 'ADMIN',
        isActive: true,
      },
      {
        name: 'Rahul Sharma',
        email: 'user1@parkhub.com',
        hashedPassword: userPassword,
        address: '123 Main St, Mumbai',
        pinCode: '400001',
        vehicleNumber: 'MH01AB1234',
        role: 'USER',
      },
      {
        name: 'Priya Patel',
        email: 'user2@parkhub.com',
        hashedPassword: userPassword,
        address: '456 Park Ave, Mumbai',
        pinCode: '400002',
        vehicleNumber: 'MH02CD5678',
        role: 'USER',
      },
      {
        name: 'Amit Desai',
        email: 'user3@parkhub.com',
        hashedPassword: userPassword,
        address: '789 Lake Road, Pune',
        pinCode: '411001',
        vehicleNumber: 'MH12EF9012',
        role: 'USER',
      },
      {
        name: 'Sneha Kulkarni',
        email: 'user4@parkhub.com',
        hashedPassword: userPassword,
        address: '321 Hill Street, Bangalore',
        pinCode: '560001',
        vehicleNumber: 'KA01GH3456',
        role: 'USER',
      },
      {
        name: 'Vikram Singh',
        email: 'user5@parkhub.com',
        hashedPassword: userPassword,
        address: '654 Ring Road, Delhi',
        pinCode: '110001',
        vehicleNumber: 'DL01IJ7890',
        role: 'USER',
      },
    ]);

    console.log(`   ✅ Created ${users.length} users`);

    // ==========================================
    // PARKING LOTS (original 4 + 6 new ones)
    // ==========================================
    console.log('🅿️  Creating parking lots...');

    const parkingLotsData = [
      // Original MySQL lots
      {
        name: 'Downtown Plaza Parking',
        address: '123 MG Road, Fort',
        city: 'Mumbai',
        pinCode: '400001',
        latitude: 18.9388,
        longitude: 72.8354,
        totalSpots: 50,
        hourlyRate: 50.0,
      },
      {
        name: 'Bandra West Parking Hub',
        address: '456 Linking Road, Bandra West',
        city: 'Mumbai',
        pinCode: '400050',
        latitude: 19.0596,
        longitude: 72.8295,
        totalSpots: 75,
        hourlyRate: 60.0,
      },
      {
        name: 'Andheri Station Parking',
        address: '789 SV Road, Andheri East',
        city: 'Mumbai',
        pinCode: '400069',
        latitude: 19.1136,
        longitude: 72.8697,
        totalSpots: 100,
        hourlyRate: 40.0,
      },
      {
        name: 'Powai Tech Park Parking',
        address: '321 Hiranandani Gardens, Powai',
        city: 'Mumbai',
        pinCode: '400076',
        latitude: 19.1197,
        longitude: 72.9073,
        totalSpots: 120,
        hourlyRate: 45.0,
      },
      // New lots for variety
      {
        name: 'Marine Drive Premium Parking',
        address: '88 Netaji Subhash Road, Marine Lines',
        city: 'Mumbai',
        pinCode: '400002',
        latitude: 18.9432,
        longitude: 72.8235,
        totalSpots: 40,
        hourlyRate: 80.0,
      },
      {
        name: 'Phoenix Mall Parking',
        address: 'Senapati Bapat Marg, Lower Parel',
        city: 'Mumbai',
        pinCode: '400013',
        latitude: 18.9928,
        longitude: 72.8282,
        totalSpots: 200,
        hourlyRate: 70.0,
      },
      {
        name: 'Koregaon Park Smart Parking',
        address: '15 North Main Road, Koregaon Park',
        city: 'Pune',
        pinCode: '411001',
        latitude: 18.5362,
        longitude: 73.8931,
        totalSpots: 60,
        hourlyRate: 35.0,
      },
      {
        name: 'Hinjewadi IT Park Parking',
        address: 'Rajiv Gandhi Infotech Park, Phase 1',
        city: 'Pune',
        pinCode: '411057',
        latitude: 18.5912,
        longitude: 73.7380,
        totalSpots: 150,
        hourlyRate: 30.0,
      },
      {
        name: 'MG Road Metro Parking',
        address: 'MG Road, Near Trinity Circle',
        city: 'Bangalore',
        pinCode: '560001',
        latitude: 12.9753,
        longitude: 77.6067,
        totalSpots: 80,
        hourlyRate: 55.0,
      },
      {
        name: 'Connaught Place Underground Parking',
        address: 'Block A, Connaught Place',
        city: 'Delhi',
        pinCode: '110001',
        latitude: 28.6315,
        longitude: 77.2167,
        totalSpots: 90,
        hourlyRate: 65.0,
      },
    ];

    const parkingLots = await ParkingLot.insertMany(parkingLotsData);
    console.log(`   ✅ Created ${parkingLots.length} parking lots`);

    // ==========================================
    // PARKING SPOTS (for each lot)
    // ==========================================
    console.log('🔲 Creating parking spots...');

    let totalSpotsCreated = 0;
    for (const lot of parkingLots) {
      const spots = [];
      for (let i = 1; i <= lot.totalSpots; i++) {
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
      totalSpotsCreated += spots.length;
      console.log(`   📌 ${lot.name}: ${spots.length} spots`);
    }
    console.log(`   ✅ Created ${totalSpotsCreated} total spots`);

    // ==========================================
    // SIMULATE SOME OCCUPANCY
    // ==========================================
    console.log('🚗 Simulating parking occupancy...');

    // Occupy some spots in each lot to make the data realistic
    const occupancyRates = [0.6, 0.45, 0.3, 0.7, 0.85, 0.55, 0.4, 0.25, 0.5, 0.65];

    for (let i = 0; i < parkingLots.length; i++) {
      const lot = parkingLots[i];
      const targetOccupancy = occupancyRates[i];
      const spotsToOccupy = Math.floor(lot.totalSpots * targetOccupancy);

      if (spotsToOccupy > 0) {
        const availableSpots = await ParkingSpot.find({
          lotId: lot._id,
          status: 'AVAILABLE',
        }).limit(spotsToOccupy);

        for (const spot of availableSpots) {
          // Pick a random user (not admin)
          const randomUser = users[Math.floor(Math.random() * (users.length - 1)) + 1];

          // Create an active booking
          const hoursAgo = Math.floor(Math.random() * 5) + 1;
          const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

          const booking = await Booking.create({
            userId: randomUser._id,
            lotId: lot._id,
            spotId: spot._id,
            vehicleNumber: randomUser.vehicleNumber || 'MH01XX' + Math.floor(Math.random() * 9000 + 1000),
            bookedHourlyRate: lot.hourlyRate,
            startTime,
            status: 'ACTIVE',
          });

          spot.status = 'OCCUPIED';
          spot.currentBookingId = booking._id;
          await spot.save();
        }

        console.log(`   🚙 ${lot.name}: ${spotsToOccupy} spots occupied (${Math.round(targetOccupancy * 100)}%)`);
      }
    }

    // ==========================================
    // HISTORICAL BOOKINGS (completed)
    // ==========================================
    console.log('📜 Creating booking history...');

    const regularUsers = users.filter((u) => u.role === 'USER');
    let completedCount = 0;

    for (const user of regularUsers) {
      // Each user gets 3-8 completed bookings in the past
      const numBookings = Math.floor(Math.random() * 6) + 3;

      for (let i = 0; i < numBookings; i++) {
        const randomLot = parkingLots[Math.floor(Math.random() * parkingLots.length)];
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const hoursParked = Math.random() * 4 + 0.5; // 0.5 to 4.5 hours
        const durationMinutes = Math.round(hoursParked * 60);
        const totalCost = Math.round(randomLot.hourlyRate * hoursParked * 100) / 100;

        const startTime = new Date(
          Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000
        );
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        await Booking.create({
          userId: user._id,
          lotId: randomLot._id,
          spotId: (await ParkingSpot.findOne({ lotId: randomLot._id }))._id,
          vehicleNumber: user.vehicleNumber || 'MH01XX' + Math.floor(Math.random() * 9000 + 1000),
          bookedHourlyRate: randomLot.hourlyRate,
          startTime,
          endTime,
          durationMinutes,
          totalCost,
          status: 'COMPLETED',
        });

        completedCount++;
      }
    }

    console.log(`   ✅ Created ${completedCount} completed bookings`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ Database seeded successfully!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   👤 Users: ${users.length}`);
    console.log(`   🅿️  Parking Lots: ${parkingLots.length}`);
    console.log(`   🔲 Total Spots: ${totalSpotsCreated}`);
    console.log(`   📜 Completed Bookings: ${completedCount}`);
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   Admin: admin@parkhub.com / admin123456');
    console.log('   User:  user1@parkhub.com / password123');
    console.log('   User:  user2@parkhub.com / password123');
    console.log('   User:  user3@parkhub.com / password123');
    console.log('   User:  user4@parkhub.com / password123');
    console.log('   User:  user5@parkhub.com / password123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
