const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const DEFAULT_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_REGISTER_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_OAUTH_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LOGIN_MAX = 10;
const DEFAULT_REGISTER_MAX = 5;
const DEFAULT_OAUTH_MAX = 20;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getClientKey = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return ipKeyGenerator(ip);
};

const createJsonRateLimiter = ({
  windowMs,
  limit,
  message,
  keyGenerator = (req) => getClientKey(req),
  skipSuccessfulRequests = false,
}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator,
    handler: (req, res, _next, options) => {
      const resetTime = req.rateLimit?.resetTime instanceof Date
        ? req.rateLimit.resetTime.getTime()
        : Date.now() + options.windowMs;
      const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));

      res.set('Retry-After', String(retryAfter));
      res.status(options.statusCode).json({
        message,
        retryAfter,
      });
    },
  });

const loginLimiter = createJsonRateLimiter({
  windowMs: toPositiveInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, DEFAULT_LOGIN_WINDOW_MS),
  limit: toPositiveInt(process.env.LOGIN_RATE_LIMIT_MAX, DEFAULT_LOGIN_MAX),
  message: 'Too many login attempts. Please try again later.',
  keyGenerator: (req) => {
    const username = String(req.body?.username || '').trim().toLowerCase() || 'anonymous';
    return `${getClientKey(req)}:${username}`;
  },
  skipSuccessfulRequests: true,
});

const registerLimiter = createJsonRateLimiter({
  windowMs: toPositiveInt(process.env.REGISTER_RATE_LIMIT_WINDOW_MS, DEFAULT_REGISTER_WINDOW_MS),
  limit: toPositiveInt(process.env.REGISTER_RATE_LIMIT_MAX, DEFAULT_REGISTER_MAX),
  message: 'Too many registration attempts. Please try again later.',
});

const oauthLimiter = createJsonRateLimiter({
  windowMs: toPositiveInt(process.env.OAUTH_RATE_LIMIT_WINDOW_MS, DEFAULT_OAUTH_WINDOW_MS),
  limit: toPositiveInt(process.env.OAUTH_RATE_LIMIT_MAX, DEFAULT_OAUTH_MAX),
  message: 'Too many OAuth attempts. Please try again later.',
});

module.exports = {
  loginLimiter,
  registerLimiter,
  oauthLimiter,
};
