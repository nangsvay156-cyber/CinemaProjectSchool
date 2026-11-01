import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.fullName, form.email, form.password, form.phone);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 64 }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Create your account</h1>
      <p className="muted" style={{ marginBottom: 28 }}>Join to start booking tickets.</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Full name</label>
          <input className="input" required value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Phone (optional)</label>
          <input className="input" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" required minLength={6} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--gold)' }}>Log in</Link>
      </p>
    </div>
  );
}
