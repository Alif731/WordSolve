const Concept = require("../models/Concept");
const Attempt = require("../models/Attempt");
const {
  getNextProblem,
  updateMastery,
  jumpToConcept,
  MASTERY_MIN_ATTEMPTS,
  MASTERY_SCORE_THRESHOLD,
  MASTERY_SUCCESS_RATE,
  WINDOW_SIZE,
} = require("../utils/learningEngine");
const {
  serializeResponse,
  validateQuestionResponse,
} = require("../utils/backendAnswerValidation");

// Shared config object sent to frontend — single source of truth
const masteryConfig = {
  masteryMinAttempts: MASTERY_MIN_ATTEMPTS,
  masteryScoreThreshold: MASTERY_SCORE_THRESHOLD,
  masterySuccessRate: MASTERY_SUCCESS_RATE,
  windowSize: WINDOW_SIZE,
};

const CONCEPT_ID_PATTERN = /^[a-z0-9_]{1,80}$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const MAX_RESPONSE_BYTES = 12_000;
const MAX_RESPONSE_DEPTH = 8;
const MAX_RESPONSE_KEYS = 100;
const MAX_RESPONSE_ARRAY_LENGTH = 100;
const MAX_RESPONSE_STRING_LENGTH = 2_000;
const BLOCKED_RESPONSE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const validateNestedResponse = (value, depth = 0) => {
  if (depth > MAX_RESPONSE_DEPTH) {
    return "Response is too deeply nested";
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value.length <= MAX_RESPONSE_STRING_LENGTH
      ? null
      : "Response text is too long";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? null : "Response contains an invalid number";
  }

  if (typeof value === "boolean") {
    return null;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_RESPONSE_ARRAY_LENGTH) {
      return "Response array is too large";
    }

    for (const item of value) {
      const error = validateNestedResponse(item, depth + 1);
      if (error) return error;
    }

    return null;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length > MAX_RESPONSE_KEYS) {
      return "Response object has too many fields";
    }

    for (const [key, nestedValue] of entries) {
      if (key.length > 100 || BLOCKED_RESPONSE_KEYS.has(key)) {
        return "Response contains an invalid field";
      }

      const error = validateNestedResponse(nestedValue, depth + 1);
      if (error) return error;
    }

    return null;
  }

  return "Response contains an unsupported value";
};

const validateSubmitPayload = (body = {}) => {
  const conceptId = body?.conceptId;
  const questionId = body?.questionId;

  if (typeof conceptId !== "string" || !CONCEPT_ID_PATTERN.test(conceptId)) {
    return { error: "Invalid conceptId" };
  }

  if (typeof questionId !== "string" || !OBJECT_ID_PATTERN.test(questionId)) {
    return { error: "Invalid questionId" };
  }

  if (!Object.prototype.hasOwnProperty.call(body, "response")) {
    return { error: "Response is required" };
  }

  const responseError = validateNestedResponse(body.response);
  if (responseError) {
    return { error: responseError };
  }

  try {
    if (JSON.stringify(body.response).length > MAX_RESPONSE_BYTES) {
      return { error: "Response is too large" };
    }
  } catch (_error) {
    return { error: "Response could not be processed" };
  }

  return { conceptId, questionId, response: body.response };
};

const validateIssuedQuestion = (user, conceptId, questionId) => {
  const issuedQuestion = user.issuedQuestion;

  if (!issuedQuestion?.conceptId || !issuedQuestion?.questionId) {
    return "Please request a new problem before submitting an answer";
  }

  if (
    issuedQuestion.conceptId !== conceptId ||
    String(issuedQuestion.questionId) !== questionId
  ) {
    return "This answer does not match the currently issued problem";
  }

  return null;
};

const serializeProblemForClient = (questionDoc) => {
  const raw = questionDoc.toObject ? questionDoc.toObject() : questionDoc;
  
  // Create a safe copy to send to the client
  const safeQuestion = { ...raw, id: raw._id };
  
  // Strip fields that should only appear after the student submits.
  // - explanation: revealed only in the submitAnswer response
  // - generatedByAI / verifiedByTeacher: internal metadata
  //
  // NOTE: `correctAnswer` is intentionally KEPT. The client uses it for
  // instant visual feedback on conceptual (MCQ) and visual bar model
  // questions. Server-side validation in submitAnswer is the authoritative
  // check regardless.
  //
  // NOTE: `validation` is intentionally KEPT. It contains structural/display
  // data the client needs (displayEquation, verificationEquation, slot
  // structure for bar models, variable metadata for locking unknowns).
  delete safeQuestion.explanation;
  delete safeQuestion.generatedByAI;
  delete safeQuestion.verifiedByTeacher;
  
  return safeQuestion;
};

