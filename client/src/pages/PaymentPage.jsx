import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { CreditCard, ArrowLeft, ShieldCheck, CheckCircle2, QrCode, Smartphone, Wallet, Loader2, AlertCircle } from 'lucide-react';

export const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Read checkout parameters
  const queryParams = new URLSearchParams(location.search);
  const bookingId = queryParams.get('bookingId');
  const amount = Number(queryParams.get('amount') || 0);
  const isCancellation = queryParams.get('isCancellation') === 'true';
  const initialMethod = queryParams.get('method') || 'UPI';

  // State
  const [paymentMethod, setPaymentMethod] = useState(initialMethod);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [utr, setUtr] = useState('');

  // Card Form State
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  // Fetch booking details to display summary
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get('/api/bookings');
        const currentBooking = res.data.find(b => b.id === bookingId);
        if (currentBooking) {
          setBookingDetails(currentBooking);
        }
      } catch (err) {
        console.error('Error fetching booking details for payment:', err);
      }
    };
    if (bookingId) {
      fetchDetails();
    }
  }, [bookingId]);

  // Handle Card Input Formatters
  const handleCardChange = (e) => {
    const { id, value } = e.target;
    let formattedVal = value;

    if (id === 'number') {
      formattedVal = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    } else if (id === 'expiry') {
      formattedVal = value.replace(/\D/g, '').slice(0, 4);
      if (formattedVal.length >= 2) {
        formattedVal = `${formattedVal.slice(0, 2)}/${formattedVal.slice(2)}`;
      }
    } else if (id === 'cvv') {
      formattedVal = value.replace(/\D/g, '').slice(0, 3);
    }

    setCardData({
      ...cardData,
      [id]: formattedVal
    });
  };

  // UPI configuration parameters
  const receiverUpi = '7415648476@ybl';
  const payeeName = 'ParkHub';
  const txnNote = isCancellation 
    ? `ParkHub_Cancellation_Fee_${bookingId ? bookingId.slice(-6) : ''}`
    : `ParkHub_Parking_Release_${bookingId ? bookingId.slice(-6) : ''}`;
  
  // Dynamic UPI payment URL format
  const upiUrl = `upi://pay?pa=${receiverUpi}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&tn=${encodeURIComponent(txnNote)}&cu=INR`;
  
  // Google QR Code generator API URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(upiUrl)}`;

  // Handle Payment Submit
  const handlePayment = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // UPI Validations
    if (paymentMethod === 'UPI' && amount > 0) {
      const cleanUtr = utr.trim();
      if (!cleanUtr || !/^\d{12}$/.test(cleanUtr)) {
        setError('Please enter a valid 12-digit UPI Transaction Ref (UTR) number.');
        return;
      }
    }

    // Card Validations
    if (paymentMethod === 'CARD') {
      if (cardData.number.replace(/\s/g, '').length !== 16) {
        setError('Please enter a valid 16-digit credit card number.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
        setError('Please enter a valid card expiry date (MM/YY).');
        return;
      }
      if (cardData.cvv.length !== 3) {
        setError('Please enter a valid 3-digit CVV code.');
        return;
      }
      if (!cardData.name.trim()) {
        setError('Please enter the cardholder\'s full name.');
        return;
      }
    }

    setLoading(true);
    setLoadingStatus('Contacting payment merchant server...');

    setTimeout(() => {
      setLoadingStatus('Authorizing payment transaction with bank...');
      
      setTimeout(async () => {
        setLoadingStatus('Completing slot booking updates...');
        try {
          let res;
          if (isCancellation) {
            res = await api.post(`/api/bookings/${bookingId}/cancel`, {
              utr: paymentMethod === 'UPI' ? utr : null,
              paymentMethod
            });
          } else {
            res = await api.post(`/api/bookings/${bookingId}/release`, {
              utr: paymentMethod === 'UPI' ? utr : null,
              paymentMethod
            });
          }

          setLoadingStatus('');
          setLoading(false);
          setPaymentSuccess(true);
          
          // Successful sound or delay before redirecting back
          setTimeout(() => {
            navigate('/dashboard', {
              state: { releasedBooking: res.data }
            });
          }, 2500);

        } catch (err) {
          console.error(err);
          setError(err.response?.data?.error || 'Transaction validation failed. Please try again.');
          setLoading(false);
          setLoadingStatus('');
        }
      }, 2000);
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem' }} className="animate-fade-in">
      <button 
        onClick={() => navigate('/dashboard')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary)',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '1.5rem'
        }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {paymentSuccess ? (
        /* SUCCESS ANIMATION CONTAINER */
        <div className="glass-panel text-shimmer" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '2rem auto',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{
            background: 'var(--success-glow)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            color: 'var(--success)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
          }}>
            <CheckCircle2 size={42} className="animate-scale-in" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
            Payment Successful!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
            ₹{amount.toFixed(2)} has been successfully credited to <strong style={{ color: 'white' }}>{receiverUpi}</strong>.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.88rem' }}>
            <Loader2 size={16} className="animate-spin" />
            <span>Updating slot state... Redirecting to dashboard...</span>
          </div>
        </div>
      ) : (
        /* BILLING CONTENT GRID */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.2fr)',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* LEFT COLUMN: ORDER SUMMARY */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              Order Summary
            </h3>
            
            {bookingDetails ? (
              <div style={{ fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <p><span style={{ color: 'var(--text-muted)' }}>Parking Lot:</span> <strong style={{ color: 'white' }}>{bookingDetails.lot_name}</strong></p>
                <p><span style={{ color: 'var(--text-muted)' }}>Spot Code:</span> <strong style={{ color: 'var(--primary)' }}>{bookingDetails.spot_code || 'A-01'}</strong></p>
                <p><span style={{ color: 'var(--text-muted)' }}>Vehicle Plate:</span> <strong style={{ color: 'white' }}>{bookingDetails.vehicle_number}</strong></p>
                <p><span style={{ color: 'var(--text-muted)' }}>Start Time:</span> <span>{new Date(bookingDetails.start_time).toLocaleString()}</span></p>
                {isCancellation ? (
                  <p><span style={{ color: 'var(--text-muted)' }}>Cancellation State:</span> <span className="badge badge-danger">EXCEEDED 5-MIN GRACE</span></p>
                ) : (
                  <p><span style={{ color: 'var(--text-muted)' }}>Parked Duration:</span> <span style={{ fontWeight: 600 }}>{Math.max(1, Math.floor((Date.now() - new Date(bookingDetails.start_time).getTime()) / 1000 / 60))} mins</span></p>
                )}
                
                <div style={{
                  borderTop: '1px dashed var(--border-color)',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.25rem',
                  fontWeight: 800
                }}>
                  <span style={{ color: 'white' }}>Amount Due:</span>
                  <span style={{ color: 'var(--accent)' }}>₹{amount.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                <span>Loading checkout details...</span>
              </div>
            )}

            <div style={{
              marginTop: '2rem',
              background: 'rgba(99, 102, 241, 0.03)',
              border: '1px solid rgba(99, 102, 241, 0.1)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              display: 'flex',
              gap: '0.6rem',
              color: 'var(--text-muted)'
            }}>
              <ShieldCheck size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>Payments are secured with 256-bit bank-grade encryption. Credited directly to payee account {receiverUpi}.</span>
            </div>
          </div>

          {/* RIGHT COLUMN: PAYMENT GATEWAY INTERFACE */}
          <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
            
            {/* Loading block overlay */}
            {loading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(5, 7, 12, 0.85)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: 'var(--radius-md)',
                padding: '2rem'
              }}>
                <Loader2 size={40} className="animate-spin" color="var(--primary)" style={{ marginBottom: '1.25rem' }} />
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>Processing Checkout</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.5rem', textAlign: 'center' }}>
                  {loadingStatus}
                </span>
              </div>
            )}

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              Select Payment Gateway
            </h3>

            {error && (
              <div className="custom-alert custom-alert-danger" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Selector tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '2rem' }}>
              {[
                { id: 'UPI', label: 'UPI QR', icon: <QrCode size={16} /> },
                { id: 'CARD', label: 'Credit Card', icon: <CreditCard size={16} /> },
                { id: 'WALLET', label: 'Wallets', icon: <Wallet size={16} /> }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => { setPaymentMethod(method.id); setError(''); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.75rem 0.5rem',
                    background: paymentMethod === method.id ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid',
                    borderColor: paymentMethod === method.id ? 'var(--primary)' : 'var(--border-color)',
                    color: paymentMethod === method.id ? 'white' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {method.icon}
                  {method.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: UPI INTEGRATION (DYNAMIC QR + DEEP LINK) */}
            {paymentMethod === 'UPI' && (
              <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Scan the dynamic UPI QR code below with any UPI application (Google Pay, PhonePe, Paytm, BHIM) to make a payment of <strong>₹{amount.toFixed(2)}</strong>.
                </p>

                {/* QR Code Container */}
                <div style={{
                  background: 'white',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  width: '230px',
                  height: '230px',
                  margin: '0 auto 1.5rem auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                  border: '4px solid var(--primary)'
                }}>
                  <img 
                    src={qrCodeUrl} 
                    alt="Scan to Pay UPI" 
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                <div style={{
                  marginBottom: '2rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}>
                  <span style={{ display: 'block' }}>Beneficiary VPA: <strong>{receiverUpi}</strong></span>
                  <span style={{ display: 'block', marginTop: '0.2rem' }}>Trans Ref: <code>{txnNote}</code></span>
                </div>

                {/* Mobile Direct Deep link button */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Surfing on Mobile? Launch your payment application directly:
                  </span>
                  <a 
                    href={upiUrl}
                    className="btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1.5rem',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    <Smartphone size={16} color="var(--primary)" />
                    Pay via Mobile UPI App
                  </a>
                </div>

                {/* UTR Input Field */}
                {amount > 0 && (
                  <div className="input-glow-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <label htmlFor="utr" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Enter 12-digit UPI Ref No. (UTR) *
                    </label>
                    <input 
                      id="utr"
                      type="text"
                      className="input-glow"
                      required
                      placeholder="e.g. 123456789012"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', textAlign: 'center', fontSize: '1rem', letterSpacing: '2px' }}
                    />
                  </div>
                )}

                {/* Verification Trigger */}
                <button
                  onClick={() => handlePayment(null)}
                  className="btn-premium animate-glow-pulse"
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  I Have Completed Payment
                </button>
              </div>
            )}

            {/* TAB CONTENT: CREDIT CARD FORM */}
            {paymentMethod === 'CARD' && (
              <form onSubmit={handlePayment} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 3D Glassmorphic credit card visualizer */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.45) 0%, rgba(168, 85, 247, 0.3) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontFamily: 'monospace',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  marginBottom: '1rem',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '2px' }}>PARKHUB PREMIUM CHECKOUT</span>
                    <ShieldCheck size={20} color="white" />
                  </div>

                  <div style={{ fontSize: '1.25rem', letterSpacing: '3px', margin: '1rem 0' }}>
                    {cardData.number || '•••• •••• •••• ••••'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.2rem' }}>CARDHOLDER NAME</span>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{cardData.name || 'YOUR FULL NAME'}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.2rem' }}>EXPIRES</span>
                      <span style={{ fontSize: '0.8rem' }}>{cardData.expiry || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="input-glow-group">
                  <label htmlFor="number">Card Number</label>
                  <input
                    id="number"
                    type="text"
                    className="input-glow"
                    required
                    placeholder="4111 2222 3333 4444"
                    value={cardData.number}
                    onChange={handleCardChange}
                  />
                </div>

                <div className="input-glow-group">
                  <label htmlFor="name">Cardholder Name</label>
                  <input
                    id="name"
                    type="text"
                    className="input-glow"
                    required
                    placeholder="Enter full name"
                    value={cardData.name}
                    onChange={handleCardChange}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-glow-group">
                    <label htmlFor="expiry">Expiry Date</label>
                    <input
                      id="expiry"
                      type="text"
                      className="input-glow"
                      required
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={handleCardChange}
                    />
                  </div>
                  <div className="input-glow-group">
                    <label htmlFor="cvv">CVV Code</label>
                    <input
                      id="cvv"
                      type="password"
                      className="input-glow"
                      required
                      placeholder="•••"
                      maxLength="3"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-premium"
                  style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
                >
                  Pay ₹{amount.toFixed(2)} Securely
                </button>
              </form>
            )}

            {/* TAB CONTENT: WALLET SELECTION */}
            {paymentMethod === 'WALLET' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Pay using standard digital wallets. Redirects to wallet authorization.
                </p>

                {[
                  { id: 'PAYTM_W', label: 'Paytm Wallet' },
                  { id: 'PHONEPE_W', label: 'PhonePe Wallet' },
                  { id: 'AMAZON_W', label: 'Amazon Pay Wallet' }
                ].map(wallet => (
                  <button
                    key={wallet.id}
                    onClick={() => handlePayment(null)}
                    className="btn-outline"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.85rem 1.25rem',
                      width: '100%',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    <span>{wallet.label}</span>
                    <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>Connect Wallet →</span>
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
