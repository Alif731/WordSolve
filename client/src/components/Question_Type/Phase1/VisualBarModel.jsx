import React, { useState, useEffect } from "react";
import { PiArrowBendDoubleUpLeftBold } from "react-icons/pi";

const VisualBarModel = ({
  problem,
  answer,
  setAnswer,
  isSuccess,
  isError,
  handleKeyDown,
  handleSubmit,
}) => {
  const visualData = problem?.question?.visualData;

  // --- HINT STATE ---
  const [showHint, setShowHint] = useState(false);
  const [isHintFading, setIsHintFading] = useState(false); // hint animation state
  useEffect(() => {
    // Only run this if it's actually a visual problem
    if (problem?.question?.type === "visual") {
      let hintCount = 0;
      const savedCount = sessionStorage.getItem("visualHintCount");
      const lastSeenId = sessionStorage.getItem("lastHintProblemId");

      // Grab the rule we set during login (Fallback to 1 just in case)
      const maxHintsAllowed = parseInt(
        sessionStorage.getItem("maxHintsAllowed") || "1",
        10,
      );

      if (savedCount) {
        hintCount = parseInt(savedCount, 10);
      }

      // Safely grab the database ID of this specific problem
      const currentProblemId =
        problem?.question?.id || problem?.question?._id || "fallback-id";

      //  Dynamically check against maxHintsAllowed!
      if (hintCount < maxHintsAllowed) {
        setShowHint(true);

        // Don't double-count if they refresh the page
        if (lastSeenId !== String(currentProblemId)) {
          sessionStorage.setItem("visualHintCount", String(hintCount + 1));
          sessionStorage.setItem("lastHintProblemId", String(currentProblemId));
        }
      }
    }
  }, [problem]); // Re-run when the problem changes

  // 2. Hide hint the millisecond they start typing
  useEffect(() => {
    if (answer !== "" && showHint && !isHintFading) {
      // Step A: Trigger the fade-out CSS animation
      setIsHintFading(true);

      setTimeout(() => {
        setShowHint(false);
        setIsHintFading(false); // Reset for the next question
      }, 700);
    }
  }, [answer, showHint, isHintFading]);

  const getInputClass = () => {
    if (isSuccess) return "visual__input visual__input__success";
    if (isError) return "visual__input visual__input__error";
    return "visual__input";
  };

  const getDynamicWidth = () => {
    if (!isSuccess && !isError) return undefined;
    if (isSuccess) return "100%";

    const correctNum = Number(problem?.question?.correctAnswer);
    const userNum = Number(answer);

    if (!isNaN(correctNum) && !isNaN(userNum) && correctNum > 0) {
      const percentage = (userNum / correctNum) * 100;
      return `${Math.min(100, Math.max(15, percentage))}%`;
    }
    return "100%";
  };

  if (!visualData) return null;

  // Build the visual segments array using a standard for loop
  const visualSegments = [];
  for (let i = 0; i < visualData.parts.length; i++) {
    const part = visualData.parts[i];
    visualSegments.push(
      <div
        key={i}
        className="visual__segment"
        style={{
          backgroundColor: part.color,
          flex: part.value,
        }}
      >
        <span className="visual__label">{part.label}</span>
      </div>,
    );
  }

  return (
    <div className="visual__container">
      {visualData.showTotal && (
        <div className="visual__bracket">
          {showHint && !isSuccess && !isError && (
            <div
              className={`visual__hint ${isHintFading ? "hint-fading-out" : ""}`}
            >
              <div className="visual__hint-text">Type here!</div>
              <div className="visual__hint-arrow">
                <PiArrowBendDoubleUpLeftBold />
              </div>
            </div>
          )}
          <input
            type="number"
            className={getInputClass()}
            value={answer}
            onChange={(e) =>
              !isSuccess && !isError && setAnswer(e.target.value)
            }
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            placeholder="?"
            autoComplete="off"
            readOnly={isSuccess || isError}
            style={{ width: getDynamicWidth() }}
          />
          <div className="visual__line">
            <span className="visual__line__span">|</span>
          </div>
        </div>
      )}
      <div className={`visual__bars`}>{visualSegments}</div>
    </div>
  );
};

export default VisualBarModel;
