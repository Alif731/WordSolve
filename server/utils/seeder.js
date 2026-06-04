const Concept = require("../models/Concept");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const TeacherSignupCode = require("../models/TeacherSignupCode");
const {
  buildEquationString,
  createBarModelSpec,
  createEquationTemplate,
  createQuestionEnvelope,
  extractNounFromQuestion,
} = require("./backendAnswerValidation");

const DEFAULT_TEACHER_SIGNUP_CODE = "TEACHER2026";

const stringifySlots = (slots) =>
  Object.fromEntries(
    Object.entries(slots).map(([key, value]) => [key, String(value)]),
  );

const getGivenSlotKeys = (slots) =>
  Object.entries(slots)
    .filter(([, value]) => String(value).trim() !== "?")
    .map(([key]) => key);

const getValidatedSlots = (schemaKind, slots) =>
  schemaKind === "compare"
    ? stringifySlots(slots)
    : stringifySlots(
        Object.fromEntries(
          Object.entries(slots).filter(
            ([, value]) => String(value).trim() !== "?",
          ),
        ),
      );

const withUnknownSlot = (values, unknownSlot) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      key === unknownSlot ? "?" : String(value),
    ]),
  );

const ensureTeacherSignupCode = async () => {
  const existingCode = await TeacherSignupCode.findOne({
    code: DEFAULT_TEACHER_SIGNUP_CODE,
  });

  if (!existingCode) {
    await TeacherSignupCode.create({
      code: DEFAULT_TEACHER_SIGNUP_CODE,
      label: "Default teacher signup code",
    });
    console.log("Teacher Sign-Up Code Seeded");
  }
};

// ============================================================================

// SHARED SCHEMA HELPERS

// ============================================================================

const createEquationFromBarQuestion = ({
  concept,
  text,
  schemaKind,
  barValues,
  scaleValues = barValues,
  labels,
  roleLabels = labels,
  valueLabels = {},
  equationDisplayValues,
  validationSlots,
  alternateSlots = validationSlots,
  operator,
  difficulty,
  participants = null,
  comparisonWording = null,
  equationForm = null,
  compareVariant = null,
  alignmentMode = null,
  barDecorations = {},
}) => {
  const editableEquationKeys = getGivenSlotKeys(validationSlots);
  const keys =
    schemaKind === "compare"
      ? {
          left: {
            key: "leftTerm",
            label: labels.left,
            role: "smaller",
            value: equationDisplayValues.leftTerm,
          },
          right: {
            key: "rightTerm",
            label: labels.right,
            role: "difference",
            value: equationDisplayValues.rightTerm,
          },
          result: {
            key: "result",
            label: labels.result,
            role: "bigger",
            value: equationDisplayValues.result,
          },
        }
      : {
          left: {
            key: "leftTerm",
            label: labels.left,
            role: schemaKind === "change" ? "start" : "partA",
            value: equationDisplayValues.leftTerm,
          },
          right: {
            key: "rightTerm",
            label: labels.right,
            role: schemaKind === "change" ? "change" : "partB",
            value: equationDisplayValues.rightTerm,
          },
          result: {
            key: "result",
            label: labels.result,
            role: schemaKind === "change" ? "end" : "total",
            value: equationDisplayValues.result,
          },
        };

  const operatorEditable = schemaKind !== "change";
  const equationSpec = {
    operator,
    operatorEditable,
    template: createEquationTemplate({
      operator,
      left: keys.left,
      right: keys.right,
      result: keys.result,
      editableKeys: editableEquationKeys,
      operatorEditable,
    }),
  };

  return createQuestionEnvelope({
    text,
    concept,
    type: "equation_builder",
    difficulty,
    correctAnswer: buildEquationString(equationSpec, {
      slots: validationSlots,
      operator,
    }),
    schemaKind,
    interactionMode: "equation_builder",
    moduleStage: "bar_to_equation",
    promptTitle: "build the equation",
    inputMode: "keypad_equation",
    helperText: "Tap any box to fill in the equation.",
    barModelSpec: createBarModelSpec({
      schemaKind,
      unknownSlot:
        Object.entries(barValues).find(([, value]) => value === "?")?.[0] ||
        null,
      values: barValues,
      scaleValues,
      labels,
      roleLabels,
      valueLabels,
      participants,
      comparisonWording,
      equationForm,
      compareVariant,
      alignmentMode,
      barDecorations,
    }),
    equationSpec,
    validation: {
      slots: getValidatedSlots(schemaKind, validationSlots),
      alternateSlots: stringifySlots(alternateSlots),
      operator,
      equations: [
        buildEquationString(equationSpec, {
          slots: validationSlots,
          operator,
        }),
        buildEquationString(equationSpec, {
          slots: alternateSlots,
          operator,
        }),
      ],
    },
  });
};

const createSchemaRecognitionQuestion = ({
  concept,
  text,
  schemaKind,
  values,
  labels,
  roleLabels = labels,
  displayValues,
  validationSlots,
  alternateSlots = values,
  unknownSlot,
  difficulty,
}) =>
  createQuestionEnvelope({
    text,
    concept,
    type: "bar_model_builder",
    difficulty,
    correctAnswer: "bar-model-complete",
    schemaKind,
    interactionMode: "bar_model_builder",
    moduleStage: "word_to_bar", // Critical: This hides the stage tabs
    promptTitle: "build the bar model",
    inputMode: "keypad_bar_model",
    helperText: "Fill only the numbers that are given in the story.",
    unknownSlot,
    barModelSpec: createBarModelSpec({
      schemaKind,
      unknownSlot,
      values: displayValues,
      scaleValues: values,
      labels,
      roleLabels,
      editableKeys: getGivenSlotKeys(validationSlots),
    }),
    validation: {
      slots: getValidatedSlots(schemaKind, validationSlots),
      alternateSlots: stringifySlots(alternateSlots),
    },
  });

const createSchemaBarQuestion = ({
  concept,
  text,
  schemaKind,
  values,
  labels,
  roleLabels = labels,
  valueLabels = {},
  displayValues,
  validationSlots,
  alternateSlots = values,
  unknownSlot,
  difficulty,
  participants = null,
  comparisonWording = null,
  equationForm = null,
  compareVariant = null,
  alignmentMode = null,
  barDecorations = {},
  stageIndex = 1,
  stageLabel = "1. Bar model",
  stageTotal = 3,
}) =>
  createQuestionEnvelope({
    text,
    concept,
    type: "bar_model_builder",
    difficulty,
    correctAnswer: "bar-model-complete",
    schemaKind,
    interactionMode: "bar_model_builder",
    moduleStage: "schema_bar_model",
    promptTitle: "bar model",
    inputMode: "keypad_bar_model",
    stageIndex,
    stageLabel,
    stageTotal,
    helperText: "Fill only the numbers that are given in the story.",
    unknownSlot,
    barModelSpec: createBarModelSpec({
      schemaKind,
      unknownSlot,
      values: displayValues,
      scaleValues: values,
      labels,
      roleLabels,
      valueLabels,
      editableKeys: getGivenSlotKeys(validationSlots),
      participants,
      comparisonWording,
      equationForm,
      compareVariant,
      alignmentMode,
      barDecorations,
    }),
    validation: {
      slots: getValidatedSlots(schemaKind, validationSlots),
      alternateSlots: stringifySlots(alternateSlots),
    },
  });

const createSchemaEquationQuestion = ({
  concept,
  text,
  schemaKind,
  values,
  displayBarValues = values,
  scaleValues = values,
  labels,
  roleLabels = labels,
  valueLabels = {},
  unknownSlot,
  equationValues,
  validationSlots,
  alternateSlots = validationSlots,
  operator,
  difficulty,
  participants = null,
  comparisonWording = null,
  equationForm = null,
  compareVariant = null,
  alignmentMode = null,
  barDecorations = {},
  hideTopBar = false,
  stageIndex = 2,
  stageLabel = "2. Equation",
  stageTotal = 3,
}) => {
  const editableEquationKeys = getGivenSlotKeys(validationSlots);
  const operatorEditable = schemaKind !== "change";
  const equationSpec = {
    operator,
    operatorEditable,
    template: createEquationTemplate({
      operator,
      left: {
        key: "leftTerm",
        label: labels.left,
        role:
          schemaKind === "compare"
            ? "smaller"
            : schemaKind === "change"
              ? "start"
              : "partA",
        value: equationValues.leftTerm,
      },
      right: {
        key: "rightTerm",
        label: labels.right,
        role:
          schemaKind === "compare"
            ? "difference"
            : schemaKind === "change"
              ? "change"
              : "partB",
        value: equationValues.rightTerm,
      },
      result: {
        key: "result",
        label: labels.result,
        role:
          schemaKind === "compare"
            ? "bigger"
            : schemaKind === "change"
              ? "end"
              : "total",
        value: equationValues.result,
      },
      editableKeys: editableEquationKeys,
      operatorEditable,
    }),
  };

  return createQuestionEnvelope({
    text,
    concept,
    type: "equation_builder",
    difficulty,
    correctAnswer: buildEquationString(equationSpec, {
      slots: validationSlots,
      operator,
    }),
    schemaKind,
    interactionMode: "equation_builder",
    moduleStage: "schema_equation",
    promptTitle: "equation",
    inputMode: "keypad_equation",
    stageIndex,
    stageLabel,
    stageTotal,
    helperText: "Fill only the numbers that are given in the story.",
    unknownSlot,
    barModelSpec: {
      ...createBarModelSpec({
        schemaKind,
        unknownSlot,
        values: displayBarValues,
        scaleValues,
        labels,
        roleLabels,
        valueLabels,
        participants,
        comparisonWording,
        equationForm,
        compareVariant,
        alignmentMode,
        barDecorations,
      }),
      hideTopBar,
    },
    equationSpec,
    validation: {
      slots: getValidatedSlots(schemaKind, validationSlots),
      alternateSlots: stringifySlots(alternateSlots),
      operator,
      equations: [
        buildEquationString(equationSpec, {
          slots: validationSlots,
          operator,
        }),
        buildEquationString(equationSpec, {
          slots: alternateSlots,
          operator,
        }),
      ],
    },
  });
};

const createSchemaSolveQuestion = ({
  concept,
  text,
  schemaKind,
  answer,
  displayEquation,
  verificationEquation,
  solutionLabel,
  difficulty,
  stageIndex = 3,
  stageLabel = "3. Solve",
  stageTotal = 3,
}) =>
  createQuestionEnvelope({
    text,
    concept,
    type: "direct",
    difficulty,
    correctAnswer: answer,
    schemaKind,
    interactionMode: "direct_answer",
    moduleStage: "schema_solve",
    promptTitle: "solve",
    inputMode: "text_answer",
    stageIndex,
    stageLabel,
    stageTotal,
    helperText: "Work out the value of ? and enter it above.",
    equationSpec: {
      displayEquation,
    },
    validation: {
      acceptableAnswers: [String(answer)],
      displayEquation,
      verificationEquation,
      solutionLabel,
    },
  });

const createVariableIdentificationQuestion = ({
  concept,
  text,
  schemaKind,
  sentences,
  variables,
  difficulty,
}) =>
  createQuestionEnvelope({
    text,
    concept,
    type: "variable_identification",
    difficulty,
    correctAnswer: "variables-identified",
    schemaKind,
    interactionMode: "variable_identification",
    moduleStage: "schema_variables",
    promptTitle: "identify variables",
    inputMode: "text_answer",
    helperText:
      "For each variable, decide: is it given in the problem, or is it what we need to find? For given variables, enter the value.",
    visualData: {
      sentences,
      variables: variables.map(({ key, label }) => ({ key, label })),
    },
    validation: {
      variables: Object.fromEntries(
        variables.map(({ key, role, value }) => [
          key,
          { role, value: String(value) },
        ]),
      ),
    },
  });

const createDirectSchemaQuestion = ({
  concept,
  text,
  schemaKind,
  answer,
  difficulty,
}) =>
  createQuestionEnvelope({
    text,
    concept,
    type: "direct",
    difficulty,
    correctAnswer: answer,
    schemaKind,
    interactionMode: "direct_answer",
    moduleStage: "schema_direct_solve",
    promptTitle: "solve the problem",
    inputMode: "text_answer",
    helperText: "Solve the story problem directly and enter the answer.",
    validation: {
      acceptableAnswers: [String(answer)],
    },
  });

const createSchemaVariableQuestionFromItem = ({
  item,
  concept,
  schemaKind,
  slotKeys,
}) =>
  createVariableIdentificationQuestion({
    concept,
    text: item.text,
    schemaKind,
    sentences: item.sentences,
    difficulty: item.difficulty,
    variables: slotKeys.map((key) => ({
      key,
      label: item.labels[key],
      role: key === item.unknownSlot ? "find" : "given",
      value: key === item.unknownSlot ? "?" : item.values[key],
    })),
  });

const createDirectQuestionFromItem = ({ item, concept, schemaKind }) =>
  createDirectSchemaQuestion({
    concept,
    text: item.text,
    schemaKind,
    answer: item.values[item.unknownSlot],
    difficulty: item.difficulty,
  });

// ============================================================================

// 1. ARITHMETIC PRACTICE (4 MODULES)

// ============================================================================

