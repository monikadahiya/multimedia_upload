const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');

// Protects routes: requires a valid access token, delivered either as an
// HTTP-only cookie ("accessToken") or an Authorization: Bearer header.
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new ApiError(401, 'User for this token no longer exists.');
  }

  req.user = user;
  next();
});

module.exports = { protect };
