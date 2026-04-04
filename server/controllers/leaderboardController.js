const Attempt = require("../models/Attempt");
const AppSettings = require("../models/AppSettings");

const SETTINGS_KEY = "global";

const getOrCreateSettings = async () => {
  let settings = await AppSettings.findOne({ key: SETTINGS_KEY });

  if (!settings) {
    settings = await AppSettings.create({
      key: SETTINGS_KEY,
      leaderboardEnabled: true,
    });
  }

  return settings;
};

const getLeaderboardStatus = async (req, res) => {
  const settings = await getOrCreateSettings();

  res.json({
    enabled: settings.leaderboardEnabled,
    canManage: req.user.role === "teacher",
  });
};

const updateLeaderboardStatus = async (req, res) => {
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    res.status(400).json({ message: "`enabled` must be a boolean value" });
    return;
  }

  const settings = await getOrCreateSettings();
  settings.leaderboardEnabled = enabled;
  await settings.save();

  res.json({
    enabled: settings.leaderboardEnabled,
    message: `Leaderboard ${enabled ? "enabled" : "disabled"} successfully`,
  });
};

const getLeaderboard = async (req, res) => {
  const settings = await getOrCreateSettings();
  const isTeacher = req.user.role === "teacher";

  if (!settings.leaderboardEnabled && !isTeacher) {
    res.status(403).json({
      message: "Leaderboard is currently disabled by the teacher",
      enabled: false,
    });
    return;
  }

  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 100)
    : 20;

  const entries = await Attempt.aggregate([
    {
      $group: {
        _id: "$user",
        totalAttempts: { $sum: 1 },
        correctAttempts: {
          $sum: {
            $cond: ["$isCorrect", 1, 0],
          },
        },
        lastAttemptAt: { $max: "$timestamp" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { "user.role": "student" } },
    {
      $addFields: {
        accuracy: {
          $cond: [
            { $eq: ["$totalAttempts", 0] },
            0,
            {
              $multiply: [
                { $divide: ["$correctAttempts", "$totalAttempts"] },
                100,
              ],
            },
          ],
        },
      },
    },
    {
      $sort: {
        correctAttempts: -1,
        accuracy: -1,
        totalAttempts: -1,
        lastAttemptAt: 1,
      },
    },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        username: "$user.username",
        avatar: "$user.avatar",
        avatarSeed: "$user.avatarSeed",
        correctAttempts: 1,
        totalAttempts: 1,
        accuracy: 1,
        lastAttemptAt: 1,
      },
    },
  ]);

  const rankedEntries = entries.map((entry, index) => ({
    rank: index + 1,
    ...entry,
    accuracy: Number(entry.accuracy.toFixed(1)),
  }));

  res.json({
    enabled: settings.leaderboardEnabled,
    entries: rankedEntries,
  });
};

module.exports = {
  getLeaderboardStatus,
  updateLeaderboardStatus,
  getLeaderboard,
};