const createPracticeQuestion = ({
  concept,
  promptTitle,
  practiceMode,
  left,
  operator,
  right,
  answer,
  difficulty,
}) => {
  const equationSpec = {
    operator,
    template: createEquationTemplate({
      operator,
      left: { key: "left", label: "1st number", value: left },
      right: { key: "right", label: "2nd number", value: right },
      result: { key: "answer", label: "answer", value: answer },
      editableKeys: ["answer"],
    }),
  };

  return createQuestionEnvelope({
    text: `${left} ${operator} ${right} = ?`,
    concept,
    type: "direct",
    difficulty,
    correctAnswer: answer,
    schemaKind: "practice",
    interactionMode: "direct_answer",
    moduleStage: "practice",
    practiceMode,
    promptTitle,
    inputMode: "keypad_single_blank",
    helperText: "Tap the ? box, then type the answer.",
    equationSpec,
    operands: [left, right],
    validation: {
      acceptableAnswers: [String(answer)],
      slots: { answer: String(answer) },
    },
  });
};

const arithmeticConcepts = [
  {
    id: "single_add",
    title: "Single +",
    description: "Single-digit addition practice.",
    prerequisites: [],
    questions: [
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 3,
        operator: "+",
        right: 4,
        answer: 7,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 8,
        operator: "+",
        right: 1,
        answer: 9,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 6,
        operator: "+",
        right: 2,
        answer: 8,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 5,
        operator: "+",
        right: 4,
        answer: 9,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 4,
        operator: "+",
        right: 5,
        answer: 9,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 7,
        operator: "+",
        right: 2,
        answer: 9,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 2,
        operator: "+",
        right: 5,
        answer: 7,
        difficulty: 1,
      }),
    ],
  },
  {
    id: "single_sub",
    title: "Single -",
    description: "Single-digit subtraction practice.",
    prerequisites: ["single_add"],
    questions: [
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 9,
        operator: "-",
        right: 2,
        answer: 7,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 8,
        operator: "-",
        right: 3,
        answer: 5,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 7,
        operator: "-",
        right: 1,
        answer: 6,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 6,
        operator: "-",
        right: 4,
        answer: 2,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 8,
        operator: "-",
        right: 5,
        answer: 3,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 9,
        operator: "-",
        right: 4,
        answer: 5,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 5,
        operator: "-",
        right: 2,
        answer: 3,
        difficulty: 1,
      }),
    ],
  },
  {
    id: "multi_add",
    title: "Multi +",
    description: "Multi-digit addition practice.",
    prerequisites: ["single_sub"],
    questions: [
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 14,
        operator: "+",
        right: 8,
        answer: 22,
        difficulty: 2,
      }),
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 27,
        operator: "+",
        right: 15,
        answer: 42,
        difficulty: 2,
      }),
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 36,
        operator: "+",
        right: 12,
        answer: 48,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 46,
        operator: "+",
        right: 23,
        answer: 69,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 52,
        operator: "+",
        right: 35,
        answer: 87,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 61,
        operator: "+",
        right: 28,
        answer: 89,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 44,
        operator: "+",
        right: 33,
        answer: 77,
        difficulty: 3,
      }),
    ],
  },
  {
    id: "multi_sub",
    title: "Multi -",
    description: "Multi-digit subtraction practice.",
    prerequisites: ["multi_add"],
    questions: [
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 21,
        operator: "-",
        right: 7,
        answer: 14,
        difficulty: 2,
      }),
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 32,
        operator: "-",
        right: 14,
        answer: 18,
        difficulty: 2,
      }),
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 54,
        operator: "-",
        right: 21,
        answer: 33,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 58,
        operator: "-",
        right: 27,
        answer: 31,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 75,
        operator: "-",
        right: 42,
        answer: 33,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 88,
        operator: "-",
        right: 51,
        answer: 37,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 96,
        operator: "-",
        right: 34,
        answer: 62,
        difficulty: 3,
      }),
    ],
  },
];

// ============================================================================

// 2. MISSING NUMBERS (2 MODULES)

// ============================================================================

const createMissingPartQuestion = ({
  concept,
  operator,
  values,
  unknownKey,
  difficulty,
}) => {
  const equationSpec = {
    operator,
    template: createEquationTemplate({
      operator,
      left:
        operator === "+"
          ? { key: "partA", label: "1st number", value: values.partA }
          : { key: "start", label: "1st number", value: values.start },
      right:
        operator === "+"
          ? { key: "partB", label: "2nd number", value: values.partB }
          : { key: "change", label: "2nd number", value: values.change },
      result:
        operator === "+"
          ? { key: "total", label: "answer", value: values.total }
          : { key: "end", label: "answer", value: values.end },
      editableKeys: [unknownKey],
    }),
  };

  const solvedValues =
    operator === "+"
      ? { partA: values.partA, partB: values.partB, total: values.total }
      : { start: values.start, change: values.change, end: values.end };

  return createQuestionEnvelope({
    text: buildEquationString(equationSpec, { slots: solvedValues }),
    concept,
    type: "equation_builder",
    difficulty,
    correctAnswer: solvedValues[unknownKey],
    // schemaKind: "missing_part",
    schemaKind: "practice",
    interactionMode: "equation_builder",
    moduleStage: "equations",
    practiceMode: concept,
    promptTitle: "find the missing number",
    inputMode: "keypad_equation",
    helperText: "Tap the blue box and type your answer.",
    unknownSlot: unknownKey,
    equationSpec,
    validation: {
      slots: { [unknownKey]: String(solvedValues[unknownKey]) },
      equation: buildEquationString(equationSpec, { slots: solvedValues }),
    },
  });
};

const missingNumberConcepts = [
  {
    id: "missing_part_easy",
    title: "Missing Number (Easy)",
    description: "Find the missing number in any position (under 20).",
    prerequisites: ["multi_sub"],
    questions: [
      // Addition
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "+",
        values: { partA: 8, partB: 4, total: 12 },
        unknownKey: "partB",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "+",
        values: { partA: 6, partB: 4, total: 10 },
        unknownKey: "partA",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "+",
        values: { partA: 9, partB: 6, total: 15 },
        unknownKey: "total",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "+",
        values: { partA: 7, partB: 5, total: 12 },
        unknownKey: "partA",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "+",
        values: { partA: 9, partB: 8, total: 17 },
        unknownKey: "partB",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "+",
        values: { partA: 5, partB: 7, total: 12 },
        unknownKey: "total",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "+",
        values: { partA: 8, partB: 6, total: 14 },
        unknownKey: "partA",
        difficulty: 1,
      }),
      // Subtraction
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "-",
        values: { start: 14, change: 5, end: 9 },
        unknownKey: "start",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "-",
        values: { start: 15, change: 8, end: 7 },
        unknownKey: "start",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "-",
        values: { start: 18, change: 9, end: 9 },
        unknownKey: "change",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "-",
        values: { start: 12, change: 4, end: 8 },
        unknownKey: "end",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "-",
        values: { start: 19, change: 6, end: 13 },
        unknownKey: "start",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_easy",
        operator: "-",
        values: { start: 16, change: 7, end: 9 },
        unknownKey: "change",
        difficulty: 1,
      }),
    ],
  },
  {
    id: "missing_part_hard",
    title: "Missing Number (Hard)",
    description: "Find the missing number in any position (up to 99).",
    prerequisites: ["missing_part_easy"],
    questions: [
      // Addition
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "+",
        values: { partA: 25, partB: 35, total: 60 },
        unknownKey: "partB",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "+",
        values: { partA: 42, partB: 28, total: 70 },
        unknownKey: "partA",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "+",
        values: { partA: 55, partB: 33, total: 88 },
        unknownKey: "total",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "+",
        values: { partA: 38, partB: 24, total: 62 },
        unknownKey: "partA",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "+",
        values: { partA: 46, partB: 37, total: 83 },
        unknownKey: "partB",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "+",
        values: { partA: 23, partB: 45, total: 68 },
        unknownKey: "total",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "+",
        values: { partA: 32, partB: 54, total: 86 },
        unknownKey: "partA",
        difficulty: 2,
      }),
      // Subtraction
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "-",
        values: { start: 75, change: 25, end: 50 },
        unknownKey: "change",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "-",
        values: { start: 82, change: 34, end: 48 },
        unknownKey: "end",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "-",
        values: { start: 95, change: 42, end: 53 },
        unknownKey: "start",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "-",
        values: { start: 68, change: 21, end: 47 },
        unknownKey: "change",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "-",
        values: { start: 55, change: 29, end: 26 },
        unknownKey: "end",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_hard",
        operator: "-",
        values: { start: 78, change: 45, end: 33 },
        unknownKey: "start",
        difficulty: 2,
      }),
    ],
  },
];

// ============================================================================

// 3. COMBINE SCHEMA (5 MODULES)

// ============================================================================

const createCombineBarModelQuestion = ({
  concept,
  text,
  values,
  labels,
  unknownSlot,
  difficulty,
  moduleStage = "word_to_bar",
}) => {
  const displayValues = { partA: "?", partB: "?", total: "?" };
  const validationSlots = withUnknownSlot(values, unknownSlot);

  const createQuestion =
    moduleStage === "schema_bar_model"
      ? createSchemaBarQuestion
      : createSchemaRecognitionQuestion;

  return createQuestion({
    concept,
    text,
    schemaKind: "combine",
    values,
    labels,
    displayValues,
    validationSlots,
    alternateSlots: stringifySlots(values),
    unknownSlot,
    difficulty,
  });
};

const createCombineEquationQuestion = ({
  concept,
  text,
  values,
  labels,
  unknownSlot,
  difficulty,
  moduleStage = "bar_to_equation",
}) => {
  const displayValues = withUnknownSlot(values, unknownSlot);
  const equationLabels = {
    ...labels,
    left: labels.partA,
    right: labels.partB,
    result: labels.total,
  };
  const equationSlots = {
    leftTerm: displayValues.partA,
    rightTerm: displayValues.partB,
    result: displayValues.total,
  };
  const alternateSlots = {
    leftTerm: String(values.partA),
    rightTerm: String(values.partB),
    result: String(values.total),
  };

  const question =
    moduleStage === "schema_equation"
      ? createSchemaEquationQuestion({
          concept,
          text,
          schemaKind: "combine",
          values: displayValues,
          displayBarValues: displayValues,
          scaleValues: values,
          labels: equationLabels,
          unknownSlot,
          equationValues: equationSlots,
          validationSlots: equationSlots,
          alternateSlots,
          operator: "+",
          difficulty,
        })
      : createEquationFromBarQuestion({
          concept,
          text,
          schemaKind: "combine",
          barValues: displayValues,
          scaleValues: values,
          labels: equationLabels,
          equationDisplayValues: equationSlots,
          validationSlots: equationSlots,
          alternateSlots,
          operator: "+",
          difficulty,
        });

  return question;
};

const createCombineSolveQuestion = ({
  concept,
  text,
  values,
  unknownSlot,
  difficulty,
}) => {
  const displayValues = withUnknownSlot(values, unknownSlot);
  const displayEquation = `${displayValues.partA} + ${displayValues.partB} = ${displayValues.total}`;
  const answer = values[unknownSlot];
  const verificationEquation = `${values.partA} + ${values.partB} = ${values.total}`;

  return createSchemaSolveQuestion({
    concept,
    text,
    schemaKind: "combine",
    answer,
    displayEquation,
    verificationEquation,
    solutionLabel: `? = ${answer}`,
    difficulty,
  });
};

const createCombineFullBundle = (item, concept = "combine_mod4") => [
  createCombineBarModelQuestion({
    ...item,
    concept,
    moduleStage: "schema_bar_model",
  }),
  createCombineEquationQuestion({
    ...item,
    concept,
    moduleStage: "schema_equation",
  }),
  createCombineSolveQuestion({ ...item, concept }),
];

