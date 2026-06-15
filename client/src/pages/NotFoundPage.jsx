import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 70px)',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div className="particle-orb" style={{
        top: '20%', left: '20%', width: '200px', height: '200px',
        background: 'rgba(239, 68, 68, 0.08)',
        animationDuration: '10s'
      }} />
      <div className="particle-orb" style={{
        bottom: '20%', right: '20%', width: '250px', height: '250px',
        background: 'rgba(168, 85, 247, 0.06)',
        animationDuration: '12s', animationDelay: '3s'
      }} />

      <div className="glass-panel animate-scale-in" style={{
        textAlign: 'center',
        padding: '3.5rem 3rem',
        maxWidth: '520px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 404 Number */}
        <div style={{
          fontSize: '7rem',
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: '0.5rem',
          letterSpacing: '-0.05em'
        }}>
          <span className="text-gradient">4</span>
          <span style={{ color: 'var(--danger)' }}>0</span>
          <span className="text-gradient">4</span>
        </div>

        {/* Icon */}
        <div style={{
          background: 'var(--danger-glow)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '1rem auto 1.5rem auto',
          border: '1px solid rgba(239, 68, 68, 0.25)'
        }}>
          <AlertTriangle size={26} color="var(--danger)" />
        </div>

        <h2 style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          marginBottom: '0.75rem'
        }}>
          Page Not Found
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          marginBottom: '2rem',
          maxWidth: '380px',
          margin: '0 auto 2rem auto'
        }}>
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <Link 
            to="/" 
            className="btn-premium"
            style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
          >
            <Home size={16} />
            <span>Back to Home</span>
          </Link>
          <Link 
            to="/dashboard"
            className="btn-outline"
            style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
