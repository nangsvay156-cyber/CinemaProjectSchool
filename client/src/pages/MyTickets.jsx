import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function MyTickets() {
  const [bookings, setBookings] = useState([]);
  const [qrModal, setQrModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/bookings/my');
    setBookings(data);
    setLoading(false);
  }

  async function cancelBooking(id) {
    if (!confirm('Cancel this booking?')) return;
    await api.put(`/bookings/${id}/cancel`);
    load();
  }

  async function showQr(id) {
    const { data } = await api.get(`/tickets/${id}/qr`);
    setQrModal({ ...data, bookingId: id });
  }

  const statusColor = { confirmed: 'badge-green', pending: 'badge-gold', cancelled: 'badge-red', expired: 'badge-red' };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 30, marginBottom: 24 }}>My Tickets</h1>

      {loading ? <div className="spinner" /> : bookings.length === 0 ? (
        <p className="muted">You haven't booked any tickets yet.</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {bookings.map((b) => (
            <div key={b.BookingId} className="card film-strip-edge" style={{ padding: '26px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: 18 }}>{b.MovieTitle}</h3>
                <span className={`badge ${statusColor[b.Status] || 'badge-gold'}`}>{b.Status}</span>
              </div>
              <p className="muted" style={{ marginTop: 6 }}>{b.RoomName} · {b.Date} · {b.StartTime?.slice(0, 5)}</p>
              <p style={{ marginTop: 8 }}>Seats: <strong>{b.Seats}</strong></p>
              <p className="muted" style={{ marginTop: 4 }}>Total: ${Number(b.TotalPrice).toFixed(2)}</p>

              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                {b.Status === 'pending' && (
                  <a href={`/checkout/${b.BookingId}`} className="btn btn-gold">Pay Now</a>
                )}
                {b.Status === 'confirmed' && (
                  <>
                    <button className="btn btn-outline" onClick={() => showQr(b.BookingId)}>Show QR</button>
                    <a className="btn btn-outline" href={`/api/tickets/${b.BookingId}/pdf`} target="_blank" rel="noreferrer">
                      Download PDF
                    </a>
                  </>
                )}
                {(b.Status === 'pending' || b.Status === 'confirmed') && (
                  <button className="btn btn-ghost" onClick={() => cancelBooking(b.BookingId)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {qrModal && (
        <div onClick={() => setQrModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ textAlign: 'center', maxWidth: 320 }}>
            <h3 style={{ marginBottom: 16 }}>Entry Ticket</h3>
            <img src={qrModal.qr} alt="Ticket QR" style={{ width: 220, borderRadius: 8 }} />
            <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
              {qrModal.ticket.MovieTitle} · {qrModal.ticket.Seats}
            </p>
            <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setQrModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
