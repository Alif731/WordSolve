import { describe, expect, it } from "vitest";

import {
  buildSubmissionResponse,
  createInitialResponse,
  evaluateBarModelStageResponse,
  evaluateEquationStageResponse,
  getChangeIdentificationFeedback,
  isQuestionResponseReady,
  isWorksheetDrivenQuestion,
} from "../utils/questionValidation";

const combineQuestion = {
  interactionMode: "equation_builder",
  moduleStage: "bar_to_equation",
  schemaKind: "combine",
  equationSpec: {
    operator: "+",
    operatorEditable: true,
    template: [
      { type: "slot", key: "leftTerm", value: "?", editable: false },
      { type: "operator", key: "operator", value: "+", editable: true },
      { type: "slot", key: "rightTerm", value: "4", editable: true },
      { type: "symbol", value: "=" },
      { type: "slot", key: "result", value: "10", editable: true },
    ],
  },
  validation: {
    slots: { rightTerm: "4", result: "10" },
    alternateSlots: { leftTerm: "6", rightTerm: "4", result: "10" },
    operator: "+",
  },
};

const changeQuestion = {
  interactionMode: "equation_builder",
  moduleStage: "schema_equation",
  inputMode: "keypad_equation",
  schemaKind: "change",
  equationSpec: {
    operator: "-",
    operatorEditable: true,
    template: [
      { type: "slot", key: "leftTerm", value: "15", editable: true },
      { type: "operator", key: "operator", value: "-", editable: true },
      { type: "slot", key: "rightTerm", value: "?", editable: false },
      { type: "symbol", value: "=" },
      { type: "slot", key: "result", value: "11", editable: true },
    ],
  },
  validation: {
    slots: { leftTerm: "15", result: "11" },
    alternateSlots: { leftTerm: "15", rightTerm: "4", result: "11" },
    operator: "-",
  },
};

const combineBarQuestion = {
  interactionMode: "bar_model_builder",
  moduleStage: "word_to_bar",
  schemaKind: "combine",
  barModelSpec: {
    total: { key: "total", value: "10" },
    left: { key: "partA", value: "?" },
    right: { key: "partB", value: "4" },
  },
  validation: {
    slots: { total: "10", partB: "4" },
    alternateSlots: { total: "10", partA: "6", partB: "4" },
  },
};

const changeIdentificationQuestion = {
  type: "change_identification",
  interactionMode: "change_identification",
  moduleStage: "change_identify",
  inputMode: "change_identify",
  schemaKind: "change",
  validation: {
    changeDirection: "decrease",
    correctBarModel: "decrease_bar",
  },
};

describe("evaluateEquationStageResponse", () => {
  it("accepts question mark, blank, and calculated unknowns for combine stages", () => {
    expect(
      evaluateEquationStageResponse(combineQuestion, {
        slots: { leftTerm: "?", rightTerm: "4", result: "10" },
        operator: "+",
      }).isCorrect,
    ).toBe(true);

    expect(
      evaluateEquationStageResponse(combineQuestion, {
        slots: { rightTerm: "4", result: "10" },
        operator: "+",
      }).isCorrect,
    ).toBe(true);

    expect(
      evaluateEquationStageResponse(combineQuestion, {
        slots: { leftTerm: "6", rightTerm: "4", result: "10" },
        operator: "+",
      }).isCorrect,
    ).toBe(true);
  });

  it("rejects wrong numeric unknowns and wrong given values", () => {
    const wrongUnknown = evaluateEquationStageResponse(combineQuestion, {
      slots: { leftTerm: "5", rightTerm: "4", result: "10" },
      operator: "+",
    });

    expect(wrongUnknown.isCorrect).toBe(false);
    expect(wrongUnknown.feedback.leftTerm.isCorrect).toBe(false);

    const wrongGiven = evaluateEquationStageResponse(combineQuestion, {
      slots: { leftTerm: "?", rightTerm: "5", result: "10" },
      operator: "+",
    });

    expect(wrongGiven.isCorrect).toBe(false);
    expect(wrongGiven.feedback.rightTerm.isCorrect).toBe(false);
  });

  it("rejects swapped combine parts and marks them as incorrect in feedback", () => {
    const swapQuestion = {
      ...combineQuestion,
      equationSpec: {
        ...combineQuestion.equationSpec,
        template: [
          { type: "slot", key: "leftTerm", value: "6", editable: true },
          { type: "operator", key: "operator", value: "+", editable: true },
          { type: "slot", key: "rightTerm", value: "4", editable: true },
          { type: "symbol", value: "=" },
          { type: "slot", key: "result", value: "?", editable: false },
        ],
      },
      validation: {
        slots: { leftTerm: "6", rightTerm: "4" },
        alternateSlots: { leftTerm: "6", rightTerm: "4", result: "10" },
        operator: "+",
      },
    };

    const result = evaluateEquationStageResponse(swapQuestion, {
      slots: { leftTerm: "4", rightTerm: "6", result: "?" },
      operator: "+",
    });

    expect(result.isCorrect).toBe(false);
    expect(result.feedback.leftTerm.isCorrect).toBe(false);
    expect(result.feedback.rightTerm.isCorrect).toBe(false);
  });

  it("keeps change operator validation with the same unknown-slot rules", () => {
    expect(
      evaluateEquationStageResponse(changeQuestion, {
        slots: { leftTerm: "15", rightTerm: "4", result: "11" },
        operator: "-",
      }).isCorrect,
    ).toBe(true);

    const wrongOperator = evaluateEquationStageResponse(changeQuestion, {
      slots: { leftTerm: "15", rightTerm: "4", result: "11" },
      operator: "+",
    });

    expect(wrongOperator.isCorrect).toBe(false);
    expect(wrongOperator.operatorFeedback.isCorrect).toBe(false);
  });
});

