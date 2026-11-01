const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/movies', require('./routes/movie.routes'));
app.use('/api/rooms', require('./routes/room.routes'));
app.use('/api/seats', require('./routes/seat.routes'));
app.use('/api/showtimes', require('./routes/showtime.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/promocodes', require('./routes/promo.routes'));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// Central error handler (e.g. multer file errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🎬 Cinema Booking API running on http://localhost:${PORT}`));
