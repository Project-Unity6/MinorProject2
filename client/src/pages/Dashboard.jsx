import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Search, MapPin, Calendar, Clock, CreditCard, 
  Car, CircleDollarSign, CheckCircle, HelpCircle, AlertTriangle, XCircle, Info
} from 'lucide-react';

export const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Intercept successful payments state from redirection
  useEffect(() => {
    if (location.state && location.state.releasedBooking) {
      setReleasedBooking(location.state.releasedBooking);
      setShowInvoiceModal(true);
      // Clean up router state so refreshing doesn't launch the modal again
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState('find'); // 'find' | 'active' | 'history'
  
  // Search & Lots State
  const [searchQuery, setSearchQuery] = useState('');
  const [lots, setLots] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  
  // Spots visualizer state
  const [selectedLot, setSelectedLot] = useState(null);
  const [spots, setSpots] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicle_number || user?.vehicleNumber || '');
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  
  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'WALLET'
  const [upiApp, setUpiApp] = useState('GPAY'); // 'GPAY' | 'PHONEPE' | 'PAYTM'

  // End Parking Confirmation State
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [selectedBookingToEnd, setSelectedBookingToEnd] = useState(null);
  const [releasingSubmitting, setReleasingSubmitting] = useState(false);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState(null);
  const [cancellingSubmitting, setCancellingSubmitting] = useState(false);

  // Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    address: '',
    pinCode: '',
    vehicleNumber: ''
  });

  // Bookings State
  const [activeBookings, setActiveBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('ALL');
  
  // Invoice / Release State
  const [releasedBooking, setReleasedBooking] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Status Alerts
  const [alert, setAlert] = useState(null);

  // Fetch Lots by Query or City
  const fetchLots = async (query = '', city = '') => {
    setSearching(true);
    try {
      const q = query || city;
      const res = await api.get(`/api/parking/search`, {
        params: { q }
      });
      setLots(res.data);
    } catch (err) {
      console.error('Error searching lots:', err);
      showAlert('error', 'Failed to retrieve parking lots.');
    } finally {
      setSearching(false);
    }
  };

  // Fetch User Bookings
  const fetchBookings = async () => {
    try {
      // Active Bookings
      const resActive = await api.get('/api/bookings', { params: { status: 'ACTIVE' } });
      setActiveBookings(resActive.data);

      // Historical Bookings
      const resHistory = await api.get('/api/bookings');
      // Filter out Active from history display
      setBookingHistory(resHistory.data.filter(b => b.status !== 'ACTIVE'));
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  // Sync vehicle number when user details change (e.g. initial login)
  useEffect(() => {
    if (user) {
      setVehicleNumber(user.vehicle_number || user.vehicleNumber || '');
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchLots('', selectedCity);
    fetchBookings();
  }, [selectedCity]);

  // Show status banner helpers
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Handle Select Lot
  const handleSelectLot = async (lot) => {
    setSelectedLot(lot);
    setSelectedSpot(null);
    setStartTime(new Date().toISOString().slice(0, 16)); // default to now
    setLoadingSpots(true);
    try {
      const res = await api.get(`/api/parking/lots/${lot.id}/spots`);
      setSpots(res.data);
    } catch (err) {
      console.error('Error fetching spots:', err);
      showAlert('error', 'Failed to retrieve parking spots.');
    } finally {
      setLoadingSpots(false);
    }
  };

  // Open booking confirmation modal with regex check
  const handleInitiateBooking = () => {
    if (!selectedSpot) {
      showAlert('warning', 'Please select a parking spot code first.');
      return;
    }
    if (!vehicleNumber.trim()) {
      showAlert('warning', 'Please enter your vehicle plate number.');
      return;
    }
    
    // Clean and validate plate format MH01AB1234
    const cleanVehicle = vehicleNumber.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    const vehicleRegex = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$|^[A-Z]{2}\d{2}\d{4}$/;
    if (!vehicleRegex.test(cleanVehicle)) {
      showAlert('error', 'Invalid Vehicle Number format. Please use MH01AB1234 style.');
      return;
    }

    setVehicleNumber(cleanVehicle);
    setShowBookingModal(true);
  };

  // Confirm booking API request
  const handleConfirmBooking = async () => {
    setBookingSubmitting(true);
    try {
      await api.post('/api/bookings', {
        lot_id: selectedLot.id,
        spot_id: selectedSpot.id,
        vehicle_number: vehicleNumber,
        start_time: startTime
      });
      
      showAlert('success', 'Booking reserved successfully! Slot status updated.');
      setShowBookingModal(false);
      setSelectedLot(null);
      setSelectedSpot(null);
      
      // Refresh
      fetchBookings();
      fetchLots('', selectedCity);
      
      // Switch tab to active
      setActiveTab('active');
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.error || 'Failed to create booking.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Trigger Confirmation Modal for Ending Parking
  const initiateReleaseBooking = (booking) => {
    setSelectedBookingToEnd(booking);
    setShowEndConfirmModal(true);
  };

  // Confirm and Release booking
  const handleConfirmReleaseBooking = () => {
    setShowEndConfirmModal(false);
    
    // Calculate estimated minutes and cost to pass to payment gateway
    const elapsedMs = Date.now() - new Date(selectedBookingToEnd.start_time).getTime();
    const elapsedMins = Math.max(0, Math.floor(elapsedMs / 1000 / 60));
    const billableMinutes = Math.max(1, elapsedMins);
    const amount = Math.round((billableMinutes / 60) * (selectedBookingToEnd.bookedHourlyRate || 50) * 100) / 100;

    navigate(`/payment?bookingId=${selectedBookingToEnd.id}&amount=${amount}&isCancellation=false&method=UPI`);
    setSelectedBookingToEnd(null);
  };

  // Trigger Confirmation Modal for Cancellation
  const initiateCancelBooking = (booking) => {
    setSelectedBookingToCancel(booking);
    setShowCancelModal(true);
  };

  // Confirm and Cancel booking
  const handleConfirmCancelBooking = async () => {
    setShowCancelModal(false);
    
    // Calculate elapsed time
    const elapsedMs = Date.now() - new Date(selectedBookingToCancel.start_time).getTime();
    const elapsedMins = Math.max(0, Math.floor(elapsedMs / 1000 / 60));
    
    let cancellationFee = 0;
    if (elapsedMins > 5) {
      cancellationFee = Math.round(0.20 * selectedBookingToCancel.bookedHourlyRate * 100) / 100;
    }

    if (cancellationFee > 0) {
      // Fee applies -> Redirect to payment page
      navigate(`/payment?bookingId=${selectedBookingToCancel.id}&amount=${cancellationFee}&isCancellation=true&method=UPI`);
    } else {
      // Free cancellation -> Complete directly
      setCancellingSubmitting(true);
      try {
        const res = await api.post(`/api/bookings/${selectedBookingToCancel.id}/cancel`);
        setReleasedBooking(res.data);
        setShowInvoiceModal(true);
        fetchBookings();
        fetchLots('', selectedCity);
      } catch (err) {
        console.error(err);
        showAlert('error', 'Failed to cancel reservation.');
      } finally {
        setCancellingSubmitting(false);
      }
    }
    setSelectedBookingToCancel(null);
  };

  // Handle profile form submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    
    if (!profileForm.name.trim()) {
      setProfileError('Name is required.');
      return;
    }
    
    if (profileForm.pinCode && !/^\d{6}$/.test(profileForm.pinCode)) {
      setProfileError('PIN Code must be a 6-digit number (e.g. 400001).');
      return;
    }
    
    const cleanVehicle = profileForm.vehicleNumber ? profileForm.vehicleNumber.replace(/[^A-Z0-9]/ig, '').toUpperCase() : '';
    if (profileForm.vehicleNumber) {
      const vehicleRegex = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$|^[A-Z]{2}\d{2}\d{4}$/;
      if (!vehicleRegex.test(cleanVehicle)) {
        setProfileError('Please enter a valid vehicle number (e.g. MH01AB1234).');
        return;
      }
    }
    
    setProfileSubmitting(true);
    try {
      await updateProfile({
        name: profileForm.name,
        address: profileForm.address,
        pin_code: profileForm.pinCode,
        vehicle_number: cleanVehicle
      });
      showAlert('success', 'Profile updated successfully!');
      setShowProfileModal(false);
    } catch (err) {
      console.error(err);
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Calculate live duration helper
  const getDurationText = (startTime) => {
    const elapsedMs = Date.now() - new Date(startTime).getTime();
    const minutes = Math.max(0, Math.floor(elapsedMs / 1000 / 60));
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  // Helper to check if cancellation is free
  const isFreeCancellation = (startTime) => {
    const elapsedMs = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(elapsedMs / 1000 / 60);
    return minutes <= 5;
  };

  // Local state timer tick to force re-render for timers
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    let timer;
    if (activeTab === 'active' && activeBookings.length > 0) {
      timer = setInterval(() => setTicks(t => t + 1), 10000);
    }
    return () => clearInterval(timer);
  }, [activeTab, activeBookings]);

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* User Dashboard Header */}
      <div className="glass-panel" style={{
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Welcome, {user?.name}</h2>
            <button
              onClick={() => {
                setProfileForm({
                  name: user?.name || '',
                  address: user?.address || '',
                  pinCode: user?.pin_code || user?.pinCode || '',
                  vehicleNumber: user?.vehicle_number || user?.vehicleNumber || ''
                });
                setProfileError('');
                setShowProfileModal(true);
              }}
              className="btn-outline"
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              ✏️ Edit Profile
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
            Registered Vehicle: <strong style={{ color: 'var(--primary)' }}>{user?.vehicle_number || user?.vehicleNumber || 'Not specified'}</strong>
            {(user?.pin_code || user?.pinCode) && ` | PIN: ${user?.pin_code || user?.pinCode}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ACTIVE BOOKINGS</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>{activeBookings.length}</span>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>PAST RESERVATIONS</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary)' }}>{bookingHistory.length}</span>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {alert && (
        <div className={`custom-alert custom-alert-${alert.type === 'error' ? 'danger' : alert.type === 'warning' ? 'warning' : 'success'}`} style={{ marginBottom: '1.5rem' }}>
          {alert.type === 'error' ? <AlertTriangle size={18} /> : alert.type === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        gap: '1rem'
      }}>
        <button 
          onClick={() => { setActiveTab('find'); setSelectedLot(null); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '1rem 0.5rem',
            color: activeTab === 'find' ? 'white' : 'var(--text-muted)',
            fontWeight: activeTab === 'find' ? 700 : 500,
            fontSize: '1rem',
            borderBottom: activeTab === 'find' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          🔍 Find Parking
        </button>
        <button 
          onClick={() => { setActiveTab('active'); fetchBookings(); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '1rem 0.5rem',
            color: activeTab === 'active' ? 'white' : 'var(--text-muted)',
            fontWeight: activeTab === 'active' ? 700 : 500,
            fontSize: '1rem',
            borderBottom: activeTab === 'active' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          🚗 Active Bookings ({activeBookings.length})
        </button>
        <button 
          onClick={() => { setActiveTab('history'); fetchBookings(); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '1rem 0.5rem',
            color: activeTab === 'history' ? 'white' : 'var(--text-muted)',
            fontWeight: activeTab === 'history' ? 700 : 500,
            fontSize: '1rem',
            borderBottom: activeTab === 'history' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          📜 Booking History
        </button>
      </div>

      {/* TAB 1: FIND PARKING */}
      {activeTab === 'find' && (
        <div className="animate-fade-in">
          {/* Search bar & quick cities */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="Search parking lots by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.75rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.95rem'
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLots(searchQuery)}
                />
              </div>
              <button 
                onClick={() => fetchLots(searchQuery)}
                className="btn-premium"
                style={{ padding: '0.8rem 2rem' }}
              >
                Search
              </button>
            </div>

            {/* Quick selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Quick Cities:</span>
              {['Mumbai', 'Pune', 'Bangalore', 'Delhi'].map(city => (
                <button
                  key={city}
                  onClick={() => { setSelectedCity(city); setSearchQuery(''); }}
                  style={{
                    background: selectedCity === city ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                    color: 'white',
                    border: '1px solid',
                    borderColor: selectedCity === city ? 'transparent' : 'var(--border-color)',
                    padding: '0.35rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Lot visualizer OR List */}
          {selectedLot ? (
            /* VISUAL SPOT SELECTOR PANEL */
            <div className="glass-panel animate-slide-up" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <button 
                    onClick={() => setSelectedLot(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}
                  >
                    ← Back to Lots
                  </button>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedLot.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{selectedLot.address}, {selectedLot.city}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)' }}>
                    ₹{selectedLot.dynamic_rate}/hr
                  </div>
                  {selectedLot.price_multiplier > 1.0 ? (
                    <span className="badge badge-warning">
                      ⚡ Surge {selectedLot.price_multiplier}x
                    </span>
                  ) : selectedLot.price_multiplier < 1.0 ? (
                    <span className="badge badge-success">
                      🎁 Discount (20% Off)
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Spots Legend */}
              <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0 2rem 0', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'var(--success-glow)', border: '1px solid var(--success)' }} />
                  <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'var(--danger-glow)', border: '1px solid var(--danger)' }} />
                  <span>Occupied</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'var(--warning-glow)', border: '1px solid var(--warning)' }} />
                  <span>Reserved</span>
                </div>
              </div>

              {/* Spots Loading */}
              {loadingSpots ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <div style={{
                    width: '35px',
                    height: '35px',
                    border: '3px solid rgba(255, 255, 255, 0.1)',
                    borderTop: '3px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem auto'
                  }} />
                  <span style={{ color: 'var(--text-muted)' }}>Loading live spot layout...</span>
                </div>
              ) : (
                /* Grid of Spots */
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '2.5rem',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingRight: '0.5rem'
                  }}>
                    {spots.map(spot => {
                      const isAvailable = spot.status === 'AVAILABLE';
                      const isSelected = selectedSpot?.id === spot.id;
                      
                      let bg = 'var(--danger-glow)';
                      let border = 'rgba(239, 68, 68, 0.4)';
                      let color = 'var(--danger)';
                      let cursor = 'not-allowed';

                      if (spot.status === 'AVAILABLE') {
                        bg = isSelected ? 'var(--primary)' : 'var(--success-glow)';
                        border = isSelected ? 'white' : 'rgba(16, 185, 129, 0.4)';
                        color = isSelected ? 'white' : 'var(--success)';
                        cursor = 'pointer';
                      } else if (spot.status === 'RESERVED') {
                        bg = 'var(--warning-glow)';
                        border = 'rgba(245, 158, 11, 0.4)';
                        color = 'var(--warning)';
                      }

                      return (
                        <button
                          key={spot.id}
                          disabled={!isAvailable}
                          onClick={() => setSelectedSpot(spot)}
                          style={{
                            background: bg,
                            border: '1px solid',
                            borderColor: border,
                            color: color,
                            padding: '0.75rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: cursor,
                            textAlign: 'center',
                            transition: 'var(--transition-fast)',
                            boxShadow: isSelected ? '0 0 12px var(--primary-glow)' : 'none'
                          }}
                        >
                          {spot.spot_code}
                        </button>
                      );
                    })}
                  </div>

                  {/* Booking configuration */}
                  <div className="glass-panel" style={{
                    padding: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    background: 'rgba(255, 255, 255, 0.01)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>SELECTED SPOT</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                          {selectedSpot ? selectedSpot.spot_code : 'None'}
                        </span>
                      </div>
                      
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>VEHICLE NUMBER</span>
                        <input 
                          type="text"
                          className="input-glow"
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            fontSize: '0.92rem',
                            width: '140px',
                            border: '1px solid var(--border-color)',
                            textTransform: 'uppercase'
                          }}
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                          placeholder="MH01AB1234"
                        />
                      </div>

                      {/* Freedom to Choose Start Time */}
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>START TIME</span>
                        <input 
                          type="datetime-local"
                          className="input-glow"
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            fontSize: '0.92rem',
                            width: '190px',
                            border: '1px solid var(--border-color)',
                            color: 'white'
                          }}
                          value={startTime}
                          min={new Date().toISOString().slice(0, 16)}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleInitiateBooking}
                      disabled={!selectedSpot || !vehicleNumber}
                      className="btn-premium"
                      style={{ padding: '0.75rem 2rem' }}
                    >
                      Book Selected Slot
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PARKING LOTS SEARCH RESULTS LIST */
            <div>
              {searching ? (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTop: '4px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1.5rem auto'
                  }} />
                  <span style={{ color: 'var(--text-muted)' }}>Searching for parking sites...</span>
                </div>
              ) : lots.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <HelpCircle size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <p>No parking lots found matching your parameters.</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {lots.map(lot => {
                    const isHighOccupancy = lot.occupancy_percent >= 70;
                    const isDiscounted = lot.price_multiplier < 1.0;
                    
                    return (
                      <div 
                        key={lot.id} 
                        className="glass-panel animate-slide-up"
                        style={{
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          border: isHighOccupancy 
                            ? '1px solid rgba(245, 158, 11, 0.25)' 
                            : isDiscounted 
                              ? '1px solid rgba(16, 185, 129, 0.25)'
                              : '1px solid var(--border-color)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Occupancy Indicator stripe */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '4px',
                          background: isHighOccupancy 
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                            : isDiscounted 
                              ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : 'linear-gradient(90deg, #6366f1, #a855f7)'
                        }} />

                        <div>
                          <div style={{ display: 'flex', justify_content: 'space-between', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', maxWidth: '65%' }}>{lot.name}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                              <span className={`badge ${lot.available_spots > 0 ? 'badge-success' : 'badge-danger'}`}>
                                {lot.available_spots > 0 ? `${lot.available_spots} left` : 'Full'}
                              </span>
                              {isDiscounted && (
                                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                                  🎁 20% OFF
                                </span>
                              )}
                            </div>
                          </div>

                          <p style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            <MapPin size={12} color="var(--primary)" />
                            <span>{lot.address}, {lot.city}</span>
                          </p>

                          {/* Progress bar */}
                          <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                              <span>Occupancy Rate</span>
                              <span>{lot.occupancy_percent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${lot.occupancy_percent}%`,
                                height: '100%',
                                background: isHighOccupancy ? 'var(--warning)' : isDiscounted ? 'var(--success)' : 'var(--primary)',
                                borderRadius: '999px'
                              }} />
                            </div>
                          </div>
                        </div>

                        {/* Price & Selection */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '1rem',
                          marginTop: '0.5rem'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                              {lot.price_multiplier !== 1.0 && (
                                <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  ₹{lot.base_rate}
                                </span>
                              )}
                              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                                ₹{lot.dynamic_rate}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/hr</span>
                            </div>
                            {lot.price_multiplier > 1.0 ? (
                              <span style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 600, display: 'block' }}>
                                ⚡ Surge ({lot.price_multiplier}x)
                              </span>
                            ) : lot.price_multiplier < 1.0 ? (
                              <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, display: 'block' }}>
                                🎁 Low occupancy discount applied
                              </span>
                            ) : null}
                          </div>

                          <button
                            onClick={() => handleSelectLot(lot)}
                            disabled={lot.available_spots === 0}
                            className={lot.available_spots > 0 ? "btn-premium" : "btn-outline"}
                            style={{
                              padding: '0.45rem 1rem',
                              fontSize: '0.85rem',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            Select Lot
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE BOOKINGS */}
      {activeTab === 'active' && (
        <div className="animate-fade-in">
          {activeBookings.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Car size={45} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h4 style={{ fontSize: '1.2rem', color: 'white', fontWeight: 700, marginBottom: '0.5rem' }}>No Active Bookings</h4>
              <p style={{ maxWidth: '450px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                You do not have any vehicle currently parked. Switch to the 'Find Parking' tab to browse slots and make a booking.
              </p>
              <button 
                onClick={() => setActiveTab('find')} 
                className="btn-premium"
                style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
              >
                Find Parking Spot
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.5rem'
            }}>
              {activeBookings.map(booking => {
                const freeCancellation = isFreeCancellation(booking.start_time);

                return (
                  <div key={booking.id} className="glass-panel animate-slide-up" style={{
                    padding: '1.75rem',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '1.25rem',
                      right: '1.25rem'
                    }}>
                      <span className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>
                        🟢 Parked
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem', width: '70%' }}>{booking.lot_name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                      {booking.lot_address}, {booking.lot_city}
                    </p>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '1.25rem'
                    }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>SPOT CODE</span>
                        <strong style={{ fontSize: '1.1rem', color: 'white' }}>{booking.spot_code || 'Assigned'}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>VEHICLE PLATE</span>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{booking.vehicle_number}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>START TIME</span>
                        <span style={{ fontSize: '0.85rem' }}>{new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>DURATION</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                          {getDurationText(booking.start_time)}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '1.25rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-muted)'
                    }}>
                      <Info size={14} color="var(--primary)" />
                      <span>
                        Billing: prorated per minute of use. Minimum 1 minute charge.
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>LOCKED RATE</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>₹{booking.bookedHourlyRate || 50}/hr</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {/* Cancellation Feature */}
                        <button
                          onClick={() => initiateCancelBooking(booking)}
                          className="btn-outline"
                          style={{
                            padding: '0.5rem 0.85rem',
                            fontSize: '0.82rem',
                            color: '#f87171',
                            borderColor: 'rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.03)'
                          }}
                        >
                          Cancel
                        </button>
                        
                        <button
                          onClick={() => initiateReleaseBooking(booking)}
                          className="btn-danger-premium"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                        >
                          End & Pay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BOOKING HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem 2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Past Bookings Logs</h3>
            
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'COMPLETED', 'CANCELLED'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setHistoryFilter(filter)}
                  style={{
                    background: historyFilter === filter ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: historyFilter === filter ? 'var(--border-color-hover)' : 'var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: historyFilter === filter ? 'white' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '0.3rem 0.75rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {bookingHistory.filter(b => historyFilter === 'ALL' || b.status === historyFilter).length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={35} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <p>No historical records exist for this filter status.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Parking Location</th>
                    <th>Vehicle Plate</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingHistory
                    .filter(b => historyFilter === 'ALL' || b.status === historyFilter)
                    .map(b => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{b.lot_name || 'Downtown Parking'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.lot_address || 'Fort, Mumbai'}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.vehicle_number}</td>
                        <td>{new Date(b.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>{b.duration_minutes !== null ? `${b.duration_minutes} mins` : 'N/A'}</td>
                        <td style={{ fontWeight: 700 }}>₹{b.total_cost || 0}</td>
                        <td>
                          <span className={`badge ${b.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM BOOKING MODAL */}
      {showBookingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
          background: 'rgba(5, 7, 12, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel animate-slide-up" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '2rem',
            background: 'var(--bg-card)'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard color="var(--primary)" />
              <span>Checkout Reservation</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Verify slot details and select your payment method.
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-muted)' }}>Location:</strong> {selectedLot?.name}
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-muted)' }}>Reserved Spot:</strong> {selectedSpot?.spot_code}
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-muted)' }}>Vehicle Plate:</strong> {vehicleNumber}
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-muted)' }}>Start Time:</strong> {new Date(startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </p>

              {/* Pricing Breakdown */}
              <div style={{
                borderTop: '1px solid var(--border-color)',
                marginTop: '0.75rem',
                paddingTop: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Base Rate:</span>
                  <span>₹{selectedLot?.base_rate}/hr</span>
                </div>
                {selectedLot?.price_multiplier !== 1.0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {selectedLot?.price_multiplier > 1.0 ? '⚡ Surge' : '🎁 Discount'} ({selectedLot?.price_multiplier}x):
                    </span>
                    <span style={{ color: selectedLot?.price_multiplier > 1.0 ? 'var(--warning)' : 'var(--success)' }}>
                      {selectedLot?.price_multiplier > 1.0 ? '+' : '-'}₹{Math.abs(selectedLot?.dynamic_rate - selectedLot?.base_rate).toFixed(0)}/hr
                    </span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px dashed var(--border-color)',
                  paddingTop: '0.5rem',
                  marginTop: '0.35rem',
                  fontWeight: 700,
                  fontSize: '1.05rem'
                }}>
                  <span style={{ color: 'white' }}>Locked Rate:</span>
                  <span style={{ color: 'var(--accent)' }}>₹{selectedLot?.dynamic_rate}/hr</span>
                </div>
              </div>
            </div>

            {/* Payment Options (UPI options phonepe, gpay, paytm) */}
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                SELECT PAYMENT METHOD
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                {['UPI', 'CARD', 'WALLET'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: '0.65rem 0.5rem',
                      background: paymentMethod === method ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid',
                      borderColor: paymentMethod === method ? 'var(--primary)' : 'var(--border-color)',
                      color: paymentMethod === method ? 'white' : 'var(--text-muted)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* UPI Sub Apps Integrations */}
              {paymentMethod === 'UPI' && (
                <div className="animate-fade-in" style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    SELECT UPI PROVIDER
                  </span>
                  {[
                    { id: 'GPAY', label: 'Google Pay (GPay)' },
                    { id: 'PHONEPE', label: 'PhonePe' },
                    { id: 'PAYTM', label: 'Paytm' }
                  ].map(app => (
                    <label key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: upiApp === app.id ? 'white' : 'var(--text-muted)' }}>
                      <input 
                        type="radio" 
                        name="upiApp" 
                        value={app.id} 
                        checked={upiApp === app.id} 
                        onChange={() => setUpiApp(app.id)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>{app.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="btn-outline"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingSubmitting}
                className="btn-premium"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                {bookingSubmitting ? 'Confirming...' : 'Book & Park'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM END PARKING MODAL */}
      {showEndConfirmModal && selectedBookingToEnd && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
          background: 'rgba(5, 7, 12, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel animate-slide-up" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
              <AlertTriangle color="#ef4444" />
              <span>End Parking Session?</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Are you sure you want to end your parking session for location <strong>{selectedBookingToEnd.lot_name}</strong>?
            </p>

            {(() => {
              const elapsedMs = Date.now() - new Date(selectedBookingToEnd.start_time).getTime();
              const elapsedMins = Math.max(0, Math.floor(elapsedMs / 1000 / 60));
              const billableMinutes = Math.max(1, elapsedMins);
              const estCost = Math.round((billableMinutes / 60) * (selectedBookingToEnd.bookedHourlyRate || 50) * 100) / 100;
              
              let durationStr = `${elapsedMins} min`;
              if (elapsedMins >= 60) {
                const hrs = Math.floor(elapsedMins / 60);
                const mins = elapsedMins % 60;
                durationStr = `${hrs}h ${mins}m`;
              }

              return (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.5rem',
                  fontSize: '0.88rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Elapsed Duration:</span>
                    <span style={{ fontWeight: 600, color: 'white' }}>{durationStr}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Billable Units:</span>
                    <span style={{ fontWeight: 600, color: 'white' }}>{billableMinutes} {billableMinutes === 1 ? 'min' : 'mins'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Locked Rate:</span>
                    <span style={{ fontWeight: 600, color: 'white' }}>₹{selectedBookingToEnd.bookedHourlyRate || 50}/hr</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px dashed var(--border-color)',
                    paddingTop: '0.5rem',
                    marginTop: '0.5rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: 'var(--accent)'
                  }}>
                    <span>Estimated Cost:</span>
                    <span>₹{estCost}</span>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => { setShowEndConfirmModal(false); setSelectedBookingToEnd(null); }}
                className="btn-outline"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReleaseBooking}
                disabled={releasingSubmitting}
                className="btn-danger-premium"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                {releasingSubmitting ? 'Processing...' : 'End & Release'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CANCELLATION MODAL */}
      {showCancelModal && selectedBookingToCancel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
          background: 'rgba(5, 7, 12, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel animate-slide-up" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
              <XCircle color="#ef4444" />
              <span>Cancel Reservation?</span>
            </h3>
            
            {isFreeCancellation(selectedBookingToCancel.start_time) ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                <p>You are canceling this slot within the <strong>5-minute grace period</strong>.</p>
                <div style={{
                  background: 'var(--success-glow)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#a7f3d0',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '0.75rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  ✅ FREE CANCELLATION APPLIED
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                <p>You have exceeded the <strong>5-minute free cancellation threshold</strong> since reservation start time.</p>
                <div style={{
                  background: 'var(--danger-glow)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '0.75rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  ⚠️ 20% CANCELLATION FEE APPLIED
                  <br />
                  Fee: ₹{Math.round(0.20 * selectedBookingToCancel.bookedHourlyRate * 100) / 100}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => { setShowCancelModal(false); setSelectedBookingToCancel(null); }}
                className="btn-outline"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                No, Keep Booked
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelBooking}
                disabled={cancellingSubmitting}
                className="btn-danger-premium"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                {cancellingSubmitting ? 'Canceling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED INVOICE / RECEIPT MODAL */}
      {showInvoiceModal && releasedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
          background: 'rgba(5, 7, 12, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel animate-slide-up" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '2.5rem 2rem',
            background: 'var(--bg-card)',
            border: releasedBooking.status === 'CANCELLED' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              background: releasedBooking.status === 'CANCELLED' ? 'var(--danger-glow)' : 'var(--success-glow)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: releasedBooking.status === 'CANCELLED' ? 'var(--danger)' : 'var(--success)',
              border: releasedBooking.status === 'CANCELLED' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {releasedBooking.status === 'CANCELLED' ? <XCircle size={30} /> : <CheckCircle size={30} />}
            </div>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {releasedBooking.status === 'CANCELLED' ? 'Reservation Cancelled' : 'Parking Session Ended'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              {releasedBooking.status === 'CANCELLED' 
                ? 'Your booking was cancelled and the slot has been freed.' 
                : 'Your invoice receipt has been compiled successfully.'}
            </p>

            <div style={{
              borderTop: '1px dashed var(--border-color)',
              borderBottom: '1px dashed var(--border-color)',
              padding: '1.5rem 0',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ticket ID:</span>
                <span style={{ fontWeight: 600, color: 'white' }}>{releasedBooking.id.substring(18)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Plate Code:</span>
                <span style={{ fontWeight: 600, color: 'white' }}>{releasedBooking.vehicle_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Time Active:</span>
                <span style={{ fontWeight: 600, color: 'white' }}>{releasedBooking.duration_minutes} mins</span>
              </div>
              {releasedBooking.payment_utr && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>UPI Ref (UTR):</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)', letterSpacing: '1px' }}>{releasedBooking.payment_utr}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 700, color: 'white' }}>
                  {releasedBooking.status === 'CANCELLED' ? 'Cancellation Fee:' : 'Grand Total:'}
                </span>
                <span style={{ fontWeight: 800, color: releasedBooking.status === 'CANCELLED' ? '#f87171' : 'var(--accent)' }}>
                  ₹{releasedBooking.total_cost}
                </span>
              </div>
            </div>

            <button
              onClick={() => { setShowInvoiceModal(false); setReleasedBooking(null); fetchBookings(); }}
              className="btn-premium"
              style={{ width: '100%', padding: '0.8rem' }}
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
          background: 'rgba(5, 7, 12, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel animate-slide-up" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '2rem',
            background: 'var(--bg-card)'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✏️ Edit Profile Settings</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Update your account details and registered vehicle information.
            </p>

            {profileError && (
              <div className="custom-alert custom-alert-danger" style={{ marginBottom: '1.25rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              {/* Full Name */}
              <div className="input-glow-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Full Name</label>
                <input
                  type="text"
                  required
                  className="input-glow"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'white'
                  }}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              {/* Address */}
              <div className="input-glow-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Residential Address</label>
                <input
                  type="text"
                  className="input-glow"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'white'
                  }}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="123 Street Name, City"
                />
              </div>

              {/* PIN Code & Vehicle Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>PIN Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    className="input-glow"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'white'
                    }}
                    value={profileForm.pinCode}
                    onChange={(e) => setProfileForm({ ...profileForm, pinCode: e.target.value })}
                    placeholder="400001"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Vehicle Number</label>
                  <input
                    type="text"
                    className="input-glow"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'white',
                      textTransform: 'uppercase'
                    }}
                    value={profileForm.vehicleNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder="MH01AB1234"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="btn-outline"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="btn-premium"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {profileSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pulse keyframe injection */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>

    </div>
  );
};
