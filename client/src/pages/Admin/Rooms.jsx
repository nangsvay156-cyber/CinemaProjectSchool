import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ roomName: '', type: '2D', capacity: 60 });
  const [layoutRoom, setLayoutRoom] = useState(null);
  const [layout, setLayout] = useState({ rowCount: 5, seatsPerRow: 10, vipRows: 'A', coupleRows: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/rooms');
    setRooms(data);
  }

  async function addRoom(e) {
    e.preventDefault();
    await api.post('/rooms', form);
    setForm({ roomName: '', type: '2D', capacity: 60 });
    load();
  }

  async function removeRoom(id) {
    if (!confirm('Delete this room?')) return;
    try { await api.delete(`/rooms/${id}`); load(); }
    catch (err) { alert(err.response?.data?.message || 'Could not delete.'); }
  }

  async function generateLayout(e) {
    e.preventDefault();
    const rowLetters = Array.from({ length: Number(layout.rowCount) }, (_, i) => String.fromCharCode(65 + i));
    await api.post(`/rooms/${layoutRoom}/seats/layout`, {
      rows: rowLetters,
      seatsPerRow: Number(layout.seatsPerRow),
      vipRows: layout.vipRows.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
      coupleRows: layout.coupleRows.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    });
    alert('Seat layout generated.');
    setLayoutRoom(null);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 28 }}>
      <form onSubmit={addRoom} className="card" style={{ alignSelf: 'start' }}>
        <h3 style={{ marginBottom: 16 }}>Add Cinema Room</h3>
        <div className="field">
          <label>Room name</label>
          <input className="input" required value={form.roomName} onChange={(e) => setForm({ ...form, roomName: e.target.value })} />
        </div>
        <div className="field">
          <label>Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>2D</option><option>3D</option><option>IMAX</option>
          </select>
        </div>
        <div className="field">
          <label>Capacity</label>
          <input className="input" type="number" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-full">Add Room</button>
      </form>

      <div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: 24 }}>
          {rooms.map((r) => (
            <div key={r.RoomId} className="card">
              <h4>{r.RoomName}</h4>
              <p className="muted" style={{ fontSize: 12.5, margin: '4px 0 12px' }}>{r.Type} · {r.Capacity} seats</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" onClick={() => setLayoutRoom(r.RoomId)}>Seat Layout</button>
                <button className="btn btn-ghost" onClick={() => removeRoom(r.RoomId)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {layoutRoom && (
          <form onSubmit={generateLayout} className="card" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 6 }}>Generate Seat Layout</h3>
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 16 }}>This replaces any existing seats for this room.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Number of rows</label>
                <input className="input" type="number" value={layout.rowCount} onChange={(e) => setLayout({ ...layout, rowCount: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Seats per row</label>
                <input className="input" type="number" value={layout.seatsPerRow} onChange={(e) => setLayout({ ...layout, seatsPerRow: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>VIP rows (comma separated, e.g. A,B)</label>
              <input className="input" value={layout.vipRows} onChange={(e) => setLayout({ ...layout, vipRows: e.target.value })} />
            </div>
            <div className="field">
              <label>Couple rows (comma separated)</label>
              <input className="input" value={layout.coupleRows} onChange={(e) => setLayout({ ...layout, coupleRows: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-full">Generate</button>
              <button type="button" className="btn btn-outline" onClick={() => setLayoutRoom(null)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
