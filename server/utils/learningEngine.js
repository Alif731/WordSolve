const Concept = require("../models/Concept");

const WINDOW_SIZE = 5;
const MASTERY_MIN_ATTEMPTS = 4;
const MASTERY_SCORE_THRESHOLD = 4;
const MASTERY_SUCCESS_RATE = 0.8; // 80% — student must get 4/5, 8/10, etc.

// const WINDOW_SIZE = 5;
// const MASTERY_MIN_ATTEMPTS = 5;
// const MASTERY_SCORE_THRESHOLD = 5;
// const MASTERY_SUCCESS_RATE = 0.8; // 80% — student must get 4/5, 8/10, etc.

const CHANGE_POINT_FALSE_POSITIVE_RATE = Math.exp(-MASTERY_SCORE_THRESHOLD);
const BANDIT_PRIORS = Object.freeze({
  guessProbability: 0.1,
  slipProbability: 0.1,
});
const BANDIT_HISTORY_LIMIT = 25;
const EPSILON = 1e-9;

const isFullIntegrationConceptId = (conceptId) => {
  const id = String(conceptId || "");
  return id === "combine_mod4" || id === "compare_mod4" || id === "change_mod5";
};

const getBundleSize = (conceptId) => {
  return String(conceptId || "") === "change_mod5" ? 4 : 3;
};

function clampProbability(value, fallback = 0.5) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(numericValue, EPSILON), 1 - EPSILON);
}

function clampUnitInterval(value, fallback = 0) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(numericValue, 0), 1);
}

function clampNonNegativeInteger(value, fallback = 0) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return fallback;
  }

  return Math.floor(numericValue);
}

function normalizeBooleanList(values, limit) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.slice(-limit).map(Boolean);
}

function normalizeNumberList(values, limit) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((value) => Number.isFinite(Number(value)))
    .slice(-limit)
    .map(Number);
}

function cloneMasteryEntry(entry) {
  if (!entry) {
    return null;
  }

  if (typeof entry.toObject === "function") {
    return entry.toObject();
  }

  return JSON.parse(JSON.stringify(entry));
}

function persistMasteryEntry(user, conceptId, masteryData) {
  user.mastery.set(conceptId, masteryData);
  user.markModified("mastery");
  return masteryData;
}

function getTotalInteractionCount(user) {
  let total = 0;

  for (const [, entry] of user.mastery.entries()) {
    const masteryData = cloneMasteryEntry(entry);
    total += clampNonNegativeInteger(
      masteryData?.adaptiveState?.timesPlayed,
      clampNonNegativeInteger(masteryData?.attemptCount, 0),
    );
  }

  return total;
}

function normalizeAdaptiveState(adaptiveState, fallback = {}) {
  const fallbackTimesPlayed = clampNonNegativeInteger(fallback.timesPlayed, 0);
  const fallbackCorrectnessSum = clampNonNegativeInteger(
    fallback.correctnessSum,
    0,
  );
  const fallbackRecord = normalizeBooleanList(
    fallback.correctnessRecord,
    BANDIT_HISTORY_LIMIT,
  );

  const safeTimesPlayed = clampNonNegativeInteger(
    adaptiveState?.timesPlayed,
    fallbackTimesPlayed,
  );
  const safeCorrectnessSum = Math.min(
    clampNonNegativeInteger(
      adaptiveState?.correctnessSum,
      fallbackCorrectnessSum,
    ),
    safeTimesPlayed,
  );
  const estimateFallback =
    safeTimesPlayed > 0 ? safeCorrectnessSum / safeTimesPlayed : 0;

  return {
    timesPlayed: safeTimesPlayed,
    correctnessSum: safeCorrectnessSum,
    estimate: clampUnitInterval(adaptiveState?.estimate, estimateFallback),
    ucb: Number.isFinite(Number(adaptiveState?.ucb))
      ? Number(adaptiveState.ucb)
      : 0,
    lcb: Number.isFinite(Number(adaptiveState?.lcb))
      ? Number(adaptiveState.lcb)
      : 0,
    timeAdded: clampNonNegativeInteger(
      adaptiveState?.timeAdded,
      fallback.timeAdded || 0,
    ),
    guessProbability: clampProbability(
      adaptiveState?.guessProbability || BANDIT_PRIORS.guessProbability,
      BANDIT_PRIORS.guessProbability,
    ),
    slipProbability: clampProbability(
      adaptiveState?.slipProbability || BANDIT_PRIORS.slipProbability,
      BANDIT_PRIORS.slipProbability,
    ),
    changePointScore: Number.isFinite(Number(adaptiveState?.changePointScore))
      ? Number(adaptiveState.changePointScore)
      : 0,
    changePointIndex: clampNonNegativeInteger(
      adaptiveState?.changePointIndex,
      0,
    ),
    correctnessRecord: normalizeBooleanList(
      adaptiveState?.correctnessRecord,
      BANDIT_HISTORY_LIMIT,
    ).length
      ? normalizeBooleanList(
          adaptiveState?.correctnessRecord,
          BANDIT_HISTORY_LIMIT,
        )
      : fallbackRecord,
    changePointLog: normalizeNumberList(
      adaptiveState?.changePointLog,
      BANDIT_HISTORY_LIMIT,
    ),
  };
}

