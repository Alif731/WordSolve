import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { Activity } from "lucide-react";

// Scss Components
import "../sass/components/questionCard.scss";
import "../sass/components/question_type/conceptualQuestion.scss";
import "../sass/components/question_type/visualBarModel.scss";
import "../sass/components/question_type/matchTheFollowing.scss";
import "../sass/components/question_type/directInputQuestion.scss";

// Question Components
// import DragDropQuestion from "./DragDropQuestion";
import GhostPanel from "./GhostPanel.jsx";
import ConceptualQuestion from "./Question_Type/ConceptualQuestion";
import VisualBarModel from "./Question_Type/VisualBarModel";
import MatchTheFollowing from "./Question_Type/MatchTheFollowing";
import DirectInputQuestion from "./Question_Type/DirectInputQuestion";

const audioSuccess = new Audio("/success1.mp3");
const audioFailure = new Audio("/failure.mp3");

const QuestionCard = ({ problem, onSubmit }) => {
  const [answer, setAnswer] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    setAnswer("");
    setIsSuccess(false);
    setIsError(false);
    setSelectedOption(null);
  }, [problem]);

  const playSuccessSound = () => {
    audioSuccess.currentTime = 0;
    audioSuccess.play().catch((e) => console.log("Audio blocked by browser"));
  };

  const playErrorSound = () => {
    audioFailure.currentTime = 0;
    audioFailure.play().catch((e) => console.log("Audio blocked by browser"));
  };

  const handleOptionClick = (option) => {
    if (isSuccess || isError) return;
    setSelectedOption(option);

    const rawCorrect = problem?.question?.correctAnswer || problem?.answer;
    if (rawCorrect === undefined || rawCorrect === null) {
      onSubmit(option);
      return;
    }

    const isCorrect = String(option).trim() === String(rawCorrect).trim();

    if (isCorrect) {
      // setStreak((prev) => prev + 1);
      setIsSuccess(true);
      playSuccessSound();
      setTimeout(() => onSubmit(option), 3000);
    } else {
      // setStreak(0);
      setIsError(true);
      playErrorSound();
      setTimeout(() => onSubmit(option), 2600);
    }
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (answer === "" || answer === null || answer === undefined) return;

    const rawCorrect = problem?.question?.correctAnswer;
    if (rawCorrect === undefined || rawCorrect === null) {
      onSubmit(answer);
      return;
    }

    const userAnswer = String(answer).trim();
    const dbAnswer = String(rawCorrect).trim();
    const isCorrect = userAnswer === dbAnswer;

    const shouldAnimate =
      problem.question.type === "visual" ||
      problem.question.type === "icons_items" ||
      problem.question.type === "direct";

    if (shouldAnimate) {
      if (isCorrect) {
        // setStreak((prev) => prev + 1); // 🔥 ADDED THIS
        playSuccessSound();
        setIsSuccess(true);
        setTimeout(() => onSubmit(userAnswer), 3000);
      } else {
        // setStreak(0); // 🔥 ADDED THIS
        playErrorSound();
        setIsError(true);
        setTimeout(() => onSubmit(userAnswer), 2600);
      }
    } else {
      onSubmit(userAnswer);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit(e);
  };

  const handleMatchComplete = (isValid) => {
    setAnswer("matched");
    if (isValid) {
      // setStreak((prev) => prev + 1);
      setIsSuccess(true);
      playSuccessSound();
      setTimeout(() => onSubmit("matched"), 2500);
    } else {
      // setStreak(0);
      setIsError(true);
      playErrorSound();
      setTimeout(() => onSubmit("wrong_answer"), 2600);
    }
  };

  if (!problem) return <div className="loading-state">Loading...</div>;

  const questionType = problem.question.type;
  const isConceptual = questionType === "conceptual";
  const visualData = problem.question.visualData;
  const isIconsItems = questionType === "icons_items";
  const isMatchTheFollowing =
    isIconsItems &&
    Array.isArray(visualData?.leftItems) &&
    Array.isArray(visualData?.rightItems);

  const matchLeft = visualData?.leftItems || [
    { id: "L1", content: "🐶🐶🐶 + 🐶🐶", matchId: "R1" },
    { id: "L2", content: "10 - 4", matchId: "R2" },
    { id: "L3", content: "⭐⭐ × ⭐⭐", matchId: "R3" },
    { id: "L4", content: "8 ÷ 2", matchId: "R4" },
  ];

  const matchRight = visualData?.rightItems || [
    { id: "R4", content: "4" },
    { id: "R1", content: "5" },
    { id: "R3", content: "4 Stars" },
    { id: "R2", content: "6" },
    { id: "R5", content: "9" },
  ];

  return (
    <div>
      {/* THE GHOST PANEL (Only visible in dev mode) */}
      <GhostPanel
        adaptiveData={problem?.adaptiveState}
        conceptId={problem?.concept?.id}
      />
      {/* This renders the actual question (Conceptual, Bar Model, etc.) */}
      <div className="question__card">
        {isSuccess && (
          <Confetti recycle={false} numberOfPieces={500} gravity={0.3} />
        )}
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
            handleKeyDown={handleKeyDown}
            handleSubmit={handleSubmit}
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
            {!isConceptual && questionType !== "visual" && !isIconsItems && (
              <DirectInputQuestion
                answer={answer}
                setAnswer={setAnswer}
                isSuccess={isSuccess}
                isError={isError}
                handleSubmit={handleSubmit}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
