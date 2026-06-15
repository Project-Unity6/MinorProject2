import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  PlusCircle, Edit3, Settings, TrendingUp, Users, 
  MapPin, CheckCircle, BarChart3, Info, AlertTriangle, Layers, Coins,
  Search, Calendar, Clock, CreditCard
} from 'lucide-react';

export const AdminDashboard = () => {
  // Tabs State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'lots' | 'create' | 'reports' | 'bookings'

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Bookings Log State
  const [adminBookings, setAdminBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('ALL');

  // Parking Lots State
  const [lots, setLots] = useState([]);
  const [loadingLots, setLoadingLots] = useState(false);

  // Edit Lot State
  const [editingLot, setEditingLot] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    city: '',
    pin_code: '',
    hourly_rate: 0
  });

  // Create Lot State
  const [newLot, setNewLot] = useState({
    name: '',
    address: '',
    city: '',
    pin_code: '',
    total_spots: 50,
    hourly_rate: 50,
    latitude: 19.0760,
    longitude: 72.8777
  });

  // UI Alerts
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reports State
  const [reports, setReports] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Show status banner helper
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Fetch Admin Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get('/api/admin/analytics/overview');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      showAlert('error', 'Failed to retrieve administrative analytics.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Lots (Uses public search endpoint without query for complete list)
  const fetchLots = async () => {
    setLoadingLots(true);
    try {
      const res = await api.get('/api/parking/search');
      setLots(res.data);
    } catch (err) {
      console.error('Error fetching parking lots:', err);
    } finally {
      setLoadingLots(false);
    }
  };

  // Fetch Reports (real data)
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get('/api/admin/analytics/reports');
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch Admin Bookings
  const fetchAdminBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.get('/api/admin/bookings');
      setAdminBookings(res.data);
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
      showAlert('error', 'Failed to retrieve booking logs.');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Load Initial Data
  useEffect(() => {
    fetchAnalytics();
    fetchLots();
  }, []);

  // Handle Create Lot
  const handleCreateLot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/admin/parking-lots', newLot);
      showAlert('success', `Parking lot "${newLot.name}" created successfully with ${newLot.total_spots} slots.`);
      
      // Reset form
      setNewLot({
        name: '',
        address: '',
        city: '',
        pin_code: '',
        total_spots: 50,
        hourly_rate: 50,
        latitude: 19.0760,
        longitude: 72.8777
      });
      
      // Refresh
      fetchLots();
      fetchAnalytics();
      setActiveTab('lots');
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.error || 'Failed to initialize parking lot.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const startEdit = (lot) => {
    setEditingLot(lot);
    setEditForm({
      name: lot.name,
      address: lot.address,
      city: lot.city,
      pin_code: lot.pin_code,
      hourly_rate: lot.hourly_rate
    });
  };

  // Handle Update Lot
  const handleUpdateLot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/api/admin/parking-lots/${editingLot.id}`, editForm);
      showAlert('success', `Parking lot "${editForm.name}" updated successfully.`);
      setEditingLot(null);
      
      // Refresh
      fetchLots();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.error || 'Failed to update parking lot.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Admin Dashboard Header */}
      <div className="glass-panel" style={{
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        background: 'rgba(23, 17, 39, 0.6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 className="text-gradient-purple" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Admin Console</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            System-wide operational summaries and site configurations.
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-sm)',
          color: '#c084fc',
          fontSize: '0.9rem',
          fontWeight: 700
        }}>
          🛡️ SYSTEM SECURE
        </div>
      </div>

      {/* Global Alerts */}
      {alert && (
        <div className={`custom-alert custom-alert-${alert.type === 'error' ? 'danger' : 'success'}`} style={{ marginBottom: '1.5rem' }}>
          {alert.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        gap: '1.5rem'
      }}>
        {[
          { id: 'overview', label: '📈 Overview' },
          { id: 'lots', label: '🅿️ Parking Lots' },
          { id: 'create', label: '➕ Create Lot' },
          { id: 'reports', label: '📊 Reports' },
          { id: 'bookings', label: '📋 Booking Logs' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'overview') fetchAnalytics();
              if (tab.id === 'lots') fetchLots();
              if (tab.id === 'reports') fetchReports();
              if (tab.id === 'bookings') fetchAdminBookings();
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0.5rem',
              color: activeTab === tab.id ? '#c084fc' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '1rem',
              borderBottom: activeTab === tab.id ? '2.5px solid #a855f7' : '2.5px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          {loadingAnalytics ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.1)',
                borderTop: '4px solid #a855f7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1.5rem auto'
              }} />
              <span style={{ color: 'var(--text-muted)' }}>Crunching real-time database analytics...</span>
            </div>
          ) : (
            <div>
              {/* Stats Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
              }}>
                {/* Total Bookings */}
                <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', position: 'relative' }}>
                  <Layers style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', opacity: 0.15, color: '#c084fc' }} size={35} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL BOOKINGS</span>
                  <h3 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0' }}>
                    {analytics?.total_bookings?.all_time}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#a7f3d0', fontWeight: 600 }}>
                    +{analytics?.total_bookings?.today} bookings today
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', position: 'relative' }}>
                  <Coins style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', opacity: 0.15, color: '#10b981' }} size={35} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CUMULATIVE REVENUE</span>
                  <h3 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#10b981' }}>
                    ₹{analytics?.total_revenue?.all_time}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#a7f3d0', fontWeight: 600 }}>
                    +₹{analytics?.total_revenue?.today} today
                  </div>
                </div>

                {/* Occupancy Rate */}
                <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', position: 'relative' }}>
                  <TrendingUp style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', opacity: 0.15, color: 'var(--accent)' }} size={35} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVG LIVE OCCUPANCY</span>
                  <h3 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: 'var(--accent)' }}>
                    {analytics?.occupancy_rate?.current}%
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Across all parking spots
                  </div>
                </div>

                {/* Active Users */}
                <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', position: 'relative' }}>
                  <Users style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', opacity: 0.15, color: '#f59e0b' }} size={35} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE PARKED VEHICLES</span>
                  <h3 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#f59e0b' }}>
                    {analytics?.active_users}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Occupied spots currently active
                  </div>
                </div>
              </div>

              {/* Informational Alerts */}
              <div className="glass-panel" style={{
                padding: '1.5rem',
                borderLeft: '4px solid #a855f7',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}>
                <Info size={24} style={{ color: '#c084fc', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white', marginBottom: '0.25rem' }}>Dynamic Pricing Surge Engine</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    The pricing matrix applies automated multiplier rates based on real-time occupancy. Tier triggers: 
                    {' '}<strong style={{ color: 'var(--text-main)' }}>50% occupancy (1.2x)</strong>, 
                    {' '}<strong style={{ color: 'var(--text-main)' }}>70% occupancy (1.5x)</strong>, 
                    {' '}<strong style={{ color: 'var(--text-main)' }}>85% occupancy (1.8x)</strong>, 
                    and <strong style={{ color: 'var(--text-main)' }}>95% occupancy (2.0x)</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PARKING LOTS TABLE */}
      {activeTab === 'lots' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem 2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Managed Parking Locations</h3>

          {loadingLots ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{
                width: '30px',
                height: '30px',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderTop: '3px solid #a855f7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem auto'
              }} />
              <span style={{ color: 'var(--text-muted)' }}>Refreshing spots and pricing...</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Lot Details</th>
                    <th>City</th>
                    <th>Base / Dynamic Rate</th>
                    <th>Occupied Slots</th>
                    <th>Occupancy %</th>
                    <th>Configure</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map(lot => (
                    <tr key={lot.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{lot.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lot.address} (PIN: {lot.pin_code})</div>
                      </td>
                      <td>{lot.city}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>₹{lot.hourly_rate}</span>
                        {lot.dynamic_rate !== lot.hourly_rate && (
                          <span style={{ color: 'var(--warning)', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 700 }}>
                            ₹{lot.dynamic_rate} (Active Surge)
                          </span>
                        )}
                      </td>
                      <td>{lot.total_spots - lot.available_spots} / {lot.total_spots}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${lot.occupancy_percent}%`, height: '100%', background: lot.occupancy_percent > 70 ? 'var(--warning)' : '#a855f7' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{lot.occupancy_percent}%</span>
                        </div>
                      </td>
                      <td>
                        <button 
                          onClick={() => startEdit(lot)}
                          style={{
                            background: 'rgba(168, 85, 247, 0.12)',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            color: '#c084fc',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 600
                          }}
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE LOT FORM */}
      {activeTab === 'create' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', maxWidth: '700px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle color="#c084fc" />
            <span>Initialize Parking Site</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
            Adds a new parking location to the database and automatically constructs all individual slot sensor objects.
          </p>

          <form onSubmit={handleCreateLot}>
            <div className="input-glow-group">
              <label htmlFor="lotName">Location/Lot Name</label>
              <input
                id="lotName"
                type="text"
                required
                className="input-glow"
                style={{ paddingLeft: '1rem' }}
                placeholder="e.g. Bandra Premium Lot"
                value={newLot.name}
                onChange={(e) => setNewLot({ ...newLot, name: e.target.value })}
              />
            </div>

            <div className="input-glow-group">
              <label htmlFor="lotAddress">Street Address</label>
              <input
                id="lotAddress"
                type="text"
                required
                className="input-glow"
                style={{ paddingLeft: '1rem' }}
                placeholder="e.g. 102 Linking Road"
                value={newLot.address}
                onChange={(e) => setNewLot({ ...newLot, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-glow-group">
                <label htmlFor="lotCity">City</label>
                <input
                  id="lotCity"
                  type="text"
                  required
                  className="input-glow"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Mumbai"
                  value={newLot.city}
                  onChange={(e) => setNewLot({ ...newLot, city: e.target.value })}
                />
              </div>

              <div className="input-glow-group">
                <label htmlFor="lotPin">PIN Code</label>
                <input
                  id="lotPin"
                  type="text"
                  required
                  maxLength="6"
                  className="input-glow"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. 400050"
                  value={newLot.pin_code}
                  onChange={(e) => setNewLot({ ...newLot, pin_code: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-glow-group">
                <label htmlFor="lotSpots">Total Spots Capacity (Max 200)</label>
                <input
                  id="lotSpots"
                  type="number"
                  required
                  min="5"
                  max="200"
                  className="input-glow"
                  style={{ paddingLeft: '1rem' }}
                  value={newLot.total_spots}
                  onChange={(e) => setNewLot({ ...newLot, total_spots: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="input-glow-group">
                <label htmlFor="lotRate">Base Rate (₹ / hour)</label>
                <input
                  id="lotRate"
                  type="number"
                  required
                  min="10"
                  className="input-glow"
                  style={{ paddingLeft: '1rem' }}
                  value={newLot.hourly_rate}
                  onChange={(e) => setNewLot({ ...newLot, hourly_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-glow-group">
                <label htmlFor="lotLat">GPS Latitude</label>
                <input
                  id="lotLat"
                  type="number"
                  step="0.000001"
                  className="input-glow"
                  style={{ paddingLeft: '1rem' }}
                  value={newLot.latitude}
                  onChange={(e) => setNewLot({ ...newLot, latitude: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="input-glow-group">
                <label htmlFor="lotLng">GPS Longitude</label>
                <input
                  id="lotLng"
                  type="number"
                  step="0.000001"
                  className="input-glow"
                  style={{ paddingLeft: '1rem' }}
                  value={newLot.longitude}
                  onChange={(e) => setNewLot({ ...newLot, longitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-premium"
              style={{
                width: '100%',
                padding: '0.85rem',
                marginTop: '1.5rem',
                background: 'linear-gradient(135deg, var(--secondary) 0%, #7c3aed 100%)',
                boxShadow: '0 4px 14px 0 var(--secondary-glow)'
              }}
            >
              {submitting ? 'Generating spots and saving...' : 'Initialize Site'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ANALYTICS REPORTS */}
      {activeTab === 'reports' && (
        <div className="animate-fade-in">
          {loadingReports ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <div style={{
                width: '40px', height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.1)',
                borderTop: '4px solid #a855f7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1.5rem auto'
              }} />
              <span style={{ color: 'var(--text-muted)' }}>Loading analytics reports...</span>
            </div>
          ) : reports ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Top Row: Revenue + Time Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {/* Revenue by City */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={18} color="#a855f7" />
                    <span>Revenue by City (₹)</span>
                  </h4>
                  {reports.revenue_by_city.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No completed bookings yet</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {reports.revenue_by_city.map((bar, i) => {
                        const maxRevenue = reports.revenue_by_city[0]?.total_revenue || 1;
                        const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', '#f59e0b', '#10b981'];
                        return (
                          <div key={bar.city}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                              <span>{bar.city} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({bar.booking_count} bookings)</span></span>
                              <strong style={{ color: 'white' }}>₹{bar.total_revenue.toLocaleString()}</strong>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${(bar.total_revenue / maxRevenue) * 100}%`,
                                height: '100%',
                                background: colors[i % colors.length],
                                borderRadius: '999px',
                                transition: 'width 0.8s ease'
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Booking Time Distribution */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} color="var(--accent)" />
                    <span>Booking Time Distribution</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reports.booking_time_distribution.map((bar, i) => {
                      const colors = ['var(--accent)', 'var(--primary)', 'var(--secondary)', '#f59e0b', '#ef4444'];
                      return (
                        <div key={bar.time}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            <span>{bar.time}</span>
                            <strong style={{ color: 'white' }}>{bar.share}%</strong>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.max(bar.share, 2)}%`,
                              height: '100%',
                              background: colors[i % colors.length],
                              borderRadius: '999px',
                              transition: 'width 0.8s ease'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Top Lots + Occupancy */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {/* Top Performing Lots */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Coins size={18} color="#10b981" />
                    <span>Top Performing Lots</span>
                  </h4>
                  {reports.top_lots.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No revenue data yet</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {reports.top_lots.map((lot, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.85rem 1rem',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                              <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>#{i + 1}</span>
                              {lot.lot_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lot.city} • {lot.booking_count} bookings</div>
                          </div>
                          <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                            ₹{lot.total_revenue.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Per-Lot Occupancy */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="#c084fc" />
                    <span>Live Occupancy by Lot</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reports.occupancy_by_lot.map((lot, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                          <span>{lot.lot_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({lot.city})</span></span>
                          <span style={{ fontWeight: 600 }}>{lot.occupied}/{lot.total_spots} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({lot.occupancy_percent}%)</span></span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${lot.occupancy_percent}%`,
                            height: '100%',
                            background: lot.occupancy_percent > 70 ? 'var(--warning)' : lot.occupancy_percent > 40 ? '#a855f7' : 'var(--success)',
                            borderRadius: '999px',
                            transition: 'width 0.8s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BarChart3 size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
              <p>Click the Reports tab to load analytics data.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BOOKINGS LOGS */}
      {activeTab === 'bookings' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem 2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>System-wide Booking Audit Trail</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Reconcile bank credits using 12-digit UTR numbers submitted for UPI payments.
              </p>
            </div>
            
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setBookingFilter(filter)}
                  style={{
                    background: bookingFilter === filter ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: bookingFilter === filter ? 'var(--border-color-hover)' : 'var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: bookingFilter === filter ? 'white' : 'var(--text-muted)',
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

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search by customer name, email, vehicle number, or UTR reference..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'white',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {loadingBookings ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{
                width: '30px',
                height: '30px',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderTop: '3px solid #a855f7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem auto'
              }} />
              <span style={{ color: 'var(--text-muted)' }}>Fetching all database booking records...</span>
            </div>
          ) : (() => {
            const filtered = adminBookings.filter(b => {
              const matchesFilter = bookingFilter === 'ALL' || b.status === bookingFilter;
              if (!matchesFilter) return false;
              
              if (!bookingSearch.trim()) return true;
              
              const searchLower = bookingSearch.toLowerCase();
              return (
                b.user_name.toLowerCase().includes(searchLower) ||
                b.user_email.toLowerCase().includes(searchLower) ||
                b.vehicle_number.toLowerCase().includes(searchLower) ||
                (b.payment_utr && b.payment_utr.toLowerCase().includes(searchLower)) ||
                (b.lot_name && b.lot_name.toLowerCase().includes(searchLower)) ||
                (b.id && b.id.toLowerCase().includes(searchLower))
              );
            });

            if (filtered.length === 0) {
              return (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={35} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <p>No bookings records matched your search parameters.</p>
                </div>
              );
            }

            return (
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Booking Ref / User</th>
                      <th>Lot Code & Spot</th>
                      <th>Vehicle Number</th>
                      <th>Timings & Duration</th>
                      <th>Cost</th>
                      <th>Payment UTR</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(b => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#c084fc', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                            #{b.id.slice(-8).toUpperCase()}
                          </div>
                          <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{b.user_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.user_email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{b.lot_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Spot: <strong style={{ color: 'white' }}>{b.spot_code}</strong></div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.vehicle_number}</td>
                        <td>
                          <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock size={12} color="var(--primary)" />
                            <span>In: {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {b.end_time && (
                            <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                              <Clock size={12} color="#fca5a5" />
                              <span>Out: {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Duration: {b.duration_minutes !== null ? `${b.duration_minutes} mins` : 'Active timer'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: b.total_cost > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                          ₹{b.total_cost || 0}
                        </td>
                        <td>
                          {b.payment_utr ? (
                            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>{b.payment_utr}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                              {b.total_cost > 0 ? 'Pending Verification' : 'No Charge'}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${b.status === 'COMPLETED' ? 'badge-success' : b.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* EDIT MODAL POPUP */}
      {editingLot && (
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
            background: 'var(--bg-card)',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings color="#c084fc" />
              <span>Modify Parking Lot</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Update specific settings for parking site "{editingLot.name}".
            </p>

            <form onSubmit={handleUpdateLot}>
              <div className="input-glow-group">
                <label htmlFor="editName" style={{ color: '#c084fc' }}>Lot Name</label>
                <input
                  id="editName"
                  type="text"
                  required
                  className="input-glow"
                  style={{ paddingLeft: '1rem', borderColor: 'rgba(168, 85, 247, 0.15)' }}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="input-glow-group">
                <label htmlFor="editAddress" style={{ color: '#c084fc' }}>Street Address</label>
                <input
                  id="editAddress"
                  type="text"
                  required
                  className="input-glow"
                  style={{ paddingLeft: '1rem', borderColor: 'rgba(168, 85, 247, 0.15)' }}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-glow-group">
                  <label htmlFor="editCity" style={{ color: '#c084fc' }}>City</label>
                  <input
                    id="editCity"
                    type="text"
                    required
                    className="input-glow"
                    style={{ paddingLeft: '1rem', borderColor: 'rgba(168, 85, 247, 0.15)' }}
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  />
                </div>

                <div className="input-glow-group">
                  <label htmlFor="editPin" style={{ color: '#c084fc' }}>PIN Code</label>
                  <input
                    id="editPin"
                    type="text"
                    required
                    maxLength="6"
                    className="input-glow"
                    style={{ paddingLeft: '1rem', borderColor: 'rgba(168, 85, 247, 0.15)' }}
                    value={editForm.pin_code}
                    onChange={(e) => setEditForm({ ...editForm, pin_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-glow-group">
                <label htmlFor="editRate" style={{ color: '#c084fc' }}>Hourly Base Rate (₹)</label>
                <input
                  id="editRate"
                  type="number"
                  required
                  min="10"
                  className="input-glow"
                  style={{ paddingLeft: '1rem', borderColor: 'rgba(168, 85, 247, 0.15)' }}
                  value={editForm.hourly_rate}
                  onChange={(e) => setEditForm({ ...editForm, hourly_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingLot(null)}
                  className="btn-outline"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-premium"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, var(--secondary) 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 14px 0 var(--secondary-glow)'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spinner keyframe style helper */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};
