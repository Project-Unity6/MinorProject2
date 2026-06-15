# ParkHub - Smart Parking Management System

## Project Overview
**ParkHub** is a modern, full-stack, smart parking management web application designed to solve real-world urban parking issues. It provides users with a real-time visualization of parking slots in different lots, dynamic occupancy-based pricing, minute-level billing, and instant slot booking/reservations.

---

## Why We Need This Project (Problem & Solution)

### The Problem
1. **Inefficient Space Utilization**: Drivers spend significant time and fuel searching for open spots in cities, causing traffic congestion and excess carbon emissions.
2. **Static Pricing**: Traditional parking systems charge a flat fee regardless of demand, leading to underpriced prime slots during peak hours or empty garages during off-peak times.
3. **Lack of Real-time Visibility**: Drivers cannot see layout designs or spot occupancy rates before arriving, making reservations a guessing game.

### The Solution
- **Real-Time Visual Layout**: ParkHub visualizes parking slots dynamically (`AVAILABLE`, `OCCUPIED`, or `RESERVED`), helping users select exactly where they want to park.
- **Dynamic Pricing Engine**: Occupancy rates determine price multipliers in real-time.
  - **High Demand (Surge)**: >= 70% occupancy applies a **1.5x multiplier**, >= 85% occupancy applies a **1.8x multiplier** to manage demand.
  - **Low Demand (Discount)**: < 30% occupancy applies a **20% discount (0.8x multiplier)** to attract vehicles.
- **Micro-Billing**: Billing is calculated per minute of actual usage (minimum 1 minute), making parking fairer compared to systems that round up to the nearest hour.

---

## Technical Architecture

ParkHub uses a decoupled **MERN-like** architecture:
*   **Frontend**: React (Vite-powered), React Router, Axios for API calls, and premium glassmorphic vanilla CSS styles.
*   **Backend**: Node.js and Express.js REST API.
*   **Database**: MongoDB with Mongoose ODM.
*   **Authentication**: JSON Web Tokens (JWT) stored in LocalStorage, with auth middleware attaching current user objects to requests.

---

## Handling Concurrency: Simultaneous Bookings of the Same Slot

One of the most critical challenges in a reservation platform is the **Race Condition**: *What happens if two users simultaneously attempt to book the exact same slot?*

### The Concurrency Strategy
ParkHub handles simultaneous booking requests using **Atomic Database Locking** at the MongoDB level.

#### 1. How MongoDB Decides the Winner
- Rather than checking spot availability and then updating it in two separate database calls (which creates a race condition), we use MongoDB's atomic `findOneAndUpdate` operation.
- In `server/routes/bookings.js`:
  ```javascript
  spot = await ParkingSpot.findOneAndUpdate(
    { _id: spot_id, lotId: lot_id, status: 'AVAILABLE' },
    { status: targetStatus },
    { new: true }
  );
  ```
- **Atomicity**: MongoDB guarantees that document modifications are atomic at the single-document level. When two requests arrive at the database at the exact same millisecond:
  1. MongoDB processes the first command, matches the criteria (`status: 'AVAILABLE'`), updates it to `OCCUPIED` (or `RESERVED`), and locks the document.
  2. MongoDB processes the second command. However, the condition `status: 'AVAILABLE'` is no longer met because the first user already changed it.
  3. As a result, the second database query returns `null` instead of the spot.

#### 2. What Message Is Shown to the User?
- The winning user successfully secures the spot, a `Booking` log is created, and they proceed to the Active Booking screen.
- The losing user's request fails the `if (!spot)` check. The backend responds with a `400 Bad Request` and a clean error payload:
  ```json
  { "error": "This parking spot has already been booked by another user. Please select a different spot." }
  ```
- The React frontend catches this API error message and displays it in a red **Error Alert Banner** directly on the dashboard, prompting them to choose another slot.

#### 3. Database Rollback Protection
If the booking document creation fails *after* the spot status has been updated (for example, due to a validation constraint), the backend catch-block rolls back the slot state automatically:
```javascript
catch (bookingError) {
  // Rollback the spot status if booking document creation fails
  await ParkingSpot.findByIdAndUpdate(spot._id, {
    status: 'AVAILABLE',
    currentBookingId: null
  });
  throw bookingError;
}
```

---

## Core Database Models

### 1. Booking (`server/models/Booking.js`)
Tracks the lifecycle of a reservation. Uses a unique, sparse index on the transaction reference (`paymentUtr`) so multiple active bookings can omit it without duplicate key errors, while enforcing uniqueness once paid.

### 2. ParkingSpot (`server/models/ParkingSpot.js`)
Maintains the individual slots (e.g., `A-01`, `B-12`) and links their current state to an active booking ID.

### 3. ParkingLot (`server/models/ParkingLot.js`)
Tracks lot metadata (latitude, longitude, base hourly rates, and total spots).

### 4. User (`server/models/User.js`)
Manages registration, credentials, vehicle plates, and role-based permissions (`USER` vs `ADMIN`).
