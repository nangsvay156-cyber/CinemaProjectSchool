import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Showtimes() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ movieId: '', roomId: '', date: '', startTime: '', endTime: '', price: 6 });
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const [st, mv, rm] = await Promise.all([
      api.get('/showtimes'), api.get('/movies', { params: { limit: 100, status: '' } }), api.get('/rooms')
    ]);
    setShowtimes(st.data);
    setMovies(mv.data.data);
    setRooms(rm.data);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/showtimes', form);
      setForm({ movieId: '', roomId: '', date: '', startTime: '', endTime: '', price: 6 });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the showtime.');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this showtime?')) return;
    try { await api.delete(`/showtimes/${id}`); load(); }
    catch (err) { alert(err.response?.data?.message || 'Could not delete.'); }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 28 }}>
      <form onSubmit={submit} className="card" style={{ alignSelf: 'start' }}>
        <h3 style={{ marginBottom: 16 }}>Add Showtime</h3>
        <div className="field">
          <label>Movie</label>
          <select className="input" required value={form.movieId} onChange={(e) => setForm({ ...form, movieId: e.target.value })}>
            <option value="">Select a movie</option>
            {movies.map((m) => <option key={m.MovieId} value={m.MovieId}>{m.Title}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Room</label>
          <select className="input" required value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
            <option value="">Select a room</option>
            {rooms.map((r) => <option key={r.RoomId} value={r.RoomId}>{r.RoomName} ({r.Type})</option>)}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Start time</label>
            <input className="input" type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>End time</label>
            <input className="input" type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Base price ($)</label>
          <input className="input" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-full">Add Showtime</button>
      </form>

      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} className="card">
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12.5 }}>
              <th style={{ paddingBottom: 10 }}>Movie</th><th>Room</th><th>Date</th><th>Time</th><th>Price</th><th></th>
            </tr>
          </thead>
          <tbody>
            {showtimes.map((s) => (
              <tr key={s.ShowtimeId} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 0' }}>{s.MovieTitle}</td>
                <td>{s.RoomName}</td>
                <td>{s.Date}</td>
                <td>{s.StartTime?.slice(0, 5)}</td>
                <td>${s.Price}</td>
                <td><button className="btn btn-ghost" onClick={() => remove(s.ShowtimeId)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
