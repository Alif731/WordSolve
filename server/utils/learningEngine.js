const Concept = require("../models/Concept");

const WINDOW_SIZE = 10;
const MASTERY_MIN_ATTEMPTS = 5;
const CHANGE_POINT_FALSE_POSITIVE_RATE = 0.0004;
const BANDIT_PRIORS = Object.freeze({
  guessAlpha: 20,
  guessBeta: 160,
  slipAlpha: 20,
  slipBeta: 160,
});
const BANDIT_HISTORY_LIMIT = 25;
const EPSILON = 1e-9;

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

function sampleStandardNormal() {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function sampleGamma(shape) {
  if (shape < 1) {
    const uniform = 1 - Math.random();
    return sampleGamma(shape + 1) * Math.pow(uniform, 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    const x = sampleStandardNormal();
    const v = Math.pow(1 + c * x, 3);

    if (v <= 0) {
      continue;
    }

    const uniform = Math.random();
    if (uniform < 1 - 0.0331 * Math.pow(x, 4)) {
      return d * v;
    }

    if (Math.log(uniform) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

function sampleBeta(alpha, beta) {
  const x = sampleGamma(alpha);
  const y = sampleGamma(beta);
  return x / (x + y);
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
      adaptiveState?.guessProbability,
      sampleBeta(BANDIT_PRIORS.guessAlpha, BANDIT_PRIORS.guessBeta),
    ),
    slipProbability: clampProbability(
      adaptiveState?.slipProbability,
      sampleBeta(BANDIT_PRIORS.slipAlpha, BANDIT_PRIORS.slipBeta),
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

function chooseNextConceptId(user, frontier) {
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

function getQuestionForConcept(concept, masteryEntry) {
  if (!concept?.questions?.length) {
    return null;
  }

  const questionIndex =
    masteryEntry.adaptiveState.timesPlayed % concept.questions.length;
  return concept.questions[questionIndex];
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
  return (
    adaptiveState.changePointScore >=
    Math.log(1 / CHANGE_POINT_FALSE_POSITIVE_RATE)
  );
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
    question: getQuestionForConcept(concept, masteryEntry),
  };
}

async function getNextConcept(user) {
  const { concept } = await getNextProblem(user);
  return concept;
}

async function updateMastery(user, conceptId, isCorrect) {
  const graph = await loadConceptGraph();
  const masteryEntry = ensureMasteryEntry(user, conceptId, {
    status: "unlocked",
    timeAdded: getTotalInteractionCount(user),
  });

  masteryEntry.lastAttempts = normalizeBooleanList(
    [...masteryEntry.lastAttempts, isCorrect],
    WINDOW_SIZE,
  );
  masteryEntry.attemptCount += 1;
  if (isCorrect) {
    masteryEntry.successCount += 1;
  }

  updateAdaptiveState(masteryEntry.adaptiveState, Boolean(isCorrect));
  persistMasteryEntry(user, conceptId, masteryEntry);

  if (
    masteryEntry.status !== "mastered" &&
    masteryEntry.attemptCount >= MASTERY_MIN_ATTEMPTS &&
    hasMasteryChangePoint(masteryEntry.adaptiveState)
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

  return masteryEntry;
}

module.exports = {
  updateMastery,
  getNextConcept,
  getNextProblem,
};
