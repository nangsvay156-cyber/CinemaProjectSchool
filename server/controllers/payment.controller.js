const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { sendBookingConfirmation } = require('../utils/mailer');

// POST /api/payments  Body: { bookingId, method }
// method: cash | aba_pay | acleda | visa | mastercard | qr
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { bookingId, method } = req.body;
    const validMethods = ['cash', 'aba_pay', 'acleda', 'visa', 'mastercard', 'qr'];
    if (!bookingId || !validMethods.includes(method)) {
      return res.status(400).json({ message: 'A valid bookingId and payment method are required.' });
    }

    const [bookingRows] = await conn.query('SELECT * FROM bookings WHERE BookingId = ?', [bookingId]);
    if (!bookingRows.length) return res.status(404).json({ message: 'Booking not found.' });
    const booking = bookingRows[0];

    if (booking.CustomerId !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have access to this booking.' });
    }
    if (booking.Status !== 'pending') {
      return res.status(400).json({ message: `This booking is already ${booking.Status}.` });
    }

    await conn.beginTransaction();

    // In production this is where you'd call the real ABA/ACLEDA/Visa gateway
    // and only mark as paid once the gateway confirms success.
    const transactionId = `TXN-${Date.now()}-${uuidv4().slice(0, 8)}`;
    await conn.query(
      'INSERT INTO payments (BookingId, Method, Amount, Status, TransactionId) VALUES (?, ?, ?, ?, ?)',
      [bookingId, method, booking.TotalPrice, 'paid', transactionId]
    );
    await conn.query("UPDATE bookings SET Status = 'confirmed' WHERE BookingId = ?", [bookingId]);

    const ticketCode = uuidv4();
    await conn.query('INSERT INTO tickets (BookingId, TicketCode) VALUES (?, ?)', [bookingId, ticketCode]);

    await conn.commit();

    // Fire-and-forget confirmation email
    const [details] = await db.query(
      `SELECT m.Title AS movieTitle, r.RoomName AS roomName, s.Date AS date, s.StartTime AS startTime,
              u.Email AS email,
              GROUP_CONCAT(se.SeatNumber ORDER BY se.SeatNumber SEPARATOR ', ') AS seats
       FROM bookings b
       JOIN showtimes s ON s.ShowtimeId = b.ShowtimeId
       JOIN movies m ON m.MovieId = s.MovieId
       JOIN cinema_rooms r ON r.RoomId = s.RoomId
       JOIN users u ON u.UserId = b.CustomerId
       JOIN booking_seats bs ON bs.BookingId = b.BookingId
       JOIN seats se ON se.SeatId = bs.SeatId
       WHERE b.BookingId = ? GROUP BY b.BookingId`,
      [bookingId]
    );
    if (details.length) {
      sendBookingConfirmation(details[0].email, {
        movieTitle: details[0].movieTitle,
        roomName: details[0].roomName,
        date: details[0].date,
        startTime: details[0].startTime,
        seats: details[0].seats.split(', '),
        totalPrice: booking.TotalPrice,
        bookingId
      });
    }

    res.status(201).json({ message: 'Payment successful. Booking confirmed.', transactionId, ticketCode });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Payment failed. Please try again.' });
  } finally {
    conn.release();
  }
};

exports.getMyPayments = async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, m.Title AS MovieTitle FROM payments p
     JOIN bookings b ON b.BookingId = p.BookingId
     JOIN showtimes s ON s.ShowtimeId = b.ShowtimeId
     JOIN movies m ON m.MovieId = s.MovieId
     WHERE b.CustomerId = ? ORDER BY p.PaymentDate DESC`,
    [req.user.userId]
  );
  res.json(rows);
};

// PUT /api/payments/:id/refund  (admin only)
exports.refund = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM payments WHERE PaymentId = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Payment not found.' });
    if (rows[0].Status !== 'paid') return res.status(400).json({ message: 'Only paid payments can be refunded.' });

    await conn.beginTransaction();
    await conn.query("UPDATE payments SET Status = 'refunded' WHERE PaymentId = ?", [req.params.id]);
    await conn.query("UPDATE bookings SET Status = 'cancelled' WHERE BookingId = ?", [rows[0].BookingId]);
    await conn.query('DELETE FROM booking_seats WHERE BookingId = ?', [rows[0].BookingId]);
    await conn.commit();

    res.json({ message: 'Refund issued and booking cancelled.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Could not process the refund.' });
  } finally {
    conn.release();
  }
};
