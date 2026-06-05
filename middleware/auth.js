const jwt = require('jsonwebtoken');
require('dotenv').config();

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ error: 'Authentication required' });
      req.user = null;
      return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
      req.user = { userId: payload.userId, role: payload.role };
      next();
    } catch {
      if (required) return res.status(401).json({ error: 'Invalid or expired token' });
      req.user = null;
      next();
    }
  };
}

module.exports = { auth };