function ensureMasteryEntry(
  user,
  conceptId,
  { status = "locked", timeAdded = 0 } = {},
) {
  const existingEntry = cloneMasteryEntry(user.mastery.get(conceptId));
  const attemptCount = clampNonNegativeInteger(existingEntry?.attemptCount, 0);
  const successCount = Math.min(
    clampNonNegativeInteger(existingEntry?.successCount, 0),
    attemptCount,
  );
  const lastAttempts = normalizeBooleanList(
    existingEntry?.lastAttempts,
    WINDOW_SIZE,
  );

  const normalizedEntry = {
    status: existingEntry?.status || status,
    successCount,
    attemptCount,
    lastAttempts,
    adaptiveState: normalizeAdaptiveState(existingEntry?.adaptiveState, {
      timeAdded,
      timesPlayed: attemptCount,
      correctnessSum: successCount,
      correctnessRecord: lastAttempts,
    }),
  };

  if (status === "unlocked" && normalizedEntry.status === "locked") {
    normalizedEntry.status = "unlocked";
  }

  return persistMasteryEntry(user, conceptId, normalizedEntry);
}

function buildConceptGraph(concepts) {
  const conceptMap = new Map();
  const childrenById = new Map();

  for (const concept of concepts) {
    conceptMap.set(concept.id, concept);
    childrenById.set(concept.id, []);
  }

  for (const concept of concepts) {
    for (const prerequisiteId of concept.prerequisites || []) {
      if (!childrenById.has(prerequisiteId)) {
        childrenById.set(prerequisiteId, []);
      }

      childrenById.get(prerequisiteId).push(concept.id);
    }
  }

  const rootIds = concepts
    .filter(
      (concept) => !concept.prerequisites || concept.prerequisites.length === 0,
    )
    .map((concept) => concept.id);

  return { conceptMap, childrenById, rootIds };
}

async function loadConceptGraph() {
  const concepts = await Concept.find({}).sort({ createdAt: 1, _id: 1 });
  return buildConceptGraph(concepts);
}

function dedupeIds(ids) {
  const uniqueIds = [];
  const seenIds = new Set();

  for (const id of ids) {
    if (!id || seenIds.has(id)) {
      continue;
    }

    seenIds.add(id);
    uniqueIds.push(id);
  }

  return uniqueIds;
}

function getExistingFrontier(user, conceptMap) {
  const frontier = [];

  for (const conceptId of user.zpdNodes || []) {
    if (conceptMap.has(conceptId)) {
      frontier.push(conceptId);
    }
  }

  if (frontier.length > 0) {
    return dedupeIds(frontier);
  }

  for (const [conceptId, rawEntry] of user.mastery.entries()) {
    const masteryEntry = cloneMasteryEntry(rawEntry);
    if (masteryEntry?.status === "unlocked" && conceptMap.has(conceptId)) {
      frontier.push(conceptId);
    }
  }

  return dedupeIds(frontier);
}

