const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");

// Endpoint: GET /api/teacher/stats
router.get("/stats", teacherController.getClassroomStats);

module.exports = router;
