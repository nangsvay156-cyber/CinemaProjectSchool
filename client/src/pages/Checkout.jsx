import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const METHODS = [
  { id: 'cash', label: 'Cash at Counter' },
  { id: 'aba_pay', label: 'ABA Pay' },
  { id: 'acleda', label: 'ACLEDA' },
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'MasterCard' },
  { id: 'qr', label: 'QR Payment' }
];

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [method, setMethod] = useState('aba_pay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(600);

  useEffect(() => { load(); }, [bookingId]);
  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    const { data } = await api.get(`/bookings/${bookingId}`);
    setBooking(data);
  }

  async function pay() {
    setLoading(true);
    setError('');
    try {
      await api.post('/payments', { bookingId: Number(bookingId), method });
      navigate(`/my-tickets`, { state: { justBooked: bookingId } });
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  }

  if (!booking) return <div className="container" style={{ paddingTop: 60 }}><div className="spinner" /></div>;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 520 }}>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>Complete Payment</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Seats held for <strong style={{ color: secondsLeft < 60 ? 'var(--red)' : 'var(--gold)' }}>{mm}:{ss}</strong>
      </p>

      <div className="card film-strip-edge" style={{ padding: '28px 20px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, marginBottom: 6 }}>{booking.MovieTitle}</h3>
        <p className="muted">{booking.RoomName} · {booking.Date} · {booking.StartTime?.slice(0, 5)}</p>
        <p style={{ marginTop: 12 }}>Total: <strong style={{ color: 'var(--gold)' }}>${Number(booking.TotalPrice).toFixed(2)}</strong></p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ marginBottom: 12 }}>Payment method</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className="btn"
              style={{
                justifyContent: 'flex-start',
                background: method === m.id ? 'rgba(232,184,74,0.15)' : 'var(--surface-2)',
                border: `1.5px solid ${method === m.id ? 'var(--gold)' : 'var(--border)'}`,
                color: 'var(--text)'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      <button className="btn btn-gold btn-full" disabled={loading || secondsLeft === 0} onClick={pay}>
        {loading ? 'Processing…' : `Pay $${Number(booking.TotalPrice).toFixed(2)}`}
      </button>
      {secondsLeft === 0 && <p className="error-text">Your seat hold expired. Please book again.</p>}
    </div>
  );
}