function initializeRootFrontier(user, rootIds) {
  const frontier = [];
  const timeAdded = getTotalInteractionCount(user);

  for (const conceptId of rootIds) {
    const masteryEntry = ensureMasteryEntry(user, conceptId, {
      status: "unlocked",
      timeAdded,
    });

    if (masteryEntry.status !== "mastered") {
      frontier.push(conceptId);
    }
  }

  user.zpdNodes = frontier;
  return frontier;
}

function normalizeFrontier(user, conceptMap, rootIds) {
  const candidateFrontier = getExistingFrontier(user, conceptMap);
  const activeFrontier = candidateFrontier.length
    ? candidateFrontier
    : initializeRootFrontier(user, rootIds);

  if (!activeFrontier.length) {
    user.zpdNodes = [];
    return [];
  }

  const normalizedFrontier = [];
  const timeAdded = getTotalInteractionCount(user);

  for (const conceptId of activeFrontier) {
    const masteryEntry = ensureMasteryEntry(user, conceptId, {
      status: "unlocked",
      timeAdded,
    });

    if (masteryEntry.status !== "mastered") {
      normalizedFrontier.push(conceptId);
    }
  }

  if (normalizedFrontier.length === 0 && rootIds.length > 0) {
    return initializeRootFrontier(user, rootIds);
  }

  user.zpdNodes = dedupeIds(normalizedFrontier);
  return user.zpdNodes;
}

function arePrerequisitesMastered(user, concept) {
  return (concept.prerequisites || []).every((prerequisiteId) => {
    const prerequisiteEntry = cloneMasteryEntry(
      user.mastery.get(prerequisiteId),
    );
    return prerequisiteEntry?.status === "mastered";
  });
}

async function unlockChildren(user, parentId, graph) {
  const childIds = graph.childrenById.get(parentId) || [];
  const timeAdded = getTotalInteractionCount(user);

  for (const childId of childIds) {
    const childConcept = graph.conceptMap.get(childId);
    if (!childConcept || !arePrerequisitesMastered(user, childConcept)) {
      continue;
    }

    const childEntry = ensureMasteryEntry(user, childId, {
      status: "unlocked",
      timeAdded,
    });

    if (childEntry.status === "locked") {
      childEntry.status = "unlocked";
      persistMasteryEntry(user, childId, childEntry);
    }

    if (childEntry.status !== "mastered" && !user.zpdNodes.includes(childId)) {
      user.zpdNodes.push(childId);
    }
  }

  user.zpdNodes = dedupeIds(
    user.zpdNodes.filter((conceptId) => conceptId !== parentId),
  );
}

function klBernoulli(p, q) {
  const safeP = clampProbability(p);
  const safeQ = clampProbability(q);
  return (
    safeP * Math.log(safeP / safeQ) +
    (1 - safeP) * Math.log((1 - safeP) / (1 - safeQ))
  );
}

function solveKlUcb(p, upperBound) {
  if (!Number.isFinite(upperBound) || upperBound <= 0) {
    return clampProbability(p);
  }

  let low = clampProbability(p);
  let high = 1 - EPSILON;

  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    if (klBernoulli(p, mid) <= upperBound) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return low;
}

function solveKlLcb(p, upperBound) {
  if (!Number.isFinite(upperBound) || upperBound <= 0) {
    return clampProbability(p);
  }

  let low = EPSILON;
  let high = clampProbability(p);

  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    if (klBernoulli(p, mid) > upperBound) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return high;
}