/**
 * Fetches the next problem for the user based on the KL-UCB learning engine.
 */
exports.getProblem = async (req, res) => {
  try {
    const user = req.user;
    const { concept, question } = await getNextProblem(user);

    if (!concept || !question) {
      user.issuedQuestion = null;
      await user.save();
      return res.json({ message: "Curriculum complete!", complete: true });
    }

    user.issuedQuestion = {
      conceptId: concept.id,
      questionId: String(question._id),
      issuedAt: new Date(),
    };
    await user.save(); // Persist updated ZPD cache and issued question

    // for ghost panel
    const masteryEntry = user.mastery.get(concept.id);
    const rawAdaptiveState = masteryEntry.adaptiveState.toObject
      ? masteryEntry.adaptiveState.toObject()
      : masteryEntry.adaptiveState;
    res.json({
      concept: { id: concept.id, title: concept.title },
      question: serializeProblemForClient(question),
      description: concept.description,
      masteryConfig,
      //  ghost panel stats
      adaptiveState: {
        ...rawAdaptiveState, //  Now the score, G, S, and UCB will actually spread!
        status: masteryEntry.status,
        attemptCount: masteryEntry.attemptCount,
        successCount: masteryEntry.successCount,
        lastAttempts: masteryEntry.lastAttempts,
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
    const payload = validateSubmitPayload(req.body);
    if (payload.error) {
      return res.status(400).json({ error: payload.error });
    }

    const { conceptId, questionId, response } = payload;
    const user = req.user;
    const issuedQuestionError = validateIssuedQuestion(user, conceptId, questionId);

    if (issuedQuestionError) {
      return res.status(409).json({ error: issuedQuestionError });
    }

    const { concept, question } = await Concept.findQuestion(
      conceptId,
      questionId,
    );

    if (!concept || !question) {
      return res.status(404).json({ error: "Concept or Question not found" });
    }

    const isCorrect = validateQuestionResponse(question.toObject(), response);

    // Log attempt
    await Attempt.create({
      user: user._id,
      conceptId,
      questionId,
      isCorrect,
      response: typeof response === "string" ? response : serializeResponse(response),
    });

    // Update mastery first (returns bundle metadata for streak logic)
    const { bundleJustCompleted, bundleCorrect } = await updateMastery(user, conceptId, isCorrect);

    // --- BUNDLE-AWARE STREAK ---
    // For Module 4 (_mod4), streak only updates on bundle completion.
    // For all other modules, every answer updates streak (bundleJustCompleted is always true).
    if (bundleJustCompleted) {
      if (bundleCorrect) {
        user.streak += 1;
        if (user.streak > (user.maxStreak || 0)) {
          user.maxStreak = user.streak;
        }
      } else {
        user.streak = 0;
      }
    }

    user.issuedQuestion = null;
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
    const { username, mastery, zpdNodes, streak } = req.user;

    res.json({ username, mastery, zpdNodes, streak, masteryConfig });
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

/**
 * Jump the student to a specific concept, mastering all prerequisites.
 * Used by the Student Hub to let students skip practice and go directly
 * to word problems.
 */
exports.jumpToConcept = async (req, res) => {
  try {
    const { conceptId } = req.body;
    const user = req.user;

    if (!conceptId) {
      return res.status(400).json({ error: "conceptId is required" });
    }

    await jumpToConcept(user, conceptId);
    user.issuedQuestion = null;
    await user.save();

    res.json({ success: true, zpdNodes: user.zpdNodes });
  } catch (error) {
    console.error("jumpToConcept error:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};

/**
 * Switch the active section for the student.
 */
exports.switchSection = async (req, res) => {
  try {
    const { sectionId } = req.body;
    const user = req.user;

    if (!sectionId) {
      return res.status(400).json({ error: "sectionId is required" });
    }

    const { switchSection } = require("../utils/learningEngine");
    await switchSection(user, sectionId);
    user.issuedQuestion = null;
    await user.save();

    res.json({ success: true, zpdNodes: user.zpdNodes });
  } catch (error) {
    console.error("switchSection error:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};
