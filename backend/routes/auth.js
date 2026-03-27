const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// @POST /api/auth/register
router.post('/register', authLimiter, [
  body('username').trim().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('displayName').optional().trim().isLength({ max: 50 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { username, email, password, displayName } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(400).json({ success: false, message: `${field} already taken.` });
    }

    const user = await User.create({
      username: username.toLowerCase(),
      email,
      password,
      displayName: displayName || username
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        skills: user.skills,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// @POST /api/auth/login
router.post('/login', authLimiter, [
  body('login').trim().notEmpty(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Email/username and password are required.' });
    }

    const { login, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login.toLowerCase() }
      ]
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        skills: user.skills,
        location: user.location,
        website: user.website,
        githubUrl: user.githubUrl,
        twitterUrl: user.twitterUrl,
        linkedinUrl: user.linkedinUrl,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @POST /api/auth/logout
router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
