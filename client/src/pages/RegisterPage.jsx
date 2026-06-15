import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, MapPin, Hash, Car, UserPlus, AlertCircle } from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    pinCode: '',
    vehicleNumber: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validations
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      setError('PIN Code must be a 6-digit number (e.g. 400001).');
      return;
    }

    const cleanVehicle = formData.vehicleNumber ? formData.vehicleNumber.replace(/[^A-Z0-9]/ig, '').toUpperCase() : '';
    if (formData.vehicleNumber) {
      const vehicleRegex = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$|^[A-Z]{2}\d{2}\d{4}$/;
      if (!vehicleRegex.test(cleanVehicle)) {
        setError('Please enter a valid vehicle number (e.g. MH01AB1234).');
        return;
      }
    }

    setSubmitting(true);
    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.address,
        formData.pinCode,
        cleanVehicle
      );
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed. Email might already be taken.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 70px)',
      padding: '2rem 1.5rem'
    }}>
      <div className="glass-panel form-card animate-slide-up" style={{
        background: 'rgba(17, 25, 40, 0.65)',
        maxWidth: '540px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
          }}>
            <UserPlus size={22} color="white" />
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Join ParkHub and manage your bookings effortlessly
          </p>
        </div>

        {error && (
          <div className="custom-alert custom-alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="input-glow-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <div className="input-icon-wrapper">
                <User size={18} />
              </div>
              <input
                id="name"
                type="text"
                required
                className="input-glow"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div className="input-glow-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <div className="input-icon-wrapper">
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                required
                className="input-glow"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-glow-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <div className="input-icon-wrapper">
                <Lock size={18} />
              </div>
              <input
                id="password"
                type="password"
                required
                className="input-glow"
                placeholder="•••••• (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address */}
          <div className="input-glow-group">
            <label htmlFor="address">Residential Address</label>
            <div className="input-wrapper">
              <div className="input-icon-wrapper">
                <MapPin size={18} />
              </div>
              <input
                id="address"
                type="text"
                className="input-glow"
                placeholder="123 Main St, Mumbai"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Grid for PIN and Vehicle */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            {/* PIN Code */}
            <div className="input-glow-group">
              <label htmlFor="pinCode">PIN Code</label>
              <div className="input-wrapper">
                <div className="input-icon-wrapper">
                  <Hash size={18} />
                </div>
                <input
                  id="pinCode"
                  type="text"
                  maxLength="6"
                  className="input-glow"
                  placeholder="400001"
                  value={formData.pinCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Vehicle Number */}
            <div className="input-glow-group">
              <label htmlFor="vehicleNumber">Vehicle Number</label>
              <div className="input-wrapper">
                <div className="input-icon-wrapper">
                  <Car size={18} />
                </div>
                <input
                  id="vehicleNumber"
                  type="text"
                  className="input-glow"
                  placeholder="MH01AB1234"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-premium"
            style={{ width: '100%', padding: '0.85rem', marginTop: '1rem', fontSize: '1rem' }}
          >
            {submitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: 'var(--text-muted)'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: 'var(--primary)',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
