const db = require('../config/db');

exports.getAll = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM cinema_rooms ORDER BY RoomName');
  res.json(rows);
};

exports.getById = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM cinema_rooms WHERE RoomId = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Room not found.' });
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  try {
    const { roomName, type, capacity } = req.body;
    if (!roomName || !capacity) return res.status(400).json({ message: 'Room name and capacity are required.' });
    const [result] = await db.query(
      'INSERT INTO cinema_rooms (RoomName, Type, Capacity) VALUES (?, ?, ?)',
      [roomName, type || '2D', capacity]
    );
    res.status(201).json({ message: 'Room created.', roomId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create the room.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { roomName, type, capacity, status } = req.body;
    await db.query(
      'UPDATE cinema_rooms SET RoomName=?, Type=?, Capacity=?, Status=? WHERE RoomId=?',
      [roomName, type, capacity, status, req.params.id]
    );
    res.json({ message: 'Room updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update the room.' });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM cinema_rooms WHERE RoomId = ?', [req.params.id]);
    res.json({ message: 'Room deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete the room. It may have active showtimes.' });
  }
};
