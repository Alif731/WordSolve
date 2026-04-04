const express = require('express');
const router = express.Router();
const { getProblem, submitAnswer, getUserStatus } = require('../controllers/learningController');
const { protect } = require('../controllers/middleware/authMiddleware');

router.use(protect); // Apply protect middleware to all routes in this file

router.get('/problem', getProblem);
router.post('/submit', submitAnswer);
router.get('/status', getUserStatus);

module.exports = router;
