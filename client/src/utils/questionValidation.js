const normalizeString = (value) =>
  String(value === undefined || value === null ? "" : value)
    .trim()
    .toLowerCase();

export const isCompareAnswerInputQuestion = (question) =>
  question?.moduleStage === "schema_bar_model" &&
  question?.schemaKind === "compare" &&
  question?.barModelSpec?.compareVariant === "fewer_than_gap";

export const isVariableIdentificationQuestion = (question) =>
  question?.interactionMode === "variable_identification" ||
  question?.moduleStage === "schema_variables";

export const isChangeIdentificationQuestion = (question) =>
  question?.interactionMode === "change_identification" ||
  question?.moduleStage === "change_identify";

export const isWorksheetDrivenQuestion = (question) =>
  [
    "practice",
    "equations",
    "bar_to_equation",
    "schema_bar_model",
    "schema_direct_solve",
    "schema_equation",
    "schema_solve",
    "schema_variables",
    "word_to_bar",
    "change_identify",
  ].includes(question?.moduleStage);

export const getChangeIdentificationFeedback = (question, response = {}) => {
  const expectedDirection = normalizeString(question?.validation?.changeDirection);
  const expectedBarModel = normalizeString(question?.validation?.correctBarModel);
  const selectedDirection = normalizeString(response?.changeDirection);
  const selectedBarModel = normalizeString(response?.barModel);

  return {
    correctDirection: expectedDirection,
    correctBarModel: expectedBarModel,
    selectedDirection,
    selectedBarModel,
    directionAnswered: selectedDirection !== "",
    barModelAnswered: selectedBarModel !== "",
    directionCorrect:
      selectedDirection !== "" && selectedDirection === expectedDirection,
    barModelCorrect:
      selectedBarModel !== "" && selectedBarModel === expectedBarModel,
  };
};

export const getEditableEquationItems = (question) =>
  (question?.equationSpec?.template || []).filter(
    (item) => item.type === "slot" && item.editable !== false,
  );

export const getEquationSlotItems = (question) =>
  (question?.equationSpec?.template || []).filter(
    (item) => item.type === "slot" && item.key,
  );

export const isEquationBuilderStage = (question) =>
  ["bar_to_equation", "schema_equation"].includes(question?.moduleStage);

export const getEditableBarKeys = (question) =>
  question?.barModelSpec?.editableKeys || [];

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object || {}, key);

const getBarModelBoxes = (question) => {
  const spec = question?.barModelSpec || {};
  const boxes = [
    spec.total,
    spec.left,
    spec.right,
    spec.start,
    spec.change,
    spec.end,
    spec.result,
    spec.bigger,
    spec.smaller,
    spec.difference,
  ].filter(Boolean);

  return Array.from(new Map(boxes.map((box) => [box.key, box])).values());
};

const getExpectedBarValue = (question, box) => {
  if (!box?.key) return "";

  if (hasOwn(question?.validation?.slots, box.key)) {
    return String(question.validation.slots[box.key] ?? "").trim();
  }

  return String(box.value ?? "").trim();
};

const getCalculatedBarValue = (question, key) => {
  if (hasOwn(question?.validation?.alternateSlots, key)) {
    const value = String(question.validation.alternateSlots[key] ?? "").trim();
    return value && value !== "?" ? value : "";
  }

  return "";
};

const isUnknownValue = (value) => value === "" || value === "?";

