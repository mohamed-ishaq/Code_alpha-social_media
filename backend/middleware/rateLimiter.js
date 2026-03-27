const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: { success: false, message: 'Slow down! Too many posts in a short time.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter, authLimiter, postLimiter };
