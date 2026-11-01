import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function toEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [favorited, setFavorited] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data } = await api.get(`/movies/${id}`);
    setMovie(data);
    const st = await api.get('/showtimes', { params: { movieId: id } });
    setShowtimes(st.data);
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    await api.post(`/movies/${id}/reviews`, { rating, comment });
    setComment('');
    load();
  }

  async function toggleFavorite() {
    if (!user) return navigate('/login');
    const { data } = await api.post(`/movies/${id}/favorite`);
    setFavorited(data.favorited);
  }

  if (!movie) return <div className="container" style={{ paddingTop: 60 }}><div className="spinner" /></div>;

  const byDate = showtimes.reduce((acc, s) => {
    acc[s.Date] = acc[s.Date] || [];
    acc[s.Date].push(s);
    return acc;
  }, {});

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>
        <img
          src={movie.Poster || 'https://placehold.co/300x450/1B1420/A79AB3?text=No+Poster'}
          alt={movie.Title}
          style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }}
        />
        <div>
          <span className="badge badge-gold">★ {Number(movie.Rating || 0).toFixed(1)}</span>
          <h1 style={{ fontSize: 40, margin: '10px 0' }}>{movie.Title}</h1>
          <p className="muted" style={{ marginBottom: 10 }}>
            {movie.Category} · {movie.Duration} min · {movie.Language} · {movie.ReleaseDate?.slice(0, 10)}
          </p>
          <p style={{ maxWidth: 620, lineHeight: 1.6 }}>{movie.Description}</p>
          <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={toggleFavorite}>
            {favorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
          </button>

          {movie.Trailer && (
            <div style={{ marginTop: 24, aspectRatio: '16/9', maxWidth: 560 }}>
              <iframe
                src={toEmbedUrl(movie.Trailer)} title="Trailer" width="100%" height="100%"
                style={{ border: 'none', borderRadius: 10 }} allowFullScreen
              />
            </div>
          )}
        </div>
      </div>

      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 26, marginBottom: 18 }}>Showtimes</h2>
        {Object.keys(byDate).length === 0 && <p className="muted">No showtimes scheduled yet.</p>}
        {Object.entries(byDate).map(([date, times]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <p className="muted" style={{ marginBottom: 10 }}>{date}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {times.map((t) => (
                <button key={t.ShowtimeId} className="btn btn-outline"
                  onClick={() => navigate(`/booking/${t.ShowtimeId}`)}>
                  {t.StartTime.slice(0, 5)} · {t.RoomName} ({t.RoomType}) · ${t.Price}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 48, maxWidth: 640 }}>
        <h2 style={{ fontSize: 26, marginBottom: 18 }}>Reviews</h2>
        <form onSubmit={submitReview} className="card" style={{ marginBottom: 24 }}>
          <div className="field">
            <label>Your rating</label>
            <select className="input" value={rating} onChange={(e) => setRating(e.target.value)} style={{ maxWidth: 120 }}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          <div className="field">
            <label>Comment</label>
            <textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <button className="btn btn-primary">Submit Review</button>
        </form>

        {movie.reviews?.length === 0 && <p className="muted">Be the first to review this movie.</p>}
        {movie.reviews?.map((r) => (
          <div key={r.ReviewId} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{r.FullName}</strong>
              <span className="badge badge-gold">{r.Rating} ★</span>
            </div>
            {r.Comment && <p className="muted" style={{ marginTop: 8 }}>{r.Comment}</p>}
          </div>
        ))}
      </section>
    </div>
  );
}
