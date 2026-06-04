// SchemaQuestion.jsx
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  getDisplayedTextAnswer,
  getChangeIdentificationFeedback,
  isCompareAnswerInputQuestion,
  isQuestionResponseReady,
  isVariableIdentificationQuestion,
  isChangeIdentificationQuestion,
  getChangeIdentifyDynamicData,
} from "../../../utils/questionValidation";
import {
  joinSlotValue,
  buildCompareAnswerPrompt,
  // getActiveInputLabel,
  getBarLabel,
  getTrueExpectedValue,
  solveMissingValue,
} from "./SchemaUtils";
import {
  PracticeTabs,
  EquationTabs,
  StageTabs,
  Keypad,
  EquationBoard,
} from "./WorksheetParts";
import { MiniBarModelIcon } from "../../MiniBarModelIcon";
import BarModel, { CompareGuidedAnswerModel } from "./BarModelRenderer";
import CustomSelect from "../../CustomSelect";
import { useSchemaProgress } from "../../../hooks/useSchemaProgress";
import { useSelector } from "react-redux";
import { HelpCircle } from "lucide-react";
// import { LayoutTemplate, Lightbulb } from "lucide-react";

// Deterministic shuffle
const seededShuffle = (array, seed) => {
  const result = [...array];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 11) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const hashString = (str) =>
  (str || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

// ===========================================
// Change Module 2: Two-Step Identification
// Step 2a: Is the quantity increasing or decreasing?
// Step 2b: Pick the correct bar model layout
// ===========================================
const ChangeIdentificationPanel = ({
  question,
  response,
  setResponse,
  disabled,
  hasFeedback,
  feedbackData,
  animate = false,
  userId,
}) => {
  const subStep = response?.subStep || "2a";
  // const labels = question?.visualData?.labels || {};

  const {
    itemNoun: resolvedNoun,
    increaseSubtext: resolvedIncrease,
    decreaseSubtext: resolvedDecrease,
    isUncountable,
  } = getChangeIdentifyDynamicData(
    question?.text,
    question?.visualData?.itemNoun,
    question?.visualData?.increaseSubtext,
    question?.visualData?.decreaseSubtext,
  );

  const cleanActionVerb = (fullSubtext, noun) => {
    if (!fullSubtext) return "";
    let clean = fullSubtext.trim();
    if (noun && clean.toLowerCase().startsWith(noun.toLowerCase())) {
      clean = clean.substring(noun.length).trim();
    }
    if (clean.toLowerCase().startsWith("quantity")) {
      clean = clean.substring(8).trim();
    }
    if (clean.toLowerCase().startsWith("was ")) {
      clean = clean.substring(4).trim();
    } else if (clean.toLowerCase().startsWith("were ")) {
      clean = clean.substring(5).trim();
    }
    return clean;
  };

  const increaseAction =
    cleanActionVerb(resolvedIncrease, resolvedNoun) || "added";
  const decreaseAction =
    cleanActionVerb(resolvedDecrease, resolvedNoun) || "removed";

  const changeFeedback = getChangeIdentificationFeedback(question, response);
  const hasDirectionFeedback =
    hasFeedback &&
    subStep === "2a" &&
    feedbackData?.changeDirectionCorrect !== undefined;
  const hasBarModelFeedback =
    hasFeedback &&
    subStep === "2b" &&
    feedbackData?.barModelCorrect !== undefined;

  // Put this near your other const definitions at the top of the panel
  const [showBarModelHint, setShowBarModelHint] = useState(false);

  useEffect(() => {
    // 🔥 1. Add `animate` to the check: Wait until the unfolding animation triggers!
    if (subStep === "2b" && userId && animate) {
      const storageKey = `hasSeenBarModelHint_${userId}`;
      const hasSeenHint = localStorage.getItem(storageKey);

      if (!hasSeenHint) {
        // 🔥 2. Add a slight delay (e.g., 400ms) so the cards finish unfolding BEFORE the modal pops
        const timer = setTimeout(() => {
          setShowBarModelHint(true);
          localStorage.setItem(storageKey, "true");
        }, 600);

        // Cleanup the timer just in case the user navigates away super fast
        return () => clearTimeout(timer);
      }
    }
  }, [subStep, userId, animate]); // 🔥 3. Make sure `animate` is in this array!

  const handleDirectionSelect = (dir) => {
    if (disabled) return;
    setResponse((prev) => ({
      ...prev,
      changeDirection: dir,
    }));
  };

  const handleBarModelSelect = (model) => {
    if (disabled) return;
    setResponse((prev) => ({
      ...prev,
      barModel: model,
    }));
  };

  const getDirectionClass = (direction) => {
    const isSelected = response?.changeDirection === direction;
    const isActuallyCorrect = changeFeedback?.correctDirection === direction;

    let classes = [];

    // Show standard blue selection before submitting
    if (isSelected && !hasDirectionFeedback) classes.push("is-selected");

    // Once submitted, ONLY style the button the user actually clicked
    if (hasDirectionFeedback && isSelected) {
      if (isActuallyCorrect) {
        classes.push("is-correct");
      } else {
        classes.push("is-wrong");
      }
    }

    return classes.join(" ");
  };
  const getBarModelClass = (model) => {
    const isSelected = response?.barModel === model;
    const isActuallyCorrect = changeFeedback?.correctBarModel === model;

    let classes = [];

    // Show standard blue selection before submitting
    if (isSelected && !hasBarModelFeedback) classes.push("is-selected");

    // Once submitted, ONLY style the button the user actually clicked
    if (hasBarModelFeedback && isSelected) {
      if (isActuallyCorrect) {
        classes.push("is-correct");
      } else {
        classes.push("is-wrong");
      }
    }

    return classes.join(" ");
  };

  return (
    <div className="change-identify">
      {/* Step 2a: Increase or Decrease? */}
      {subStep === "2a" && (
        <div className="change-identify__step">
          {/* <h3 className="change-identify__title">
            {resolvedNoun ? (
              <>
                What happened to the {isUncountable ? "amount of" : "number of"}{" "}
                <strong>{resolvedNoun}</strong> from Start to End?
              </>
            ) : (
              <>
                Is the quantity <strong>increasing</strong> or{" "}
                <strong>decreasing</strong>?
              </>
            )}
          </h3> */}

          <div className="change-identify__title">
            <div className="v-action-tag v-action-tag--step2a">
              Select the Direction of Change
            </div>
            <div className="change-identify__title-icon">
              <HelpCircle size={29} />
            </div>
            <p>
              {resolvedNoun ? (
                <>
                  What happened to the{" "}
                  {isUncountable ? "amount of" : "number of"}{" "}
                  <strong>{resolvedNoun}</strong> from Start to End?
                </>
              ) : (
                <>
                  Is the quantity <strong>increasing</strong> or{" "}
                  <strong>decreasing</strong>?
                </>
              )}
            </p>
          </div>

          {/* Step 2a: Component Style */}
          <div
            className={`change-identify__options ${animate ? "animate-unfold" : ""}`}
          >
            {/* <div className="change-identify__options animate-unfold"> */}
            {/* --- EXPANDING MORPH CARD: INCREASE --- */}
            <button
              type="button"
              className={`change-identify__option expand-card ${getDirectionClass("increase")}`}
              onClick={() => handleDirectionSelect("increase")}
              disabled={disabled}
            >
              {/* 1. Default State: Tactile Circle + Label */}
              <div className="expand-card__container-image">
                <div className="expand-card__circle expand-card__circle--increase">
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
                {/* 🔥 NEW: Default State Label */}
                <span className="expand-card__default-label">Increase</span>
              </div>

              {/* 2. Expanded State: The Card */}
              <div className="expand-card__content">
                <div className="expand-card__detail">
                  <span className="expand-card__title">Increase</span>
                  {resolvedIncrease && (
                    <span className="expand-card__subtext expand-card__subtext__increase">
                      {resolvedIncrease}
                    </span>
                  )}
                </div>
                {/* Popped out Mini Icon */}
                <div className="expand-card__product-image">
                  <div className="expand-card__box-image">
                    <div className="expand-card__circle expand-card__circle--increase">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* --- EXPANDING MORPH CARD: DECREASE --- */}
            <button
              type="button"
              className={`change-identify__option expand-card ${getDirectionClass("decrease")}`}
              onClick={() => handleDirectionSelect("decrease")}
              disabled={disabled}
            >
              {/* 1. Default State: Tactile Circle + Label */}
              <div className="expand-card__container-image">
                <div className="expand-card__circle expand-card__circle--decrease">
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="7" y1="7" x2="17" y2="17"></line>
                    <polyline points="17 7 17 17 7 17"></polyline>
                  </svg>
                </div>
                {/* 🔥 NEW: Default State Label */}
                <span className="expand-card__default-label">Decrease</span>
              </div>

              {/* 2. Expanded State: The Card */}
              <div className="expand-card__content">
                <div className="expand-card__detail">
                  <span className="expand-card__title">Decrease</span>
                  {resolvedDecrease && (
                    <span className="expand-card__subtext expand-card__subtext__decrease">
                      {resolvedDecrease}
                    </span>
                  )}
                </div>
                {/* Popped out Mini Icon */}
                <div className="expand-card__product-image">
                  <div className="expand-card__box-image">
                    <div className="expand-card__circle expand-card__circle--decrease">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="7" y1="7" x2="17" y2="17"></line>
                        <polyline points="17 7 17 17 7 17"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
          {/* 
          {step2aCorrect && (
            <div className="change-identify__feedback change-identify__feedback--correct">
              ✓ Correct! The quantity is{" "}
              <strong>
                {response?.changeDirection === "increase"
                  ? "increasing"
                  : "decreasing"}
              </strong>
              .
            </div>
          )}
          {step2aWrong && (
            <div className="change-identify__feedback change-identify__feedback--wrong">
              ✕ Not quite. The correct answer is{" "}
              <strong>
                {question?.validation?.changeDirection === "increase"
                  ? "Increase"
                  : "Decrease"}
              </strong>
              .
            </div>
          )} */}
        </div>
      )}

      {/* Step 2b: Pick the bar model */}
      {subStep === "2b" && (
        <div className="change-identify__step">
          {/* Type 1 */}
          {/* <div className="change-identify__title">
            <div className="change-identify__title-icon">
              <LayoutTemplate size={22} />
            </div>
            {response?.changeDirection && (
              <div className="change-identify__carry-hint">
                <span className="change-identify__carry-hint__top">
                  You said the {resolvedNoun || "quantity"}{" "}
                  <strong style={{ textTransform: "capitalize" }}>
                    {response.changeDirection === "increase"
                      ? "increased ↗"
                      : "decreased ↘"}
                  </strong>
                </span>
                <span className="change-identify__carry-hint__bottom">
                  Now pick the bar model that shows{" "}
                  <strong>
                    {response.changeDirection === "increase"
                      ? "an increase"
                      : "a decrease"}
                  </strong>
                  .
                </span>
              </div>
            )}
          </div> */}

          {/*Type 2 */}
          <div className="change-identify__title__2b">
            {/* The Floating Absolute Tag */}{" "}
            {response?.changeDirection && (
              <div
                className={`v-action-tag ${
                  response.changeDirection === "increase"
                    ? "v-action-tag--end"
                    : "v-action-tag--start"
                }`}
              >
                {response.changeDirection === "increase" ? (
                  <>
                    Choose the model where <strong>END</strong> is biggest.
                  </>
                ) : (
                  <>
                    Choose the model where <strong>START</strong> is biggest.
                  </>
                )}
                {/* THE RE-OPEN BUTTON (Stays on the page) */}
                {!showBarModelHint && (
                  <button
                    type="button"
                    className="change-identify__hint-reopen"
                    onClick={() => setShowBarModelHint(true)}
                  >
                    <HelpCircle size={16} />
                    {/* How do I choose? */}
                  </button>
                )}
              </div>
            )}
            {/* The Icon */}
            <div className="change-identify__title-icon">
              <MiniBarModelIcon /> {/* Or your LayoutTemplate icon */}
            </div>
            {response?.changeDirection && (
              <div className="change-identify__carry-hint">
                {/* 1. The Ultra-Short Recap */}
                <p className="v-hint-text">
                  You said the {resolvedNoun || "quantity"}{" "}
                  <strong style={{ textTransform: "capitalize" }}>
                    {response.changeDirection === "increase"
                      ? "increased ↗"
                      : "decreased ↘"}
                  </strong>
                  .
                </p>

                {/* 2. The Integrated Visual Bridge Blocks */}
                <div className="change-identify__visual-blocks animate-unfold">
                  {response.changeDirection === "increase" ? (
                    <div className="v-math-row">
                      <div className="v-block v-block--start v-block--small">
                        START
                      </div>
                      <span className="v-operator">+</span>
                      <div className="v-block v-block--change v-block--small">
                        CHANGE
                      </div>
                      <span className="v-operator">=</span>
                      <div className="v-block v-block--end v-block--large v-block--pulse">
                        END
                      </div>
                    </div>
                  ) : (
                    <div className="v-math-row">
                      <div className="v-block v-block--start v-block--large v-block--pulse">
                        START
                      </div>
                      <span className="v-operator">-</span>
                      <div className="v-block v-block--change v-block--small">
                        CHANGE
                      </div>
                      <span className="v-operator">=</span>
                      <div className="v-block v-block--end v-block--small">
                        END
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/*  Modal Hint */}
          {showBarModelHint &&
            createPortal(
              <div
                className="hint-modal-overlay"
                onClick={() => setShowBarModelHint(false)}
              >
                <div
                  className="change-identify__hint"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="hint-header">
                    <strong>
                      How to choose{" "}
                      <h2 className="hint-header__main">bar model</h2>
                    </strong>
                  </div>

                  <div className="hint-text">
                    {/* 🔥 The floating tag now holds the golden rule */}
                    <div className="hint-text-tag">
                      The top bar is always the total.
                    </div>

                    <p className="hint-question">
                      To choose your model, ask yourself:{" "}
                      <em>When did we have the most?</em>
                    </p>

                    <ul className="hint-list">
                      <li className="hint-list__end">
                        If we added things, the{" "}
                        <strong className="hl-end">END</strong> is the biggest.
                      </li>
                      <li className="hint-list__start">
                        If we lost things, the{" "}
                        <strong className="hl-start">START</strong> was the
                        biggest.
                      </li>
                    </ul>
                  </div>

                  <div className="hint-models">
                    {/* Increase model preview */}
                    <div className="hint-model">
                      <div className="static-bar-model static-bar-model--increase hint-bar-model">
                        <div className="static-bar-model__top">
                          <div className="static-bar__block static-bar__block--end hint-bar-block">
                            <span className="static-bar__title hint-bar-title">
                              End (total)
                            </span>
                          </div>
                        </div>
                        <div className="static-bar-model__bottom hint-bar-bottom">
                          <div className="static-bar__block static-bar__block--start hint-bar-block hint-bar-start">
                            <span className="static-bar__title hint-bar-title">
                              Start
                            </span>
                          </div>
                          <div className="static-bar__block static-bar__block--change hint-bar-block hint-bar-change">
                            <span className="static-bar__title hint-bar-title">
                              + Change
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="hint-label increase">Increase</span>
                      <span className="hint-desc">something was added ➕</span>
                    </div>

                    <div
                      className="hint-model"
                      style={{
                        borderRight: "2px dashed #F2CC8F",
                      }}
                    ></div>

                    {/* Decrease model preview */}
                    <div className="hint-model">
                      <div className="static-bar-model static-bar-model--decrease hint-bar-model">
                        <div className="static-bar-model__top">
                          <div className="static-bar__block static-bar__block--start hint-bar-block">
                            <span className="static-bar__title hint-bar-title">
                              Start (total)
                            </span>
                          </div>
                        </div>
                        <div className="static-bar-model__bottom hint-bar-bottom">
                          <div className="static-bar__block static-bar__block--end hint-bar-block hint-bar-end">
                            <span className="static-bar__title hint-bar-title">
                              End
                            </span>
                          </div>
                          <div className="static-bar__block static-bar__block--change hint-bar-block hint-bar-change">
                            <span className="static-bar__title hint-bar-title">
                              − Change
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="hint-label decrease">Decrease</span>
                      <span className="hint-desc">
                        something was removed ➖
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="worksheet-button worksheet-button--primary hint-dismiss-btn"
                    onClick={() => setShowBarModelHint(false)}
                  >
                    Close
                  </button>
                </div>
              </div>,
              document.body,
            )}

          {/* ----------------------------- */}

          {/* <div className="change-identify__bar-options animate-unfold "> */}

          <div
            className={`change-identify__bar-options ${animate ? "animate-unfold" : ""}`}
          >
            {/* --- INCREASE BAR MODEL (WITH WAVES) --- */}
            <button
              type="button"
              className={`change-identify__bar-option wave-card ${getBarModelClass("increase_bar")}`}
              onClick={() => handleBarModelSelect("increase_bar")}
              disabled={disabled}
            >
              {/* The Liquid Waves */}
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>

              {/* The Frosted Glass Content */}
              <div className="wave-card__content">
                <div className="static-bar-model static-bar-model--increase">
                  <div className="static-bar-model__top">
                    <div className="static-bar__block static-bar__block--end">
                      <span className="static-bar__title">End</span>
                      <span className="static-bar__subtext">
                        total {resolvedNoun || "items"}
                      </span>
                    </div>
                  </div>
                  <div className="static-bar-model__bottom">
                    <div className="static-bar__block static-bar__block--start">
                      <span className="static-bar__title">Start</span>
                      <span className="static-bar__subtext">
                        {resolvedNoun || "items"} before
                      </span>
                    </div>
                    <div className="static-bar__block static-bar__block--change">
                      <span className="static-bar__title">Change</span>
                      <span className="static-bar__subtext">
                        {increaseAction} (+)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* --- DECREASE BAR MODEL (WITH WAVES) --- */}
            <button
              type="button"
              className={`change-identify__bar-option wave-card ${getBarModelClass("decrease_bar")}`}
              onClick={() => handleBarModelSelect("decrease_bar")}
              disabled={disabled}
            >
              {/* The Liquid Waves */}
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>

              {/* The Frosted Glass Content */}
              <div className="wave-card__content">
                <div className="static-bar-model static-bar-model--decrease">
                  <div className="static-bar-model__top">
                    <div className="static-bar__block static-bar__block--start">
                      <span className="static-bar__title">Start</span>
                      <span className="static-bar__subtext">
                        total {resolvedNoun || "items"}
                      </span>
                    </div>
                  </div>
                  <div className="static-bar-model__bottom">
                    <div className="static-bar__block static-bar__block--end">
                      <span className="static-bar__title">End</span>
                      <span className="static-bar__subtext">
                        {resolvedNoun || "items"} remaining
                      </span>
                    </div>
                    <div className="static-bar__block static-bar__block--change">
                      <span className="static-bar__title">Change</span>
                      <span className="static-bar__subtext">
                        {decreaseAction} (-)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Feedback Messages */}
          {/* {step2bCorrect && (
            <div className="change-identify__feedback change-identify__feedback--correct">
              ✓ Correct! That is the right bar model.
            </div>
          )}
          {step2bWrong && (
            <div className="change-identify__feedback change-identify__feedback--wrong">
              ✕ Not quite. The correct bar model is the{" "}
              <strong>
                {question?.validation?.correctBarModel === "increase_bar"
                  ? "Increase"
                  : "Decrease"}
              </strong>{" "}
              model.
            </div>
          )} */}
        </div>
      )}
    </div>
  );
};

const VariableIdentificationPanel = ({
  question,
  response,
  setResponse,
  disabled,
  hasFeedback,
  isDummyMode,
  isRevealed,
  animateCards = false,
}) => {
  const sentences = question?.visualData?.sentences || [];
  const variables = question?.visualData?.variables || [];
  const expectedVars = question?.validation?.variables || {};
  const { userInfo } = useSelector((state) => state.auth);
  // const [variableCardsReady, setVariableCardsReady] = useState(false);

  // useEffect(() => {
  //   setVariableCardsReady(false);
  //   const timer = setTimeout(() => setVariableCardsReady(true), 250); // same delay
  //   return () => clearTimeout(timer);
  // }, [question?.id]);

  const { hasCompleted, markCompleted } = useSchemaProgress(
    question?.schemaKind,
    userInfo?.id || userInfo?._id,
  );
  // For change schema: fixed chronological order (start → change → end)
  // For other schemas: seeded shuffle as before
  const shuffledVariables = useMemo(() => {
    if (question?.schemaKind === "change") {
      const order = ["start", "change", "end"];
      const sorted = [...variables].sort(
        (a, b) => order.indexOf(a.key) - order.indexOf(b.key),
      );
      // Only use sorted if all 3 keys matched; else fall through to shuffle
      if (
        sorted.length === variables.length &&
        sorted.every((v, i) => order.indexOf(v.key) === i)
      ) {
        return sorted;
      }
    }
    return seededShuffle(variables, hashString(question?.text));
  }, [variables, question?.text, question?.schemaKind]);

  // 1. GHOST LOGIC: Check if the user has started interacting
  // Returns true if ANY variable has a 'role' or 'value' defined in the response state
  const hasStarted = Object.values(response?.variables || {}).some(
    (v) => v?.role || v?.value,
  );

  // Determine per-card feedback state
  const updateVariable = (key, field, value) => {
    if (disabled && !isDummyMode) return;

    // Only mark as completed on real first interaction, not dummy mode
    if (!hasStarted && !isDummyMode) {
      markCompleted();
    }

    setResponse((current) => ({
      ...(current || {}),
      variables: {
        ...(current?.variables || {}),
        [key]: {
          ...(current?.variables?.[key] || {}),
          [field]: value,
          ...(field === "role" && value === "find" ? { value: "" } : {}),
        },
      },
    }));
  };

  const getCardState = (variable) => {
    const answer = response?.variables?.[variable.key] || {};
    const expected = expectedVars[variable.key];
    if (!expected) return "";

    if (isRevealed) return "is-revealed";

    if (!hasFeedback) return "";

    // Check role correctness
    const isRoleCorrect = answer.role === expected.role;
    // For "given" variables, also check value. For "find", value check isn't strictly necessary here based on your logic, but we ensure it matches the expected condition.
    const isValueCorrect =
      expected.role === "find" ||
      String(answer.value) === String(expected.value);

    if (isRoleCorrect && isValueCorrect) return "is-correct";
    return "is-wrong";
  };

  // Options for the Custom Select Dropdown
  const roleOptions = [
    { value: "given", label: "✓ Given Value" },
    { value: "find", label: "? Unknown Value " },
  ];

  return (
    <div className="variable-identification">
      {/* Sentences at top */}
      <div className="variable-identification__sentences">
        {sentences.map((sentence, index) => (
          <div className="variable-sentence" key={`${index}-${sentence}`}>
            <span>{index + 1}</span>
            <p>{sentence}</p>
          </div>
        ))}
      </div>

      {/* Variable cards */}
      {/* <div className="variable-cards"> */}
      <div className={`variable-cards ${animateCards ? "animate-unfold" : ""}`}>
        {shuffledVariables.map((variable) => {
          const answer = response?.variables?.[variable.key] || {};
          const expected = expectedVars[variable.key];
          const cardState = getCardState(variable);
          // const isCardLocked =
          //   cardState === "is-correct" || cardState === "is-revealed";
          const isCardLocked =
            cardState === "is-correct" ||
            cardState === "is-revealed" ||
            hasFeedback;

          const displayRole = isRevealed ? expected?.role : answer.role;
          const displayValue = isRevealed ? expected?.value : answer.value;

          // 🔥 2. GHOST LOGIC: Apply to ALL cards until the user starts
          const hasStartedForVar = answer.role || answer.value;
          const isGhostHint =
            !hasStartedForVar && !isDummyMode && !hasCompleted;

          // const isGhostHint = !hasStarted && !isDummyMode && !hasCompleted;
          // 🔥 3. DYNAMIC TEXT: Tailor the hint to the specific expected answer
          const ghostRoleText =
            expected?.role === "given"
              ? "e.g: Given Value"
              : "e.g:Unknown Value";

          const ghostValueText =
            expected?.role === "given" ? `e.g., ${expected?.value}` : "?";

          return (
            <div
              className={`variable-row-horizontal ${cardState} ${isGhostHint ? "is-hinted" : ""}`}
              key={variable.key}
            >
              {/* Left Side: Variable Name with Tag --- SIKE */}
              <div className="variable-row-horizontal__name">
                {question?.schemaKind === "change" && (
                  <span
                    className={`variable-tag variable-tag--${variable.key}`}
                  >
                    {variable.key === "start"
                      ? "Start"
                      : variable.key === "change"
                        ? "Change"
                        : "End"}
                  </span>
                )}
                {variable.label}
              </div>

              {/* Right Side: Split Controls */}
              <div className="variable-row-horizontal__controls">
                {/* Control 1: Role Selection */}
                <div className="control-group">
                  <span className="control-label">ROLE</span>
                  <CustomSelect
                    options={roleOptions}
                    value={displayRole || ""}
                    onChange={(val) =>
                      updateVariable(variable.key, "role", val)
                    }
                    placeholder="Select"
                    disabled={isCardLocked}
                    /* 🔥 Pass Ghosting Props */
                    isGhosted={isGhostHint}
                    ghostPlaceholder={isGhostHint ? ghostRoleText : ""}
                  />
                </div>

                {/* Control 2: Value Input or Placeholder
                <div className="control-group">
                  <span className="control-label">VALUE</span>
                  {displayRole === "find" ? (
                    <div className="find-placeholder">?</div>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      // 🔥 Add Ghost Input Class
                      className={`worksheet-input ${isGhostHint && !displayValue ? "ghost-input" : ""}`}
                      value={displayValue || ""}
                      disabled={isCardLocked || displayRole !== "given"}
                      // 🔥 Use dynamic value text for placeholder
                      placeholder={isGhostHint ? ghostValueText : "?"}
                      onChange={(e) =>
                        updateVariable(variable.key, "value", e.target.value)
                      }
                    />
                  )}
                </div> */}
                {/* Control 2: Value Input or Placeholder */}
                <div className="control-group">
                  <span className="control-label">VALUE</span>
                  {displayRole === "find" ? (
                    <div className="find-placeholder">?</div>
                  ) : (
                    <>
                      {isGhostHint && !displayValue ? (
                        // 👇 Ghost mode: contenteditable div with shimmer
                        <div
                          className="worksheet-input ghost-input shimmer-div"
                          contentEditable={
                            !isCardLocked && displayRole === "given"
                          }
                          suppressContentEditableWarning
                          // onBlur={(e) => {
                          //   const newValue = e.currentTarget.innerText.trim();
                          //   if (newValue) {
                          //     updateVariable(variable.key, "value", newValue);
                          //   }
                          // }}
                          onBlur={(e) => {
                            const newValue = e.currentTarget.innerText
                              .replace(/\D/g, "")
                              .trim();
                            if (newValue) {
                              updateVariable(variable.key, "value", newValue);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                          onInput={(e) => {
                            // strip non‑digits immediately
                            e.currentTarget.innerText =
                              e.currentTarget.innerText.replace(/\D/g, "");
                            // move cursor to the end
                            const range = document.createRange();
                            range.selectNodeContents(e.currentTarget);
                            range.collapse(false);
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
                          }}
                        >
                          {ghostValueText}
                        </div>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`worksheet-input ${isGhostHint && !displayValue ? "ghost-input" : ""}`}
                          value={displayValue || ""}
                          disabled={isCardLocked || displayRole !== "given"}
                          placeholder={isGhostHint ? ghostValueText : "?"}
                          // onChange={(e) =>
                          //   updateVariable(
                          //     variable.key,
                          //     "value",
                          //     e.target.value,
                          //   )
                          // }
                          onChange={(e) => {
                            const onlyDigits = e.target.value.replace(
                              /\D/g,
                              "",
                            );
                            updateVariable(variable.key, "value", onlyDigits);
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SchemaQuestion = ({
  question,
  response,
  setResponse,
  feedback,
  onCheck,
  onNext,
  isSubmitting,
  isDummyMode,
  setIsDummyMode,
  isRevealed,
  setIsRevealed,
  stageResults = {},
  autoNextCountdown,
  disableAutoNext = false,
  isExiting = false,
}) => {
  const hasFeedback = Boolean(feedback);
  const isBarModelStage = Boolean(question?.barModelSpec);
  const isEquationStage = ["bar_to_equation", "schema_equation"].includes(
    question?.moduleStage,
  );

  // --- Change Identification: local 2a feedback state ---
  const [changeIdLocalFeedback, setChangeIdLocalFeedback] = useState(null);
  const [changeIdLocalCountdown, setChangeIdLocalCountdown] = useState(null);
  useEffect(() => {
    if (changeIdLocalCountdown === null) return;

    if (changeIdLocalCountdown > 0) {
      const timer = setTimeout(() => {
        setChangeIdLocalCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Time is up! Transition to Step 2b
      setChangeIdLocalCountdown(null);
      setChangeIdLocalFeedback(null);
      setResponse((prev) => ({
        ...prev,
        subStep: "2b",
        barModel: "",
      }));
    }
  }, [changeIdLocalCountdown, setResponse]);

  // ── Auto-advance between stages on correct answer ──
  const isSchemaStage = Number(question?.stageTotal) > 1;
  const [stageNextCountdown, setStageNextCountdown] = useState(null);

  // 1. Trigger the countdown when the answer becomes correct
  useEffect(() => {
    if (!feedback?.isCorrect) {
      setStageNextCountdown(null); // Reset if wrong
      return;
    }
    if (!isSchemaStage) return;
    if (question?.stageIndex >= question?.stageTotal) return; // skip final stage

    setStageNextCountdown(2); // Start the 2-second timer
  }, [
    feedback?.isCorrect,
    question?.stageIndex,
    question?.stageTotal,
    isSchemaStage,
  ]);

  // 2. Handle the 1-second ticks
  useEffect(() => {
    if (stageNextCountdown === null) return;

    if (stageNextCountdown > 0) {
      const timer = setTimeout(() => {
        setStageNextCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Time is up! Move to the next tab
      setStageNextCountdown(null);
      onNext();
    }
  }, [stageNextCountdown, onNext]);

  // -------------------------------------------------------------------------------------------------------
  // Ghost setup for equation board (Module 3)
  const { userInfo } = useSelector((state) => state.auth);
  const userId = userInfo?.id || userInfo?._id;
  // console.log(userInfo); // inspect this
  const keypadWrapperRef = useRef(null);
  const {
    hasCompleted: equationGhostCompleted,
    markCompleted: markEquationGhostCompleted,
  } = useSchemaProgress(
    `equation_${question?.schemaKind}_${userId}`, // ← userId now part of the key
    userId,
  );

  // Identify practice schemas so we can apply the Equation Board rules
  const isPracticeStage = ["practice", "equations"].includes(
    question?.moduleStage,
  );

  const isEquationBoardActive = isEquationStage || isPracticeStage;
  const mathResult = useMemo(() => solveMissingValue(question), [question]);

  // Only apply ghost logic when the equation board is shown
  const isEquationGhostHint =
    isEquationBoardActive &&
    !isDummyMode &&
    !isRevealed &&
    !equationGhostCompleted &&
    !!userInfo;

  const displayQuestion = useMemo(() => {
    if (!isEquationStage) return question;
    // if (!isEquationBoardActive) return question;
    const qClone = JSON.parse(JSON.stringify(question));
    const studentSlots = response?.slots || {};
    const isCorrect = hasFeedback && feedback?.isCorrect;

    const isUnknownSlot = (key) => {
      return getTrueExpectedValue(question, key) === "?";
    };

    if (qClone.equationSpec) {
      if (question?.schemaKind === "change") {
        qClone.equationSpec.operatorEditable = false;
      }
      if (isDummyMode || isRevealed || isCorrect) {
        qClone.equationSpec.operatorEditable = false;
      }
    }

    if (qClone.equationSpec?.template) {
      qClone.equationSpec.template.forEach((item) => {
        // --- 1. OPERATOR LOGIC ---
        if (item?.type === "operator") {
          const isChangeOperator = question?.schemaKind === "change";
          const blueprintOp =
            (question?.equationSpec?.template || []).find(
              (t) => t.type === "operator" || t.key === "operator",
            )?.value || (question?.schemaKind === "combine" ? "+" : "");

          // Sync the value: show the blueprint sign in Reveal
          if (isRevealed) {
            item.value = blueprintOp;
          } else if (response?.operator) {
            item.value = response.operator;
          }

          // LOCKING & FEEDBACK LOGIC
          if (isRevealed) {
            // 🔥 REVEAL: Show default/neutral UI (No green/red borders)
            item.editable = !isChangeOperator;
            item.isCorrect = false;
            item.isWrong = false;
          } else if (isDummyMode && !isCorrect) {
            // DUMMY MODE: Locked hint (neutral look)
            item.editable = false;
            item.isCorrect = false;
            item.isWrong = false;
          } else {
            // MAIN SCREEN / SUCCESS
            item.editable = !isChangeOperator;

            // Show feedback only on Main Screen/Success
            if (hasFeedback) {
              const signIsCorrect =
                response?.operator === blueprintOp || isCorrect;
              item.isCorrect = signIsCorrect;
              item.isWrong = !signIsCorrect;
            }
          }
        }

        // --- 2. SLOT LOGIC (Preserved exactly as is) ---
        if (item?.type === "slot") {
          const isUnknown = isUnknownSlot(item.key);

          if (item.key && studentSlots[item.key] !== undefined) {
            item.value = studentSlots[item.key];
          }

          if (isRevealed) {
            const isFinalAnswerStage =
              question?.moduleStage === "schema_solve" ||
              question?.moduleStage === "schema_direct_solve" ||
              (Number(question?.stageTotal) > 1 &&
                question?.stageIndex === question?.stageTotal) ||
              question?.moduleStage === "direct";

            if (isUnknown) {
              item.value = isFinalAnswerStage ? mathResult || "?" : "?";
            } else {
              item.value = getTrueExpectedValue(question, item.key);
            }
            item.editable = true;
            item.isUnknown = false;
          } else if (isCorrect) {
            if (
              isUnknown &&
              (!item.value || String(item.value).trim() === "")
            ) {
              item.value = "?";
            }
            item.editable = true;
            item.isUnknown = false;
          } else if (isDummyMode) {
            if (isUnknown) {
              item.value = "?";
              item.editable = false;
              item.isUnknown = true;
            } else {
              item.editable = true;
              item.isUnknown = false;
            }
          } else {
            if (
              isUnknown &&
              (!item.value || String(item.value).trim() === "")
            ) {
              item.value = "?";
            } else if (!isUnknown && String(item.value).trim() === "?") {
              item.value = "";
            }
            item.editable = true;
            item.isUnknown = false;
          }
        }
      });
    }
    return qClone;
  }, [
    question,
    // isEquationBoardActive,
    isEquationStage,
    isDummyMode,
    hasFeedback,
    feedback,
    isRevealed,
    mathResult,
    response,
  ]);

  const isBarModelFullyFilled = useMemo(() => {
    if (!isBarModelStage || isEquationStage) return true;

    const spec = question?.barModelSpec;
    const requiredKeys = [];

    if (spec) {
      if (
        question?.schemaKind === "change" ||
        spec.layout === "change" ||
        spec.change
      ) {
        requiredKeys.push((spec.start || spec.left)?.key);
        requiredKeys.push((spec.change || spec.right)?.key);
        requiredKeys.push((spec.end || spec.total || spec.result)?.key);
      } else {
        requiredKeys.push(spec.total?.key);
        requiredKeys.push(spec.left?.key);
        requiredKeys.push(spec.right?.key);
      }
    }

    if (requiredKeys.length === 0) return false;

    const requiredCount = requiredKeys.filter((key) => {
      const correctVal = String(
        question?.validation?.slots?.[key] ?? spec?.[key]?.value ?? "",
      ).trim();
      return correctVal !== "" && correctVal !== "?";
    }).length;

    const enteredCount = requiredKeys.filter((key) => {
      const val = String(response?.slots?.[key] || "").trim();
      return val !== "" && val !== "?";
    }).length;

    return enteredCount >= requiredCount;
  }, [
    isBarModelStage,
    isEquationStage,
    response?.slots,
    question,
    // isDummyMode,
  ]);

  // --- THE STRICT LOCK: Protection for Bar Model Stage ---
  // let isBarModelFullyFilled = true;
  // if (isBarModelStage && !isEquationStage) {
  //   const spec = question?.barModelSpec;
  //   const requiredKeys = [];
  //   if (spec) {
  //     if (question?.schemaKind === "change" || spec.layout === "change") {
  //       requiredKeys.push(
  //         (spec.start || spec.left)?.key,
  //         (spec.change || spec.right)?.key,
  //         (spec.end || spec.total || spec.result)?.key,
  //       );
  //     } else {
  //       requiredKeys.push(spec.total?.key, spec.left?.key, spec.right?.key);
  //     }
  //   }
  //   isBarModelFullyFilled = requiredKeys.every((key) => {
  //     const val = response?.slots?.[key];
  //     return val !== undefined && String(val).trim() !== "";
  //   });
  // }

  // const isEquationFilled = useMemo(() => {
  //   if (!isEquationStage) return true;
  //   const slots = response?.slots || {};
  //   const filledCount = Object.values(slots).filter(
  //     (v) => String(v || "").trim() !== "",
  //   ).length;
  //   return filledCount >= 3;
  // }, [isEquationStage, response?.slots]);

  const isEquationFilled = useMemo(() => {
    // if (!isEquationStage) return true;
    if (!isEquationBoardActive) return true;
    const slots = response?.slots || {};

    // 1. Only look at keys belonging to the CURRENT question template
    const currentKeys = (question?.equationSpec?.template || [])
      .filter((item) => item.type === "slot" && item.key)
      .map((item) => item.key);

    if (currentKeys.length === 0) return false;

    const isFinalAnswerStage =
      question?.moduleStage === "schema_solve" ||
      question?.moduleStage === "schema_direct_solve" ||
      (Number(question?.stageTotal) > 1 &&
        question?.stageIndex === question?.stageTotal) ||
      question?.moduleStage === "direct";

    const opItem = (question?.equationSpec?.template || []).find(
      (i) => i.type === "operator",
    );
    const requiresOperator =
      opItem && opItem.editable !== false && question?.schemaKind !== "combine";

    const hasOperator = !requiresOperator || Boolean(response?.operator);

    if (isPracticeStage) {
      // In practice mode, the known numbers are pre-filled by the system.
      // The user only needs to type into the empty box.
      // If they type a number, it saves to state. If they backspace or clear it, it becomes "".
      const hasAnswered = currentKeys.some((key) => {
        const val = String(slots[key] || "").trim();
        return val !== "" && val !== "?";
      });

      return hasAnswered && hasOperator;
    }

    if (isFinalAnswerStage) {
      return (
        currentKeys.every((key) => {
          const val = String(slots[key] || "").trim();
          return val !== "" && val !== "?";
        }) && hasOperator
      );
    } else {
      const requiredCount = currentKeys.filter((key) => {
        const correctVal = getTrueExpectedValue(question, key);
        return correctVal !== "" && correctVal !== "?";
      }).length;

      const enteredCount = currentKeys.filter((key) => {
        const val = String(slots[key] || "").trim();
        return val !== "" && val !== "?";
      }).length;

      return enteredCount >= requiredCount && hasOperator;
    }
    // 🔥 Make sure isDummyMode is in the dependency array
  }, [
    isEquationBoardActive,
    // isEquationStage,
    isPracticeStage,
    response?.slots,
    response?.operator,
    question,
    // isDummyMode,
  ]);

  // const canCheck =
  //   (isEquationStage
  //     ? isEquationFilled
  //     : isQuestionResponseReady(question, response)) &&
  //   !isSubmitting &&
  //   !hasFeedback;

  const isDirectSchemaSolve = question?.moduleStage === "schema_direct_solve";
  const isSolveStage =
    question?.moduleStage === "schema_solve" || isDirectSchemaSolve;

  const canCheck =
    (isVariableIdentificationQuestion(question)
      ? isQuestionResponseReady(question, response)
      : isEquationBoardActive
        ? isEquationFilled
        : isBarModelStage
          ? isBarModelFullyFilled
          : isQuestionResponseReady(question, response)) &&
    !isSubmitting &&
    !hasFeedback &&
    changeIdLocalCountdown === null; // prevent re-trigger during 2a→2b transition

  const isCompareAnswerInput = isCompareAnswerInputQuestion(question);
  const isVariableIdentification = isVariableIdentificationQuestion(question);
  const isChangeIdentification = isChangeIdentificationQuestion(question);
  const showPromptStrip = !["practice", "equations"].includes(
    question?.moduleStage,
  );
  const [keypadReady, setKeypadReady] = useState(false);

  const locksUnknownSlots = ["word_to_bar", "schema_bar_model"].includes(
    question?.moduleStage,
  );
  const compareAnswerLabel = isCompareAnswerInput
    ? getBarLabel(question?.barModelSpec?.smaller, question?.barModelSpec)
    : "";
  const compareAnswerCopy = buildCompareAnswerPrompt(compareAnswerLabel);

  const showUnknownButton =
    isEquationStage ||
    (!locksUnknownSlots &&
      Object.values(question?.validation?.slots || {}).some(
        (value) => String(value).trim() === "?",
      ));

  const showOperatorPad =
    question?.inputMode === "keypad_equation" &&
    question?.equationSpec?.operatorEditable &&
    response?.activeField === "__operator__" &&
    question?.schemaKind !== "combine" &&
    !isDummyMode;

  // const triggerCheck = () => {
  //   if (!canCheck) return;

  //   // --- Change Identification 2-step intercept ---
  //   if (isChangeIdentification && response?.subStep === "2a") {
  //     const directionCorrect =
  //       response?.changeDirection === question?.validation?.changeDirection;

  //     if (directionCorrect) {
  //       // Correct! Advance to step 2b
  //       setChangeIdLocalFeedback({ step: "2a", correct: true });
  //       setTimeout(() => {
  //         setChangeIdLocalFeedback(null);
  //         setResponse((prev) => ({
  //           ...prev,
  //           subStep: "2b",
  //           barModel: "",
  //         }));
  //       }, 1200);
  //     } else {
  //       // Wrong direction: submit immediately so server feedback can show
  //       // the selected wrong option and the correct option on the same screen.
  //       onCheck();
  //     }
  //     return;
  //   }
  //   onCheck();
  // };
  // --- Change Identification: local 2a feedback state ---
  // 🔥 NEW: Countdown Engine for Step 2a -> 2b transition

  const triggerCheck = () => {
    if (!canCheck) return;

    // --- Change Identification 2-step intercept ---
    if (isChangeIdentification && response?.subStep === "2a") {
      const directionCorrect =
        response?.changeDirection === question?.validation?.changeDirection;

      if (directionCorrect) {
        // Show correct feedback and start 2s countdown
        setChangeIdLocalFeedback({ step: "2a", correct: true });
        setChangeIdLocalCountdown(2);
      } else {
        // Submit immediately on wrong answer
        onCheck();
      }
      return;
    }

    onCheck();
  };
  const isSlotLockedInDummy = (field) => {
    if (!isDummyMode || !isEquationStage || !field) return false;
    const expected = String(question?.validation?.slots?.[field] || "").trim();
    return expected === "?" || expected === "";
  };

  const updateActiveSlotValue = (nextValue) => {
    if (hasFeedback) return;

    if (isEquationGhostHint) {
      markEquationGhostCompleted();
    }

    //  Strict operator validation
    if (response?.activeField === "__operator__") {
      if (nextValue === "+" || nextValue === "-") {
        setResponse((current) => ({ ...(current || {}), operator: nextValue }));
      }
      return; // If it's not a + or -, drop it completely
    }
    if (response?.activeField === "__operator__") {
      setResponse((current) => ({ ...(current || {}), operator: nextValue }));
      return;
    }
    const targetField = response?.activeField;
    if (!targetField || isSlotLockedInDummy(targetField)) return;
    setResponse((current) => ({
      ...(current || {}),
      slots: {
        ...(current?.slots || {}),
        [targetField]: joinSlotValue(current?.slots?.[targetField], nextValue),
      },
    }));
  };

  const handleBackspace = () => {
    if (hasFeedback) return;
    if (
      response?.activeField === "__operator__" &&
      question?.schemaKind === "combine"
    )
      return;
    if (hasFeedback || response?.activeField === "__operator__") return;
    const targetField = response?.activeField;
    if (!targetField || isSlotLockedInDummy(targetField)) return;
    setResponse((current) => ({
      ...(current || {}),
      slots: {
        ...(current?.slots || {}),
        [targetField]: String(current?.slots?.[targetField] || "").slice(0, -1),
      },
    }));
  };

  const handleClear = () => {
    if (hasFeedback) return;
    const targetField = response?.activeField;
    if (!targetField || isSlotLockedInDummy(targetField)) return;
    if (targetField === "__operator__" && question?.schemaKind === "combine")
      return;
    setResponse((current) => {
      if (targetField === "__operator__") return { ...current, operator: "" };
      return { ...current, slots: { ...current?.slots, [targetField]: "" } };
    });
  };

  // 🔥 FIX 4: Push the correct numbers into memory AND clear the active selection
  useEffect(() => {
    if ((hasFeedback && feedback?.isCorrect) || isRevealed) {
      // 🔥 ADD THIS: If they solved the equation successfully, take the training wheels off!
      if (isEquationStage && !isDummyMode) {
        markEquationGhostCompleted();
      }
      const numericResult = solveMissingValue(question);
      const isFinalAnswerStage =
        question?.moduleStage === "schema_solve" ||
        question?.moduleStage === "schema_direct_solve" ||
        (Number(question?.stageTotal) > 1 &&
          question?.stageIndex === question?.stageTotal) ||
        question?.moduleStage === "direct";

      setResponse((prev) => {
        const newSlots = { ...prev.slots };
        let changed = false;

        const templateKeys = (question?.equationSpec?.template || [])
          .filter((item) => item.type === "slot" && item.key)
          .map((item) => item.key);

        templateKeys.forEach((key) => {
          const trueExpected = getTrueExpectedValue(question, key);
          const isTrueUnknown = trueExpected === "?";

          // 1. Inject the math answer if final stage, otherwise keep "?"
          if (isTrueUnknown && numericResult) {
            const desiredUnknownValue = isFinalAnswerStage
              ? numericResult
              : "?";
            if (newSlots[key] !== desiredUnknownValue) {
              newSlots[key] = desiredUnknownValue;
              changed = true;
            }
          }
          // 2. Overwrite student's wrong numbers with correct story numbers
          else if (!isTrueUnknown) {
            if (newSlots[key] !== trueExpected) {
              newSlots[key] = trueExpected;
              changed = true;
            }
          }
        });

        // 🔥 THE FIX: Clear the active field so the dark blue ring disappears, making all boxes identical
        if (prev.activeField !== null) {
          changed = true;
        }

        return changed ? { ...prev, slots: newSlots, activeField: null } : prev;
      });
    }
  }, [hasFeedback, feedback?.isCorrect, isRevealed, question, setResponse]);

  const handleTryAgain = () => {
    setIsDummyMode(true);
    // --- Scenario D: Solve Stage ---
    if (isSolveStage) {
      setResponse((prev) => ({
        ...(prev || {}),
        textAnswer: "",
      }));
      return;
    }

    // --- Scenario A: Equation Stage ---
    if (isEquationStage) {
      const newSlots = {};
      let autoFocusKey = null;

      const templateKeys = (question?.equationSpec?.template || [])
        .filter((item) => item.type === "slot" && item.key)
        .map((item) => item.key);

      templateKeys.forEach((key) => {
        const isTrueUnknown = getTrueExpectedValue(question, key) === "?";

        if (isTrueUnknown) {
          newSlots[key] = "?";
        } else {
          newSlots[key] = "";
          if (!autoFocusKey && key !== "operator") autoFocusKey = key;
        }
      });

      // Find the exact operator (+ or -) from the template blueprint
      const expectedOp =
        (question?.equationSpec?.template || []).find(
          (item) =>
            item.type === "operator" &&
            (item.value === "+" || item.value === "-"),
        )?.value || (question?.schemaKind === "combine" ? "+" : "");

      setResponse((prev) => ({
        ...prev,
        slots: newSlots,
        operator: expectedOp, // Automatically sets the + or - sign!
        activeField: autoFocusKey || "leftTerm",
      }));
      return;
    }

    // --- Scenario C: Variable Identification Stage ---
    if (isVariableIdentification) {
      // In dummy mode for variable ID, clear wrong cards' responses
      // but keep correct ones intact
      const newVars = {};
      const currentVars = response?.variables || {};
      const expected = question?.validation?.variables || {};

      Object.keys(expected).forEach((key) => {
        const submitted = currentVars[key] || {};
        const exp = expected[key];
        const isRoleCorrect = submitted.role === exp.role;
        const isValueCorrect =
          exp.role === "find" || String(submitted.value) === String(exp.value);

        if (isRoleCorrect && isValueCorrect) {
          // Keep correct answers locked
          newVars[key] = { ...submitted };
        } else {
          // Reset wrong answers
          newVars[key] = { role: "", value: "" };
        }
      });

      setResponse((prev) => ({
        ...prev,
        variables: newVars,
      }));
      return;
    }

    // --- Scenario B: Bar Model Stage (RESTORED TO ORIGINAL) ---
    const spec = question?.barModelSpec;
    let autoFocusKey = null;

    if (spec) {
      const keys =
        question?.schemaKind === "change" ||
        spec.layout === "change" ||
        spec.change
          ? [
              (spec.start || spec.left)?.key,
              (spec.change || spec.right)?.key,
              (spec.end || spec.total || spec.result)?.key,
            ]
          : [spec.total?.key, spec.left?.key, spec.right?.key];

      autoFocusKey = keys.find((key) => {
        const expected = String(
          question?.validation?.slots?.[key] ?? spec?.[key]?.value ?? "",
        ).trim();
        return expected !== "?" && expected !== "";
      });
    }

    setResponse((prev) => ({
      ...prev,
      slots: {},
      activeField: autoFocusKey,
    }));
  };

  useEffect(() => {
    if (!question || hasFeedback || isSubmitting) return;
    const isCombine = question?.schemaKind?.toLowerCase() === "combine";
    if (isEquationStage && !isDummyMode) {
      setResponse((current) => {
        const newSlots = { ...current?.slots };
        let changed = false;
        question?.equationSpec?.template?.forEach((item) => {
          if (item?.type === "slot" && item.key && newSlots[item.key] !== "") {
            newSlots[item.key] = "";
            changed = true;
          }
        });
        if (isCombine && current?.operator !== "+") changed = true;
        // if (current?.activeField !== "leftTerm") changed = true;
        if (current?.activeField !== (isEquationGhostHint ? null : "leftTerm"))
          changed = true;
        return changed
          ? {
              ...current,
              slots: newSlots,
              operator: isCombine ? "+" : current?.operator,
              // activeField: "leftTerm",
              activeField: isEquationGhostHint ? null : "leftTerm",
            }
          : current;
      });
    }
    // }, [question?.id, isEquationStage, isDummyMode, isEquationGhostHint]);
  }, [question?.id, isEquationStage, isDummyMode]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. Global Enter key handler for workflow progression
      if (event.key === "Enter") {
        // Skip the 2a→2b local countdown immediately (same transition the timer fires at 0)
        if (changeIdLocalCountdown !== null) {
          event.preventDefault();
          setChangeIdLocalCountdown(null);
          setChangeIdLocalFeedback(null);
          setResponse((prev) => ({ ...prev, subStep: "2b", barModel: "" }));
          return;
        }

        if (canCheck && !isSubmitting) {
          event.preventDefault();
          triggerCheck();
          return;
        }

        const showNext =
          feedback?.isCorrect ||
          isRevealed ||
          (!isBarModelStage &&
            !isVariableIdentification &&
            !isSolveStage &&
            !isPracticeStage &&
            hasFeedback &&
            !feedback?.isCorrect);

        if (showNext && !isSubmitting) {
          event.preventDefault();
          onNext();
          return;
        }

        const showTryAgain =
          hasFeedback &&
          !feedback?.isCorrect &&
          (isBarModelStage ||
            isEquationStage ||
            isVariableIdentification ||
            isSolveStage) &&
          !isDummyMode &&
          !isRevealed;

        if (showTryAgain && !isSubmitting) {
          event.preventDefault();
          handleTryAgain();
          return;
        }

        const showReveal =
          (isDummyMode || isPracticeStage) &&
          hasFeedback &&
          !feedback?.isCorrect &&
          !isRevealed;

        if (showReveal && !isSubmitting) {
          event.preventDefault();
          setIsRevealed(true);
          return;
        }
      }

      const targetTag = event.target?.tagName;
      const isTypingField =
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        event.target?.isContentEditable;

      if (question?.inputMode === "text_answer" || isCompareAnswerInput) {
        // Handled enter above for text inputs
        return;
      }

      if (isTypingField || hasFeedback || isSubmitting) return;
      if (/^\d$/.test(event.key) || event.key === "?") {
        event.preventDefault();
        if (response?.activeField === "__operator__") return; // Drops the keypress completely
        updateActiveSlotValue(event.key);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }
      if (event.key === "Delete") {
        event.preventDefault();
        handleClear();
        return;
      }
      if (
        response?.activeField === "__operator__" &&
        (event.key === "+" || event.key === "-")
      ) {
        event.preventDefault();
        // 🔥 ADD THIS: Kill the hint if they type the operator
        if (isEquationGhostHint) markEquationGhostCompleted();
        setResponse((current) => ({ ...(current || {}), operator: event.key }));
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canCheck,
    hasFeedback,
    isSubmitting,
    question?.inputMode,
    isCompareAnswerInput,
    response,
    setResponse,
    showUnknownButton,
    feedback,
    isRevealed,
    isBarModelStage,
    isVariableIdentification,
    isSolveStage,
    isPracticeStage,
    isDummyMode,
    isEquationStage,
    onNext,
    question,
    setIsRevealed,
    changeIdLocalCountdown,
    setChangeIdLocalCountdown,
    setChangeIdLocalFeedback,
  ]);

  // ------------------------ Conditional Auto-Scroll & Unfold (Module 2-5)------------------------
  useEffect(() => {
    if (hasFeedback) return; // Never scroll or animate after feedback

    setKeypadReady(false); // Reset animation state on new question
    setChangeIdReady(false); //  Reset animation state on new question for Module 2a, 2b

    const initTimer = setTimeout(() => {
      const wrapperEl = keypadWrapperRef.current;
      if (!wrapperEl) {
        setKeypadReady(true);
        return;
      }

      // 1. Calculate if the keypad will fit on the screen
      const rect = wrapperEl.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;

      // We estimate the keypad needs about 300px of space to unfold safely
      const needsScroll = rect.top + 300 > viewportHeight;

      if (needsScroll) {
        // SCROLL NEEDED: Add 200ms delay before scrolling, then wait 650ms to unfold
        setTimeout(() => {
          wrapperEl.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setKeypadReady(true), 300);
        }, 200);
      } else {
        // NO SCROLL NEEDED: Fast unfold after 200ms
        setTimeout(() => setKeypadReady(true), 200);
      }
    }, 50); // Tiny initial delay to let React paint the DOM

    return () => clearTimeout(initTimer);
  }, [question?.id, hasFeedback]);

  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    setShowHint(false);
  }, [question]);

  // ------------------------ Conditional Auto-Scroll & Unfold (Module 1)------------------------
  const [animateCards, setAnimateCards] = useState(false);
  const actionsRef = useRef(null);
  useEffect(() => {
    if (question?.moduleStage !== "schema_variables" || hasFeedback) return;

    setAnimateCards(false); // reset animation

    const initTimer = setTimeout(() => {
      const actionsEl = actionsRef.current;
      if (!actionsEl) {
        setAnimateCards(true);
        return;
      }

      const rect = actionsEl.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const needsScroll = rect.bottom > viewportHeight;

      if (needsScroll) {
        setTimeout(() => {
          actionsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          setTimeout(() => setAnimateCards(true), 300);
        }, 200);
      } else {
        setTimeout(() => setAnimateCards(true), 200);
      }
    }, 50);

    return () => clearTimeout(initTimer);
  }, [question?.id, hasFeedback]);

  // ------------------------ Conditional Auto-Scroll  (Change Module 2a and 2b)------------------------
  const [changeIdReady, setChangeIdReady] = useState(false);
  const changeIdentifyRef = useRef(null);

  useEffect(() => {
    if (!isChangeIdentification || hasFeedback) return;

    setChangeIdReady(false); // reset animation state

    const initTimer = setTimeout(() => {
      const actionsEl = actionsRef.current;
      if (!actionsEl) {
        setChangeIdReady(true);
        return;
      }

      const rect = actionsEl.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const needsScroll = rect.bottom > viewportHeight;

      if (needsScroll) {
        setTimeout(() => {
          actionsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          setTimeout(() => setChangeIdReady(true), 110); // unfold after scroll
        }, 200);
      } else {
        // setTimeout(() => setChangeIdReady(true), 200);
        setChangeIdReady(true);
      }
    }, 50);

    return () => clearTimeout(initTimer);
  }, [question?.id, hasFeedback, isChangeIdentification, response?.subStep]);

  return (
    <div className={`worksheet ${hasFeedback ? "is-completed" : ""}`}>
      <div className="worksheet-utility-bar">
        {/* Left Side: Title & Badge */}
        <div className="worksheet-utility-bar__left">
          <div className="worksheet-title">
            {question?.promptTitle || "practice"}
          </div>
          {question?.schemaKind && (
            <div
              className={`schema-badge schema-badge--${question.schemaKind}`}
            >
              {question.schemaKind} Schema
            </div>
          )}
        </div>
        {/* Right Side: The "Reveal Clue" button */}
        <div className="worksheet-utility-bar__right">
          {(() => {
            const helpText = isCompareAnswerInput
              ? "Use the bars to work out the missing amount, then type your answer."
              : question?.helperText;
            if (!helpText) return null;

            return (
              <button
                type="button"
                className={`worksheet-help ${showHint ? "is-open" : ""}`}
                onClick={() => setShowHint(!showHint)}
              >
                {showHint ? (
                  <span className="hint-text-reveal">{helpText}</span>
                ) : (
                  <span className="sparkle__main">
                    <span className="sparkle">✨</span> How to Play?
                  </span>
                )}
              </button>
            );
          })()}
        </div>
      </div>
      {/* Only render the top line wrapper if there is actually a tab to show inside it */}
      {(question?.moduleStage === "practice" ||
        question?.moduleStage === "equations" ||
        isSchemaStage) && (
        <div className="worksheet__topline">
          <div className="worksheet__topline-main">
            {question?.moduleStage === "practice" && (
              <PracticeTabs activeKey={question?.practiceMode} />
            )}
            {question?.moduleStage === "equations" && (
              <EquationTabs activeKey={question?.practiceMode} />
            )}
            {isSchemaStage && (
              <StageTabs
                currentStage={question?.stageIndex || 1}
                stageResults={stageResults}
                stageTotal={question?.stageTotal || 3}
              />
            )}
          </div>
        </div>
      )}

      {showPromptStrip && (
        <div className="worksheet-prompt">
          {"Q,"} {question?.text}
        </div>
      )}

      {/* MODULE 3: EQUATION BUILDING */}
      {(question?.moduleStage === "practice" ||
        question?.moduleStage === "equations" ||
        question?.moduleStage === "bar_to_equation" ||
        question?.moduleStage === "schema_equation") && (
        <>
          {(question?.moduleStage === "bar_to_equation" ||
            question?.moduleStage === "schema_equation") &&
            question?.barModelSpec && (
              <BarModel
                question={question}
                response={response}
                setResponse={setResponse}
                isAttempted={Boolean(feedback)}
                isCorrect={feedback?.isCorrect}
                targetField={response?.activeField}
                isDummyMode={isDummyMode}
                isRevealed={isRevealed}
                isReadOnly={isEquationStage}
              />
            )}
          <div className={isRevealed ? "is-revealed-board" : ""}>
            <EquationBoard
              question={displayQuestion}
              response={response}
              setResponse={setResponse}
              locked={hasFeedback}
              feedback={isRevealed ? null : feedback}
              isGhostHint={isEquationGhostHint} // add
              markCompleted={markEquationGhostCompleted} // add
            />
          </div>
        </>
      )}

      {/* MODULE 2: BAR MODEL BUILDING */}
      {(question?.moduleStage === "schema_bar_model" ||
        question?.moduleStage === "word_to_bar") &&
        (isCompareAnswerInput ? (
          <>
            <CompareGuidedAnswerModel question={question} />
            <label className="worksheet-answer-field worksheet-answer-field--guided">
              <span>{compareAnswerCopy.prompt}</span>
              <input
                type="text"
                inputMode="numeric"
                value={getDisplayedTextAnswer(response)}
                onChange={(event) =>
                  !hasFeedback &&
                  setResponse((current) => ({
                    ...(current || {}),
                    textAnswer: event.target.value,
                  }))
                }
                disabled={hasFeedback || isSubmitting}
                placeholder={compareAnswerCopy.placeholder}
              />
            </label>
          </>
        ) : (
          <BarModel
            question={question}
            response={response}
            setResponse={setResponse}
            isAttempted={Boolean(feedback)}
            isCorrect={feedback?.isCorrect}
            targetField={response?.activeField}
            isDummyMode={isDummyMode}
            isRevealed={isRevealed}
            isReadOnly={false}
          />
        ))}

      {isVariableIdentification && (
        <VariableIdentificationPanel
          question={question}
          response={response}
          setResponse={setResponse}
          disabled={hasFeedback || isSubmitting}
          hasFeedback={hasFeedback}
          isDummyMode={isDummyMode}
          isRevealed={isRevealed}
          animateCards={animateCards}
        />
      )}

      {isChangeIdentification && (
        <div ref={changeIdentifyRef}>
          <ChangeIdentificationPanel
            question={question}
            response={response}
            setResponse={setResponse}
            disabled={
              hasFeedback || isSubmitting || changeIdLocalFeedback !== null
            }
            hasFeedback={hasFeedback || changeIdLocalFeedback !== null}
            feedbackData={{
              changeDirectionCorrect:
                changeIdLocalFeedback?.step === "2a"
                  ? changeIdLocalFeedback.correct
                  : hasFeedback
                    ? response?.changeDirection ===
                      question?.validation?.changeDirection
                    : undefined,
              barModelCorrect: hasFeedback
                ? response?.barModel === question?.validation?.correctBarModel
                : undefined,
            }}
            animate={changeIdReady}
            userId={userId}
          />
        </div>
      )}

      {(question?.moduleStage === "schema_solve" || isDirectSchemaSolve) && (
        <div className="worksheet-solve">
          {(question?.validation?.displayEquation ||
            question?.equationSpec?.displayEquation) && (
            <div
              className={`worksheet-solve__equation ${hasFeedback ? (feedback?.isCorrect ? "is-correct" : "is-wrong") : ""}`}
            >
              {question?.validation?.displayEquation ||
                question?.equationSpec?.displayEquation}
            </div>
          )}

          {/* <label
            className={`worksheet-answer-field ${hasFeedback ? (feedback?.isCorrect ? "is-correct" : "is-wrong") : ""}`}
          >
            <input
              type="number"
              inputMode="numeric"
              value={getDisplayedTextAnswer(response) || ""}
              onChange={(event) =>
                !hasFeedback &&
                !isSubmitting &&
                setResponse((current) => ({
                  ...(current || {}),
                  textAnswer: event.target.value,
                }))
              }
              disabled={hasFeedback || isSubmitting}
              placeholder="Type Here"
            />
          </label> */}
          <label
            // 🔥 FIX: Added '|| isRevealed' so the box turns green
            className={`worksheet-answer-field ${hasFeedback ? (feedback?.isCorrect || isRevealed ? "is-correct" : "is-wrong") : ""}`}
          >
            <input
              type="text"
              inputMode="numeric"
              value={
                isRevealed
                  ? mathResult ||
                    feedback?.correctAnswer ||
                    feedback?.expected ||
                    question?.answer ||
                    question?.correctAnswer ||
                    question?.validation?.answer ||
                    ""
                  : getDisplayedTextAnswer(response) || ""
              }
              onChange={(event) => {
                if (!hasFeedback && !isSubmitting) {
                  // Only digits and "?" are allowed
                  const filtered = event.target.value.replace(/[^\d?]/g, "");
                  setResponse((current) => ({
                    ...(current || {}),
                    textAnswer: filtered,
                  }));
                }
              }}
              disabled={hasFeedback || isSubmitting}
              placeholder="Type Here"
            />
          </label>
          <div
            key={question?.id || question?.text}
            ref={keypadWrapperRef}
            // className={`keypad-animator ${hasFeedback ? "is-hidden" : ""}`}
            className={`keypad-animator ${hasFeedback ? "is-hidden" : ""} ${keypadReady ? "animate-unfold" : ""}`}
          >
            <Keypad
              title="Enter your answer."
              showUnknown={false}
              showOperatorPad={false}
              disabled={hasFeedback || isSubmitting}
              // onDigit={(digit) => {
              //   if (!hasFeedback) {
              //     setResponse((current) => ({
              //       ...(current || {}),
              //       textAnswer: (current?.textAnswer || "") + digit,
              //     }));
              //   }
              // }}
              onDigit={(digit) => {
                if (!hasFeedback) {
                  // Append digit or "?" — both are valid inputs
                  setResponse((current) => ({
                    ...(current || {}),
                    textAnswer: (current?.textAnswer || "") + digit,
                  }));
                }
              }}
              onBackspace={() => {
                if (!hasFeedback) {
                  setResponse((current) => ({
                    ...(current || {}),
                    textAnswer: (current?.textAnswer || "").slice(0, -1),
                  }));
                }
              }}
              onClear={() => {
                if (!hasFeedback) {
                  setResponse((current) => ({
                    ...(current || {}),
                    textAnswer: "",
                  }));
                }
              }}
            />
          </div>
        </div>
      )}

      {question?.inputMode !== "text_answer" &&
        !isCompareAnswerInput &&
        !isChangeIdentification && (
          <div
            ref={keypadWrapperRef}
            key={question?.id || question?.text}
            // className={`keypad-animator ${hasFeedback ? "is-hidden" : ""}`}
            className={`keypad-animator ${hasFeedback ? "is-hidden" : ""} ${keypadReady ? "animate-unfold" : ""}`}
          >
            <Keypad
              title={
                showOperatorPad ? "Choose the operator" : "Enter the number"
              }
              showUnknown={showUnknownButton}
              showOperatorPad={showOperatorPad}
              onDigit={updateActiveSlotValue}
              onUnknown={() => updateActiveSlotValue("?")}
              onBackspace={handleBackspace}
              onClear={handleClear}
              onOperator={(operator) => {
                if (isEquationGhostHint) markEquationGhostCompleted();
                setResponse((current) => ({ ...(current || {}), operator }));
              }}
              disabled={hasFeedback || isSubmitting}
            />
          </div>
        )}

      <div className="worksheet-actions" ref={actionsRef}>
        {/* 1. Standard SUBMIT button (Hides during the transition) */}
        {!hasFeedback && !isDummyMode && changeIdLocalFeedback === null && (
          <button
            type="button"
            className="worksheet-button worksheet-button--primary"
            onClick={triggerCheck}
            disabled={!canCheck || isSubmitting}
          >
            SUBMIT ✓
          </button>
        )}
        {/* 2.  Disabled "Next Step" button for Change 2a*/}
        {changeIdLocalFeedback?.step === "2a" &&
          changeIdLocalFeedback?.correct && (
            <button
              type="button"
              className="worksheet-button worksheet-button--continue"
              disabled={true}
              style={{ opacity: 0.7, cursor: "wait" }}
            >
              {changeIdLocalCountdown !== null && changeIdLocalCountdown > 0
                ? `Next Step in ${changeIdLocalCountdown}s`
                : "Loading..."}
            </button>
          )}

        {hasFeedback &&
          !feedback?.isCorrect &&
          (isBarModelStage ||
            isEquationStage ||
            isVariableIdentification ||
            isSolveStage) &&
          !isChangeIdentification &&
          !isDummyMode &&
          !isRevealed && (
            <button
              type="button"
              className="worksheet-button worksheet-button--primary"
              onClick={handleTryAgain}
            >
              Try Again
            </button>
          )}

        {isDummyMode && !hasFeedback && (
          <button
            type="button"
            className="worksheet-button worksheet-button--primary"
            onClick={() => {
              triggerCheck();
            }}
            disabled={!canCheck || isSubmitting}
          >
            {isVariableIdentification
              ? "SUBMIT ✓"
              : isEquationStage
                ? "SUBMIT ✓"
                : "SUBMIT ✓"}
          </button>
        )}

        {/* {isDummyMode && hasFeedback && !feedback?.isCorrect && !isRevealed && (
          <button
            type="button"
            className="worksheet-button worksheet-button--primary"
            onClick={() => setIsRevealed(true)}
          >
            Reveal Answers
          </button>
        )} */}

        {/* 4. REVEAL BUTTON: For variable identification, only show on 2nd failure (isDummyMode + hasFeedback + wrong) */}
        {/* For other stages: show when isDummyMode or solve/practice stage fails */}
        {(isDummyMode || isPracticeStage) &&
          hasFeedback &&
          !feedback?.isCorrect &&
          !isRevealed &&
          !isChangeIdentification && (
            <button
              type="button"
              className="worksheet-button worksheet-button--reveal"
              onClick={() => setIsRevealed(true)}
            >
              Reveal Answer
            </button>
          )}

        {/* 5. NEXT PROBLEM: Show after correct answer OR after reveal */}
        {/* For variable identification: only after correct or revealed (never on wrong without reveal) */}
        {/* {(feedback?.isCorrect ||
          isRevealed ||
          (!isBarModelStage &&
            !isVariableIdentification &&
            !isSolveStage &&
            !isPracticeStage &&
            hasFeedback &&
            !feedback?.isCorrect)) && (
          <button
            type="button"
            className="worksheet-button worksheet-button--continue"
            onClick={onNext}
          >
            {isSchemaStage && question?.stageIndex < question?.stageTotal
              ? "Next Step →"
              : "Next Problem →"}
          </button>
        )} */}
        {(feedback?.isCorrect ||
          isRevealed ||
          (!isBarModelStage &&
            !isVariableIdentification &&
            !isSolveStage &&
            !isPracticeStage &&
            hasFeedback &&
            !feedback?.isCorrect)) && (
          // <button
          //   type="button"
          //   // className="worksheet-button worksheet-button worksheet-button--primary"
          //   className="worksheet-button worksheet-button--continue "
          //   onClick={onNext}
          //   disabled={
          //     autoNextCountdown !== null || disableAutoNext || isExiting
          //   }
          // >
          //   {autoNextCountdown !== null
          //     ? `Next Problem in ${autoNextCountdown}s`
          //     : isExiting
          //       ? "Loading…"
          //       : isSchemaStage && question?.stageIndex < question?.stageTotal
          //         ? "Next Step →"
          //         : "Next Problem →"}
          // </button>
          <button
            type="button"
            className="worksheet-button worksheet-button--continue"
            onClick={onNext}
            disabled={
              autoNextCountdown !== null ||
              stageNextCountdown !== null ||
              // disableAutoNext ||
              isExiting
            }
          >
            {/* The hidden left arrow that slides in */}
            <svg
              viewBox="0 0 24 24"
              className="arr-2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>

            {/* The Text */}
            {/* <span className="text">
              {autoNextCountdown !== null
                ? `Next Problem in ${autoNextCountdown}s`
                : isExiting
                  ? "Loading…"
                  : isSchemaStage && question?.stageIndex < question?.stageTotal
                    ? "Next Step"
                    : "Next Problem"}
            </span> */}
            <span className="text">
              {autoNextCountdown !== null
                ? `Next Problem in ${autoNextCountdown}s`
                : stageNextCountdown !== null
                  ? `Next Stage in ${stageNextCountdown}s` /* Shows the internal tab countdown */
                  : isExiting
                    ? "Loading…"
                    : isSchemaStage &&
                        question?.stageIndex < question?.stageTotal
                      ? "Next Step"
                      : "Next Problem"}
            </span>

            {/* The expanding Uiverse circle */}
            <span className="circle"></span>

            {/* The visible right arrow that slides out */}
            <svg
              viewBox="0 0 24 24"
              className="arr-1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SchemaQuestion;