function updateBanditBounds(masteryEntry, totalPlays) {
  const adaptiveState = masteryEntry.adaptiveState;

  if (adaptiveState.timesPlayed === 0) {
    adaptiveState.ucb = 1;
    adaptiveState.lcb = 0;
    return Infinity;
  }

  const estimate = adaptiveState.correctnessSum / adaptiveState.timesPlayed;
  const logBase = Math.max(totalPlays, 2);
  const upperBound =
    Math.log(1 + totalPlays * Math.pow(Math.log(logBase), 2)) /
    adaptiveState.timesPlayed;

  adaptiveState.ucb = solveKlUcb(estimate, upperBound);
  adaptiveState.lcb = solveKlLcb(estimate, upperBound);
  adaptiveState.estimate = estimate;

  return adaptiveState.ucb;
}

// function chooseNextConceptId(user, frontier) {
//   for (const conceptId of frontier) {
//     const masteryEntry = ensureMasteryEntry(user, conceptId, {
//       status: "unlocked",
//       timeAdded: getTotalInteractionCount(user),
//     });

//     if (masteryEntry.adaptiveState.timesPlayed === 0) {
//       masteryEntry.adaptiveState.ucb = 1;
//       masteryEntry.adaptiveState.lcb = 0;
//       persistMasteryEntry(user, conceptId, masteryEntry);
//       return conceptId;
//     }
//   }

//   const totalPlays = frontier.reduce((sum, conceptId) => {
//     const masteryEntry = ensureMasteryEntry(user, conceptId, {
//       status: "unlocked",
//       timeAdded: getTotalInteractionCount(user),
//     });
//     return sum + masteryEntry.adaptiveState.timesPlayed;
//   }, 0);

//   let bestConceptId = frontier[0];
//   let bestScore = -Infinity;

//   for (const conceptId of frontier) {
//     const masteryEntry = ensureMasteryEntry(user, conceptId, {
//       status: "unlocked",
//       timeAdded: getTotalInteractionCount(user),
//     });
//     const score = updateBanditBounds(masteryEntry, totalPlays);

//     persistMasteryEntry(user, conceptId, masteryEntry);

//     if (score > bestScore) {
//       bestScore = score;
//       bestConceptId = conceptId;
//     }
//   }

//   return bestConceptId;
// }
function chooseNextConceptId(user, frontier) {
  // ==========================================
  // 1. THE FULL-INTEGRATION BUNDLE LOCK-IN CHECK
  // ==========================================
  for (const conceptId of frontier) {
    // If the concept is a full-integration module...
    if (isFullIntegrationConceptId(conceptId)) {
      const masteryEntry = ensureMasteryEntry(user, conceptId, {
        status: "unlocked",
        timeAdded: getTotalInteractionCount(user),
      });

      // If timesPlayed is not a multiple of the bundle size, they are mid-bundle!
      const bundleSize = getBundleSize(conceptId);
      if (
        masteryEntry.adaptiveState.timesPlayed > 0 &&
        masteryEntry.adaptiveState.timesPlayed % bundleSize !== 0
      ) {
        // Bypass all AI logic and force them to finish this bundle!
        return conceptId;
      }
    }
  }

  // ==========================================
  // 2. NORMAL UNPLAYED CHECK
  // ==========================================
  for (const conceptId of frontier) {
    const masteryEntry = ensureMasteryEntry(user, conceptId, {
      status: "unlocked",
      timeAdded: getTotalInteractionCount(user),
    });

    if (masteryEntry.adaptiveState.timesPlayed === 0) {
      masteryEntry.adaptiveState.ucb = 1;
      masteryEntry.adaptiveState.lcb = 0;
      persistMasteryEntry(user, conceptId, masteryEntry);
      return conceptId;
    }
  }

  // ==========================================
  // 3. NORMAL UCB MULTI-ARMED BANDIT LOGIC
  // ==========================================
  const totalPlays = frontier.reduce((sum, conceptId) => {
    const masteryEntry = ensureMasteryEntry(user, conceptId, {
      status: "unlocked",
      timeAdded: getTotalInteractionCount(user),
    });
    return sum + masteryEntry.adaptiveState.timesPlayed;
  }, 0);

  let bestConceptId = frontier[0];
  let bestScore = -Infinity;

  for (const conceptId of frontier) {
    const masteryEntry = ensureMasteryEntry(user, conceptId, {
      status: "unlocked",
      timeAdded: getTotalInteractionCount(user),
    });
    const score = updateBanditBounds(masteryEntry, totalPlays);

    persistMasteryEntry(user, conceptId, masteryEntry);

    if (score > bestScore) {
      bestScore = score;
      bestConceptId = conceptId;
    }
  }

  return bestConceptId;
}

