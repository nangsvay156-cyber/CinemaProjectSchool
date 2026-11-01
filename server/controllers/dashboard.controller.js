const db = require('../config/db');

// GET /api/dashboard/stats -> headline numbers for the admin home screen
exports.getStats = async (req, res) => {
  const [[movieCount]] = await db.query('SELECT COUNT(*) AS count FROM movies');
  const [[userCount]] = await db.query("SELECT COUNT(*) AS count FROM users WHERE Role = 'customer'");
  const [[bookingCount]] = await db.query("SELECT COUNT(*) AS count FROM bookings WHERE Status = 'confirmed'");
  const [[revenue]] = await db.query("SELECT COALESCE(SUM(Amount),0) AS total FROM payments WHERE Status = 'paid'");
  const [topMovies] = await db.query(
    `SELECT m.Title, COUNT(bs.BookingSeatId) AS TicketsSold
     FROM booking_seats bs
     JOIN bookings b ON b.BookingId = bs.BookingId
     JOIN showtimes s ON s.ShowtimeId = b.ShowtimeId
     JOIN movies m ON m.MovieId = s.MovieId
     WHERE b.Status = 'confirmed'
     GROUP BY m.MovieId ORDER BY TicketsSold DESC LIMIT 5`
  );

  res.json({
    totalMovies: movieCount.count,
    totalCustomers: userCount.count,
    confirmedBookings: bookingCount.count,
    totalRevenue: Number(revenue.total),
    topMovies
  });
};

// GET /api/dashboard/revenue?period=daily|monthly&from=&to=
exports.getRevenueReport = async (req, res) => {
  const { period = 'daily', from, to } = req.query;
  const format = period === 'monthly' ? '%Y-%m' : '%Y-%m-%d';
  const conditions = ["p.Status = 'paid'"];
  const params = [];
  if (from) { conditions.push('p.PaymentDate >= ?'); params.push(from); }
  if (to) { conditions.push('p.PaymentDate <= ?'); params.push(to); }

  const [rows] = await db.query(
    `SELECT DATE_FORMAT(p.PaymentDate, ?) AS period, SUM(p.Amount) AS revenue, COUNT(*) AS transactions
     FROM payments p
     WHERE ${conditions.join(' AND ')}
     GROUP BY period ORDER BY period`,
    [format, ...params]
  );
  res.json(rows);
};
