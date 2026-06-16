url->https://minorfrontend.netlify.app/

# 🚗 ParkHub - Smart Parking Management System (MERN Stack)

Welcome to the modernized **ParkHub** application. This project has been converted from a Flask/MySQL backend to a robust, high-performance, and visually stunning **MERN stack** (MongoDB, Express.js, React, Node.js) architecture.

The frontend is styled using a modern **cyberpunk glassmorphism design** with smooth hover effects, micro-animations, responsive layout support, and interactive visual spot selectors.

---

## 📁 Modernized Project Structure

```
ParkHub/
├── package.json              # Root workspace runner scripts
├── .gitignore                # Updated git ignore for environment configs & build dirs
├── README.md                 # Setup & configuration manual
├── server/                   # Express.js & MongoDB Backend
│   ├── package.json          # Server dependencies
│   ├── .env                  # Port, MongoDB connection URI, & JWT Secret key
│   ├── server.js             # Express application entry point
│   ├── config/
│   │   └── db.js             # Mongoose database connector helper
│   ├── models/               # Mongoose schemas (User, ParkingLot, ParkingSpot, Booking)
│   ├── middleware/
│   │   └── auth.js           # Multi-role JWT validation middleware
│   ├── routes/               # API endpoints
│   └── seed.js               # Database population script (loads sample and MySQL data)
├── client/                   # Vite & React Frontend
│   ├── package.json          # React dependencies
│   ├── vite.config.js        # Local proxy config for port forwarding
│   ├── index.html            # Core page mounting shell
│   └── src/
│       ├── main.jsx          # DOM rendering entry point
│       ├── App.jsx           # React Router and context wrapper config
│       ├── index.css         # Custom cyberpunk glassmorphic CSS design system
│       ├── context/
│       │   └── AuthContext.jsx # Global user session management context
│       ├── utils/
│       │   └── api.js        # Custom Axios helper with JWT interceptors
│       ├── components/
│       │   ├── Navbar.jsx    # Sticky navigation header
│       │   └── ProtectedRoute.jsx # User/Admin route guards & loader spinner
│       └── pages/            # View pages
│           ├── LandingPage.jsx  # Hero and sandbox credentials page
│           ├── LoginPage.jsx    # Glassmorphic user login page
│           ├── RegisterPage.jsx # Account registration page
│           ├── Dashboard.jsx    # Search, visual spot booking, active timers, invoice receipt
│           ├── AdminLoginPage.jsx # Administrative panel gatekeeper
│           └── AdminDashboard.jsx # Analytics, editable lots grid, lot creator form
└── backend/                  # (OLD Flask version - preserved)
```

---

## 🚀 Setup & Execution

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** local instance running on `mongodb://localhost:27017`

### 2. Install Dependencies
You can install dependencies across both `client/` and `server/` subfolders in a single command run from the root directory:
```bash
npm run install-all
```

### 3. Seed the Database
Populate your local MongoDB database with mock analytics history, registered users, and 10 parking lots spanning Mumbai, Pune, Bangalore, and Delhi:
```bash
npm run seed
```

### 4. Run Development Servers
Start both the Express.js API backend (port 5000) and Vite React app (port 5173) concurrently:
```bash
npm run dev
```
Open **http://localhost:5173** in your web browser.

---

## 🔑 Demo Sandbox Credentials

For testing and evaluation, the seed script prepares the following accounts:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **User** | `user1@parkhub.com` | `password123` | MH01AB1234, Mumbai |
| **User** | `user2@parkhub.com` | `password123` | MH02CD5678, Mumbai |
| **Admin** | `admin@parkhub.com` | `admin123456` | Operations access |

---

## ✨ Features

- **Dynamic Pricing Engine**: Hourly fees scale dynamically ($1.2x$ to $2.0x$) depending on the live occupancy percentage of the lot.
- **Interactive Layout Visualizer**: Review a real-time grid of all individual spots in a lot (Green: Available, Red: Occupied, Yellow: Reserved) and click to book.
- **Active Timers**: Track your current parking duration with live elapsed counters, and get a calculated receipt invoice upon checkout.
- **Admin Management Console**: Add new locations, update pricing parameters, review city-wide occupancy bar charts, and view cumulative booking revenue.