export const evaluateBarModelStageResponse = (question, response = {}) => {
  const slots = response?.slots || {};
  const feedback = {};
  const canonicalSlots = {};
  let isCorrect = true;

  getBarModelBoxes(question).forEach((box) => {
    const key = box.key;
    const student = String(slots[key] || "").trim();
    const expected = getExpectedBarValue(question, box);
    const calculated = getCalculatedBarValue(question, key);
    const isUnknown = isUnknownValue(expected);

    let isSlotCorrect;

    if (isUnknown) {
      isSlotCorrect =
        student === "" ||
        student === "?" ||
        (calculated !== "" && normalizeString(student) === normalizeString(calculated));
      canonicalSlots[key] = student === "" ? "?" : student;
    } else {
      isSlotCorrect = normalizeString(student) === normalizeString(expected);
      canonicalSlots[key] = student;
    }

    if (!isSlotCorrect) {
      isCorrect = false;
    }

    feedback[key] = { isCorrect: isSlotCorrect };
  });

  return {
    isCorrect,
    feedback,
    canonicalSlots,
  };
};

const getTemplateSlotValue = (question, key) => {
  const item = getEquationSlotItems(question).find((slot) => slot.key === key);
  return String(
    item?.value ?? question?.equationSpec?.values?.[key] ?? "",
  ).trim();
};

const getExpectedEquationSlotValue = (question, key) => {
  if (hasOwn(question?.validation?.slots, key)) {
    return String(question.validation.slots[key] ?? "").trim();
  }

  return getTemplateSlotValue(question, key);
};

const getCalculatedEquationSlotValue = (question, key) => {
  if (hasOwn(question?.validation?.alternateSlots, key)) {
    const value = String(question.validation.alternateSlots[key] ?? "").trim();
    return value && value !== "?" ? value : "";
  }

  return "";
};

const isUnknownEquationSlot = isUnknownValue;

export const evaluateEquationStageResponse = (question, response = {}) => {
  const slots = response?.slots || {};
  const slotItems = getEquationSlotItems(question);
  const feedback = {};
  const canonicalSlots = {};

  let isCorrect = true;

  slotItems.forEach((item) => {
    const key = item.key;
    const student = String(slots[key] || "").trim();
    const expected = getExpectedEquationSlotValue(question, key);
    const calculated = getCalculatedEquationSlotValue(question, key);
    const isUnknown = isUnknownEquationSlot(expected);

    let isSlotCorrect;

    if (isUnknown) {
      isSlotCorrect =
        student === "" ||
        student === "?" ||
        (calculated !== "" && normalizeString(student) === normalizeString(calculated));
      canonicalSlots[key] = student === "" ? "?" : student;
    } else {
      isSlotCorrect = normalizeString(student) === normalizeString(expected);
      canonicalSlots[key] = student;
    }

    if (!isSlotCorrect) {
      isCorrect = false;
    }

    feedback[key] = { isCorrect: isSlotCorrect };
  });

  const expectedOperator =
    question?.validation?.operator || question?.equationSpec?.operator || "";
  let operatorFeedback = null;

  if (expectedOperator && question?.schemaKind !== "combine") {
    const isOperatorCorrect =
      normalizeString(response?.operator) === normalizeString(expectedOperator);

    if (!isOperatorCorrect) {
      isCorrect = false;
    }

    operatorFeedback = { isCorrect: isOperatorCorrect };
  }

  return {
    isCorrect,
    feedback,
    operatorFeedback,
    canonicalSlots,
  };
};

export const buildEquationString = (question, response = {}) =>
  (question?.equationSpec?.template || [])
    .map((item) => {
      if (item.type === "symbol") {
        return item.value;
      }

      if (item.type === "operator") {
        return response?.operator || item.value || "?";
      }

      const value =
        response?.slots?.[item.key] ??
        item.value ??
        question?.equationSpec?.values?.[item.key] ??
        "";

      return String(value).trim() || "?";
    })
    .join(" ");

