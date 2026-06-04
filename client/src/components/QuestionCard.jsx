// QuestionCard.jsx
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";

import "../sass/components/questionCard.scss";
import "../sass/components/question_type/conceptualQuestion.scss";
import "../sass/components/question_type/visualBarModel.scss";
import "../sass/components/question_type/matchTheFollowing.scss";
import "../sass/components/question_type/directInputQuestion.scss";
import "../sass/components/question_type/schemaQuestion.scss";

import GhostPanel from "./GhostPanel.jsx";
import ConceptualQuestion from "./Question_Type/Phase1/ConceptualQuestion";
import VisualBarModel from "./Question_Type/Phase1/VisualBarModel";
import MatchTheFollowing from "./Question_Type/Phase1/MatchTheFollowing";
import DirectInputQuestion from "./Question_Type/Phase1/DirectInputQuestion";
import SchemaQuestion from "./Question_Type/Phase2/SchemaQuestion.jsx";
import {
  buildSubmissionResponse,
  createInitialResponse,
  evaluateBarModelStageResponse,
  evaluateEquationStageResponse,
  isQuestionResponseReady,
  isWorksheetDrivenQuestion,
} from "../utils/questionValidation";

// const audioSuccess = new Audio("/success1.mp3");
// const audioFailure = new Audio("/failure.mp3");
// const NEXT_PROBLEM_DELAY_MS = 1800;

