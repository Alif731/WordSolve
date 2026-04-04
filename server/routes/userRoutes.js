const express = require('express');
const router = express.Router();
const {
  authUser,
  registerUser,
  logoutUser,
  getOAuthProviders,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  getUserProfile,
  updateUserProfile,
  getUserRecentActivity,
} = require('../controllers/userController');
const { protect } = require('../controllers/middleware/authMiddleware');
const {
  loginLimiter,
  registerLimiter,
  oauthLimiter,
} = require('../controllers/middleware/rateLimitMiddleware');

router.get('/oauth/providers', getOAuthProviders);
router.get('/oauth/google', oauthLimiter, startGoogleOAuth);
router.get('/oauth/google/callback', oauthLimiter, handleGoogleOAuthCallback);

router.post('/', registerLimiter, registerUser);
router.post('/auth', loginLimiter, authUser);
router.post('/logout', logoutUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/recent-activity', protect, getUserRecentActivity);

module.exports = router;
