const express = require('express');
const router = express.Router();
const { getProblem, submitAnswer, getUserStatus, jumpToConcept, switchSection } = require('../controllers/learningController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Apply protect middleware to all routes in this file

router.get('/problem', getProblem);
router.post('/submit', submitAnswer);
router.get('/status', getUserStatus);
router.post('/jump', jumpToConcept);
router.post('/switch-section', switchSection);

module.exports = router;