const QuestionCard = ({
  problem,
  onSubmit,
  failedAnyStage,
  setFailedAnyStage,
  stageResults,
  setStageResults,
  onNext,
  disabled,
  // practiceSummary = { correct: 0, attempted: 0 },
  pendingResult,
  setPendingResult,
  statAnim,
  disableAutoNext = false,
  hasPendingMastery = false,
}) => {
  const [answer, setAnswer] = useState(() =>
    createInitialResponse(problem?.question),
  );
  const [feedback, setFeedback] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // Dummy Practice for Bar Modal
  const [isDummyMode, setIsDummyMode] = useState(false);
  const [failedFirstTry, setFailedFirstTry] = useState(false);

  // NEW: Holds our animation state safely
  // const [statAnim, setStatAnim] = useState({ key: 0, colorClass: "" });
  const [isRevealed, setIsRevealed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Module 4 single question counter
  // const [pendingResult, setPendingResult] = useState(null); // 'correct' | 'wrong' | null
  // const [failedAnyStage, setFailedAnyStage] = useState(false);
  const isSchemaStage = Number(problem?.question?.stageTotal) > 1;
  const isFinalStage =
    !isSchemaStage ||
    problem?.question?.stageIndex === problem?.question?.stageTotal;

  // The Master Switch.
  // Forces the parent's global timer to abort on the final tab of a multi-step problem!
  const shouldDisableAutoNext =
    disableAutoNext || (isSchemaStage && isFinalStage);

  // 1. When a new question loads, completely reset everything (including the animation)
  useEffect(() => {
    setAnswer(createInitialResponse(problem?.question));
    setFeedback(null);
    setIsSuccess(false);
    setIsError(false);
    setSelectedOption(null);
    // setStatAnim({ key: 0, colorClass: "" }); // Ensures no popping on question load!
    setIsDummyMode(false);
    setFailedFirstTry(false);
    setIsRevealed(false);
    // setPendingResult(null);
    // setFailedAnyStage(false);
    // setStageResults({});
    setIsExiting(false);
    setShowLoadingMsg(false);
  }, [problem]);

  useEffect(() => {
    if (pendingResult === "correct") {
      fireWinCelebration();
    }
  }, [pendingResult]);

  useEffect(() => {
    if (isDummyMode) {
      setFeedback(null);
      setIsError(false);
    }
  }, [isDummyMode]);

  //  ------------------------------ Automatically goes to next question ----------------------
  // --- AUTO-ADVANCE COUNTDOWN LOGIC ---
  const [autoNextCountdown, setAutoNextCountdown] = useState(null);
  const [showLoadingMsg, setShowLoadingMsg] = useState(false);

  // useEffect(() => {
  //   if (disableAutoNext) {
  //     setAutoNextCountdown(null);
  //   }
  // }, [disableAutoNext]);

  useEffect(() => {
    if (shouldDisableAutoNext) {
      setAutoNextCountdown(null);
    }
  }, [shouldDisableAutoNext]);

  // ------------------------ Smart Auto-Scroll for Module 1 ------------------------
  useEffect(() => {
    if (autoNextCountdown === null) return;

    if (autoNextCountdown === 0) {
      setIsExiting(true);
      setAutoNextCountdown(null); // prevent the timer from firing again
      setTimeout(() => {
        setShowLoadingMsg(true);
        setPendingResult(null); // clear the “+1” popup
        onNext(); // trigger the parent to fetch the next problem
      }, 350); // match the CSS animation duration
      return;
    }

    const timer = setTimeout(() => {
      setAutoNextCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoNextCountdown, onNext, setPendingResult]);
  // const playSuccessSound = () => {
  //   audioSuccess.currentTime = 0;
  //   audioSuccess.play().catch(() => {});
  // };

  // const playErrorSound = () => {
  //   audioFailure.currentTime = 0;
  //   audioFailure.play().catch(() => {});
  // };

  const applyFeedback = (result) => {
    setFeedback(result);
    setIsSuccess(Boolean(result?.isCorrect));
    setIsError(Boolean(result) && !result.isCorrect);
    if (!result?.isCorrect) setFailedAnyStage(true);

    // 🔥 FLIP THE SWITCH: If any stage gets a wrong answer, mark the sequence as flawed
    if (!result?.isCorrect) {
      setFailedAnyStage(true);
    }

    // if (result?.isCorrect) {
    //   playSuccessSound();
    // } else {
    //   playErrorSound();
    // }
  };

  const handleNext = async () => {
    // 1. 🔥 START THE EXIT ANIMATION
    setIsExiting(true);

    // 2. Kill the popup and countdown immediately
    setPendingResult(null);
    setAutoNextCountdown(null);

    // 3. Wait for the CSS fade out (350ms), then fetch the next question
    setTimeout(() => {
      setShowLoadingMsg(true);
      onNext();
    }, 350);

    if (!isSchemaStage) {
      setFailedAnyStage(false);
    }
  };

  // 🛑 IMPORTANT: We deleted the manual state wipes here!
  // Wiping them here before the network responds is what caused the flicker.
  // We will let the useEffect handle wiping them when the new problem actually arrives.
  const submitStructuredResponse = async () => {
    if (!problem?.question || disabled) return;

    const responseToSubmit = buildSubmissionResponse(problem.question, answer);
    const isEquationStage = ["bar_to_equation", "schema_equation"].includes(
      problem.question.moduleStage,
    );
    const isSolveStage = ["schema_solve", "schema_direct_solve"].includes(
      problem.question.moduleStage,
    );

    const isBarModelStage = Boolean(problem.question.barModelSpec);

    if (
      !isEquationStage &&
      !isBarModelStage &&
      !isQuestionResponseReady(problem.question, answer)
    )
      return;

    // ====================================================
    // 🔥 1. DUMMY MODE GRADER (Practice Mode)
    // ====================================================
    if (isDummyMode) {
      let isDummyCorrect = true;
      const detailedFeedback = { isCorrect: true, slots: {} };

      if (isSolveStage) {
        const expectedAnswers = problem.question.validation
          ?.acceptableAnswers || [problem.question.correctAnswer];
        const submittedAnswer = String(answer?.textAnswer || "").trim();
        isDummyCorrect = expectedAnswers.some(
          (expected) =>
            String(expected ?? "")
              .trim()
              .toLowerCase() === submittedAnswer.toLowerCase(),
        );
        setFeedback({ isCorrect: isDummyCorrect });
      } else if (problem.question.moduleStage === "schema_variables") {
        const expected = problem.question.validation?.variables || {};
        const studentVars = answer?.variables || {};

        Object.keys(expected).forEach((key) => {
          const student = studentVars[key] || {};
          const exp = expected[key];
          const isRoleCorrect = student.role === exp.role;
          const isValueCorrect =
            exp.role === "find" || String(student.value) === String(exp.value);

          if (!isRoleCorrect || !isValueCorrect) {
            isDummyCorrect = false;
          }
        });
        setFeedback({ isCorrect: isDummyCorrect });
      } else if (isEquationStage) {
        const result = evaluateEquationStageResponse(problem.question, answer);
        isDummyCorrect = result.isCorrect;
        detailedFeedback.isCorrect = result.isCorrect;
        detailedFeedback.slots = result.feedback;
        if (result.operatorFeedback) {
          detailedFeedback.operator = result.operatorFeedback;
        }
        setFeedback(detailedFeedback);
      } else {
        // Module 2 Practice Grading
        const result = evaluateBarModelStageResponse(problem.question, answer);
        isDummyCorrect = result.isCorrect;
        setFeedback({ isCorrect: isDummyCorrect, slots: result.feedback });
      }

      // setIsSuccess(isDummyCorrect);
      // setIsError(!isDummyCorrect);
      // Only on real first submit, never on retry
      // if (isFinalStage && !isDummyMode) {
      //   setPendingResult(result?.isCorrect ? "correct" : "wrong");
      // }

      setIsSuccess(isDummyCorrect && isFinalStage);
      if (
        isDummyCorrect &&
        isFinalStage &&
        !shouldDisableAutoNext &&
        !disableAutoNext &&
        !hasPendingMastery
      ) {
        setAutoNextCountdown(3);
      }
      setIsError(!isDummyCorrect && isFinalStage);
      // if (isSchemaStage)
      //   setStageResults((prev) => ({
      //     ...prev,
      //     [problem?.question?.stageIndex]: isDummyCorrect ? "correct" : "wrong",
      //   })); // ← ADD

      return;
    }

    // ====================================================
    // 🔥 2. MAIN SCREEN GRADER (Equation Stages)
    // ====================================================
    if (isEquationStage) {
      const expectedSlots = problem.question.validation?.slots || {};
      const result = evaluateEquationStageResponse(problem.question, answer);
      const isLocalCorrect = result.isCorrect;
      const detailedFeedback = {
        isCorrect: result.isCorrect,
        slots: result.feedback,
      };

      if (result.operatorFeedback) {
        detailedFeedback.operator = result.operatorFeedback;
      }

      setFeedback(detailedFeedback);
      setIsSuccess(isLocalCorrect);
      setIsError(!isLocalCorrect);
      if (isSchemaStage)
        setStageResults((prev) => ({
          ...prev,
          [problem?.question?.stageIndex]: isLocalCorrect ? "correct" : "wrong",
        })); // ← ADD
      if (isFinalStage && !isDummyMode)
        // setPendingResult(isLocalCorrect ? "correct" : "wrong");
        setPendingResult(
          isLocalCorrect && !failedAnyStage ? "correct" : "wrong",
        );

      if (
        isLocalCorrect &&
        isFinalStage &&
        !isDummyMode &&
        // !disableAutoNext &&
        !shouldDisableAutoNext &&
        !failedAnyStage &&
        !hasPendingMastery
      ) {
        setAutoNextCountdown(3);
      }

      if (!isLocalCorrect) setFailedFirstTry(true);

      try {
        if (isLocalCorrect) {
          responseToSubmit.slots = { ...result.canonicalSlots };
          const expectedOp =
            problem.question.validation?.operator ||
            problem.question.equationSpec?.operator ||
            problem.question.operator;
          if (expectedOp) responseToSubmit.operator = expectedOp;
        } else {
          responseToSubmit.slots = { ...expectedSlots };
          const givenBoxKey = Object.keys(expectedSlots).find(
            (k) =>
              String(expectedSlots[k]).trim() !== "?" &&
              String(expectedSlots[k]).trim() !== "",
          );
          if (givenBoxKey)
            responseToSubmit.slots[givenBoxKey] = "FORCED_FAIL_BY_FRONTEND";
        }
        const serverResult = await onSubmit(responseToSubmit);
        if (serverResult?.isCorrect === isLocalCorrect) {
          applyFeedback({ ...serverResult, ...detailedFeedback });
        } else {
          applyFeedback(serverResult);
        }
      } catch (e) {
        if (e?.status === 409) handleNext();
      }
      return;
    }

    // ====================================================
    // 🔥 3. MODULE 2 MAIN SCREEN SABOTAGE (The Emma Fix)
    // ====================================================
    if (isBarModelStage && !isEquationStage) {
      const result = evaluateBarModelStageResponse(problem.question, answer);
      const isModelPerfect = result.isCorrect;

      if (!isModelPerfect) {
        // console.log("BAR MODEL WRONG", {
        //   stageIndex: problem?.question?.stageIndex,
        //   isSchemaStage,
        //   stageResults,
        // });
        setFailedFirstTry(true);
        setIsError(true);
        setFeedback({ isCorrect: false, slots: result.feedback });
        setFailedAnyStage(true); // module 4 (fire confetti only if all 3 stages are correct)
        if (isSchemaStage)
          setStageResults((prev) => ({
            ...prev,
            [problem?.question?.stageIndex]: "wrong",
          }));
        if (isFinalStage && !isDummyMode) setPendingResult("wrong"); // Module 2, 3 → isFinalStage = true → now also updates immediately (COUNTER)

        try {
          if (responseToSubmit.slots) {
            const givenBoxKey = Object.keys(
              problem.question.validation?.slots || {},
            ).find((key) => {
              const value = String(
                problem.question.validation.slots[key],
              ).trim();
              return value !== "?" && value !== "";
            });
            if (givenBoxKey)
              responseToSubmit.slots[givenBoxKey] = "FORCED_FAIL_BY_FRONTEND";
          }
          await onSubmit(responseToSubmit);
        } catch (e) {
          if (e?.status === 409) handleNext();
        }
        return;
      }

      responseToSubmit.slots = { ...result.canonicalSlots };
    }

    // --- STANDARD FALLBACK SUBMIT ---
    try {
      const result = await onSubmit(responseToSubmit);
      applyFeedback(result);
      if (isSchemaStage) {
        setStageResults((prev) => ({
          ...prev,
          [problem?.question?.stageIndex]: result?.isCorrect
            ? "correct"
            : "wrong",
        }));
        if (!result?.isCorrect) {
          setFailedAnyStage(true);
        }
      }
      if (isFinalStage && !isDummyMode)
        // setPendingResult(result?.isCorrect ? "correct" : "wrong"); // ← ADD HERE
        // 🔥 THE FIX: Only mark the whole sequence as a success if
        // they got this stage right AND haven't failed any prior stages!
        setPendingResult(
          result?.isCorrect && !failedAnyStage ? "correct" : "wrong",
        );
      if (
        result?.isCorrect &&
        !failedAnyStage &&
        isFinalStage &&
        !isDummyMode &&
        // !disableAutoNext &&
        !shouldDisableAutoNext &&
        !hasPendingMastery
      ) {
        setAutoNextCountdown(3);
      }

      if (!result.isCorrect && isBarModelStage && !isDummyMode)
        setFailedFirstTry(true);
    } catch (error) {
      if (error?.status === 409) handleNext();
    }
  };

  const handleOptionClick = async (option) => {
    if (isSuccess || isError) return;
    setSelectedOption(option);

    const rawCorrect = problem?.question?.correctAnswer || problem?.answer;
    if (rawCorrect === undefined || rawCorrect === null) {
      onSubmit(option);
      return;
    }

    const isCorrect = String(option).trim() === String(rawCorrect).trim();

    if (isCorrect) {
      setIsSuccess(true);
      // playSuccessSound();
      setTimeout(() => onSubmit(option), 3000);
    } else {
      setIsError(true);
      // playErrorSound();
      setTimeout(() => onSubmit(option), 2600);
    }
  };

  const handleDirectSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();

    if (!problem?.question || feedback || disabled) return;

    const textAnswer =
      typeof answer === "string"
        ? answer
        : answer?.textAnswer || answer?.slots?.answer || "";

    if (!String(textAnswer || "").trim()) return;

    try {
      const result = await onSubmit(textAnswer);

      applyFeedback(result);

      // queueNextProblem();
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  const handleMatchComplete = async (isValid) => {
    if (feedback || disabled) return;

    try {
      const result = await onSubmit(isValid ? "matched" : "wrong_answer");
      applyFeedback(result);
      // queueNextProblem();
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  if (!problem) return <div className="loading-state">Loading...</div>;

  const questionType = problem.question.type;
  const isConceptual = questionType === "conceptual";
  const visualData = problem.question.visualData;
  const isIconsItems = questionType === "icons_items";
  const isWorksheetDriven = isWorksheetDrivenQuestion(problem?.question);
  const showTelemetry = Boolean(problem?.adaptiveState) && import.meta.env.DEV;
  const isMatchTheFollowing =
    isIconsItems &&
    Array.isArray(visualData?.leftItems) &&
    Array.isArray(visualData?.rightItems);

  const matchLeft = visualData?.leftItems || [];
  const matchRight = visualData?.rightItems || [];

  // custom confetti
  const fireWinCelebration = () => {
    const colors = ["#10b981", "#fbbf24", "#f43f5e", "#3b82f6", "#8b5cf6"];
    const base = {
      colors,
      gravity: 1.6,
      scalar: 1,
      ticks: 120,
      disableForReducedMotion: true,
    };

    confetti({
      ...base,
      particleCount: 35,
      angle: 60,
      spread: 45,
      origin: { x: 0, y: 0.7 },
    });
    confetti({
      ...base,
      particleCount: 35,
      angle: 120,
      spread: 45,
      origin: { x: 1, y: 0.7 },
    });
  };

  return (
    <div className="question-shell">
      <div className={`question-shell__main ${isExiting ? "is-exiting" : ""}`}>
        <div className="question__card">
          {isWorksheetDriven ? (
            <SchemaQuestion
              question={problem.question}
              response={answer}
              setResponse={setAnswer}
              feedback={feedback}
              onCheck={submitStructuredResponse}
              onNext={handleNext}
              isSubmitting={disabled}
              // for dummy test
              isDummyMode={isDummyMode}
              setIsDummyMode={setIsDummyMode}
              failedFirstTry={failedFirstTry}
              isRevealed={isRevealed}
              setIsRevealed={setIsRevealed}
              stageResults={stageResults}
              autoNextCountdown={autoNextCountdown}
              // disableAutoNext={disableAutoNext}
              disableAutoNext={shouldDisableAutoNext}
              isExiting={isExiting}
            />
          ) : (
            <>
              <div className="question__text">
                <span className="highlight3">Q,</span> {problem.question.text}
              </div>

              {isMatchTheFollowing && (
                <div className="icons-items__container">
                  <MatchTheFollowing
                    key={problem.question.id}
                    id={problem.question.id || problem.question._id}
                    leftItems={matchLeft}
                    rightItems={matchRight}
                    onComplete={handleMatchComplete}
                  />
                </div>
              )}

              {questionType === "visual" && visualData && (
                <VisualBarModel
                  problem={problem}
                  answer={answer}
                  setAnswer={setAnswer}
                  isSuccess={isSuccess}
                  isError={isError}
                  handleKeyDown={(event) => {
                    if (event.key === "Enter") handleDirectSubmit(event);
                  }}
                  handleSubmit={handleDirectSubmit}
                />
              )}

              {isConceptual ? (
                <ConceptualQuestion
                  problem={problem}
                  selectedOption={selectedOption}
                  isSuccess={isSuccess}
                  isError={isError}
                  handleOptionClick={handleOptionClick}
                />
              ) : (
                <div>
                  {!isConceptual &&
                    questionType !== "visual" &&
                    !isIconsItems && (
                      <DirectInputQuestion
                        answer={answer}
                        setAnswer={setAnswer}
                        isSuccess={isSuccess}
                        isError={isError}
                        handleSubmit={handleDirectSubmit}
                      />
                    )}
                </div>
              )}
              {(isSuccess || isError) && !isWorksheetDriven && (
                <div className="worksheet-actions">
                  <button
                    className="worksheet-button worksheet-button--continue"
                    onClick={onNext}
                  >
                    Continue →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        {pendingResult === "correct" && (
          <div className="score-pop" key={`score-pop-${statAnim.key}`}>
            <span className="score-pop__number">+1</span>
            <span className="score-pop__label">CORRECT</span>
          </div>
        )}
      </div>
      {showLoadingMsg && (
        <div className="loading-next-overlay">
          {/* Background Speed Lines */}
          <div className="longfazers">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          {/* The Flying Ship */}
          <div className="loader">
            <span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <div className="base">
              <span></span>
              <div className="face"></div>
            </div>
          </div>

          {/* Centered Text */}
          <p className="loading-text">Loading Next Challenge…</p>
        </div>
      )}

      {showTelemetry && (
        <aside className="question-shell__telemetry">
          <GhostPanel
            adaptiveData={problem?.adaptiveState}
            conceptId={problem?.concept?.id}
            masteryConfig={problem?.masteryConfig}
          />
        </aside>
      )}
    </div>
  );
};

export default QuestionCard;
