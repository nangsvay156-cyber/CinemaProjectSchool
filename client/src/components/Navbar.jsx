import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(16,11,22,0.9)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(6px)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" className="display" style={{ fontSize: 26, color: 'var(--gold)', letterSpacing: '0.06em' }}>
          Angkor<span style={{ color: 'var(--red)' }}>Shadow</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" className="muted">Movies</Link>
          {user && <Link to="/my-tickets" className="muted">My Tickets</Link>}
          {isAdmin && <Link to="/admin" className="muted">Admin</Link>}

          {user ? (
            <>
              <span style={{ fontSize: 14 }}>Hi, {user.fullName.split(' ')[0]}</span>
              <button className="btn btn-outline" onClick={() => { logout(); navigate('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Log in</Link>
              <Link to="/register" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