function getQuestionForConcept(concept, masteryEntry, user) {
  if (!concept?.questions?.length) {
    return null;
  }

  const questions = concept.questions;
  const length = questions.length;
  const timesPlayed = masteryEntry.adaptiveState?.timesPlayed || 0;

  // The Salt: Unique starting point based on username
  // const saltSource = user?.username || user?._id?.toString() || "default";
  const saltSource = user?._id?.toString() || user?.username || "default";
  const salt = saltSource
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Check if this concept requires the 3-part sequence.
  const isFullIntegration = isFullIntegrationConceptId(concept.id);

  if (isFullIntegration) {
    // ==========================================
    // FULL-INTEGRATION LOGIC: Randomize Bundles
    // ==========================================
    const BUNDLE_SIZE = getBundleSize(concept.id);
    const numBundles = Math.floor(length / BUNDLE_SIZE);

    if (numBundles === 0) return questions[timesPlayed % length]; // Safety fallback

    // Jump by a prime number of bundles
    let bundleStep = 3;
    if (numBundles % bundleStep === 0) bundleStep = 5;

    // Which bundle are we on?
    const currentBundleIndex = Math.floor(timesPlayed / BUNDLE_SIZE);

    // Which step of the bundle are we on?
    const stepInsideBundle = timesPlayed % BUNDLE_SIZE;

    // Calculate which bundle to load next, then pick the exact step inside it
    const randomizedBundle =
      (salt + currentBundleIndex * bundleStep) % numBundles;
    const finalIndex = randomizedBundle * BUNDLE_SIZE + stepInsideBundle;

    return questions[finalIndex];
  } else if (
    concept.id === "missing_part_easy" ||
    concept.id === "missing_part_hard"
  ) {
    // ==========================================
    // MISSING PART EQUATIONS: Balanced Alternating Selector Logic
    // 50% Add, 50% Sub
    // ==========================================
    const addPool = questions.filter((q) => q.equationSpec?.operator === "+");
    const subPool = questions.filter((q) => q.equationSpec?.operator === "-");

    const cycleIndex = timesPlayed % 2;
    const selectedPool =
      cycleIndex === 0
        ? addPool.length
          ? addPool
          : questions
        : subPool.length
          ? subPool
          : questions;

    let step = 3;
    if (selectedPool.length % step === 0) step = 5;

    const poolIndex = (salt + timesPlayed * step) % selectedPool.length;
    return selectedPool[poolIndex];
  } else {
    // ==========================================
    // MOD 1 & 2 LOGIC: Standard Randomization
    // ==========================================
    let step = 7;
    if (length % step === 0) step = 11;

    const index = (salt + timesPlayed * step) % length;
    return questions[index];
  }
}

function updateAdaptiveState(adaptiveState, isCorrect) {
  adaptiveState.timesPlayed += 1;
  adaptiveState.correctnessSum += isCorrect ? 1 : 0;
  adaptiveState.estimate =
    adaptiveState.timesPlayed > 0
      ? adaptiveState.correctnessSum / adaptiveState.timesPlayed
      : 0;

  adaptiveState.correctnessRecord = normalizeBooleanList(
    [...adaptiveState.correctnessRecord, isCorrect],
    BANDIT_HISTORY_LIMIT,
  );

  const guessProbability = clampProbability(adaptiveState.guessProbability);
  const slipProbability = clampProbability(adaptiveState.slipProbability);
  const increment = isCorrect
    ? Math.log((1 - slipProbability) / guessProbability)
    : Math.log(slipProbability / (1 - guessProbability));

  if (increment > 0 && adaptiveState.changePointScore === 0) {
    adaptiveState.changePointIndex = adaptiveState.timesPlayed;
  }

  adaptiveState.changePointScore += increment;
  if (adaptiveState.changePointScore < 0) {
    adaptiveState.changePointScore = 0;
    adaptiveState.changePointIndex = 0;
  }

  adaptiveState.changePointLog = normalizeNumberList(
    [...adaptiveState.changePointLog, adaptiveState.changePointScore],
    BANDIT_HISTORY_LIMIT,
  );
}

