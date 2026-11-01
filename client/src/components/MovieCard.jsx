import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  const poster = movie.Poster
    ? (movie.Poster.startsWith('http') ? movie.Poster : movie.Poster)
    : 'https://placehold.co/300x450/1B1420/A79AB3?text=No+Poster';

  return (
    <Link to={`/movies/${movie.MovieId}`} className="card" style={{ padding: 0, overflow: 'hidden', display: 'block' }}>
      <div style={{ position: 'relative' }}>
        <img src={poster} alt={movie.Title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
        <span className="badge badge-gold" style={{ position: 'absolute', top: 10, right: 10 }}>
          ★ {Number(movie.Rating || 0).toFixed(1)}
        </span>
      </div>
      <div style={{ padding: 14 }}>
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>{movie.Title}</h3>
        <div className="muted" style={{ fontSize: 12.5 }}>
          {movie.Category} · {movie.Duration} min
        </div>
      </div>
    </Link>
  );
}
