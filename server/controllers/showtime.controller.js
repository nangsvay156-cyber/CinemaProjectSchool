const db = require('../config/db');

// GET /api/showtimes?movieId=&date=&roomId=
exports.getAll = async (req, res) => {
  const { movieId, date, roomId } = req.query;
  const conditions = ["s.Status = 'scheduled'"];
  const params = [];
  if (movieId) { conditions.push('s.MovieId = ?'); params.push(movieId); }
  if (date) { conditions.push('s.Date = ?'); params.push(date); }
  if (roomId) { conditions.push('s.RoomId = ?'); params.push(roomId); }

  const [rows] = await db.query(
    `SELECT s.*, m.Title AS MovieTitle, m.Poster, m.Duration, r.RoomName, r.Type AS RoomType
     FROM showtimes s
     JOIN movies m ON m.MovieId = s.MovieId
     JOIN cinema_rooms r ON r.RoomId = s.RoomId
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.Date, s.StartTime`,
    params
  );
  res.json(rows);
};

exports.getById = async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.*, m.Title AS MovieTitle, m.Poster, m.Duration, r.RoomName, r.Type AS RoomType
     FROM showtimes s
     JOIN movies m ON m.MovieId = s.MovieId
     JOIN cinema_rooms r ON r.RoomId = s.RoomId
     WHERE s.ShowtimeId = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Showtime not found.' });
  res.json(rows[0]);
};

// GET /api/showtimes/:id/seats -> real-time seat map with availability
exports.getSeatMap = async (req, res) => {
  const [showtime] = await db.query('SELECT * FROM showtimes WHERE ShowtimeId = ?', [req.params.id]);
  if (!showtime.length) return res.status(404).json({ message: 'Showtime not found.' });

  // A seat only counts as "held" while its booking is confirmed, or pending
  // and still inside the 10-minute auto-lock window (Auto Lock Seat feature).
  const [seats] = await db.query(
    `SELECT se.SeatId, se.SeatNumber, se.SeatType, se.Price, se.Status,
            CASE WHEN held.SeatId IS NULL THEN 'available' ELSE 'booked' END AS Availability
     FROM seats se
     LEFT JOIN (
        SELECT bs.SeatId FROM booking_seats bs
        JOIN bookings b ON b.BookingId = bs.BookingId
        WHERE bs.ShowtimeId = ?
          AND (b.Status = 'confirmed' OR (b.Status = 'pending' AND b.BookingDate > NOW() - INTERVAL 10 MINUTE))
     ) held ON held.SeatId = se.SeatId
     WHERE se.RoomId = ? AND se.Status = 'active'
     ORDER BY se.SeatNumber`,
    [req.params.id, showtime[0].RoomId]
  );
  res.json({ showtime: showtime[0], seats });
};

exports.create = async (req, res) => {
  try {
    const { movieId, roomId, date, startTime, endTime, price } = req.body;
    if (!movieId || !roomId || !date || !startTime || !endTime || !price) {
      return res.status(400).json({ message: 'All showtime fields are required.' });
    }
    // prevent overlapping showtimes in the same room
    const [overlap] = await db.query(
      `SELECT ShowtimeId FROM showtimes
       WHERE RoomId = ? AND Date = ? AND Status = 'scheduled'
       AND (StartTime < ? AND EndTime > ?)`,
      [roomId, date, endTime, startTime]
    );
    if (overlap.length) return res.status(409).json({ message: 'This room is already booked for an overlapping time slot.' });

    const [result] = await db.query(
      'INSERT INTO showtimes (MovieId, RoomId, Date, StartTime, EndTime, Price) VALUES (?, ?, ?, ?, ?, ?)',
      [movieId, roomId, date, startTime, endTime, price]
    );
    res.status(201).json({ message: 'Showtime created.', showtimeId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create the showtime.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { movieId, roomId, date, startTime, endTime, price, status } = req.body;
    await db.query(
      `UPDATE showtimes SET MovieId=?, RoomId=?, Date=?, StartTime=?, EndTime=?, Price=?, Status=?
       WHERE ShowtimeId=?`,
      [movieId, roomId, date, startTime, endTime, price, status, req.params.id]
    );
    res.json({ message: 'Showtime updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update the showtime.' });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM showtimes WHERE ShowtimeId = ?', [req.params.id]);
    res.json({ message: 'Showtime deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete the showtime. It may already have bookings.' });
  }
};
