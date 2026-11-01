import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 64 }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Welcome back</h1>
      <p className="muted" style={{ marginBottom: 28 }}>Log in to book your next show.</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
        No account yet? <Link to="/register" style={{ color: 'var(--gold)' }}>Sign up</Link>
      </p>
      <p className="muted" style={{ marginTop: 8, textAlign: 'center', fontSize: 12.5 }}>
        Admin demo: admin@cinema.com / Admin@123
      </p>
    </div>
  );
}
