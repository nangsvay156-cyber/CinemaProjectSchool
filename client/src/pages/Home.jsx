import { useEffect, useState } from 'react';
import api from '../api/axios';
import MovieCard from '../components/MovieCard';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('now_showing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => loadMovies(), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [search, category, status]);

  async function loadMovies() {
    setLoading(true);
    try {
      const { data } = await api.get('/movies', { params: { search, category, status, limit: 24 } });
      setMovies(data.data);
      if (!featured && data.data.length) setFeatured(data.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {featured && (
        <section style={{
          position: 'relative', minHeight: 360, display: 'flex', alignItems: 'flex-end',
          backgroundImage: `linear-gradient(180deg, rgba(16,11,22,0.3), var(--bg) 92%), url(${featured.Poster || ''})`,
          backgroundSize: 'cover', backgroundPosition: 'center 20%', borderBottom: '1px solid var(--border)'
        }}>
          <div className="container" style={{ paddingBottom: 40, paddingTop: 60 }}>
            <span className="badge badge-red" style={{ marginBottom: 12 }}>Now Showing</span>
            <h1 style={{ fontSize: 52, lineHeight: 1, textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}>{featured.Title}</h1>
            <p className="muted" style={{ maxWidth: 560, margin: '12px 0 20px' }}>{featured.Description}</p>
            <a href={`/movies/${featured.MovieId}`} className="btn btn-primary">Book Tickets</a>
          </div>
        </section>
      )}

      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
          <input
            className="input" placeholder="Search movies…" style={{ maxWidth: 260 }}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" style={{ maxWidth: 180 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            <option>Action</option><option>Comedy</option><option>Horror</option>
            <option>Drama</option><option>Animation</option><option>Sci-Fi</option>
          </select>
          <select className="input" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="now_showing">Now Showing</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="">All</option>
          </select>
        </div>

        {loading ? (
          <div className="spinner" style={{ margin: '60px auto' }} />
        ) : movies.length === 0 ? (
          <p className="muted">No movies match your search yet.</p>
        ) : (
          <div className="grid grid-movies">
            {movies.map((m) => <MovieCard key={m.MovieId} movie={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}
