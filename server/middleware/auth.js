const jwt = require('jsonwebtoken');

// Verifies the JWT and attaches { userId, role } to req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Sign in to continue.' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Your session has expired. Sign in again.' });
  }
}

// Restricts a route to admins only. Use after `authenticate`.
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only.' });
  }
  next();
}

// Attaches req.user if a valid token is present, but doesn't block the request
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }
  next();
}

module.exports = { authenticate, requireAdmin, optionalAuth };