export const createInitialResponse = (question) => {
  if (!question?.inputMode && question?.type === "direct") {
    return "";
  }

  const inputMode = question?.inputMode || "text_answer";

  if (isCompareAnswerInputQuestion(question)) {
    return {
      slots: {},
      activeField: null,
      operator: "",
      textAnswer: "",
    };
  }

  if (isChangeIdentificationQuestion(question)) {
    return {
      changeDirection: "",
      barModel: "",
      subStep: "2a",
    };
  }

  if (isVariableIdentificationQuestion(question)) {
    return {
      variables: Object.fromEntries(
        (question?.visualData?.variables || []).map((variable) => [
          variable.key,
          {
            role: "",
            value: "",
          },
        ]),
      ),
      activeField: null,
      operator: "",
      textAnswer: "",
    };
  }

  if (inputMode === "keypad_single_blank") {
    return {
      slots: { answer: "" },
      activeField: "answer",
      operator: question?.equationSpec?.operator || "",
      textAnswer: "",
    };
  }

  if (inputMode === "keypad_equation") {
    const editableSlots = getEditableEquationItems(question);
    return {
      slots: Object.fromEntries(editableSlots.map((item) => [item.key, ""])),
      activeField: editableSlots[0]?.key || "__operator__",
      operator:
        question?.schemaKind === "change"
          ? question?.equationSpec?.operator || ""
          : question?.equationSpec?.operatorEditable
            ? ""
            : question?.equationSpec?.operator || "",
      textAnswer: "",
    };
  }

  if (inputMode === "keypad_bar_model") {
    const editableKeys = getEditableBarKeys(question);
    return {
      slots: Object.fromEntries(editableKeys.map((key) => [key, ""])),
      activeField: editableKeys[0] || null,
      operator: "",
      textAnswer: "",
    };
  }

  return {
    slots: {},
    activeField: null,
    operator: "",
    textAnswer: "",
  };
};

export const isQuestionResponseReady = (question, response) => {
  const inputMode = question?.inputMode || "text_answer";

  if (isCompareAnswerInputQuestion(question)) {
    return normalizeString(response?.textAnswer) !== "";
  }

  if (isChangeIdentificationQuestion(question)) {
    return (
      (response?.subStep === "2a" && normalizeString(response?.changeDirection) !== "") ||
      (response?.subStep === "2b" && normalizeString(response?.barModel) !== "")
    );
  }

  if (isVariableIdentificationQuestion(question)) {
    const variables = question?.visualData?.variables || [];
    return variables.every((variable) => {
      const answer = response?.variables?.[variable.key] || {};
      // Every variable must have a role selected
      if (!answer.role) return false;
      // "given" variables must also have a value entered
      if (answer.role === "given") {
        return normalizeString(answer.value) !== "";
      }
      // "find" variables only need the role
      return true;
    });
  }

  if (inputMode === "keypad_single_blank") {
    return normalizeString(response?.slots?.answer) !== "";
  }

  if (inputMode === "keypad_equation") {
    const equationReady = getEditableEquationItems(question).every(
      (item) => normalizeString(response?.slots?.[item.key]) !== "",
    );

    if (
      question?.equationSpec?.operatorEditable &&
      question?.schemaKind !== "change"
    ) {
      return equationReady && normalizeString(response?.operator) !== "";
    }

    return equationReady;
  }

  if (inputMode === "keypad_bar_model") {
    return getEditableBarKeys(question).every(
      (key) => normalizeString(response?.slots?.[key]) !== "",
    );
  }

  return normalizeString(response?.textAnswer) !== "";
};

export const getDisplayedTextAnswer = (response) => response?.textAnswer || "";

export const getSlotDisplayValue = (response, key) =>
  String(response?.slots?.[key] || "").trim();

export const getEquationFixedValue = (item) =>
  String(item?.value === undefined || item?.value === null ? "" : item.value);

export const getBarValue = (response, box) =>
  String(response?.slots?.[box?.key] || box?.value || "").trim();

