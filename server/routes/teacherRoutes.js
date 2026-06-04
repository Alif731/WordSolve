const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const teacherController = require("../controllers/teacherController");
const {
  protect,
  teacherOnly,
} = require("../middleware/authMiddleware");

const teacherRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(teacherRateLimiter);
router.use(protect, teacherOnly);

// Endpoint: GET /api/teacher/stats
router.get("/stats", teacherController.getClassroomStats);

module.exports = router;