function hasMasteryChangePoint(adaptiveState) {
  return adaptiveState.changePointScore >= MASTERY_SCORE_THRESHOLD;
}

async function getNextProblem(user) {
  const graph = await loadConceptGraph();
  const frontier = normalizeFrontier(user, graph.conceptMap, graph.rootIds);

  if (frontier.length === 0) {
    return { concept: null, question: null };
  }

  const conceptId = chooseNextConceptId(user, frontier);
  const concept = graph.conceptMap.get(conceptId) || null;

  if (!concept) {
    return { concept: null, question: null };
  }

  const masteryEntry = ensureMasteryEntry(user, concept.id, {
    status: "unlocked",
    timeAdded: getTotalInteractionCount(user),
  });

  return {
    concept,
    // We added `user` right here! -->
    question: getQuestionForConcept(concept, masteryEntry, user),
  };
}

async function getNextConcept(user) {
  const { concept } = await getNextProblem(user);
  return concept;
}

// async function updateMastery(user, conceptId, isCorrect) {
//   const graph = await loadConceptGraph();
//   const masteryEntry = ensureMasteryEntry(user, conceptId, {
//     status: "unlocked",
//     timeAdded: getTotalInteractionCount(user),
//   });

//   masteryEntry.lastAttempts = normalizeBooleanList(
//     [...masteryEntry.lastAttempts, isCorrect],
//     WINDOW_SIZE,
//   );
//   masteryEntry.attemptCount += 1;
//   if (isCorrect) {
//     masteryEntry.successCount += 1;
//   }

//   updateAdaptiveState(masteryEntry.adaptiveState, Boolean(isCorrect));
//   persistMasteryEntry(user, conceptId, masteryEntry);

//   if (
//     masteryEntry.status !== "mastered" &&
//     masteryEntry.attemptCount >= MASTERY_MIN_ATTEMPTS &&
//     hasMasteryChangePoint(masteryEntry.adaptiveState)
//   ) {
//     masteryEntry.status = "mastered";
//     persistMasteryEntry(user, conceptId, masteryEntry);
//     await unlockChildren(user, conceptId, graph);
//   } else if (masteryEntry.status === "mastered") {
//     user.zpdNodes = dedupeIds(
//       (user.zpdNodes || []).filter((id) => id !== conceptId),
//     );
//   }

//   user.zpdNodes = dedupeIds(
//     (user.zpdNodes || []).filter((activeConceptId) =>
//       graph.conceptMap.has(activeConceptId),
//     ),
//   );

//   return masteryEntry;
// }

