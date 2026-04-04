const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { clearTokenCookie } = require('../../utils/generateToken');

const protect = async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        clearTokenCookie(res);
        res.status(401).json({ message: 'Not authorized, user not found' });
        return;
      }

      next();
    } catch (error) {
      clearTokenCookie(res);

      if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
        console.warn(`JWT verification failed: ${error.message}`);
      } else {
        console.error(error);
      }

      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const teacherOnly = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
    return;
  }

  res.status(403).json({ message: 'Only teachers can perform this action' });
};

module.exports = { protect, teacherOnly };
