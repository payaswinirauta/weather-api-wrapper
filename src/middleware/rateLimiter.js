const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success    : false,
      error      : "Too many requests. Please wait 15 minutes and try again.",
      retryAfter : "15 minutes",
    });
  },
});

const compareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success    : false,
      error      : "Too many compare requests. Limit is 20 per 15 minutes.",
      retryAfter : "15 minutes",
    });
  },
});

module.exports = { apiLimiter, compareLimiter };