const combineMod1Items = [
  {
    text: "There are 18 cows and 7 sheep in a field. How many animals are in the field?",
    sentences: [
      "There are 18 cows and 7 sheep in a field.",
      "How many animals are in the field?",
    ],
    values: { partA: 18, partB: 7, total: 25 },
    labels: { partA: "cows", partB: "sheep", total: "total animals" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "A basket has 24 fruits. 9 are apples and the rest are oranges. How many oranges are in the basket?",
    sentences: [
      "A basket has 24 fruits.",
      "9 are apples and the rest are oranges.",
      "How many oranges are in the basket?",
    ],
    values: { partA: 9, partB: 15, total: 24 },
    labels: { partA: "apples", partB: "oranges", total: "total fruits" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "A class has 31 students. 16 are boys and the rest are girls. How many girls are in the class?",
    sentences: [
      "A class has 31 students.",
      "16 are boys and the rest are girls.",
      "How many girls are in the class?",
    ],
    values: { partA: 16, partB: 15, total: 31 },
    labels: { partA: "boys", partB: "girls", total: "total students" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "Nina has 14 red beads and 11 blue beads. How many beads does Nina have altogether?",
    sentences: [
      "Nina has 14 red beads and 11 blue beads.",
      "How many beads does Nina have altogether?",
    ],
    values: { partA: 14, partB: 11, total: 25 },
    labels: { partA: "red beads", partB: "blue beads", total: "total beads" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "A shelf has 40 books. 23 are storybooks and the rest are comics. How many comics are on the shelf?",
    sentences: [
      "A shelf has 40 books.",
      "23 are storybooks and the rest are comics.",
      "How many comics are on the shelf?",
    ],
    values: { partA: 23, partB: 17, total: 40 },
    labels: { partA: "storybooks", partB: "comics", total: "total books" },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "A jar has 28 marbles. 10 are glass marbles and the rest are clay marbles. How many clay marbles are in the jar?",
    sentences: [
      "A jar has 28 marbles.",
      "10 are glass marbles and the rest are clay marbles.",
      "How many clay marbles are in the jar?",
    ],
    values: { partA: 10, partB: 18, total: 28 },
    labels: {
      partA: "glass marbles",
      partB: "clay marbles",
      total: "total marbles",
    },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "A team scored 19 points in the first half and 22 points in the second half. How many points did the team score in all?",
    sentences: [
      "A team scored 19 points in the first half and 22 points in the second half.",
      "How many points did the team score in all?",
    ],
    values: { partA: 19, partB: 22, total: 41 },
    labels: {
      partA: "first half",
      partB: "second half",
      total: "total points",
    },
    unknownSlot: "total",
    difficulty: 3,
  },
  {
    text: "A tray has 36 snacks. 14 are chips and the rest are cookies. How many cookies are on the tray?",
    sentences: [
      "A tray has 36 snacks.",
      "14 are chips and the rest are cookies.",
      "How many cookies are on the tray?",
    ],
    values: { partA: 14, partB: 22, total: 36 },
    labels: { partA: "chips", partB: "cookies", total: "total snacks" },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "Liam packed 12 pencils and 8 erasers. How many school supplies did Liam pack?",
    sentences: [
      "Liam packed 12 pencils and 8 erasers.",
      "How many school supplies did Liam pack?",
    ],
    values: { partA: 12, partB: 8, total: 20 },
    labels: { partA: "pencils", partB: "erasers", total: "total supplies" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "There are 27 flowers in a garden. 15 are tulips and the rest are roses. How many roses are in the garden?",
    sentences: [
      "There are 27 flowers in a garden.",
      "15 are tulips and the rest are roses.",
      "How many roses are in the garden?",
    ],
    values: { partA: 15, partB: 12, total: 27 },
    labels: { partA: "tulips", partB: "roses", total: "total flowers" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "A store sold 45 drinks. 18 were juice boxes and the rest were water bottles. How many water bottles were sold?",
    sentences: [
      "A store sold 45 drinks.",
      "18 were juice boxes and the rest were water bottles.",
      "How many water bottles were sold?",
    ],
    values: { partA: 18, partB: 27, total: 45 },
    labels: {
      partA: "juice boxes",
      partB: "water bottles",
      total: "total drinks",
    },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "A desk has 13 markers and 9 crayons. How many art tools are on the desk?",
    sentences: [
      "A desk has 13 markers and 9 crayons.",
      "How many art tools are on the desk?",
    ],
    values: { partA: 13, partB: 9, total: 22 },
    labels: { partA: "markers", partB: "crayons", total: "total art tools" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "A box has 50 tickets. 32 are adult tickets and the rest are child tickets. How many child tickets are in the box?",
    sentences: [
      "A box has 50 tickets.",
      "32 are adult tickets and the rest are child tickets.",
      "How many child tickets are in the box?",
    ],
    values: { partA: 32, partB: 18, total: 50 },
    labels: {
      partA: "adult tickets",
      partB: "child tickets",
      total: "total tickets",
    },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "Maya saved 26 dollars in March and 14 dollars in April. How much money did Maya save altogether?",
    sentences: [
      "Maya saved 26 dollars in March and 14 dollars in April.",
      "How much money did Maya save altogether?",
    ],
    values: { partA: 26, partB: 14, total: 40 },
    labels: {
      partA: "March savings",
      partB: "April savings",
      total: "total money saved",
    },
    unknownSlot: "total",
    difficulty: 3,
  },
  {
    text: "A bin has 33 blocks. 20 are square blocks and the rest are triangle blocks. How many triangle blocks are in the bin?",
    sentences: [
      "A bin has 33 blocks.",
      "20 are square blocks and the rest are triangle blocks.",
      "How many triangle blocks are in the bin?",
    ],
    values: { partA: 20, partB: 13, total: 33 },
    labels: {
      partA: "square blocks",
      partB: "triangle blocks",
      total: "total blocks",
    },
    unknownSlot: "partB",
    difficulty: 2,
  },
];

const combineMod2Items = [
  {
    text: "A bowl has 25 berries. 12 are blueberries and the rest are strawberries. How many strawberries are in the bowl?",
    values: { partA: 12, partB: 13, total: 25 },
    labels: { total: "berries", partA: "blueberries", partB: "strawberries" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "There are 30 animals at the farm. 18 are sheep and the rest are pigs. How many pigs are at the farm?",
    values: { partA: 18, partB: 12, total: 30 },
    labels: { total: "animals", partA: "sheep", partB: "pigs" },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "A pencil case holds 22 pens. 15 are blue pens and the rest are black pens. How many black pens are in the case?",
    values: { partA: 15, partB: 7, total: 22 },
    labels: { total: "pens", partA: "blue pens", partB: "black pens" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "Mia baked 36 muffins. 20 are blueberry muffins and the rest are chocolate chip. How many chocolate chip muffins did Mia bake?",
    values: { partA: 20, partB: 16, total: 36 },
    labels: { total: "muffins", partA: "blueberry", partB: "chocolate chip" },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "A sports store sold 45 balls today. 25 were soccer balls and the rest were basketballs. How many basketballs did they sell?",
    values: { partA: 25, partB: 20, total: 45 },
    labels: { total: "balls", partA: "soccer balls", partB: "basketballs" },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "Mia has 4 red and 6 blue marbles. How many marbles does Mia have in total?",
    values: { partA: 4, partB: 6, total: 10 },
    labels: { total: "total", partA: "red", partB: "blue" },
    unknownSlot: "total",
    difficulty: 1,
  },
  {
    text: "A basket has 15 pieces of fruit. 9 are apples and the rest are bananas. How many bananas are in the basket?",
    values: { partA: 6, partB: 9, total: 15 },
    labels: { total: "fruit", partA: "bananas", partB: "apples" },
    unknownSlot: "partA",
    difficulty: 2,
  },
  {
    text: "Tara has 18 stickers. 7 are star stickers and the rest are heart stickers. How many heart stickers does Tara have?",
    values: { partA: 7, partB: 11, total: 18 },
    labels: { total: "stickers", partA: "stars", partB: "hearts" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "A desk has 12 pencils and 5 pens. How many writing tools are on the desk?",
    values: { partA: 12, partB: 5, total: 17 },
    labels: { total: "tools", partA: "pencils", partB: "pens" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "Noah found 20 shells. 8 shells are white and the rest are pink. How many pink shells did Noah find?",
    values: { partA: 12, partB: 8, total: 20 },
    labels: { total: "shells", partA: "pink", partB: "white" },
    unknownSlot: "partA",
    difficulty: 2,
  },
  {
    text: "There are 14 boys and 13 girls in a club. How many children are in the club?",
    values: { partA: 14, partB: 13, total: 27 },
    labels: { total: "children", partA: "boys", partB: "girls" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "A box has 16 crayons. 10 are red and the rest are blue. How many blue crayons are in the box?",
    values: { partA: 10, partB: 6, total: 16 },
    labels: { total: "crayons", partA: "red", partB: "blue" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "Leo spent ₹25 on books and ₹15 on toys. How much money did Leo spend in total?",
    values: { partA: 25, partB: 15, total: 40 },
    labels: { total: "money", partA: "books", partB: "toys" },
    unknownSlot: "total",
    difficulty: 3,
  },
  {
    text: "A jar has 30 marbles. 18 are glass marbles and the rest are clay marbles. How many clay marbles are in the jar?",
    values: { partA: 12, partB: 18, total: 30 },
    labels: { total: "marbles", partA: "clay", partB: "glass" },
    unknownSlot: "partA",
    difficulty: 3,
  },
  {
    text: "A parking lot has 7 cars and 5 trucks. How many vehicles are there?",
    values: { partA: 7, partB: 5, total: 12 },
    labels: { total: "vehicles", partA: "cars", partB: "trucks" },
    unknownSlot: "total",
    difficulty: 1,
  },
];

const combineMod3Items = [
  {
    text: "Sara collected 8 shells and 5 rocks. How many objects did Sara collect?",
    values: { partA: 8, partB: 5, total: 13 },
    labels: { total: "objects", partA: "shells", partB: "rocks" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "There are 16 orange balloons and 7 green balloons. How many balloons are there altogether?",
    values: { partA: 16, partB: 7, total: 23 },
    labels: { total: "balloons", partA: "orange", partB: "green" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "A vase has 22 flowers. 14 are roses and the rest are daisies. How many daisies are in the vase?",
    values: { partA: 14, partB: 8, total: 22 },
    labels: { total: "flowers", partA: "roses", partB: "daisies" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "A snack tray has 19 snacks. 6 are cookies and the rest are chips. How many chips are on the tray?",
    values: { partA: 13, partB: 6, total: 19 },
    labels: { total: "snacks", partA: "chips", partB: "cookies" },
    unknownSlot: "partA",
    difficulty: 2,
  },
  {
    text: "Maya has 11 stamps and 9 postcards. How many paper items does Maya have?",
    values: { partA: 11, partB: 9, total: 20 },
    labels: { total: "items", partA: "stamps", partB: "postcards" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "A supply cup has 24 markers. 15 are thick markers and the rest are thin markers. How many thin markers are there?",
    values: { partA: 15, partB: 9, total: 24 },
    labels: { total: "markers", partA: "thick", partB: "thin" },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "A shelf has 28 library books. 17 are fiction and the rest are nonfiction. How many nonfiction books are there?",
    values: { partA: 11, partB: 17, total: 28 },
    labels: { total: "books", partA: "nonfiction", partB: "fiction" },
    unknownSlot: "partA",
    difficulty: 3,
  },
  {
    text: "A pouch has 21 silver coins and 12 gold coins. How many coins are in the pouch?",
    values: { partA: 21, partB: 12, total: 33 },
    labels: { total: "coins", partA: "silver", partB: "gold" },
    unknownSlot: "total",
    difficulty: 3,
  },
  {
    text: "A game box has 35 tokens. 20 are red tokens and the rest are blue tokens. How many blue tokens are there?",
    values: { partA: 20, partB: 15, total: 35 },
    labels: { total: "tokens", partA: "red", partB: "blue" },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "A folder has 26 drawings. 10 are pencil drawings and the rest are paint drawings. How many paint drawings are in the folder?",
    values: { partA: 16, partB: 10, total: 26 },
    labels: { total: "drawings", partA: "paint", partB: "pencil" },
    unknownSlot: "partA",
    difficulty: 3,
  },
];

const combineMod4Items = [
  {
    text: "Nia has 8 green and 5 yellow beads. How many beads altogether?",
    values: { partA: 8, partB: 5, total: 13 },
    labels: { total: "beads", partA: "green", partB: "yellow" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "Lena packed 20 school supplies. 12 are pencils and the rest are erasers. How many erasers did Lena pack?",
    values: { partA: 12, partB: 8, total: 20 },
    labels: { total: "supplies", partA: "pencils", partB: "erasers" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "A music club has 15 singers and 14 dancers. How many members are in the club?",
    values: { partA: 15, partB: 14, total: 29 },
    labels: { total: "members", partA: "singers", partB: "dancers" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "Avery saved ₹25 in January and ₹15 in February. How much did Avery save in total?",
    values: { partA: 25, partB: 15, total: 40 },
    labels: { total: "savings", partA: "January", partB: "February" },
    unknownSlot: "total",
    difficulty: 3,
  },
  {
    text: "A tray has 12 dishes. 5 are plates and the rest are cups. How many cups are on the tray?",
    values: { partA: 7, partB: 5, total: 12 },
    labels: { total: "dishes", partA: "cups", partB: "plates" },
    unknownSlot: "partA",
    difficulty: 1,
  },
  {
    text: "A toy box has 18 toys. 11 are cars and the rest are trucks. How many trucks are in the toy box?",
    values: { partA: 11, partB: 7, total: 18 },
    labels: { total: "toys", partA: "cars", partB: "trucks" },
    unknownSlot: "partB",
    difficulty: 2,
  },
  {
    text: "A garden has 27 flowers. 16 are tulips and the rest are roses. How many roses are in the garden?",
    values: { partA: 11, partB: 16, total: 27 },
    labels: { total: "flowers", partA: "roses", partB: "tulips" },
    unknownSlot: "partA",
    difficulty: 3,
  },
  {
    text: "A shelf has 13 storybooks and 9 comics. How many books are on the shelf?",
    values: { partA: 13, partB: 9, total: 22 },
    labels: { total: "books", partA: "storybooks", partB: "comics" },
    unknownSlot: "total",
    difficulty: 2,
  },
  {
    text: "An art kit has 31 tools. 18 are brushes and the rest are pencils. How many pencils are in the art kit?",
    values: { partA: 18, partB: 13, total: 31 },
    labels: { total: "tools", partA: "brushes", partB: "pencils" },
    unknownSlot: "partB",
    difficulty: 3,
  },
  {
    text: "A team scored 24 points in the first half and 17 points in the second half. How many points did the team score?",
    values: { partA: 24, partB: 17, total: 41 },
    labels: { total: "points", partA: "first half", partB: "second half" },
    unknownSlot: "total",
    difficulty: 3,
  },
];

const combineMod5Items = [
  {
    text: "A bakery sold 45 chocolate muffins and 38 banana muffins. How many muffins did they sell in total?",
    values: { partA: 45, partB: 38, total: 83 },
    unknownSlot: "total",
    difficulty: 3,
  },
  {
    text: "There are 92 animals on a farm. 54 are chickens and the rest are pigs. How many pigs are on the farm?",
    values: { partA: 54, partB: 38, total: 92 },
    unknownSlot: "partB",
    difficulty: 4,
  },
  {
    text: "A library has 95 books about cats. 68 are about big cats and the rest are about small cats. How many books are about small cats?",
    values: { partA: 68, partB: 27, total: 95 },
    unknownSlot: "partB",
    difficulty: 4,
  },
  {
    text: "Tom collected 46 shells on Saturday and 39 shells on Sunday. How many shells did Tom collect over the weekend?",
    values: { partA: 46, partB: 39, total: 85 },
    unknownSlot: "total",
    difficulty: 3,
  },
  {
    text: "A toy store has 90 puzzles. 45 of them are big puzzles and the rest are small puzzles. How many small puzzles does the store have?",
    values: { partA: 45, partB: 45, total: 90 },
    unknownSlot: "partB",
    difficulty: 4,
  },
  {
    text: "In a garden, there are 54 apple trees and 38 orange trees. How many trees are there in total?",
    values: { partA: 54, partB: 38, total: 92 },
    unknownSlot: "total",
    difficulty: 3,
  },
  {
    text: "A train is carrying 96 people. 52 people are adults and the rest are children. How many children are on the train?",
    values: { partA: 52, partB: 44, total: 96 },
    unknownSlot: "partB",
    difficulty: 4,
  },
  {
    text: "Sarah's book has 95 stickers. 65 are star stickers and the rest are heart stickers. How many heart stickers are in the book?",
    values: { partA: 65, partB: 30, total: 95 },
    unknownSlot: "partB",
    difficulty: 4,
  },
  {
    text: "A school ordered 45 red folders and 37 blue folders. How many folders were ordered in all?",
    values: { partA: 45, partB: 37, total: 82 },
    unknownSlot: "total",
    difficulty: 3,
  },
  {
    text: "The cafeteria served 98 meals. 50 were hot meals and the rest were cold meals. How many cold meals did they serve?",
    values: { partA: 50, partB: 48, total: 98 },
    unknownSlot: "partB",
    difficulty: 4,
  },
];

const combineConcepts = [
  {
    id: "combine_mod1",
    title: "Combine: Read and Identify Variables",
    description: "Read the combine story and identify the variables.",
    prerequisites: ["missing_part_hard"],
    questions: combineMod1Items.map((item) =>
      createSchemaVariableQuestionFromItem({
        item,
        concept: "combine_mod1",
        schemaKind: "combine",
        slotKeys: ["partA", "partB", "total"],
      }),
    ),
  },
  {
    id: "combine_mod2",
    title: "Combine: Word Problem to Bar Model",
    description: "Read the combine story and build the bar model.",
    prerequisites: ["combine_mod1"],
    questions: combineMod2Items.map((item) =>
      createCombineBarModelQuestion({ ...item, concept: "combine_mod2" }),
    ),
  },
  {
    id: "combine_mod3",
    title: "Combine: Bar Model to Equation",
    description: "Translate Combine bar models into equations.",
    prerequisites: ["combine_mod2"],
    questions: combineMod3Items.map((item) =>
      createCombineEquationQuestion({ ...item, concept: "combine_mod3" }),
    ),
  },
  {
    id: "combine_mod4",
    title: "Combine: Full Integration",
    description: "Build the bar model, write the equation, and solve.",
    prerequisites: ["combine_mod3"],
    questions: combineMod4Items.flatMap((item) =>
      createCombineFullBundle(item, "combine_mod4"),
    ),
  },
  {
    id: "combine_mod5",
    title: "Combine: Direct Problem Solving",
    description: "Solve combine story problems directly.",
    prerequisites: ["combine_mod4"],
    questions: combineMod5Items.map((item) =>
      createDirectQuestionFromItem({
        item,
        concept: "combine_mod5",
        schemaKind: "combine",
      }),
    ),
  },
];

// ============================================================================

// 4. CHANGE SCHEMA (6 MODULES)

// ============================================================================

const createChangeIdentificationQuestion = ({
  concept,
  text,
  values,
  labels,
  changeDirection, // "increase" or "decrease"
  difficulty,
  stageIndex = null,
  stageLabel = null,
  stageTotal = null,
  itemNoun = null,
  increaseSubtext = null,
  decreaseSubtext = null,
}) => {
  // The correct bar model follows directly from changeDirection
  const correctBarModel =
    changeDirection === "increase" ? "increase_bar" : "decrease_bar";

  const resolvedNoun = itemNoun || extractNounFromQuestion(text);
  const resolvedIncrease =
    increaseSubtext ||
    (resolvedNoun
      ? `${resolvedNoun} were added or received`
      : "quantity was added or received");
  const resolvedDecrease =
    decreaseSubtext ||
    (resolvedNoun
      ? `${resolvedNoun} were removed or given away`
      : "quantity was removed or given away");

  return createQuestionEnvelope({
    text,
    concept,
    type: "change_identification",
    difficulty,
    correctAnswer: `${changeDirection}_${correctBarModel}`,
    schemaKind: "change",
    interactionMode: "change_identification",
    moduleStage: "change_identify",
    promptTitle: "identify the change",
    inputMode: "change_identify",
    stageIndex,
    stageLabel,
    stageTotal,
    helperText:
      "First decide if the quantity increased or decreased, then pick the matching bar model.",
    visualData: {
      labels,
      values: {
        start: String(values.start),
        change: String(values.change),
        end: String(values.end),
      },
      itemNoun: resolvedNoun,
      increaseSubtext: resolvedIncrease,
      decreaseSubtext: resolvedDecrease,
    },
    validation: {
      changeDirection,
      correctBarModel,
    },
  });
};

const createChangeFullBundle = (item, concept = "change_mod5") => {
  const displayValues = withUnknownSlot(item.values, item.unknownSlot);
  const validationSlots = withUnknownSlot(item.values, item.unknownSlot);
  const equationLabels = {
    ...item.labels,
    left: item.labels.start,
    right: item.labels.change,
    result: item.labels.end,
  };
  const equationSlots = {
    leftTerm: displayValues.start,
    rightTerm: displayValues.change,
    result: displayValues.end,
  };
  const alternateSlots = {
    leftTerm: String(item.values.start),
    rightTerm: String(item.values.change),
    result: String(item.values.end),
  };
  const displayEquation = `${displayValues.start} ${item.operator} ${displayValues.change} = ${displayValues.end}`;
  const verificationEquation = `${item.values.start} ${item.operator} ${item.values.change} = ${item.values.end}`;
  const answer = item.values[item.unknownSlot];

  return [
    createChangeIdentificationQuestion({
      concept,
      text: item.text,
      values: item.values,
      labels: item.labels,
      changeDirection:
        item.values.end > item.values.start ? "increase" : "decrease",
      difficulty: item.difficulty,
      stageIndex: 1,
      stageLabel: "1. Identify",
      stageTotal: 4,
      itemNoun: item.itemNoun,
      increaseSubtext: item.increaseSubtext,
      decreaseSubtext: item.decreaseSubtext,
    }),
    createSchemaBarQuestion({
      concept,
      text: item.text,
      schemaKind: "change",
      values: item.values,
      labels: item.labels,
      displayValues: { start: "?", change: "?", end: "?" },
      validationSlots,
      alternateSlots: item.values,
      unknownSlot: item.unknownSlot,
      difficulty: item.difficulty,
      stageIndex: 2,
      stageLabel: "2. Bar model",
      stageTotal: 4,
    }),
    createSchemaEquationQuestion({
      concept,
      text: item.text,
      schemaKind: "change",
      values: displayValues,
      displayBarValues: displayValues,
      scaleValues: item.values,
      labels: equationLabels,
      unknownSlot: item.unknownSlot,
      equationValues: equationSlots,
      validationSlots: equationSlots,
      alternateSlots,
      operator: item.operator,
      difficulty: item.difficulty,
      stageIndex: 3,
      stageLabel: "3. Equation",
      stageTotal: 4,
    }),
    createSchemaSolveQuestion({
      concept,
      text: item.text,
      schemaKind: "change",
      answer,
      displayEquation,
      verificationEquation,
      solutionLabel: `? = ${answer}`,
      difficulty: item.difficulty,
      stageIndex: 4,
      stageLabel: "4. Solve",
      stageTotal: 4,
    }),
  ];
};

const changeMod1Items = [
  {
    text: "Leo had 20 cookies. He ate 6 cookies. How many cookies does Leo have left?",
    sentences: [
      "Leo had 20 cookies.",
      "He ate 6 cookies.",
      "How many cookies does Leo have left?",
    ],
    values: { start: 20, change: 6, end: 14 },
    labels: {
      start: "cookies at first",
      change: "cookies eaten",
      end: "cookies left",
    },
    unknownSlot: "end",
    difficulty: 2,
  },
  {
    text: "A tree had 24 leaves. The wind blew some leaves away. Now there are 15 leaves left. How many leaves blew away?",
    sentences: [
      "A tree had 24 leaves.",
      "The wind blew some leaves away.",
      "Now there are 15 leaves left.",
      "How many leaves blew away?",
    ],
    values: { start: 24, change: 9, end: 15 },
    labels: {
      start: "leaves at first",
      change: "leaves blown away",
      end: "leaves left",
    },
    unknownSlot: "change",
    difficulty: 2,
  },
  {
    text: "Sam had some money. He spent ₹18 on a toy. He has ₹32 left. How much money did Sam start with?",
    sentences: [
      "Sam had some money.",
      "He spent ₹18 on a toy.",
      "He has ₹32 left.",
      "How much money did Sam start with?",
    ],
    values: { start: 50, change: 18, end: 32 },
    labels: {
      start: "money at first",
      change: "money spent",
      end: "money left",
    },
    unknownSlot: "start",
    difficulty: 3,
  },
  {
    text: "Twelve birds were on a fence. Five birds flew away. How many birds are still on the fence?",
    sentences: [
      "Twelve birds were on a fence.",
      "Five birds flew away.",
      "How many birds are still on the fence?",
    ],
    values: { start: 12, change: 5, end: 7 },
    labels: {
      start: "birds at first",
      change: "birds flew away",
      end: "birds left",
    },
    unknownSlot: "end",
    difficulty: 1,
  },
  {
    text: "Emma had some candies. She gave 15 candies to her friends. Now she has 20 candies left. How many candies did she start with?",
    sentences: [
      "Emma had some candies.",
      "She gave 15 candies to her friends.",
      "Now she has 20 candies left.",
      "How many candies did she start with?",
    ],
    values: { start: 35, change: 15, end: 20 },
    labels: {
      start: "candies at first",
      change: "candies given",
      end: "candies left",
    },
    unknownSlot: "start",
    difficulty: 3,
  },
  {
    text: "Mia had some stickers. She got 4 more stickers. Now Mia has 10 stickers. How many stickers did Mia start with?",
    sentences: [
      "Mia had some stickers.",
      "She got 4 more stickers.",
      "Now Mia has 10 stickers.",
      "How many stickers did Mia start with?",
    ],
    values: { start: 6, change: 4, end: 10 },
    labels: {
      start: "stickers at first",
      change: "stickers got",
      end: "stickers now",
    },
    unknownSlot: "start",
    difficulty: 2,
  },
  {
    text: "Jorge had ₹52. He earned ₹16 babysitting. How much money does Jorge have now?",
    sentences: [
      "Jorge had ₹52.",
      "He earned ₹16 babysitting.",
      "How much money does Jorge have now?",
    ],
    values: { start: 52, change: 16, end: 68 },
    labels: {
      start: "money at first",
      change: "money earned",
      end: "money now",
    },
    unknownSlot: "end",
    difficulty: 2,
  },
  {
    text: "Sam had 20 baseball cards. He bought 15 more cards. How many cards does Sam have now?",
    sentences: [
      "Sam had 20 baseball cards.",
      "He bought 15 more cards.",
      "How many cards does Sam have now?",
    ],
    values: { start: 20, change: 15, end: 35 },
    labels: {
      start: "cards at first",
      change: "cards bought",
      end: "cards now",
    },
    unknownSlot: "end",
    difficulty: 2,
  },
  {
    text: "Maya had some books. She bought 8 more books. Now she has 20 books. How many books did Maya start with?",
    sentences: [
      "Maya had some books.",
      "She bought 8 more books.",
      "Now she has 20 books.",
      "How many books did Maya start with?",
    ],
    values: { start: 12, change: 8, end: 20 },
    labels: {
      start: "books at first",
      change: "books bought",
      end: "books now",
    },
    unknownSlot: "start",
    difficulty: 1,
  },
  {
    text: "The team had 45 points. They scored 10 more points. How many points did the team have then?",
    sentences: [
      "The team had 45 points.",
      "They scored 10 more points.",
      "How many points did the team have then?",
    ],
    values: { start: 45, change: 10, end: 55 },
    labels: {
      start: "points at first",
      change: "points scored",
      end: "points now",
    },
    unknownSlot: "end",
    difficulty: 3,
  },
  {
    text: "A bus had 38 passengers. Fourteen passengers got off. How many passengers stayed on the bus?",
    sentences: [
      "A bus had 38 passengers.",
      "Fourteen passengers got off.",
      "How many passengers stayed on the bus?",
    ],
    values: { start: 38, change: 14, end: 24 },
    labels: {
      start: "passengers at first",
      change: "passengers got off",
      end: "passengers left",
    },
    unknownSlot: "end",
    difficulty: 3,
  },
  {
    text: "A box had some pencils. The teacher added 17 pencils. Now the box has 42 pencils. How many pencils were in the box at first?",
    sentences: [
      "A box had some pencils.",
      "The teacher added 17 pencils.",
      "Now the box has 42 pencils.",
      "How many pencils were in the box at first?",
    ],
    values: { start: 25, change: 17, end: 42 },
    labels: {
      start: "pencils at first",
      change: "pencils added",
      end: "pencils now",
    },
    unknownSlot: "start",
    difficulty: 3,
  },
  {
    text: "A game had 63 players at noon. Some players left. There were 48 players after lunch. How many players left?",
    sentences: [
      "A game had 63 players at noon.",
      "Some players left.",
      "There were 48 players after lunch.",
      "How many players left?",
    ],
    values: { start: 63, change: 15, end: 48 },
    labels: {
      start: "players at first",
      change: "players that left",
      end: "players now",
    },
    unknownSlot: "change",
    difficulty: 3,
  },
  {
    text: "A baker had 29 cupcakes. She baked 18 more cupcakes. How many cupcakes does the baker have now?",
    sentences: [
      "A baker had 29 cupcakes.",
      "She baked 18 more cupcakes.",
      "How many cupcakes does the baker have now?",
    ],
    values: { start: 29, change: 18, end: 47 },
    labels: {
      start: "cupcakes at first",
      change: "cupcakes baked",
      end: "cupcakes now",
    },
    unknownSlot: "end",
    difficulty: 3,
  },
  {
    text: "A library shelf had some books. Students borrowed 21 books. There are 34 books left. How many books were on the shelf at first?",
    sentences: [
      "A library shelf had some books.",
      "Students borrowed 21 books.",
      "There are 34 books left.",
      "How many books were on the shelf at first?",
    ],
    values: { start: 55, change: 21, end: 34 },
    labels: {
      start: "books at first",
      change: "books borrowed",
      end: "books left",
    },
    unknownSlot: "start",
    difficulty: 3,
  },
];

const changeMod2Items = [
  {
    text: "Oliver had 20 apples. He ate 6 apples.",
    values: { start: 20, change: 6, end: 14 },
    labels: {
      start: "apples at first",
      change: "apples eaten",
      end: "apples left",
    },
    difficulty: 2,
    itemNoun: "apples",
    increaseSubtext: "apples were picked or added",
    decreaseSubtext: "apples were eaten or removed",
  },
  {
    text: "A bush had 24 flowers. The wind blew 9 flowers away.",
    values: { start: 24, change: 9, end: 15 },
    labels: {
      start: "flowers at first",
      change: "flowers blown away",
      end: "flowers left",
    },
    difficulty: 2,
    itemNoun: "flowers",
    increaseSubtext: "flowers bloomed or were added",
    decreaseSubtext: "flowers blew away or died",
  },
  {
    text: "Sophie had 50 tickets. She spent 18 tickets on a prize.",
    values: { start: 50, change: 18, end: 32 },
    labels: {
      start: "tickets at first",
      change: "tickets spent",
      end: "tickets left",
    },
    difficulty: 3,
    itemNoun: "tickets",
    increaseSubtext: "tickets were won or added",
    decreaseSubtext: "tickets were spent or lost",
  },
  {
    text: "Twelve bugs were on a leaf. Five bugs flew away.",
    values: { start: 12, change: 5, end: 7 },
    labels: {
      start: "bugs at first",
      change: "bugs flew away",
      end: "bugs left",
    },
    difficulty: 1,
    itemNoun: "bugs",
    increaseSubtext: "bugs landed or were added",
    decreaseSubtext: "bugs flew away or left",
  },
  {
    text: "Aiden had 35 gems. He gave 15 gems to his brother.",
    values: { start: 35, change: 15, end: 20 },
    labels: { start: "gems at first", change: "gems given", end: "gems left" },
    difficulty: 3,
    itemNoun: "gems",
    increaseSubtext: "gems were found or added",
    decreaseSubtext: "gems were given away or lost",
  },
  {
    text: "Chloe had 6 bracelets. She got 4 more bracelets.",
    values: { start: 6, change: 4, end: 10 },
    labels: {
      start: "bracelets at first",
      change: "bracelets got",
      end: "bracelets now",
    },
    difficulty: 2,
    itemNoun: "bracelets",
    increaseSubtext: "bracelets were received or made",
    decreaseSubtext: "bracelets were lost or broken",
  },
  {
    text: "Max had 52 tokens. He earned 16 tokens at the arcade.",
    values: { start: 52, change: 16, end: 68 },
    labels: {
      start: "tokens at first",
      change: "tokens earned",
      end: "tokens now",
    },
    difficulty: 2,
    itemNoun: "tokens",
    increaseSubtext: "tokens were earned or added",
    decreaseSubtext: "tokens were spent or lost",
  },
  {
    text: "A jar had 20 buttons. Someone added 15 more buttons.",
    values: { start: 20, change: 15, end: 35 },
    labels: {
      start: "buttons at first",
      change: "buttons added",
      end: "buttons now",
    },
    difficulty: 2,
    itemNoun: "buttons",
    increaseSubtext: "buttons were bought or added",
    decreaseSubtext: "buttons were used or lost",
  },
  {
    text: "Lily had already collected 12 pebbles. She collected 8 more pebbles.",
    values: { start: 12, change: 8, end: 20 },
    labels: {
      start: "pebbles at first",
      change: "pebbles collected",
      end: "pebbles now",
    },
    difficulty: 1,
    itemNoun: "pebbles",
    increaseSubtext: "pebbles were collected or added",
    decreaseSubtext: "pebbles were thrown or removed",
  },
  {
    text: "The game had 45 levels. The creators added 10 more levels.",
    values: { start: 45, change: 10, end: 55 },
    labels: {
      start: "levels at first",
      change: "levels added",
      end: "levels now",
    },
    difficulty: 3,
    itemNoun: "levels",
    increaseSubtext: "levels were created or added",
    decreaseSubtext: "levels were removed",
  },
  {
    text: "A ship had 38 sailors. Fourteen sailors got off.",
    values: { start: 38, change: 14, end: 24 },
    labels: {
      start: "sailors at first",
      change: "sailors got off",
      end: "sailors left",
    },
    difficulty: 3,
    itemNoun: "sailors",
    increaseSubtext: "sailors boarded or got on",
    decreaseSubtext: "sailors got off or left",
  },
  {
    text: "A bag had 25 carrots. The farmer added 17 carrots.",
    values: { start: 25, change: 17, end: 42 },
    labels: {
      start: "carrots at first",
      change: "carrots added",
      end: "carrots now",
    },
    difficulty: 3,
    itemNoun: "carrots",
    increaseSubtext: "carrots were grown or added",
    decreaseSubtext: "carrots were eaten or sold",
  },
  {
    text: "A pond had 63 fish. 15 fish swam away.",
    values: { start: 63, change: 15, end: 48 },
    labels: {
      start: "fish at first",
      change: "fish swam away",
      end: "fish left",
    },
    difficulty: 3,
    itemNoun: "fish",
    increaseSubtext: "fish hatched or joined",
    decreaseSubtext: "fish swam away or were caught",
  },
  {
    text: "A chef had 29 pizzas. He baked 18 more pizzas.",
    values: { start: 29, change: 18, end: 47 },
    labels: {
      start: "pizzas at first",
      change: "pizzas baked",
      end: "pizzas now",
    },
    difficulty: 3,
    itemNoun: "pizzas",
    increaseSubtext: "pizzas were baked or added",
    decreaseSubtext: "pizzas were eaten or sold",
  },
  {
    text: "A desk had 55 papers. A student took 21 papers.",
    values: { start: 55, change: 21, end: 34 },
    labels: {
      start: "papers at first",
      change: "papers taken",
      end: "papers left",
    },
    difficulty: 3,
    itemNoun: "papers",
    increaseSubtext: "papers were printed or added",
    decreaseSubtext: "papers were taken or removed",
  },
];

const changeMod3Items = [
  {
    concept: "change_mod3",
    text: "Noah had 20 crackers. He ate 6 of them. How many crackers does Noah have left?",
    schemaKind: "change",
    values: { start: 20, change: 6, end: 14 },
    labels: {
      end: "crackers left",
      start: "crackers at first",
      change: "crackers eaten",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "?", start: "20", change: "6" },
    alternateSlots: { end: "14", start: "20", change: "6" },
    unknownSlot: "end",
    difficulty: 2,
  },
  {
    concept: "change_mod3",
    text: "A bush had 24 berries. A bird ate some, and now there are 15 berries left. How many berries did the bird eat?",
    schemaKind: "change",
    values: { start: 24, change: 9, end: 15 },
    labels: {
      end: "berries left",
      start: "berries at first",
      change: "berries eaten",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "15", start: "24", change: "?" },
    alternateSlots: { end: "15", start: "24", change: "9" },
    unknownSlot: "change",
    difficulty: 2,
  },
  {
    concept: "change_mod3",
    text: "Ava had some beads. She used 18 beads for a necklace and has 32 beads left. How many beads did Ava start with?",
    schemaKind: "change",
    values: { start: 50, change: 18, end: 32 },
    labels: {
      end: "beads left",
      start: "beads at first",
      change: "beads used",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "32", start: "?", change: "18" },
    alternateSlots: { end: "32", start: "50", change: "18" },
    unknownSlot: "start",
    difficulty: 3,
  },
  {
    concept: "change_mod3",
    text: "12 ducks were swimming in a pond. 5 ducks waddled away. How many ducks are still in the pond?",
    schemaKind: "change",
    values: { start: 12, change: 5, end: 7 },
    labels: {
      end: "ducks left",
      start: "ducks at first",
      change: "ducks waddled away",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "?", start: "12", change: "5" },
    alternateSlots: { end: "7", start: "12", change: "5" },
    unknownSlot: "end",
    difficulty: 1,
  },
  {
    concept: "change_mod3",
    text: "Liam had some grapes. He gave 15 to his sister and now has 20 left. How many grapes did he start with?",
    schemaKind: "change",
    values: { start: 35, change: 15, end: 20 },
    labels: {
      end: "grapes left",
      start: "grapes at first",
      change: "grapes given",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "20", start: "?", change: "15" },
    alternateSlots: { end: "20", start: "35", change: "15" },
    unknownSlot: "start",
    difficulty: 3,
  },
  {
    concept: "change_mod3",
    text: "Zoe had some markers. She found 4 more and now has 10.",
    schemaKind: "change",
    values: { start: 6, change: 4, end: 10 },
    labels: {
      end: "markers now",
      start: "markers at first",
      change: "markers found",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "10", start: "?", change: "4" },
    alternateSlots: { end: "10", start: "6", change: "4" },
    unknownSlot: "start",
    difficulty: 2,
  },
  {
    concept: "change_mod3",
    text: "Lucas had some shells. He collected 16 more on the beach. Now Lucas has 68 shells.",
    schemaKind: "change",
    values: { start: 52, change: 16, end: 68 },
    labels: {
      end: "shells now",
      start: "shells at first",
      change: "shells collected",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "68", start: "?", change: "16" },
    alternateSlots: { end: "68", start: "52", change: "16" },
    unknownSlot: "start",
    difficulty: 2,
  },
  {
    concept: "change_mod3",
    text: "A jar had some coins. Eli added 15 more, and now the jar has 35 coins.",
    schemaKind: "change",
    values: { start: 20, change: 15, end: 35 },
    labels: {
      end: "coins now",
      start: "coins at first",
      change: "coins added",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "35", start: "?", change: "15" },
    alternateSlots: { end: "35", start: "20", change: "15" },
    unknownSlot: "start",
    difficulty: 2,
  },
  {
    concept: "change_mod3",
    text: "Ruby had some stamps. She bought 8 more stamps and now has 20.",
    schemaKind: "change",
    values: { start: 12, change: 8, end: 20 },
    labels: {
      end: "stamps now",
      start: "stamps at first",
      change: "stamps bought",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "20", start: "?", change: "8" },
    alternateSlots: { end: "20", start: "12", change: "8" },
    unknownSlot: "start",
    difficulty: 1,
  },
  {
    concept: "change_mod3",
    text: "A game had some players. 10 more players joined to reach a total of 55 players.",
    schemaKind: "change",
    values: { start: 45, change: 10, end: 55 },
    labels: {
      end: "players now",
      start: "players at first",
      change: "players joined",
    },
    displayValues: { start: "?", change: "?", end: "?" },
    validationSlots: { end: "55", start: "?", change: "10" },
    alternateSlots: { end: "55", start: "45", change: "10" },
    unknownSlot: "start",
    difficulty: 3,
  },
];

const changeMod4Items = [
  {
    concept: "change_mod4",
    text: "There were 15 butterflies. Some butterflies flew away, and now 11 butterflies are left. How many butterflies flew away?",
    schemaKind: "change",
    barValues: { start: "15", change: "?", end: "11" },
    scaleValues: { start: 15, change: 4, end: 11 },
    labels: {
      end: "butterflies left",
      start: "butterflies at first",
      change: "butterflies flew away",
      left: "butterflies at first",
      right: "butterflies flew away",
      result: "butterflies left",
    },
    equationDisplayValues: { leftTerm: "15", rightTerm: "?", result: "11" },
    validationSlots: { leftTerm: "15", rightTerm: "?", result: "11" },
    alternateSlots: { leftTerm: "15", rightTerm: "4", result: "11" },
    operator: "-",
    difficulty: 2,
  },
  {
    concept: "change_mod4",
    text: "Chloe had some seeds. She planted 18 seeds and has 32 seeds left. How many seeds did Chloe start with?",
    schemaKind: "change",
    barValues: { start: "?", change: "18", end: "32" },
    scaleValues: { start: 50, change: 18, end: 32 },
    labels: {
      end: "seeds left",
      start: "seeds at first",
      change: "seeds planted",
      left: "seeds at first",
      right: "seeds planted",
      result: "seeds left",
    },
    equationDisplayValues: { leftTerm: "?", rightTerm: "18", result: "32" },
    validationSlots: { leftTerm: "?", rightTerm: "18", result: "32" },
    alternateSlots: { leftTerm: "50", rightTerm: "18", result: "32" },
    operator: "-",
    difficulty: 3,
  },
  {
    concept: "change_mod4",
    text: "12 frogs were sitting on a log. 5 frogs jumped away. How many frogs are still on the log?",
    schemaKind: "change",
    barValues: { start: "12", change: "5", end: "?" },
    scaleValues: { start: 12, change: 5, end: 7 },
    labels: {
      end: "frogs left",
      start: "frogs at first",
      change: "frogs jumped away",
      left: "frogs at first",
      right: "frogs jumped away",
      result: "frogs left",
    },
    equationDisplayValues: { leftTerm: "12", rightTerm: "5", result: "?" },
    validationSlots: { leftTerm: "12", rightTerm: "5", result: "?" },
    alternateSlots: { leftTerm: "12", rightTerm: "5", result: "7" },
    operator: "-",
    difficulty: 1,
  },
  {
    concept: "change_mod4",
    text: "Mason had some blocks. He lost 15 blocks and now has 20 left. How many blocks did he start with?",
    schemaKind: "change",
    barValues: { start: "?", change: "15", end: "20" },
    scaleValues: { start: 35, change: 15, end: 20 },
    labels: {
      end: "blocks left",
      start: "blocks at first",
      change: "blocks lost",
      left: "blocks at first",
      right: "blocks lost",
      result: "blocks left",
    },
    equationDisplayValues: { leftTerm: "?", rightTerm: "15", result: "20" },
    validationSlots: { leftTerm: "?", rightTerm: "15", result: "20" },
    alternateSlots: { leftTerm: "35", rightTerm: "15", result: "20" },
    operator: "-",
    difficulty: 3,
  },
  {
    concept: "change_mod4",
    text: "There were 8 slices of pie. 3 slices were eaten. How many slices are left?",
    schemaKind: "change",
    barValues: { start: "8", change: "3", end: "?" },
    scaleValues: { start: 8, change: 3, end: 5 },
    labels: {
      end: "slices left",
      start: "slices at first",
      change: "slices eaten",
      left: "slices at first",
      right: "slices eaten",
      result: "slices left",
    },
    equationDisplayValues: { leftTerm: "8", rightTerm: "3", result: "?" },
    validationSlots: { leftTerm: "8", rightTerm: "3", result: "?" },
    alternateSlots: { leftTerm: "8", rightTerm: "3", result: "5" },
    operator: "-",
    difficulty: 1,
  },
  {
    concept: "change_mod4",
    text: "Lily had some ribbons. She bought 4 more and now has 10 ribbons. How many ribbons did Lily start with?",
    schemaKind: "change",
    barValues: { start: "?", change: "4", end: "10" },
    scaleValues: { start: 6, change: 4, end: 10 },
    labels: {
      end: "ribbons now",
      start: "ribbons at first",
      change: "ribbons bought",
      left: "ribbons at first",
      right: "ribbons bought",
      result: "ribbons now",
    },
    equationDisplayValues: { leftTerm: "?", rightTerm: "4", result: "10" },
    validationSlots: { leftTerm: "?", rightTerm: "4", result: "10" },
    alternateSlots: { leftTerm: "6", rightTerm: "4", result: "10" },
    operator: "+",
    difficulty: 2,
  },
  {
    concept: "change_mod4",
    text: "Ethan had some rocks. He found 16 more. Now Ethan has 68 rocks. How many rocks did Ethan start with?",
    schemaKind: "change",
    barValues: { start: "?", change: "16", end: "68" },
    scaleValues: { start: 52, change: 16, end: 68 },
    labels: {
      end: "rocks now",
      start: "rocks at first",
      change: "rocks found",
      left: "rocks at first",
      right: "rocks found",
      result: "rocks now",
    },
    equationDisplayValues: { leftTerm: "?", rightTerm: "16", result: "68" },
    validationSlots: { leftTerm: "?", rightTerm: "16", result: "68" },
    alternateSlots: { leftTerm: "52", rightTerm: "16", result: "68" },
    operator: "+",
    difficulty: 2,
  },
  {
    concept: "change_mod4",
    text: "A store had some toys. They got 15 more, and now they have 35 toys. How many toys did the store start with?",
    schemaKind: "change",
    barValues: { start: "?", change: "15", end: "35" },
    scaleValues: { start: 20, change: 15, end: 35 },
    labels: {
      end: "toys now",
      start: "toys at first",
      change: "toys got",
      left: "toys at first",
      right: "toys got",
      result: "toys now",
    },
    equationDisplayValues: { leftTerm: "?", rightTerm: "15", result: "35" },
    validationSlots: { leftTerm: "?", rightTerm: "15", result: "35" },
    alternateSlots: { leftTerm: "20", rightTerm: "15", result: "35" },
    operator: "+",
    difficulty: 2,
  },
  {
    concept: "change_mod4",
    text: "Aria had some crayons. She found 8 more crayons and now has 20. How many crayons did Aria start with?",
    schemaKind: "change",
    barValues: { start: "?", change: "8", end: "20" },
    scaleValues: { start: 12, change: 8, end: 20 },
    labels: {
      end: "crayons now",
      start: "crayons at first",
      change: "crayons found",
      left: "crayons at first",
      right: "crayons found",
      result: "crayons now",
    },
    equationDisplayValues: { leftTerm: "?", rightTerm: "8", result: "20" },
    validationSlots: { leftTerm: "?", rightTerm: "8", result: "20" },
    alternateSlots: { leftTerm: "12", rightTerm: "8", result: "20" },
    operator: "+",
    difficulty: 1,
  },
  {
    concept: "change_mod4",
    text: "A team had some medals. They won 10 more to reach a total of 55 medals. How many medals did the team start with?",
    schemaKind: "change",
    barValues: { start: "?", change: "10", end: "55" },
    scaleValues: { start: 45, change: 10, end: 55 },
    labels: {
      end: "medals now",
      start: "medals at first",
      change: "medals won",
      left: "medals at first",
      right: "medals won",
      result: "medals now",
    },
    equationDisplayValues: { leftTerm: "?", rightTerm: "10", result: "55" },
    validationSlots: { leftTerm: "?", rightTerm: "10", result: "55" },
    alternateSlots: { leftTerm: "45", rightTerm: "10", result: "55" },
    operator: "+",
    difficulty: 3,
  },
];

const changeMod5Items = [
  {
    text: "Owen had 45 tickets. He used 12 tickets on a ride. How many tickets does he have now?",
    values: { start: 45, change: 12, end: 33 },
    labels: {
      end: "tickets left",
      start: "tickets at first",
      change: "tickets used",
    },
    unknownSlot: "end",
    operator: "-",
    difficulty: 3,
    itemNoun: "tickets",
    increaseSubtext: "tickets were earned or added",
    decreaseSubtext: "tickets were used or lost",
  },
  {
    text: "A bowl had 24 cherries. Someone ate some, and now there are 15 cherries left. How many cherries were eaten?",
    values: { start: 24, change: 9, end: 15 },
    labels: {
      end: "cherries left",
      start: "cherries at first",
      change: "cherries eaten",
    },
    unknownSlot: "change",
    operator: "-",
    difficulty: 2,
    itemNoun: "cherries",
    increaseSubtext: "cherries were added",
    decreaseSubtext: "cherries were eaten or removed",
  },
  {
    text: "Ella had some marbles. She lost 18 marbles and has 32 left. How many marbles did Ella start with?",
    values: { start: 50, change: 18, end: 32 },
    labels: {
      end: "marbles left",
      start: "marbles at first",
      change: "marbles lost",
    },
    unknownSlot: "start",
    operator: "-",
    difficulty: 3,
    itemNoun: "marbles",
    increaseSubtext: "marbles were won or found",
    decreaseSubtext: "marbles were lost or given away",
  },
  {
    text: "12 cars were in a parking lot. 5 cars drove away. How many cars are still in the lot?",
    values: { start: 12, change: 5, end: 7 },
    labels: {
      end: "cars left",
      start: "cars at first",
      change: "cars drove away",
    },
    unknownSlot: "end",
    operator: "-",
    difficulty: 1,
    itemNoun: "cars",
    increaseSubtext: "cars arrived",
    decreaseSubtext: "cars drove away",
  },
  {
    text: "Leo had some photos. He deleted 15 photos and now has 20 left. How many photos did he start with?",
    values: { start: 35, change: 15, end: 20 },
    labels: {
      end: "photos left",
      start: "photos at first",
      change: "photos deleted",
    },
    unknownSlot: "start",
    operator: "-",
    difficulty: 3,
    itemNoun: "photos",
    increaseSubtext: "photos were taken",
    decreaseSubtext: "photos were deleted",
  },
  {
    text: "Nina had some rings. She bought 4 more and now has 10 rings. How many rings did Nina start with?",
    values: { start: 6, change: 4, end: 10 },
    labels: {
      end: "rings now",
      start: "rings at first",
      change: "rings bought",
    },
    unknownSlot: "start",
    operator: "+",
    difficulty: 2,
    itemNoun: "rings",
    increaseSubtext: "rings were bought or added",
    decreaseSubtext: "rings were lost or sold",
  },
  {
    text: "Jack had some cards. He got 16 more and now has 68 cards. How many cards did Jack start with?",
    values: { start: 52, change: 16, end: 68 },
    labels: { end: "cards now", start: "cards at first", change: "cards got" },
    unknownSlot: "start",
    operator: "+",
    difficulty: 2,
    itemNoun: "cards",
    increaseSubtext: "cards were received or bought",
    decreaseSubtext: "cards were lost or traded",
  },
  {
    text: "A box had some nails. 15 new nails were added, and now there are 35 nails. How many nails were in the box at first?",
    values: { start: 20, change: 15, end: 35 },
    labels: {
      end: "nails now",
      start: "nails at first",
      change: "nails added",
    },
    unknownSlot: "start",
    operator: "+",
    difficulty: 2,
    itemNoun: "nails",
    increaseSubtext: "nails were added",
    decreaseSubtext: "nails were used or removed",
  },
  {
    text: "Mila had already planted some seeds. She planted 8 more and reached 20 seeds. How many seeds did Mila start with?",
    values: { start: 12, change: 8, end: 20 },
    labels: {
      end: "seeds now",
      start: "seeds at first",
      change: "seeds planted",
    },
    unknownSlot: "start",
    operator: "+",
    difficulty: 1,
    itemNoun: "seeds",
    increaseSubtext: "seeds were planted",
    decreaseSubtext: "seeds were removed",
  },
  {
    text: "A baker had some muffins. They baked 10 more to reach 55 muffins. How many muffins did the baker start with?",
    values: { start: 45, change: 10, end: 55 },
    labels: {
      end: "muffins now",
      start: "muffins at first",
      change: "muffins baked",
    },
    unknownSlot: "start",
    operator: "+",
    difficulty: 3,
    itemNoun: "muffins",
    increaseSubtext: "muffins were baked",
    decreaseSubtext: "muffins were sold or eaten",
  },
];

const changeMod6Items = [
  {
    text: "A farmer had 45 apples. He sold 12 apples. How many apples does he have now?",
    values: { start: 45, change: 12, end: 33 },
    labels: {
      end: "apples left",
      start: "apples at first",
      change: "apples sold",
    },
    unknownSlot: "end",
    operator: "-",
    difficulty: 3,
  },
  {
    text: "A train had 24 cars. Some detached, and now there are 15 cars left. How many detached?",
    values: { start: 24, change: 9, end: 15 },
    labels: {
      end: "cars left",
      start: "cars at first",
      change: "cars detached",
    },
    unknownSlot: "change",
    operator: "-",
    difficulty: 2,
  },
  {
    text: "A library had some dictionaries. They gave away 18 and have 32 left. How many dictionaries did they start with?",
    values: { start: 50, change: 18, end: 32 },
    labels: {
      end: "dictionaries left",
      start: "dictionaries at first",
      change: "dictionaries given away",
    },
    unknownSlot: "start",
    operator: "-",
    difficulty: 3,
  },
  {
    text: "12 ants were on a leaf. 5 ants fell off. How many ants are still on the leaf?",
    values: { start: 12, change: 5, end: 7 },
    labels: {
      end: "ants left",
      start: "ants at first",
      change: "ants fell off",
    },
    unknownSlot: "end",
    operator: "-",
    difficulty: 1,
  },
  {
    text: "A teacher had some pieces of chalk. She broke 15 pieces and now has 20 whole pieces left. How many pieces did she start with?",
    values: { start: 35, change: 15, end: 20 },
    labels: {
      end: "pieces left",
      start: "pieces at first",
      change: "pieces broken",
    },
    unknownSlot: "start",
    operator: "-",
    difficulty: 3,
  },
  {
    text: "A boy had some gems. He found 4 more and now has 10 gems. How many gems did he start with?",
    values: { start: 6, change: 4, end: 10 },
    labels: { end: "gems now", start: "gems at first", change: "gems found" },
    unknownSlot: "start",
    operator: "+",
    difficulty: 2,
  },
  {
    text: "A girl had some seashells. She collected 16 more and now has 68 seashells. How many seashells did she start with?",
    values: { start: 52, change: 16, end: 68 },
    labels: {
      end: "seashells now",
      start: "seashells at first",
      change: "seashells collected",
    },
    unknownSlot: "start",
    operator: "+",
    difficulty: 2,
  },
  {
    text: "A store had some bikes. 15 new bikes arrived, and now there are 35 bikes. How many bikes did the store start with?",
    values: { start: 20, change: 15, end: 35 },
    labels: {
      end: "bikes now",
      start: "bikes at first",
      change: "bikes arrived",
    },
    unknownSlot: "start",
    operator: "+",
    difficulty: 2,
  },
  {
    text: "A worker had some bricks. He bought 8 more and reached 20 bricks. How many bricks did he start with?",
    values: { start: 12, change: 8, end: 20 },
    labels: {
      end: "bricks now",
      start: "bricks at first",
      change: "bricks bought",
    },
    unknownSlot: "start",
    operator: "+",
    difficulty: 1,
  },
  {
    text: "A chef had some potatoes. He peeled 10 more to reach 55 peeled potatoes. How many did he start with?",
    values: { start: 45, change: 10, end: 55 },
    labels: {
      end: "potatoes now",
      start: "potatoes at first",
      change: "potatoes peeled",
    },
    unknownSlot: "start",
    operator: "+",
    difficulty: 3,
  },
];

const changeConcepts = [
  {
    id: "change_mod1",
    title: "Change: Read and Identify Variables",
    description: "Read the change story and identify the variables.",
    prerequisites: ["combine_mod5"],
    questions: changeMod1Items.map((item) =>
      createSchemaVariableQuestionFromItem({
        item,
        concept: "change_mod1",
        schemaKind: "change",
        slotKeys: ["start", "change", "end"],
      }),
    ),
  },
  {
    id: "change_mod2",
    title: "Change: Identify the Change",
    description:
      "Identify whether the quantity increased or decreased, then pick the correct bar model.",
    prerequisites: ["change_mod1"],
    questions: changeMod2Items.map((item) =>
      createChangeIdentificationQuestion({
        concept: "change_mod2",
        text: item.text,
        values: item.values,
        labels: item.labels,
        changeDirection:
          item.values.end > item.values.start ? "increase" : "decrease",
        difficulty: item.difficulty,
        itemNoun: item.itemNoun,
        increaseSubtext: item.increaseSubtext,
        decreaseSubtext: item.decreaseSubtext,
      }),
    ),
  },
  {
    id: "change_mod3",
    title: "Change: Word Problem to Bar Model",
    description: "Read the change story and build the bar model.",
    prerequisites: ["change_mod2"],
    questions: changeMod3Items.map((item) =>
      createSchemaRecognitionQuestion(item),
    ),
  },
  {
    id: "change_mod4",
    title: "Change: Bar Model to Equation",
    description: "Translate Change bar models into equations.",
    prerequisites: ["change_mod3"],
    questions: changeMod4Items.map((item) =>
      createEquationFromBarQuestion(item),
    ),
  },
  {
    id: "change_mod5",
    title: "Change: Full Integration",
    description:
      "Identify the change, build the bar model, write the equation, and solve.",
    prerequisites: ["change_mod4"],
    questions: changeMod5Items.flatMap((item) =>
      createChangeFullBundle(item, "change_mod5"),
    ),
  },
  {
    id: "change_mod6",
    title: "Change: Direct Problem Solving",
    description: "Solve change story problems directly.",
    prerequisites: ["change_mod5"],
    questions: changeMod6Items.map((item) =>
      createDirectQuestionFromItem({
        item,
        concept: "change_mod6",
        schemaKind: "change",
      }),
    ),
  },
];

// ============================================================================

// 5. COMPARE SCHEMA

// ============================================================================

const compareConcepts = [
  {
    id: "compare_mod1",
    title: "Compare: Read and Identify Variables",
    description: "Placeholder for the compare variable-identification module.",
    prerequisites: ["change_mod6"],
    questions: [],
  },
  {
    id: "compare_mod2",
    title: "Compare: Word Problem to Bar Model",
    description: "Read the compare story and build the bar model.",
    prerequisites: ["compare_mod1"],
    questions: [
      createSchemaRecognitionQuestion({
        concept: "compare_mod2",
        text: "Darnell has 234 fewer marbles than Delilah. Delilah has 362 marbles. How many does Darnell have?",
        schemaKind: "compare",
        values: { bigger: 362, smaller: 128, difference: 234 },
        labels: { bigger: "Delilah", smaller: "Darnell", difference: "fewer" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "362", smaller: "?", difference: "234" },
        unknownSlot: "smaller",
        difficulty: 4,
      }),
      createSchemaRecognitionQuestion({
        concept: "compare_mod2",
        text: "Tabitha wrote 110 words. Sasha wrote 25 fewer words than Tabitha. How many words did Sasha write?",
        schemaKind: "compare",
        values: { bigger: 110, smaller: 85, difference: 25 },
        labels: { bigger: "Tabitha", smaller: "Sasha", difference: "fewer" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "110", smaller: "?", difference: "25" },
        unknownSlot: "smaller",
        difficulty: 3,
      }),
      createSchemaRecognitionQuestion({
        concept: "compare_mod2",
        text: "The Oak tree is 45 feet tall. The Pine tree is 15 feet shorter. How tall is the Pine tree?",
        schemaKind: "compare",
        values: { bigger: 45, smaller: 30, difference: 15 },
        labels: { bigger: "Oak", smaller: "Pine", difference: "shorter" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "45", smaller: "?", difference: "15" },
        unknownSlot: "smaller",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "compare_mod2",
        text: "Sam has ₹80. Alex has ₹30 less than Sam. How much money does Alex have?",
        schemaKind: "compare",
        values: { bigger: 80, smaller: 50, difference: 30 },
        labels: { bigger: "Sam", smaller: "Alex", difference: "less" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "80", smaller: "?", difference: "30" },
        unknownSlot: "smaller",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "compare_mod2",
        text: "Max the dog weighs 60 lbs. Bella the cat is 40 lbs lighter. How much does Bella weigh?",
        schemaKind: "compare",
        values: { bigger: 60, smaller: 20, difference: 40 },
        labels: { bigger: "Max", smaller: "Bella", difference: "lighter" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "60", smaller: "?", difference: "40" },
        unknownSlot: "smaller",
        difficulty: 2,
      }),
    ],
  },

  {
    id: "compare_mod3",
    title: "Compare: Bar Model to Equation",
    description: "Translate Compare bar models into equations.",
    prerequisites: ["compare_mod2"],
    questions: [
      createEquationFromBarQuestion({
        concept: "compare_mod3",
        text: "Build the equation for Delilah and Darnell's marbles.",
        schemaKind: "compare",
        barValues: { bigger: "362", smaller: "?", difference: "234" },
        scaleValues: { bigger: 362, smaller: 128, difference: 234 },
        labels: {
          bigger: "Delilah's",
          smaller: "Darnell's",
          difference: "fewer",
          left: "Darnell's",
          right: "fewer",
          result: "Delilah's",
        },
        equationDisplayValues: {
          leftTerm: "?",
          rightTerm: "234",
          result: "362",
        },
        validationSlots: { leftTerm: "?", rightTerm: "234", result: "362" },
        alternateSlots: { leftTerm: "128", rightTerm: "234", result: "362" },
        operator: "+",
        difficulty: 3,
      }),
      createEquationFromBarQuestion({
        concept: "compare_mod3",
        text: "Build the equation for Tabitha and Sasha's words.",
        schemaKind: "compare",
        barValues: { bigger: "110", smaller: "?", difference: "25" },
        scaleValues: { bigger: 110, smaller: 85, difference: 25 },
        labels: {
          bigger: "Tabitha",
          smaller: "Sasha",
          difference: "fewer",
          left: "Sasha",
          right: "fewer",
          result: "Tabitha",
        },
        equationDisplayValues: {
          leftTerm: "?",
          rightTerm: "25",
          result: "110",
        },
        validationSlots: { leftTerm: "?", rightTerm: "25", result: "110" },
        alternateSlots: { leftTerm: "85", rightTerm: "25", result: "110" },
        operator: "+",
        difficulty: 3,
      }),
      createEquationFromBarQuestion({
        concept: "compare_mod3",
        text: "Build the equation for the Oak and Pine heights.",
        schemaKind: "compare",
        barValues: { bigger: "45", smaller: "?", difference: "15" },
        scaleValues: { bigger: 45, smaller: 30, difference: 15 },
        labels: {
          bigger: "Oak Tree",
          smaller: "Pine Tree",
          difference: "shorter",
          left: "Pine Tree",
          right: "shorter",
          result: "Oak Tree",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "15", result: "45" },
        validationSlots: { leftTerm: "?", rightTerm: "15", result: "45" },
        alternateSlots: { leftTerm: "30", rightTerm: "15", result: "45" },
        operator: "+",
        difficulty: 2,
      }),
      createEquationFromBarQuestion({
        concept: "compare_mod3",
        text: "Build the equation for Sam and Alex's money.",
        schemaKind: "compare",
        barValues: { bigger: "80", smaller: "?", difference: "30" },
        scaleValues: { bigger: 80, smaller: 50, difference: 30 },
        labels: {
          bigger: "Sam's Money",
          smaller: "Alex's Money",
          difference: "less",
          left: "Alex's Money",
          right: "less",
          result: "Sam's Money",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "30", result: "80" },
        validationSlots: { leftTerm: "?", rightTerm: "30", result: "80" },
        alternateSlots: { leftTerm: "50", rightTerm: "30", result: "80" },
        operator: "+",
        difficulty: 2,
      }),
      createEquationFromBarQuestion({
        concept: "compare_mod3",
        text: "Build the equation for Max and Bella's weights.",
        schemaKind: "compare",
        barValues: { bigger: "60", smaller: "?", difference: "40" },
        scaleValues: { bigger: 60, smaller: 20, difference: 40 },
        labels: {
          bigger: "Max's Weight",
          smaller: "Bella's Weight",
          difference: "lighter",
          left: "Bella's Weight",
          right: "lighter",
          result: "Max's Weight",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "40", result: "60" },
        validationSlots: { leftTerm: "?", rightTerm: "40", result: "60" },
        alternateSlots: { leftTerm: "20", rightTerm: "40", result: "60" },
        operator: "+",
        difficulty: 2,
      }),
    ],
  },

  {
    id: "compare_mod4",
    title: "Compare: Full Integration",
    description: "Build the bar model, write the equation, and solve.",
    prerequisites: ["compare_mod3"],
    questions: [
      // Problem 1 (Seats)
      createSchemaBarQuestion({
        concept: "compare_mod4",
        text: "The main hall has 362 seats. The balcony has 234 fewer seats than the main hall. How many seats does the balcony have?",
        schemaKind: "compare",
        values: { bigger: 362, smaller: 128, difference: 234 },
        labels: {
          bigger: "main hall seats",
          smaller: "balcony seats",
          difference: "fewer seats",
        },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "362", smaller: "?", difference: "234" },
        alternateSlots: { bigger: "362", smaller: "128", difference: "234" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "main hall", smallerOwner: "balcony" },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 4,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod4",
        text: "The main hall has 362 seats. The balcony has 234 fewer seats than the main hall. How many seats does the balcony have?",
        schemaKind: "compare",
        values: { bigger: "362", smaller: "?", difference: "234" },
        hideTopBar: true,
        scaleValues: { bigger: 362, smaller: 128, difference: 234 },
        labels: {
          bigger: "main hall seats",
          smaller: "balcony seats",
          difference: "fewer seats",
          left: "balcony seats",
          right: "fewer seats",
          result: "main hall seats",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "234", result: "362" },
        validationSlots: { leftTerm: "?", rightTerm: "234", result: "362" },
        alternateSlots: { leftTerm: "128", rightTerm: "234", result: "362" },
        participants: { biggerOwner: "main hall", smallerOwner: "balcony" },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 4,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod4",
        text: "The main hall has 362 seats. The balcony has 234 fewer seats than the main hall. How many seats does the balcony have?",
        schemaKind: "compare",
        answer: 128,
        displayEquation: "? + 234 = 362",
        verificationEquation: "128 + 234 = 362",
        solutionLabel: "? = 128",
        difficulty: 4,
      }),

      // Problem 2 (Typed Words)
      createSchemaBarQuestion({
        concept: "compare_mod4",
        text: "Ruby typed 110 words. Omar typed 25 fewer words than Ruby. How many words did Omar type?",
        schemaKind: "compare",
        values: { bigger: 110, smaller: 85, difference: 25 },
        labels: { bigger: "Ruby", smaller: "Omar", difference: "fewer" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "110", smaller: "?", difference: "25" },
        alternateSlots: { bigger: "110", smaller: "85", difference: "25" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "Ruby", smallerOwner: "Omar" },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod4",
        text: "Ruby typed 110 words. Omar typed 25 fewer words than Ruby. How many words did Omar type?",
        schemaKind: "compare",
        values: { bigger: "110", smaller: "?", difference: "25" },
        hideTopBar: true,
        scaleValues: { bigger: 110, smaller: 85, difference: 25 },
        labels: {
          bigger: "Ruby",
          smaller: "Omar",
          difference: "fewer",
          left: "Omar",
          right: "fewer",
          result: "Ruby",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "25", result: "110" },
        validationSlots: { leftTerm: "?", rightTerm: "25", result: "110" },
        alternateSlots: { leftTerm: "85", rightTerm: "25", result: "110" },
        participants: { biggerOwner: "Ruby", smallerOwner: "Omar" },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 3,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod4",
        text: "Ruby typed 110 words. Omar typed 25 fewer words than Ruby. How many words did Omar type?",
        schemaKind: "compare",
        answer: 85,
        displayEquation: "? + 25 = 110",
        verificationEquation: "85 + 25 = 110",
        solutionLabel: "? = 85",
        difficulty: 3,
      }),

      // Problem 3 (Maple/Cedar Trees)
      createSchemaBarQuestion({
        concept: "compare_mod4",
        text: "The Maple tree is 45 feet tall. The Cedar tree is 15 feet shorter. How tall is the Cedar tree?",
        schemaKind: "compare",
        values: { bigger: 45, smaller: 30, difference: 15 },
        labels: { bigger: "Maple", smaller: "Cedar", difference: "shorter" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "45", smaller: "?", difference: "15" },
        alternateSlots: { bigger: "45", smaller: "30", difference: "15" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "Maple", smallerOwner: "Cedar" },
        comparisonWording: "shorter than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod4",
        text: "The Maple tree is 45 feet tall. The Cedar tree is 15 feet shorter. How tall is the Cedar tree?",
        schemaKind: "compare",
        values: { bigger: "45", smaller: "?", difference: "15" },
        hideTopBar: true,
        scaleValues: { bigger: 45, smaller: 30, difference: 15 },
        labels: {
          bigger: "Maple",
          smaller: "Cedar",
          difference: "shorter",
          left: "Cedar",
          right: "shorter",
          result: "Maple",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "15", result: "45" },
        validationSlots: { leftTerm: "?", rightTerm: "15", result: "45" },
        alternateSlots: { leftTerm: "30", rightTerm: "15", result: "45" },
        participants: { biggerOwner: "Maple", smallerOwner: "Cedar" },
        comparisonWording: "shorter than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod4",
        text: "The Maple tree is 45 feet tall. The Cedar tree is 15 feet shorter. How tall is the Cedar tree?",
        schemaKind: "compare",
        answer: 30,
        displayEquation: "? + 15 = 45",
        verificationEquation: "30 + 15 = 45",
        solutionLabel: "? = 30",
        difficulty: 2,
      }),

      // Problem 4 (Maya/Leo Money)
      createSchemaBarQuestion({
        concept: "compare_mod4",
        text: "Maya has ₹80. Leo has ₹30 less than Maya. How much money does Leo have?",
        schemaKind: "compare",
        values: { bigger: 80, smaller: 50, difference: 30 },
        labels: { bigger: "Maya", smaller: "Leo", difference: "less" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "80", smaller: "?", difference: "30" },
        alternateSlots: { bigger: "80", smaller: "50", difference: "30" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "Maya", smallerOwner: "Leo" },
        comparisonWording: "less than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod4",
        text: "Maya has ₹80. Leo has ₹30 less than Maya. How much money does Leo have?",
        schemaKind: "compare",
        values: { bigger: "80", smaller: "?", difference: "30" },
        hideTopBar: true,
        scaleValues: { bigger: 80, smaller: 50, difference: 30 },
        labels: {
          bigger: "Maya",
          smaller: "Leo",
          difference: "less",
          left: "Leo",
          right: "less",
          result: "Maya",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "30", result: "80" },
        validationSlots: { leftTerm: "?", rightTerm: "30", result: "80" },
        alternateSlots: { leftTerm: "50", rightTerm: "30", result: "80" },
        participants: { biggerOwner: "Maya", smallerOwner: "Leo" },
        comparisonWording: "less than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod4",
        text: "Maya has ₹80. Leo has ₹30 less than Maya. How much money does Leo have?",
        schemaKind: "compare",
        answer: 50,
        displayEquation: "? + 30 = 80",
        verificationEquation: "50 + 30 = 80",
        solutionLabel: "? = 50",
        difficulty: 2,
      }),

      // Problem 5 (Suitcase/Backpack Weight)
      createSchemaBarQuestion({
        concept: "compare_mod4",
        text: "A suitcase weighs 60 lbs. A backpack is 40 lbs lighter. How much does the backpack weigh?",
        schemaKind: "compare",
        values: { bigger: 60, smaller: 20, difference: 40 },
        labels: {
          bigger: "suitcase",
          smaller: "backpack",
          difference: "lighter",
        },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "60", smaller: "?", difference: "40" },
        alternateSlots: { bigger: "60", smaller: "20", difference: "40" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "suitcase", smallerOwner: "backpack" },
        comparisonWording: "lighter than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod4",
        text: "A suitcase weighs 60 lbs. A backpack is 40 lbs lighter. How much does the backpack weigh?",
        schemaKind: "compare",
        values: { bigger: "60", smaller: "?", difference: "40" },
        hideTopBar: true,
        scaleValues: { bigger: 60, smaller: 20, difference: 40 },
        labels: {
          bigger: "suitcase",
          smaller: "backpack",
          difference: "lighter",
          left: "backpack",
          right: "lighter",
          result: "suitcase",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "40", result: "60" },
        validationSlots: { leftTerm: "?", rightTerm: "40", result: "60" },
        alternateSlots: { leftTerm: "20", rightTerm: "40", result: "60" },
        participants: { biggerOwner: "suitcase", smallerOwner: "backpack" },
        comparisonWording: "lighter than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod4",
        text: "A suitcase weighs 60 lbs. A backpack is 40 lbs lighter. How much does the backpack weigh?",
        schemaKind: "compare",
        answer: 20,
        displayEquation: "? + 40 = 60",
        verificationEquation: "20 + 40 = 60",
        solutionLabel: "? = 20",
        difficulty: 2,
      }),
    ],
  },
  {
    id: "compare_mod5",
    title: "Compare: Direct Problem Solving",
    description: "Placeholder for the compare direct-problem-solving module.",
    prerequisites: ["compare_mod4"],
    questions: [],
  },
];

// ============================================================================
// SEEDER EXECUTION
// ============================================================================
const conceptsData = [
  ...arithmeticConcepts,
  ...missingNumberConcepts,
  ...combineConcepts,
  ...changeConcepts,
  ...compareConcepts,
];

// const seedData = async () => {
//   try {
//     await Concept.deleteMany({});
//     await User.deleteMany({});
//     await Attempt.deleteMany({});
//     await TeacherSignupCode.deleteMany({});
//     console.log("Database Wiped Clean");

//     await ensureTeacherSignupCode();

//     await Concept.insertMany(conceptsData);
//     console.log("Concepts Seeded");

//     const testUser = new User({
//       username: "student1",
//       password: "password123",
//       role: "student",
//       streak: 0,
//       zpdNodes: ["single_add"],
//       mastery: {
//         single_add: {
//           status: "unlocked",
//           successCount: 0,
//           attemptCount: 0,
//           lastAttempts: [],
//         },
//       },
//     });

//     await testUser.save();
//     console.log("Test User (student1) Seeded Successfully");

//     const teacherUser = new User({
//       username: "teacher1",
//       password: "password123",
//       role: "teacher",
//       mastery: {},
//       zpdNodes: [],
//       avatar: "beam",
//       streak: 0,
//     });

//     await teacherUser.save();
//     console.log("Teacher User Seeded Successfully");
//   } catch (error) {
//     console.error("Seeding Error:", error);
//   }
// };

const seedData = async () => {
  try {
    const isLocalOrMemory =
      process.env.USE_MEMORY_DB === "true" ||
      !process.env.MONGO_URI ||
      process.env.MONGO_URI.includes("localhost") ||
      process.env.MONGO_URI.includes("127.0.0.1");

    const isDevOrTest = process.env.NODE_ENV !== "production";

    // Only wipe if explicitly requested OR if we are running in local/memory database under dev/test environments.
    // This protects production Atlas DBs from accidental wipes even if run from a local machine in development mode.
    const shouldWipe =
      process.env.RESET_DEMO_DATA === "true" ||
      (isLocalOrMemory && isDevOrTest);

    // 1. Clean the database (ONLY IF EXPLICITLY ALLOWED OR IN LOCAL DEV)
    if (shouldWipe) {
      await Concept.deleteMany({});
      await User.deleteMany({});
      await Attempt.deleteMany({});
      await TeacherSignupCode.deleteMany({});
      console.log("-----------------------------------------");
      console.log("🧹 DATABASE WIPED FOR TESTING");
    } else {
      console.log("-----------------------------------------");
      console.log("⚠️ SKIPPING DATABASE WIPE (Protecting Production Data)");
    }

    await ensureTeacherSignupCode();

    if (shouldWipe) {
      await Concept.insertMany(conceptsData);
      console.log("✅ All concepts inserted from scratch.");

      // 2. THE TESTING SWITCH
      // Change this variable to the ID you want to test right now.
      // Here are some common jump points:
      // ----------------------------------------------867
      // const testStage = "combine_mod3"; // CHANGE THIS TO JUMP
      const testStage = "change_mod1"; // CHANGE THIS TO JUMP

      // 3. Create the test user with ONLY that stage active
      const testUser = new User({
        username: "student1",
        password: "password123",
        role: "student",
        streak: 0,
        avatar: "beam",

        // Forces this specific node to be the ONLY one the student sees
        zpdNodes: [testStage],

        mastery: {
          [testStage]: {
            status: "unlocked",
            successCount: 0,
            attemptCount: 0,
            lastAttempts: [],
          },
        },
      });
      const testUser1 = new User({
        username: "goku",
        password: "asdasd@1",
        role: "student",
        streak: 0,
        avatar: "beam",

        // Forces this specific node to be the ONLY one the student sees
        zpdNodes: [testStage],

        mastery: {
          [testStage]: {
            status: "unlocked",
            successCount: 0,
            attemptCount: 0,
            lastAttempts: [],
          },
        },
      });

      await testUser.save();
      await testUser1.save();
      console.log(
        `🚀 TEST READY: 'student1' is jumped directly to [${testStage}]`,
      );

      // 4. Create Teacher
      const teacherUser = new User({
        username: "teacher1",
        password: "password123",
        role: "teacher",
        mastery: {},
        zpdNodes: [],
        avatar: "pixel",
        streak: 0,
      });
      await teacherUser.save();
      console.log("👨‍🏫 Teacher account created.");
    } else {
      console.log(
        "🔄 Upserting concepts to preserve and update production data...",
      );
      for (const concept of conceptsData) {
        await Concept.findOneAndUpdate({ id: concept.id }, concept, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        });
      }
      console.log("✅ All concepts successfully upserted/updated.");
      console.log("⚠️ Skipped demo user/teacher seeding in non-wipe mode.");
    }
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};

module.exports = seedData;

if (require.main === module) {
  const dotenv = require("dotenv");
  const path = require("path");

  const isProdWipe = process.argv.includes("--prod-wipe");
  const isProdSeed = process.argv.includes("--prod-seed");

  if (isProdWipe || isProdSeed) {
    // Load the shared production config (Atlas URI + JWT — no wipe flag baked in)
    const prodEnvPath = path.resolve(__dirname, "../.env.prod");
    dotenv.config({ path: prodEnvPath });

    if (isProdWipe) {
      // Unlock the wipe via CLI arg only — the file itself is always safe
      process.env.RESET_DEMO_DATA = "true";
      console.log("⚠️  --prod-wipe: FULL WIPE + RESEED on production Atlas DB");
    } else {
      console.log("🔄 --prod-seed: Upsert concepts only, user data untouched");
    }
    console.log(`   MONGO_URI → ${process.env.MONGO_URI}`);
    console.log(`   RESET_DEMO_DATA → ${process.env.RESET_DEMO_DATA ?? "false (upsert only)"}`);
    console.log("");
  } else {
    dotenv.config({ path: path.resolve(__dirname, "../.env") });
  }

  const connectDB = require("../config/db");
  const mongoose = require("mongoose");

  connectDB()
    .then(async () => {
      console.log("Starting seeder directly...");
      await seedData();
      console.log("Seeding finished!");
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error("Direct seeding error:", err);
      process.exit(1);
    });
}
