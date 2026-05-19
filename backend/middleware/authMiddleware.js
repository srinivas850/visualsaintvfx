const jwt = require('jsonwebtoken');

/**
 * Protects admin routes. Validates JWT and checks role === 'admin'.
 */
const protectAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }

    req.admin = decoded;
    return next();
  } catch (error) {
    console.error('[Auth] Admin token verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
  }
};

/**
 * Protects client routes. Validates JWT and checks role === 'client'.
 */
const protectClient = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'client') {
      return res.status(403).json({ success: false, message: 'Not authorized as client' });
    }

    req.client = decoded;
    return next();
  } catch (error) {
    console.error('[Auth] Client token verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
  }
};

module.exports = { protectAdmin, protectClient };
