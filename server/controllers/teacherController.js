// teacherController.js
const User = require("../models/User");

exports.getClassroomStats = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select(
      "username mastery",
    );

    const classroomData = students.map((student) => {
      // 🔥 CHANGE: Use .entries() to get [id, data] pairs
      const masteryEntries = Array.from(student.mastery.entries());

      return {
        id: student._id,
        username: student.username,

        // 2. Avatar data
        avatar: student.avatar || "beam",
        avatarSeed: student.avatarSeed || student.username,
        totalAttempts: masteryEntries.reduce(
          (acc, [id, data]) => acc + data.attemptCount,
          0,
        ),
        nodesMastered: masteryEntries.filter(
          ([id, data]) => data.status === "mastered",
        ).length,

        nodes: masteryEntries.map(([id, data]) => ({
          nodeId: id, // Captures "foundation_signs" correctly!
          status: data.status,
          score: data.adaptiveState?.changePointScore || 0,
          attempts: data.attemptCount || 0,
          correct: data.successCount || 0,
          slip: data.adaptiveState?.slipProbability || 0,
          estimate: data.adaptiveState?.estimate || 0,
        })),
      };
    });

    res.json(classroomData);
  } catch (error) {
    console.error("Teacher Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