describe("evaluateBarModelStageResponse", () => {
  it("accepts question mark, blank, and calculated unknowns for combine bar models", () => {
    expect(
      evaluateBarModelStageResponse(combineBarQuestion, {
        slots: { total: "10", partA: "?", partB: "4" },
      }).isCorrect,
    ).toBe(true);

    expect(
      evaluateBarModelStageResponse(combineBarQuestion, {
        slots: { total: "10", partB: "4" },
      }).isCorrect,
    ).toBe(true);

    expect(
      evaluateBarModelStageResponse(combineBarQuestion, {
        slots: { total: "10", partA: "6", partB: "4" },
      }).isCorrect,
    ).toBe(true);
  });

  it("rejects wrong numeric unknowns in combine bar models", () => {
    const result = evaluateBarModelStageResponse(combineBarQuestion, {
      slots: { total: "10", partA: "5", partB: "4" },
    });

    expect(result.isCorrect).toBe(false);
    expect(result.feedback.partA.isCorrect).toBe(false);
  });
});

describe("change identification helpers", () => {
  it("routes change identification through the worksheet UI", () => {
    expect(isWorksheetDrivenQuestion(changeIdentificationQuestion)).toBe(true);
  });

  it("creates, readies, and submits the two-step response shape", () => {
    const initial = createInitialResponse(changeIdentificationQuestion);

    expect(initial).toEqual({
      changeDirection: "",
      barModel: "",
      subStep: "2a",
    });
    expect(isQuestionResponseReady(changeIdentificationQuestion, initial)).toBe(false);

    const step2a = { ...initial, changeDirection: "decrease" };
    expect(isQuestionResponseReady(changeIdentificationQuestion, step2a)).toBe(true);

    const step2b = { ...step2a, subStep: "2b", barModel: "decrease_bar" };
    expect(isQuestionResponseReady(changeIdentificationQuestion, step2b)).toBe(true);
    expect(buildSubmissionResponse(changeIdentificationQuestion, step2b)).toEqual({
      changeDirection: "decrease",
      barModel: "decrease_bar",
    });
  });

  it("identifies selected wrong and correct options for feedback styling", () => {
    const feedback = getChangeIdentificationFeedback(changeIdentificationQuestion, {
      changeDirection: "increase",
      barModel: "increase_bar",
      subStep: "2b",
    });

    expect(feedback.selectedDirection).toBe("increase");
    expect(feedback.correctDirection).toBe("decrease");
    expect(feedback.directionCorrect).toBe(false);
    expect(feedback.selectedBarModel).toBe("increase_bar");
    expect(feedback.correctBarModel).toBe("decrease_bar");
    expect(feedback.barModelCorrect).toBe(false);
  });
});

describe("createInitialResponse", () => {
  it("pre-fills locked change operators so validation still submits the expected sign", () => {
    const response = createInitialResponse({
      ...changeQuestion,
      equationSpec: {
        ...changeQuestion.equationSpec,
        operatorEditable: false,
      },
    });

    expect(response.operator).toBe("-");
  });
});