// Critical Bug Fix (Stop ZPD from jumping from module 3 without completing)
// Bundle-aware scoring: Module 4 steps are grouped into bundles of 3.
// attemptCount/successCount only update when a bundle completes.
// A wrong first attempt marks the bundle as failed, but the student still
// continues through the remaining steps in the same question bundle.
async function updateMastery(user, conceptId, isCorrect) {
  const graph = await loadConceptGraph();
  const masteryEntry = ensureMasteryEntry(user, conceptId, {
    status: "unlocked",
    timeAdded: getTotalInteractionCount(user),
  });

  const isFullIntegration = isFullIntegrationConceptId(conceptId);

  // Step 1: Always update adaptive state first (increments timesPlayed)
  updateAdaptiveState(masteryEntry.adaptiveState, Boolean(isCorrect));

  // Step 2: Update mastery-level counts (bundle-aware for Module 4)
  let bundleJustCompleted = false;
  let bundleCorrect = false;

  if (isFullIntegration) {
    // ==========================================
    // BUNDLE-AWARE SCORING for Full Integration
    // ==========================================
    const bundleSize = getBundleSize(conceptId);
    const tp = masteryEntry.adaptiveState.timesPlayed; // already incremented

    if (tp % bundleSize === 0) {
      // Bundle completed naturally after the last step.
      bundleJustCompleted = true;
      const record = masteryEntry.adaptiveState.correctnessRecord;
      const lastN = record.slice(-bundleSize);
      bundleCorrect = lastN.length === bundleSize && lastN.every(Boolean);

      masteryEntry.attemptCount += 1;
      if (bundleCorrect) {
        masteryEntry.successCount += 1;
      }
      masteryEntry.lastAttempts = normalizeBooleanList(
        [...masteryEntry.lastAttempts, bundleCorrect],
        WINDOW_SIZE,
      );
    }
    // else: mid-bundle -> don't update mastery counts yet
  } else {
    // ==========================================
    // STANDARD per-step scoring (Modules 1-3, 5-6)
    // ==========================================
    bundleJustCompleted = true;
    bundleCorrect = isCorrect;

    masteryEntry.lastAttempts = normalizeBooleanList(
      [...masteryEntry.lastAttempts, isCorrect],
      WINDOW_SIZE,
    );
    masteryEntry.attemptCount += 1;
    if (isCorrect) {
      masteryEntry.successCount += 1;
    }
  }

  persistMasteryEntry(user, conceptId, masteryEntry);

  // Step 3: Check for mastery graduation
  // For full-integration, timesPlayed (not attemptCount) tracks bundle boundaries
  const isBundleComplete = isFullIntegration
    ? masteryEntry.adaptiveState.timesPlayed % getBundleSize(conceptId) === 0
    : true;

  // Success rate check: student must achieve >= MASTERY_SUCCESS_RATE (80%) over the recent window
  const windowAttempts = masteryEntry.lastAttempts || [];
  const recentSuccesses = windowAttempts.filter(Boolean).length;
  const recentSuccessRate =
    windowAttempts.length > 0 ? recentSuccesses / windowAttempts.length : 0;

  const hasRequiredSuccessRate = recentSuccessRate >= MASTERY_SUCCESS_RATE;

  if (
    masteryEntry.status !== "mastered" &&
    masteryEntry.attemptCount >= MASTERY_MIN_ATTEMPTS &&
    hasMasteryChangePoint(masteryEntry.adaptiveState) &&
    hasRequiredSuccessRate &&
    isBundleComplete
  ) {
    masteryEntry.status = "mastered";
    persistMasteryEntry(user, conceptId, masteryEntry);
    await unlockChildren(user, conceptId, graph);
  } else if (masteryEntry.status === "mastered") {
    user.zpdNodes = dedupeIds(
      (user.zpdNodes || []).filter((id) => id !== conceptId),
    );
  }

  user.zpdNodes = dedupeIds(
    (user.zpdNodes || []).filter((activeConceptId) =>
      graph.conceptMap.has(activeConceptId),
    ),
  );

  return { masteryEntry, bundleJustCompleted, bundleCorrect };
}

/**
 * Jump the student directly to a specific concept by mastering all
 * prerequisites up to (but not including) the target concept.
 * This lets students skip practice sections and go straight to word problems.
 */
