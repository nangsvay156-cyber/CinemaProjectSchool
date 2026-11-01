const db = require('../config/db');

// GET /api/rooms/:roomId/seats  -> static layout for a room
exports.getByRoom = async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM seats WHERE RoomId = ? ORDER BY SeatNumber',
    [req.params.roomId]
  );
  res.json(rows);
};

// POST /api/rooms/:roomId/seats/layout
// Body: { rows: ["A","B","C"], seatsPerRow: 10, vipRows: ["A"], coupleRows: [], prices: { normal, vip, couple } }
// Generates a full seat layout in one go (bulk create).
exports.generateLayout = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { rows, seatsPerRow, vipRows = [], coupleRows = [], prices = {} } = req.body;
    if (!rows?.length || !seatsPerRow) {
      return res.status(400).json({ message: 'rows[] and seatsPerRow are required.' });
    }
    const priceMap = { normal: prices.normal ?? 5, vip: prices.vip ?? 8, couple: prices.couple ?? 14 };

    await conn.beginTransaction();
    await conn.query('DELETE FROM seats WHERE RoomId = ?', [req.params.roomId]);

    const values = [];
    for (const row of rows) {
      const isCouple = coupleRows.includes(row);
      const isVip = vipRows.includes(row);
      const seatType = isCouple ? 'couple' : isVip ? 'vip' : 'normal';
      const step = isCouple ? 2 : 1; // couple seats pair up two physical seats as one unit
      for (let i = 1; i <= seatsPerRow; i += step) {
        values.push([req.params.roomId, `${row}${i}`, seatType, priceMap[seatType]]);
      }
    }
    await conn.query('INSERT INTO seats (RoomId, SeatNumber, SeatType, Price) VALUES ?', [values]);
    await conn.commit();

    res.status(201).json({ message: `Generated ${values.length} seats.` });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Could not generate the seat layout.' });
  } finally {
    conn.release();
  }
};

exports.updateSeat = async (req, res) => {
  try {
    const { seatType, price, status } = req.body;
    await db.query(
      'UPDATE seats SET SeatType = ?, Price = ?, Status = ? WHERE SeatId = ?',
      [seatType, price, status, req.params.seatId]
    );
    res.json({ message: 'Seat updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update the seat.' });
  }
};

exports.deleteSeat = async (req, res) => {
  await db.query('DELETE FROM seats WHERE SeatId = ?', [req.params.seatId]);
  res.json({ message: 'Seat removed.' });
};
