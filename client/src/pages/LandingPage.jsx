import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, ChevronRight, Search, Car, CreditCard, 
  Shield, MapPin, Clock, TrendingUp, Star, ArrowRight,
  Sparkles, CheckCircle
} from 'lucide-react';

/* Animated counter hook */
const useCountUp = (target, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

export const LandingPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [statsVisible, setStatsVisible] = useState(false);

  // Trigger counter animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setStatsVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const spots = useCountUp(500, 1800, statsVisible);
  const cities = useCountUp(4, 1200, statsVisible);
  const bookings = useCountUp(10000, 2200, statsVisible);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '0' }}>

      {/* ===== HERO SECTION ===== */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '7rem 1.5rem 4rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating particle orbs */}
        <div className="particle-orb" style={{
          top: '10%', left: '15%', width: '250px', height: '250px',
          background: 'rgba(99, 102, 241, 0.12)',
          animationDuration: '10s'
        }} />
        <div className="particle-orb" style={{
          top: '60%', right: '10%', width: '200px', height: '200px',
          background: 'rgba(168, 85, 247, 0.1)',
          animationDuration: '12s', animationDelay: '2s'
        }} />
        <div className="particle-orb" style={{
          top: '30%', right: '30%', width: '120px', height: '120px',
          background: 'rgba(6, 182, 212, 0.08)',
          animationDuration: '8s', animationDelay: '4s'
        }} />

        {/* Version chip */}
        <div className="animate-slide-up stagger-1" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '0.5rem 1.15rem',
          borderRadius: '9999px',
          fontSize: '0.88rem',
          fontWeight: 600,
          color: 'var(--primary)',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          <Sparkles size={14} />
          <span>Powered by Smart Parking Engine v2.0</span>
        </div>

        {/* Main heading */}
        <h1 className="animate-slide-up stagger-2" style={{
          fontSize: '4.2rem',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          Find & Reserve Parking{' '}
          <br />
          <span className="text-shimmer" style={{ fontSize: '4.2rem' }}>
            In Seconds, Not Hours
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-slide-up stagger-3" style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '600px',
          margin: '0 auto 2.5rem auto',
          fontWeight: 400,
          lineHeight: 1.7,
          position: 'relative',
          zIndex: 1
        }}>
          Real-time slot availability, dynamic pricing that saves you money, 
          and instant digital booking — all from one beautiful dashboard.
        </p>

        {/* CTA Buttons */}
        <div className="animate-slide-up stagger-4" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1
        }}>
          {isAuthenticated ? (
            <Link 
              to={isAdmin ? "/admin/dashboard" : "/dashboard"} 
              className="btn-premium animate-glow-pulse"
              style={{ padding: '1rem 2.25rem', fontSize: '1.05rem' }}
            >
              <span>Go to Dashboard</span>
              <ChevronRight size={18} />
            </Link>
          ) : (
            <>
              <Link 
                to="/register" 
                className="btn-premium animate-glow-pulse"
                style={{ padding: '1rem 2.25rem', fontSize: '1.05rem' }}
              >
                <span>Get Started Free</span>
                <ArrowRight size={18} />
              </Link>
              <Link 
                to="/login" 
                className="btn-outline"
                style={{ padding: '1rem 2.25rem', fontSize: '1.05rem' }}
              >
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>

        {/* Animated Stats Strip */}
        <div className="animate-slide-up stagger-5" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '3rem',
          marginTop: '4rem',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1
        }}>
          {[
            { value: `${spots}+`, label: 'Parking Spots', color: 'var(--primary)' },
            { value: cities, label: 'Cities Covered', color: 'var(--accent)' },
            { value: `${(bookings / 1000).toFixed(bookings >= 10000 ? 0 : 1)}K+`, label: 'Bookings Made', color: 'var(--secondary)' }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div className="count-number" style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                color: stat.color,
                lineHeight: 1.2
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                marginTop: '0.25rem'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{
        maxWidth: '1100px',
        margin: '2rem auto 0 auto',
        padding: '4rem 1.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 className="animate-slide-up" style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            marginBottom: '0.75rem'
          }}>
            How It <span className="text-gradient">Works</span>
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '1.05rem',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            Three simple steps to hassle-free parking
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          position: 'relative'
        }}>
          {[
            {
              step: '01',
              icon: <Search size={26} />,
              title: 'Search Nearby',
              desc: 'Browse available parking lots across your city with real-time occupancy data and dynamic pricing.',
              color: 'var(--primary)',
              bg: 'rgba(99, 102, 241, 0.1)',
              borderColor: 'rgba(99, 102, 241, 0.15)'
            },
            {
              step: '02',
              icon: <CreditCard size={26} />,
              title: 'Book & Pay',
              desc: 'Select your slot, choose a start time, and confirm your reservation with UPI, card, or wallet payment.',
              color: 'var(--secondary)',
              bg: 'rgba(168, 85, 247, 0.1)',
              borderColor: 'rgba(168, 85, 247, 0.15)'
            },
            {
              step: '03',
              icon: <Car size={26} />,
              title: 'Park & Go',
              desc: 'Drive in, park at your reserved spot, and end your session when done. Pay only for the time used.',
              color: 'var(--accent)',
              bg: 'rgba(6, 182, 212, 0.1)',
              borderColor: 'rgba(6, 182, 212, 0.15)'
            }
          ].map((item, i) => (
            <div
              key={i}
              className="glass-panel card-hover-lift animate-slide-up"
              style={{
                padding: '2rem',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${item.borderColor}`,
                animationDelay: `${0.2 + i * 0.15}s`,
                opacity: 0,
                animationFillMode: 'forwards'
              }}
            >
              {/* Step number watermark */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '15px',
                fontSize: '5rem',
                fontWeight: 900,
                color: item.color,
                opacity: 0.06,
                lineHeight: 1,
                pointerEvents: 'none'
              }}>
                {item.step}
              </div>

              {/* Icon */}
              <div style={{
                background: item.bg,
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color,
                marginBottom: '1.25rem'
              }}>
                {item.icon}
              </div>

              {/* Step label */}
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.5rem'
              }}>
                Step {item.step}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {item.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section style={{
        maxWidth: '1100px',
        margin: '2rem auto 0 auto',
        padding: '4rem 1.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            marginBottom: '0.75rem'
          }}>
            Why Choose <span className="text-gradient-cyan">ParkHub</span>?
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '1.05rem',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            Built for the modern driver who values time and money
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            {
              icon: <TrendingUp size={22} />,
              title: 'Dynamic Pricing',
              desc: 'Save up to 20% during off-peak hours with our smart occupancy-based pricing engine.',
              color: '#10b981',
              bg: 'rgba(16, 185, 129, 0.08)'
            },
            {
              icon: <Clock size={22} />,
              title: 'Real-time Availability',
              desc: 'Live spot counts updated instantly. No more circling the lot looking for parking.',
              color: '#6366f1',
              bg: 'rgba(99, 102, 241, 0.08)'
            },
            {
              icon: <Shield size={22} />,
              title: 'Secure Payments',
              desc: 'Pay with Google Pay, PhonePe, Paytm, or card. Your transactions are encrypted and safe.',
              color: '#a855f7',
              bg: 'rgba(168, 85, 247, 0.08)'
            },
            {
              icon: <MapPin size={22} />,
              title: 'Multi-City Coverage',
              desc: 'From Mumbai to Delhi — find parking wherever you go across India\'s major cities.',
              color: '#06b6d4',
              bg: 'rgba(6, 182, 212, 0.08)'
            }
          ].map((feat, i) => (
            <div
              key={i}
              className="glass-panel card-hover-lift"
              style={{
                padding: '1.75rem',
                textAlign: 'left',
                borderTop: `3px solid ${feat.color}`
              }}
            >
              <div style={{
                background: feat.bg,
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: feat.color,
                marginBottom: '1.25rem'
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.45rem' }}>{feat.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section style={{
        maxWidth: '1100px',
        margin: '2rem auto 0 auto',
        padding: '4rem 1.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            marginBottom: '0.75rem'
          }}>
            Loved by <span className="text-gradient-purple">Thousands</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
            Here's what our users have to say
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            {
              name: 'Priya Sharma',
              role: 'Daily Commuter, Mumbai',
              text: 'ParkHub has completely changed how I deal with parking in Mumbai. The real-time availability is a game changer — I save 20 minutes every morning!',
              rating: 5
            },
            {
              name: 'Rahul Mehta',
              role: 'Business Owner, Pune',
              text: 'The dynamic pricing is brilliant. I always book during off-peak and save almost 20%. The admin dashboard helps me manage my own lot effortlessly.',
              rating: 5
            },
            {
              name: 'Ananya Desai',
              role: 'Software Engineer, Bangalore',
              text: 'Clean UI, fast bookings, and the cancel-within-5-minutes feature gives me peace of mind. Best parking app I\'ve used in India.',
              rating: 5
            }
          ].map((review, i) => (
            <div
              key={i}
              className="glass-panel card-hover-lift"
              style={{
                padding: '1.75rem',
                position: 'relative'
              }}
            >
              {/* Stars */}
              <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1rem' }}>
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={16} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>

              {/* Quote */}
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.92rem',
                lineHeight: 1.7,
                marginBottom: '1.25rem',
                fontStyle: 'italic'
              }}>
                "{review.text}"
              </p>

              {/* Author */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{review.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{review.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section style={{
        maxWidth: '900px',
        margin: '2rem auto 0 auto',
        padding: '4rem 1.5rem 5rem 1.5rem'
      }}>
        <div className="gradient-border-card">
          <div className="inner" style={{
            textAlign: 'center',
            padding: '3.5rem 2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background glow */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '300px',
              height: '300px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              pointerEvents: 'none'
            }} />

            <h2 style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              marginBottom: '1rem',
              position: 'relative',
              zIndex: 1
            }}>
              Ready to Park <span className="text-gradient">Smarter</span>?
            </h2>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              maxWidth: '500px',
              margin: '0 auto 2rem auto',
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 1
            }}>
              Join thousands of drivers who save time and money with ParkHub's intelligent parking system.
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}>
              {isAuthenticated ? (
                <Link 
                  to={isAdmin ? "/admin/dashboard" : "/dashboard"} 
                  className="btn-premium"
                  style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}
                >
                  <span>Open Dashboard</span>
                  <ChevronRight size={18} />
                </Link>
              ) : (
                <>
                  <Link 
                    to="/register" 
                    className="btn-premium"
                    style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}
                  >
                    <span>Create Free Account</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link 
                    to="/login"
                    className="btn-outline"
                    style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}
                  >
                    <span>Sign In</span>
                  </Link>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              marginTop: '2.5rem',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}>
              {[
                'Free Cancellation under 5 min',
                'Secure UPI Payments',
                'No Hidden Charges'
              ].map((badge, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)'
                }}>
                  <CheckCircle size={14} color="var(--success)" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
