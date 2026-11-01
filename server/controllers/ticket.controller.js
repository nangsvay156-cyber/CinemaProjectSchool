const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const db = require('../config/db');

async function getTicketDetails(bookingId) {
  const [rows] = await db.query(
    `SELECT t.TicketId, t.TicketCode, t.IsUsed, t.UsedAt,
            b.BookingId, b.TotalPrice, b.CustomerId,
            m.Title AS MovieTitle, r.RoomName, s.Date, s.StartTime,
            GROUP_CONCAT(se.SeatNumber ORDER BY se.SeatNumber SEPARATOR ', ') AS Seats
     FROM tickets t
     JOIN bookings b ON b.BookingId = t.BookingId
     JOIN showtimes s ON s.ShowtimeId = b.ShowtimeId
     JOIN movies m ON m.MovieId = s.MovieId
     JOIN cinema_rooms r ON r.RoomId = s.RoomId
     JOIN booking_seats bs ON bs.BookingId = b.BookingId
     JOIN seats se ON se.SeatId = bs.SeatId
     WHERE t.BookingId = ?
     GROUP BY t.TicketId`,
    [bookingId]
  );
  return rows[0];
}

// GET /api/tickets/:bookingId/qr -> returns a QR code (data URL) for the ticket
exports.getQr = async (req, res) => {
  try {
    const ticket = await getTicketDetails(req.params.bookingId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found. Payment may not be completed yet.' });
    if (req.user.role !== 'admin' && ticket.CustomerId !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have access to this ticket.' });
    }

    const payload = JSON.stringify({
      code: ticket.TicketCode,
      bookingId: ticket.BookingId,
      movie: ticket.MovieTitle,
      room: ticket.RoomName,
      seats: ticket.Seats,
      date: ticket.Date,
      time: ticket.StartTime
    });
    const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 1 });

    res.json({ qr: qrDataUrl, ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate the QR code.' });
  }
};

// POST /api/tickets/verify  Body: { code }  (admin / gate scanner use)
exports.verify = async (req, res) => {
  try {
    const { code } = req.body;
    const [rows] = await db.query('SELECT * FROM tickets WHERE TicketCode = ?', [code]);
    if (!rows.length) return res.status(404).json({ valid: false, message: 'Ticket not recognized.' });

    const ticket = rows[0];
    if (ticket.IsUsed) {
      return res.status(409).json({ valid: false, message: 'This ticket was already used.', usedAt: ticket.UsedAt });
    }

    await db.query('UPDATE tickets SET IsUsed = TRUE, UsedAt = NOW() WHERE TicketId = ?', [ticket.TicketId]);
    const details = await getTicketDetails(ticket.BookingId);
    res.json({ valid: true, message: 'Ticket accepted. Enjoy the movie!', ticket: details });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not verify the ticket.' });
  }
};

// GET /api/tickets/:bookingId/pdf -> downloadable e-ticket
exports.downloadPdf = async (req, res) => {
  try {
    const ticket = await getTicketDetails(req.params.bookingId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    if (req.user.role !== 'admin' && ticket.CustomerId !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have access to this ticket.' });
    }

    const qrDataUrl = await QRCode.toDataURL(ticket.TicketCode, { width: 200 });
    const qrImage = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket.BookingId}.pdf`);

    const doc = new PDFDocument({ size: [300, 500], margin: 20 });
    doc.pipe(res);

    doc.fontSize(18).fillColor('#7A1F2B').text('CINEMA E-TICKET', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('#000').text(ticket.MovieTitle, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333');
    doc.text(`Room: ${ticket.RoomName}`);
    doc.text(`Date: ${ticket.Date}`);
    doc.text(`Time: ${ticket.StartTime}`);
    doc.text(`Seats: ${ticket.Seats}`);
    doc.text(`Booking #: ${ticket.BookingId}`);
    doc.text(`Total Paid: $${ticket.TotalPrice}`);
    doc.moveDown();
    doc.image(qrImage, { fit: [200, 200], align: 'center' });
    doc.moveDown();
    doc.fontSize(8).fillColor('#888').text('Present this QR code at the entrance.', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate the PDF ticket.' });
  }
};
