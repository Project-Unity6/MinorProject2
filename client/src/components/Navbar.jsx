import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ParkingSquare, LogOut, LayoutDashboard, User, ShieldAlert, Home } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(11, 15, 25, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.85rem 1.5rem',
      transition: 'var(--transition-normal)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          textDecoration: 'none',
          color: 'white',
          fontWeight: 800,
          fontSize: '1.45rem',
          letterSpacing: '-0.02em',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
          }}>
            <ParkingSquare size={20} color="white" />
          </div>
          <span>Park<span className="text-gradient">Hub</span></span>
        </Link>

        {/* Navigation Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link 
            to="/" 
            style={{
              color: isActive('/') ? 'white' : 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.92rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: isActive('/') ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              transition: 'var(--transition-fast)'
            }}
          >
            <Home size={15} />
            <span>Home</span>
          </Link>

          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <>
                  <Link 
                    to="/admin/dashboard" 
                    style={{
                      color: isActive('/admin/dashboard') ? 'white' : 'var(--text-muted)',
                      textDecoration: 'none',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive('/admin/dashboard') ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <ShieldAlert size={15} color="var(--secondary)" />
                    <span>Admin Panel</span>
                  </Link>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--secondary)'
                  }}>
                    ADMIN
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/dashboard" 
                    style={{
                      color: isActive('/dashboard') ? 'white' : 'var(--text-muted)',
                      textDecoration: 'none',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive('/dashboard') ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <LayoutDashboard size={15} />
                    <span>Dashboard</span>
                  </Link>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <User size={14} color="var(--primary)" />
                    <span>{user?.name}</span>
                  </div>
                </>
              )}

              <button 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                style={{
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="btn-premium"
                style={{
                  padding: '0.45rem 1.1rem',
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
