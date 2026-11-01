const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { userId: user.UserId, role: user.Role, name: user.FullName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }
    const [existing] = await db.query('SELECT UserId FROM users WHERE Email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'That email is already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (FullName, Email, Password, Phone) VALUES (?, ?, ?, ?)',
      [fullName, email, hashed, phone || null]
    );
    const user = { UserId: result.insertId, Role: 'customer', FullName: fullName };
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.UserId, fullName, email, role: 'customer' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE Email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid email or password.' });

    const user = rows[0];
    if (user.Status === 'banned') return res.status(403).json({ message: 'This account has been suspended.' });

    const match = await bcrypt.compare(password, user.Password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.UserId, fullName: user.FullName, email: user.Email, role: user.Role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

exports.me = async (req, res) => {
  const [rows] = await db.query(
    'SELECT UserId, FullName, Email, Phone, Role, CreatedAt FROM users WHERE UserId = ?',
    [req.user.userId]
  );
  if (!rows.length) return res.status(404).json({ message: 'User not found.' });
  res.json(rows[0]);
};
