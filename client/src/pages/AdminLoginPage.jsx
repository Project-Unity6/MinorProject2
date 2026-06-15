import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, AlertCircle } from 'lucide-react';

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const userData = await login(email, password);
      
      // Strict role check for Admin
      if (userData.role !== 'ADMIN') {
        logout(); // Force logout invalid role session
        setError('Access Denied. You do not possess administrator rights.');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid administrator credentials.');
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
        border: '1px solid rgba(168, 85, 247, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.15)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--secondary) 0%, #7c3aed 100%)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
          }}>
            <ShieldAlert size={22} color="white" />
          </div>
          <h2 className="text-gradient-purple" style={{ fontSize: '1.85rem', fontWeight: 800 }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Secure login for parking site administrators
          </p>
        </div>

        {error && (
          <div className="custom-alert custom-alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div className="input-glow-group">
            <label htmlFor="email" style={{ color: '#c084fc' }}>Admin Email</label>
            <div className="input-wrapper">
              <div className="input-icon-wrapper" style={{ color: '#c084fc' }}>
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                required
                className="input-glow"
                style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}
                placeholder="admin@parkhub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 4px var(--secondary-glow)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="input-glow-group">
            <label htmlFor="password" style={{ color: '#c084fc' }}>Secret Key</label>
            <div className="input-wrapper">
              <div className="input-icon-wrapper" style={{ color: '#c084fc' }}>
                <Lock size={18} />
              </div>
              <input
                id="password"
                type="password"
                required
                className="input-glow"
                style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 4px var(--secondary-glow)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-premium"
            style={{
              width: '100%',
              padding: '0.85rem',
              marginTop: '1rem',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, var(--secondary) 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px 0 var(--secondary-glow)'
            }}
          >
            {submitting ? 'Verifying authority...' : 'Access Console'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          <Link to="/" style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontWeight: 500
          }}>
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};