export const buildSubmissionResponse = (question, response) => {
  if (!question?.inputMode && typeof response === "string") {
    return response;
  }

  const inputMode = question?.inputMode || "text_answer";

  if (isCompareAnswerInputQuestion(question)) {
    return {
      slots: {
        ...(question?.validation?.slots || {}),
        [question?.unknownSlot || "smaller"]: response?.textAnswer || "",
      },
    };
  }

  if (isChangeIdentificationQuestion(question)) {
    return {
      changeDirection: response?.changeDirection || "",
      barModel: response?.barModel || "",
    };
  }

  if (isVariableIdentificationQuestion(question)) {
    return {
      variables: { ...(response?.variables || {}) },
    };
  }

  if (inputMode === "text_answer") {
    return {
      textAnswer: response?.textAnswer || "",
    };
  }

  if (inputMode === "keypad_single_blank") {
    const answer = response?.slots?.answer || "";
    return {
      textAnswer: answer,
      slots: {
        answer,
      },
    };
  }

  if (inputMode === "keypad_bar_model") {
    return {
      slots: { ...(response?.slots || {}) },
    };
  }

  return {
    slots: { ...(response?.slots || {}) },
    operator: response?.operator || "",
  };
};

export const extractNounFromQuestion = (text) => {
  if (!text) return "items";
  const t = text.toLowerCase();
  
  const mapping = [
    { key: "cookie", value: "cookies" },
    { key: "leave", value: "leaves" },
    { key: "cand", value: "candies" },
    { key: "sticker", value: "stickers" },
    { key: "money", value: "money" },
    { key: "dollar", value: "money" },
    { key: "card", value: "baseball cards" },
    { key: "page", value: "pages" },
    { key: "point", value: "points" },
    { key: "passenger", value: "passengers" },
    { key: "pencil", value: "pencils" },
    { key: "player", value: "players" },
    { key: "cupcake", value: "cupcakes" },
    { key: "book", value: "books" },
    { key: "bird", value: "birds" },
    { key: "stamp", value: "stamps" },
    { key: "member", value: "members" },
    { key: "puzzle", value: "puzzles solved" },
    { key: "token", value: "tokens" },
    { key: "apple", value: "apples" },
    { key: "berry", value: "berries" },
    { key: "fruit", value: "fruits" },
    { key: "toy", value: "toys" },
    { key: "ball", value: "balls" },
  ];
  
  for (const item of mapping) {
    if (t.includes(item.key)) {
      return item.value;
    }
  }
  
  const match = text.match(/had\s+(?:some\s+|already\s+|)?(?:\d+\s+)?([a-zA-Z]+)/i);
  if (match && match[1]) {
    const word = match[1].toLowerCase();
    if (!["some", "a", "an", "the", "already"].includes(word)) {
      return word;
    }
  }
  
  return "items";
};

export const isUncountableNoun = (noun) => {
  if (!noun) return false;
  const n = noun.toLowerCase().trim();
  const uncountables = ["money", "water", "juice", "milk", "sand", "time", "cash", "gold", "flour", "sugar", "salt", "bread", "cheese", "butter", "rice", "homework", "music"];
  if (uncountables.includes(n)) return true;
  
  // Plural countable nouns in math stories typically end in 's'
  if (!n.endsWith("s")) {
    return true; // assume singular/uncountable (e.g. money, cash, water)
  }
  
  return false;
};

export const getChangeIdentifyDynamicData = (text, itemNoun, increaseSubtext, decreaseSubtext) => {
  const resolvedNoun = itemNoun || extractNounFromQuestion(text);
  
  let resolvedIncrease = increaseSubtext;
  let resolvedDecrease = decreaseSubtext;
  
  const isUncountable = isUncountableNoun(resolvedNoun);
  const verb = isUncountable ? "was" : "were";
  
  if (!resolvedIncrease) {
    resolvedIncrease = resolvedNoun ? `${resolvedNoun} ${verb} added or received` : "quantity was added or received";
  }
  if (!resolvedDecrease) {
    resolvedDecrease = resolvedNoun ? `${resolvedNoun} ${verb} removed or given away` : "quantity was removed or given away";
  }
  
  return {
    itemNoun: resolvedNoun,
    increaseSubtext: resolvedIncrease,
    decreaseSubtext: resolvedDecrease,
    isUncountable,
  };
};

