const db = require('../config/db');

// GET /api/movies?search=&category=&language=&status=&page=&limit=
exports.getAll = async (req, res) => {
  try {
    const { search, category, language, status, page = 1, limit = 12 } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(Title LIKE ? OR Description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) { conditions.push('Category = ?'); params.push(category); }
    if (language) { conditions.push('Language = ?'); params.push(language); }
    if (status) { conditions.push('Status = ?'); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await db.query(
      `SELECT * FROM movies ${where} ORDER BY ReleaseDate DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM movies ${where}`, params);

    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load movies.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM movies WHERE MovieId = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Movie not found.' });

    const [reviews] = await db.query(
      `SELECT r.ReviewId, r.Rating, r.Comment, r.CreatedAt, u.FullName
       FROM reviews r JOIN users u ON u.UserId = r.UserId
       WHERE r.MovieId = ? ORDER BY r.CreatedAt DESC`,
      [req.params.id]
    );

    res.json({ ...rows[0], reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load the movie.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, category, duration, language, releaseDate, trailer, status } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    const poster = req.file ? `/uploads/posters/${req.file.filename}` : (req.body.poster || null);

    const [result] = await db.query(
      `INSERT INTO movies (Title, Description, Category, Duration, Language, ReleaseDate, Poster, Trailer, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, category || null, duration || null, language || null,
       releaseDate || null, poster, trailer || null, status || 'now_showing']
    );
    res.status(201).json({ message: 'Movie added.', movieId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add the movie.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description, category, duration, language, releaseDate, trailer, status } = req.body;
    const [existing] = await db.query('SELECT * FROM movies WHERE MovieId = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Movie not found.' });

    const poster = req.file ? `/uploads/posters/${req.file.filename}` : (req.body.poster ?? existing[0].Poster);

    await db.query(
      `UPDATE movies SET Title=?, Description=?, Category=?, Duration=?, Language=?, ReleaseDate=?,
       Poster=?, Trailer=?, Status=? WHERE MovieId=?`,
      [title ?? existing[0].Title, description ?? existing[0].Description, category ?? existing[0].Category,
       duration ?? existing[0].Duration, language ?? existing[0].Language, releaseDate ?? existing[0].ReleaseDate,
       poster, trailer ?? existing[0].Trailer, status ?? existing[0].Status, req.params.id]
    );
    res.json({ message: 'Movie updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update the movie.' });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM movies WHERE MovieId = ?', [req.params.id]);
    res.json({ message: 'Movie deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete the movie. It may still have active showtimes.' });
  }
};

// ---- Reviews ----
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5.' });

    await db.query(
      `INSERT INTO reviews (MovieId, UserId, Rating, Comment) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE Rating = VALUES(Rating), Comment = VALUES(Comment)`,
      [req.params.id, req.user.userId, rating, comment || null]
    );
    const [[{ avg }]] = await db.query('SELECT AVG(Rating) AS avg FROM reviews WHERE MovieId = ?', [req.params.id]);
    await db.query('UPDATE movies SET Rating = ? WHERE MovieId = ?', [Number(avg).toFixed(1), req.params.id]);

    res.json({ message: 'Review saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save the review.' });
  }
};

// ---- Favorites ----
exports.toggleFavorite = async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT * FROM favorites WHERE UserId = ? AND MovieId = ?',
      [req.user.userId, req.params.id]
    );
    if (existing.length) {
      await db.query('DELETE FROM favorites WHERE UserId = ? AND MovieId = ?', [req.user.userId, req.params.id]);
      return res.json({ favorited: false });
    }
    await db.query('INSERT INTO favorites (UserId, MovieId) VALUES (?, ?)', [req.user.userId, req.params.id]);
    res.json({ favorited: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update favorites.' });
  }
};

exports.getMyFavorites = async (req, res) => {
  const [rows] = await db.query(
    `SELECT m.* FROM favorites f JOIN movies m ON m.MovieId = f.MovieId
     WHERE f.UserId = ? ORDER BY f.CreatedAt DESC`,
    [req.user.userId]
  );
  res.json(rows);
};
