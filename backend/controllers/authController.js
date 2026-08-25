const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const jwt = require('jsonwebtoken');

const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: maxAgeMs,
});

const ACCESS_COOKIE_MS = 15 * 60 * 1000; // 15 min
const REFRESH_COOKIE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const issueTokens = async (res, user) => {
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshTokens = [...(user.refreshTokens || []), refreshToken].slice(-5); // cap sessions per user
  await user.save();

  res.cookie('accessToken', accessToken, cookieOptions(ACCESS_COOKIE_MS));
  res.cookie('refreshToken', refreshToken, cookieOptions(REFRESH_COOKIE_MS));

  return { accessToken, refreshToken };
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });
  const { accessToken } = await issueTokens(res, user);

  res.status(201).json({ success: true, user: user.toSafeObject(), accessToken });
});

// @desc    Log in
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { accessToken } = await issueTokens(res, user);
  res.json({ success: true, user: user.toSafeObject(), accessToken });
});

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token provided');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Refresh token invalid or expired. Please log in again.');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    throw new ApiError(401, 'Refresh token not recognized. Please log in again.');
  }

  const accessToken = generateAccessToken(user._id.toString());
  res.cookie('accessToken', accessToken, cookieOptions(ACCESS_COOKIE_MS));
  res.json({ success: true, accessToken });
});

// @desc    Log out (invalidate current refresh token)
// @route   POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await User.updateOne({ refreshTokens: token }, { $pull: { refreshTokens: token } });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
});

// @desc    Get current authenticated user
// @route   GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { register, login, refresh, logout, me };
