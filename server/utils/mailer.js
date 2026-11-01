const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendBookingConfirmation(to, booking) {
  if (!process.env.SMTP_USER) {
    console.log('[mailer] SMTP not configured, skipping email to', to);
    return;
  }
  const { movieTitle, roomName, date, startTime, seats, totalPrice, bookingId } = booking;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Booking Confirmed - ${movieTitle} (#${bookingId})`,
      html: `
        <h2>Your ticket is confirmed 🎬</h2>
        <p><strong>Movie:</strong> ${movieTitle}</p>
        <p><strong>Room:</strong> ${roomName}</p>
        <p><strong>Date:</strong> ${date} at ${startTime}</p>
        <p><strong>Seats:</strong> ${seats.join(', ')}</p>
        <p><strong>Total Paid:</strong> $${totalPrice}</p>
        <p>Show the QR code in your account under "My Tickets" at the entrance.</p>
      `
    });
  } catch (err) {
    console.error('[mailer] failed to send confirmation:', err.message);
  }
}

module.exports = { sendBookingConfirmation };
