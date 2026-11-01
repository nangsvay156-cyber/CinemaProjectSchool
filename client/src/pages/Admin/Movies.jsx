import { useEffect, useState } from 'react';
import api from '../../api/axios';

const empty = { title: '', description: '', category: 'Action', duration: 120, language: 'English', releaseDate: '', trailer: '', status: 'now_showing' };

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(empty);
  const [posterFile, setPosterFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/movies', { params: { limit: 100, status: '' } });
    setMovies(data.data);
  }

  function edit(m) {
    setEditingId(m.MovieId);
    setForm({
      title: m.Title, description: m.Description || '', category: m.Category || '',
      duration: m.Duration || '', language: m.Language || '', releaseDate: m.ReleaseDate?.slice(0, 10) || '',
      trailer: m.Trailer || '', status: m.Status
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(empty);
    setPosterFile(null);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (posterFile) fd.append('poster', posterFile);

    try {
      if (editingId) await api.put(`/movies/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/movies', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the movie.');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this movie? This cannot be undone.')) return;
    try {
      await api.delete(`/movies/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete.');
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 28 }}>
      <form onSubmit={submit} className="card" style={{ alignSelf: 'start' }}>
        <h3 style={{ marginBottom: 16 }}>{editingId ? 'Edit Movie' : 'Add Movie'}</h3>
        {['title', 'category', 'language', 'trailer'].map((f) => (
          <div className="field" key={f}>
            <label style={{ textTransform: 'capitalize' }}>{f}</label>
            <input className="input" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
          </div>
        ))}
        <div className="field">
          <label>Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Duration (min)</label>
            <input className="input" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Release date</label>
            <input className="input" type="date" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="now_showing">Now Showing</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="ended">Ended</option>
          </select>
        </div>
        <div className="field">
          <label>Poster image</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files[0])} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-full">{editingId ? 'Save Changes' : 'Add Movie'}</button>
          {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', alignContent: 'start' }}>
        {movies.map((m) => (
          <div key={m.MovieId} className="card">
            <h4 style={{ marginBottom: 4 }}>{m.Title}</h4>
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>{m.Category} · {m.Status}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => edit(m)}>Edit</button>
              <button className="btn btn-ghost" onClick={() => remove(m.MovieId)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
