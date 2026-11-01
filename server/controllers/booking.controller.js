const db = require('../config/db');

// POST /api/bookings  Body: { showtimeId, seatIds: [1,2,3], promoCode }
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { showtimeId, seatIds, promoCode } = req.body;
    if (!showtimeId || !Array.isArray(seatIds) || !seatIds.length) {
      return res.status(400).json({ message: 'showtimeId and at least one seat are required.' });
    }

    const [showtimeRows] = await conn.query('SELECT * FROM showtimes WHERE ShowtimeId = ?', [showtimeId]);
    if (!showtimeRows.length) return res.status(404).json({ message: 'Showtime not found.' });
    const showtime = showtimeRows[0];

    const [seats] = await conn.query(
      `SELECT * FROM seats WHERE SeatId IN (?) AND RoomId = ? AND Status = 'active'`,
      [seatIds, showtime.RoomId]
    );
    if (seats.length !== seatIds.length) {
      return res.status(400).json({ message: 'One or more selected seats are invalid for this room.' });
    }

    // Calculate total: base showtime price + seat-type surcharge, per seat
    let total = seats.reduce((sum, s) => sum + Number(showtime.Price) + Number(s.Price), 0);

    // Apply promo code, if any
    let appliedPromo = null;
    if (promoCode) {
      const [promoRows] = await conn.query(
        `SELECT * FROM promo_codes WHERE Code = ? AND Status = 'active'
         AND (ExpiryDate IS NULL OR ExpiryDate >= CURDATE())`,
        [promoCode]
      );
      if (!promoRows.length) return res.status(400).json({ message: 'That promo code is invalid or expired.' });
      const promo = promoRows[0];
      if (promo.MaxUses > 0 && promo.UsedCount >= promo.MaxUses) {
        return res.status(400).json({ message: 'That promo code has reached its usage limit.' });
      }
      total = promo.DiscountType === 'percent'
        ? total * (1 - Number(promo.DiscountValue) / 100)
        : Math.max(0, total - Number(promo.DiscountValue));
      appliedPromo = promo;
    }

    await conn.beginTransaction();

    const [bookingResult] = await conn.query(
      'INSERT INTO bookings (CustomerId, ShowtimeId, TotalPrice, PromoCode, Status) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, showtimeId, total.toFixed(2), promoCode || null, 'pending']
    );
    const bookingId = bookingResult.insertId;

    // This insert relies on the UNIQUE KEY (ShowtimeId, SeatId) in booking_seats
    // to atomically reject a seat that another request grabbed a moment ago.
    try {
      const values = seats.map((s) => [bookingId, s.SeatId, showtimeId, Number(showtime.Price) + Number(s.Price)]);
      await conn.query('INSERT INTO booking_seats (BookingId, SeatId, ShowtimeId, Price) VALUES ?', [values]);
    } catch (err) {
      await conn.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'One or more seats were just taken by another customer. Please pick again.' });
      }
      throw err;
    }

    if (appliedPromo) {
      await conn.query('UPDATE promo_codes SET UsedCount = UsedCount + 1 WHERE PromoId = ?', [appliedPromo.PromoId]);
    }

    await conn.commit();
    res.status(201).json({
      message: 'Seats reserved. Complete payment within 10 minutes to confirm your booking.',
      bookingId,
      totalPrice: Number(total.toFixed(2))
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Could not create the booking.' });
  } finally {
    conn.release();
  }
};

exports.getMyBookings = async (req, res) => {
  const [rows] = await db.query(
    `SELECT b.*, m.Title AS MovieTitle, m.Poster, r.RoomName, s.Date, s.StartTime,
            GROUP_CONCAT(se.SeatNumber ORDER BY se.SeatNumber SEPARATOR ', ') AS Seats
     FROM bookings b
     JOIN showtimes s ON s.ShowtimeId = b.ShowtimeId
     JOIN movies m ON m.MovieId = s.MovieId
     JOIN cinema_rooms r ON r.RoomId = s.RoomId
     JOIN booking_seats bs ON bs.BookingId = b.BookingId
     JOIN seats se ON se.SeatId = bs.SeatId
     WHERE b.CustomerId = ?
     GROUP BY b.BookingId
     ORDER BY b.BookingDate DESC`,
    [req.user.userId]
  );
  res.json(rows);
};

exports.getById = async (req, res) => {
  const [rows] = await db.query(
    `SELECT b.*, m.Title AS MovieTitle, m.Poster, r.RoomName, s.Date, s.StartTime, s.EndTime
     FROM bookings b
     JOIN showtimes s ON s.ShowtimeId = b.ShowtimeId
     JOIN movies m ON m.MovieId = s.MovieId
     JOIN cinema_rooms r ON r.RoomId = s.RoomId
     WHERE b.BookingId = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
  const booking = rows[0];

  if (req.user.role !== 'admin' && booking.CustomerId !== req.user.userId) {
    return res.status(403).json({ message: 'You do not have access to this booking.' });
  }

  const [seats] = await db.query(
    `SELECT se.SeatNumber, se.SeatType, bs.Price FROM booking_seats bs
     JOIN seats se ON se.SeatId = bs.SeatId WHERE bs.BookingId = ?`,
    [req.params.id]
  );
  res.json({ ...booking, seats });
};

exports.cancel = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bookings WHERE BookingId = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
    const booking = rows[0];

    if (req.user.role !== 'admin' && booking.CustomerId !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have access to this booking.' });
    }
    if (booking.Status === 'cancelled') return res.status(400).json({ message: 'This booking is already cancelled.' });

    await db.query("UPDATE bookings SET Status = 'cancelled' WHERE BookingId = ?", [req.params.id]);
    // Free the seats immediately by removing the join rows
    await db.query('DELETE FROM booking_seats WHERE BookingId = ?', [req.params.id]);

    res.json({ message: 'Booking cancelled. If payment was made, a refund can be issued from Payments.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not cancel the booking.' });
  }
};
