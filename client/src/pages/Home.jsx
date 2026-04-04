import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  useGetProblemQuery,
  useGetUserStatusQuery,
  useSubmitAnswerMutation,
} from "../store/slices/gameApiSlice";

import QuestionCard from "../components/QuestionCard";
import "../sass/page/homePage.scss";
const Home = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const username = userInfo?.username;
  // --- RTK QUERY HOOKS ---
  const {
    data: problem,
    isLoading: loadingProblem,
    isError: errorProblem,
    refetch: refetchProblem,
  } = useGetProblemQuery(username, { skip: !username });

  const { data: status } = useGetUserStatusQuery(username, { skip: !username });
  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitAnswerMutation();

  // Streak Animation ----------------------------
  const [isAnimatingSuccess, setIsAnimatingSuccess] = useState(false);
  const [isAnimatingFailure, setIsAnimatingFailure] = useState(false);

  const prevStreakRef = useRef(0);

  useEffect(() => {
    const currentStreak = status?.streak || 0;
    const prevStreak = prevStreakRef.current;

    // SCENARIO 1: Streak extended
    if (currentStreak > prevStreak && currentStreak > 0) {
      setIsAnimatingSuccess(true);
      setTimeout(() => setIsAnimatingSuccess(false), 500);
    }
    // SCENARIO 2: Streak lost
    else if (currentStreak === 0 && prevStreak > 0) {
      setIsAnimatingFailure(true);
      setTimeout(() => setIsAnimatingFailure(false), 600);
    }

    prevStreakRef.current = currentStreak;
  }, [status?.streak]);
  //  ---------------------------- End

  // --- HANDLERS ---
  const handleAnswerSubmit = async (answer) => {
    if (!problem?.question) return;

    try {
      await submitAnswer({
        conceptId: problem.concept.id,
        questionId: problem.question.id,
        response: answer,
      }).unwrap();

      // refetch questions
      refetchProblem();
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };
  const isMastered = problem?.complete;

  if (!username) return <div className="loading-state">Loading...</div>;
  if (!problem) return <div className="loading-state">Loading...</div>;

  return (
    <div className="home-page">
      {/* --- ADDED BACK: GAME HEADER --- */}
      <header className="game-header">
        <div className="player-badge highlight2">
          <span className="highlight1">G</span>ood{" "}
          <span className="highlight2">M</span>orning {username}
          <strong style={{ marginLeft: "0.4rem" }}>
            {" "}
            . <span className="highlight1">L</span>et's Continue this Journey!
          </strong>
        </div>
        {(status?.streak >= 1 || isAnimatingFailure) && (
          <div
            className={`streak__badge ${isAnimatingSuccess ? "pop-active" : ""} ${isAnimatingFailure ? "shake-active" : ""}`}
          >
            <span className="highlight1">S</span>treak:{" "}
            <span className="highlight2">x</span>
            {isAnimatingFailure ? 0 : status.streak}
            <span className="right"></span>
            <span className="bottom"></span>
            <span className="left"></span>
          </div>
        )}
      </header>
      {problem?.description && problem.concept.id === "foundation_signs" && (
        <h2 className="card__header__type">{problem.description}</h2>
      )}
      <main className="home-layout">
        {isMastered ? (
          <div className="status-card master">
            You have mastered all available concepts!
          </div>
        ) : // 3. LOADING STATE
        loadingProblem ? (
          <div className="status-card loading">
            <div className="spinner">⏳</div>
            Loading your challenge...
          </div>
        ) : // 4. ERROR STATE
        errorProblem ? (
          <div className="status-card error-msg">
            Error loading game data. Please try refreshing.
          </div>
        ) : (
          // 5. QUESTION CARD
          problem &&
          problem.question && (
            <QuestionCard
              key={problem.question.id}
              problem={problem}
              onSubmit={handleAnswerSubmit}
              disabled={isSubmitting}
            />
          )
        )}
      </main>
    </div>
  );
};

export default Home;
