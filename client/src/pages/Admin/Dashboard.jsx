import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data));
  }, []);

  if (!stats) return <div className="spinner" />;

  const cards = [
    { label: 'Total Movies', value: stats.totalMovies },
    { label: 'Customers', value: stats.totalCustomers },
    { label: 'Confirmed Bookings', value: stats.confirmedBookings },
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}` }
  ];

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 32 }}>
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="muted" style={{ fontSize: 13 }}>{c.label}</p>
            <p style={{ fontSize: 30, fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Top Selling Movies</h3>
        {stats.topMovies.length === 0 ? <p className="muted">No sales data yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {stats.topMovies.map((m, i) => (
                <tr key={m.Title} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-muted)' }}>#{i + 1}</td>
                  <td style={{ padding: '10px 0' }}>{m.Title}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>{m.TicketsSold} tickets</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
