import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';

export default function SeatSelection() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [showtimeId]);

  async function load() {
    const res = await api.get(`/showtimes/${showtimeId}/seats`);
    setData(res.data);
  }

  function toggle(seat) {
    setSelected((prev) =>
      prev.includes(seat.SeatId) ? prev.filter((id) => id !== seat.SeatId) : [...prev, seat.SeatId]
    );
  }

  const selectedSeats = data?.seats.filter((s) => selected.includes(s.SeatId)) || [];
  const total = selectedSeats.reduce((sum, s) => sum + Number(data.showtime.Price) + Number(s.Price), 0);

  async function confirmSelection() {
    if (!user) return navigate('/login', { state: { from: `/booking/${showtimeId}` } });
    if (!selected.length) return setError('Select at least one seat.');
    setLoading(true);
    setError('');
    try {
      const { data: booking } = await api.post('/bookings', { showtimeId: Number(showtimeId), seatIds: selected, promoCode: promoCode || undefined });
      navigate(`/checkout/${booking.bookingId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reserve those seats.');
      load();
      setSelected([]);
    } finally {
      setLoading(false);
    }
  }

  if (!data) return <div className="container" style={{ paddingTop: 60 }}><div className="spinner" /></div>;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 30, marginBottom: 4 }}>Select Your Seats</h1>
      <p className="muted" style={{ marginBottom: 32 }}>
        {data.showtime.Date} · {data.showtime.StartTime.slice(0, 5)}
      </p>

      <SeatMap seats={data.seats} selected={selected} onToggle={toggle} />

      <div className="card" style={{ maxWidth: 420, margin: '40px auto 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="muted">Seats</span>
          <span>{selectedSeats.map((s) => s.SeatNumber).join(', ') || '—'}</span>
        </div>
        <div className="field">
          <label>Promo code (optional)</label>
          <input className="input" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, marginBottom: 16 }}>
          <strong>Total</strong>
          <strong style={{ color: 'var(--gold)' }}>${total.toFixed(2)}</strong>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-full" disabled={loading || !selected.length} onClick={confirmSelection}>
          {loading ? 'Reserving…' : 'Continue to Payment'}
        </button>
      </div>
    </div>
  );
}
