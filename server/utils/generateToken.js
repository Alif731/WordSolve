const jwt = require('jsonwebtoken');

const DEFAULT_JWT_EXPIRES_IN_DAYS = 7;

const getJwtExpiresInDays = () => {
  const parsed = Number.parseInt(process.env.JWT_EXPIRES_IN_DAYS, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_JWT_EXPIRES_IN_DAYS;
};

const getJwtCookieOptions = () => {
  const expiresInDays = getJwtExpiresInDays();

  const isDev = process.env.NODE_ENV === 'development';
  return {
    httpOnly: true,
    secure: !isDev,
    sameSite: isDev ? 'strict' : 'none',
    maxAge: expiresInDays * 24 * 60 * 60 * 1000,
  };
};

const generateToken = (res, userId) => {
  const cookieOptions = getJwtCookieOptions();

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: `${getJwtExpiresInDays()}d`,
  });

  res.cookie('jwt', token, cookieOptions);
};

const clearTokenCookie = (res) => {
  res.cookie('jwt', '', {
    ...getJwtCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
};

module.exports = generateToken;
module.exports.clearTokenCookie = clearTokenCookie;
module.exports.getJwtCookieOptions = getJwtCookieOptions;
