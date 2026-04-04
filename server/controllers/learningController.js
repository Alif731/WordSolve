const Concept = require("../models/Concept");
const Attempt = require("../models/Attempt");
const { getNextProblem, updateMastery } = require("../utils/learningEngine");

/**
 * Fetches the next problem for the user based on the KL-UCB learning engine.
 */
exports.getProblem = async (req, res) => {
  try {
    const user = req.user;
    const { concept, question } = await getNextProblem(user);
    await user.save(); // Persist updated ZPD cache

    if (!concept || !question) {
      return res.json({ message: "Curriculum complete!", complete: true });
    }

    // for ghost panel
    const masteryEntry = user.mastery.get(concept.id);
    const rawAdaptiveState = masteryEntry.adaptiveState.toObject
      ? masteryEntry.adaptiveState.toObject()
      : masteryEntry.adaptiveState;
    res.json({
      concept: { id: concept.id, title: concept.title },
      question: { ...question.toObject(), id: question._id },
      description: concept.description,
      //  ghost panel stats
      adaptiveState: {
        ...rawAdaptiveState, //  Now the score, G, S, and UCB will actually spread!
        status: masteryEntry.status,
        attemptCount: masteryEntry.attemptCount,
        successCount: masteryEntry.successCount,
      },
    });
  } catch (error) {
    console.error("getProblem error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Validates a user's answer, logs the attempt, and updates mastery.
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { conceptId, questionId, response } = req.body;
    const user = req.user;

    const { concept, question } = await Concept.findQuestion(
      conceptId,
      questionId,
    );

    if (!concept || !question) {
      return res.status(404).json({ error: "Concept or Question not found" });
    }

    const isCorrect =
      response.trim().toLowerCase() ===
      question.correctAnswer.trim().toLowerCase();

    // --- THE SECRET SAUCE STARTS HERE ---
    if (isCorrect) {
      user.streak += 1; // Increment global streak

      // Optional: Track Personal Best
      if (user.streak > (user.maxStreak || 0)) {
        user.maxStreak = user.streak;
      }
    } else {
      user.streak = 0; // Reset global streak on any wrong answer
    }

    await Attempt.create({
      user: user._id,
      conceptId,
      questionId,
      isCorrect,
      response,
    });
    await updateMastery(user, conceptId, isCorrect);

    await user.save(); // This now saves the NEW streak to MongoDB

    const updatedEntry = user.mastery.get(conceptId); // ghost panel

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "Good job!",
      streak: user.streak, // Send new streak back to frontend
      mastery: user.mastery.get(conceptId),
      adaptiveState: updatedEntry?.adaptiveState || {},
      zpdNodes: user.zpdNodes,
    });
  } catch (error) {
    console.error("submitAnswer error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// exports.submitAnswer = async (req, res) => {
//   try {
//     const { conceptId, questionId, response } = req.body;
//     const user = req.user;

//     const { concept, question } = await Concept.findQuestion(conceptId, questionId);

//     if (!concept || !question) {
//       return res.status(404).json({ error: 'Concept or Question not found' });
//     }

//     const isCorrect = response.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

//     await Attempt.create({ user: user._id, conceptId, questionId, isCorrect, response });
//     await updateMastery(user, conceptId, isCorrect);
//     await user.save();

//     res.json({
//       isCorrect,
//       correctAnswer: question.correctAnswer,
//       explanation: question.explanation || 'Good job!',
//       mastery: user.mastery.get(conceptId),
//       zpdNodes: user.zpdNodes
//     });
//   } catch (error) {
//     console.error('submitAnswer error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

/**
 * Returns the current student's learning progress.
 */
exports.getUserStatus = async (req, res) => {
  try {
    // Add 'streak' to the destructuring
    const { username, mastery, zpdNodes, streak } = req.user;

    // Return it in the JSON response
    res.json({ username, mastery, zpdNodes, streak });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
// exports.getUserStatus = async (req, res) => {
//   try {
//     const { username, mastery, zpdNodes } = req.user;
//     res.json({ username, mastery, zpdNodes });
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// };
