import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/movies', label: 'Movies' },
  { to: '/admin/rooms', label: 'Rooms & Seats' },
  { to: '/admin/showtimes', label: 'Showtimes' },
  { to: '/admin/promos', label: 'Promo Codes' }
];

export default function AdminLayout() {
  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 30, marginBottom: 20 }}>Admin Dashboard</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <NavLink
            key={t.to} to={t.to} end={t.end}
            style={({ isActive }) => ({
              padding: '10px 16px', fontSize: 14, fontWeight: 600,
              borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
              color: isActive ? 'var(--gold)' : 'var(--text-muted)'
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