async function jumpToConcept(user, targetConceptId) {
  const graph = await loadConceptGraph();
  const targetConcept = graph.conceptMap.get(targetConceptId);
  if (!targetConcept) {
    throw new Error(`Concept "${targetConceptId}" not found`);
  }

  // Collect all ancestors (prerequisites, recursively) of the target
  const toMaster = new Set();
  const queue = [...(targetConcept.prerequisites || [])];
  while (queue.length > 0) {
    const id = queue.shift();
    if (toMaster.has(id) || !graph.conceptMap.has(id)) continue;
    toMaster.add(id);
    const concept = graph.conceptMap.get(id);
    for (const prereq of concept.prerequisites || []) {
      queue.push(prereq);
    }
  }

  // Mark every ancestor as mastered
  const timeAdded = getTotalInteractionCount(user);
  for (const conceptId of toMaster) {
    const entry = ensureMasteryEntry(user, conceptId, {
      status: "unlocked",
      timeAdded,
    });
    entry.status = "mastered";
    persistMasteryEntry(user, conceptId, entry);
  }

  // Unlock the target concept itself
  const targetEntry = ensureMasteryEntry(user, targetConceptId, {
    status: "unlocked",
    timeAdded,
  });
  if (targetEntry.status === "locked") {
    targetEntry.status = "unlocked";
    persistMasteryEntry(user, targetConceptId, targetEntry);
  }

  // Set the ZPD to the target concept only
  user.zpdNodes = [targetConceptId];
}

/**
 * Switch the student's active section and un-skip any skipped nodes.
 */
async function switchSection(user, sectionId) {
  const PATHWAYS = {
    practice: ["single_add", "single_sub", "multi_add", "multi_sub"],
    equations: ["missing_part_easy", "missing_part_hard"],
  };

  if (sectionId === "schemas") {
    const entry = user.mastery.get("combine_mod1");
    if (!entry || entry.status === "locked") {
      await jumpToConcept(user, "combine_mod1");
      return;
    }

    const schemaNodes = [];
    for (const [id, mEntry] of user.mastery.entries()) {
      if (!PATHWAYS.practice.includes(id) && !PATHWAYS.equations.includes(id)) {
        if (mEntry.status === "unlocked") {
          schemaNodes.push(id);
        }
      }
    }

    if (schemaNodes.length > 0) {
      user.zpdNodes = schemaNodes;
    } else {
      const target = "combine_mod1";
      const mEntry = user.mastery.get(target);
      if (mEntry) {
        mEntry.status = "unlocked";
        persistMasteryEntry(user, target, mEntry);
      }
      user.zpdNodes = [target];
    }
    return;
  }

  const concepts = PATHWAYS[sectionId];
  if (!concepts) throw new Error("Invalid section");

  for (const conceptId of concepts) {
    const entry = user.mastery.get(conceptId);
    if (entry && entry.status === "mastered") {
      const windowAttempts = entry.lastAttempts || [];
      const recentSuccesses = windowAttempts.filter(Boolean).length;
      const recentSuccessRate =
        windowAttempts.length > 0 ? recentSuccesses / windowAttempts.length : 0;

      const trulyMastered =
        entry.attemptCount >= MASTERY_MIN_ATTEMPTS &&
        recentSuccessRate >= MASTERY_SUCCESS_RATE &&
        hasMasteryChangePoint(entry.adaptiveState);

      if (!trulyMastered) {
        entry.status = "unlocked";
        persistMasteryEntry(user, conceptId, entry);
      }
    }
  }

  let targetConceptId = null;
  for (const conceptId of concepts) {
    const entry = user.mastery.get(conceptId);
    if (!entry || entry.status !== "mastered") {
      targetConceptId = conceptId;
      break;
    }
  }

  if (!targetConceptId) {
    targetConceptId = concepts[concepts.length - 1];
    const entry = user.mastery.get(targetConceptId);
    entry.status = "unlocked";
    persistMasteryEntry(user, targetConceptId, entry);
  }

  const targetEntry = ensureMasteryEntry(user, targetConceptId, {
    status: "unlocked",
    timeAdded: getTotalInteractionCount(user),
  });

  if (targetEntry.status === "locked") {
    targetEntry.status = "unlocked";
    persistMasteryEntry(user, targetConceptId, targetEntry);
  }

  user.zpdNodes = [targetConceptId];
}

module.exports = {
  updateMastery,
  getNextConcept,
  getNextProblem,
  jumpToConcept,
  switchSection,
  isFullIntegrationConceptId,
  MASTERY_MIN_ATTEMPTS,
  MASTERY_SCORE_THRESHOLD,
  MASTERY_SUCCESS_RATE,
  WINDOW_SIZE,
};
