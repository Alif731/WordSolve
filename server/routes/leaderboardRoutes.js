const express = require('express');
const {
  getLeaderboardStatus,
  updateLeaderboardStatus,
  getLeaderboard,
} = require('../controllers/leaderboardController');
const { protect, teacherOnly } = require('../controllers/middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/status', getLeaderboardStatus);
router.put('/status', teacherOnly, updateLeaderboardStatus);
router.get('/', getLeaderboard);

module.exports = router;
