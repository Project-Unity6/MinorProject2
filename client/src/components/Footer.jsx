import React from 'react';
import { Link } from 'react-router-dom';
import { ParkingSquare, Globe, Mail, ExternalLink } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Gradient accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '2px',
        background: 'linear-gradient(90deg, var(--primary), var(--secondary), var(--accent), var(--secondary), var(--primary))',
        backgroundSize: '200% auto',
        animation: 'gradientShift 4s ease infinite'
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 1.5rem 2rem 1.5rem'
      }}>
        {/* Top grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}>
          {/* Brand */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ParkingSquare size={18} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                Park<span className="text-gradient">Hub</span>
              </span>
            </div>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              lineHeight: 1.7,
              maxWidth: '280px'
            }}>
              India's smartest parking management platform. Find, book, and pay for parking in seconds.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem'
            }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: 'Home', to: '/' },
                { label: 'Find Parking', to: '/login' },
                { label: 'Register', to: '/register' },
                { label: 'Dashboard', to: '/dashboard' }
              ].map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.88rem',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 style={{
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem'
            }}>
              Features
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                'Dynamic Pricing',
                'Real-time Availability',
                'UPI Payments',
                'Admin Analytics'
              ].map(item => (
                <span
                  key={item}
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.88rem'
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem'
            }}>
              Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} />
                support@parkhub.in
              </span>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                {[
                  { icon: <Globe size={16} />, label: 'Website' },
                  { icon: <Mail size={16} />, label: 'Email' },
                  { icon: <ExternalLink size={16} />, label: 'Links' }
                ].map(social => (
                  <div
                    key={social.label}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--primary)';
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                    title={social.label}
                  >
                    {social.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <span style={{
            color: 'var(--text-muted)',
            fontSize: '0.82rem'
          }}>
            © {currentYear} ParkHub. All rights reserved.
          </span>
          <div style={{
            display: 'flex',
            gap: '1.5rem'
          }}>
            {['Privacy Policy', 'Terms of Service'].map(item => (
              <span
                key={item}
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
