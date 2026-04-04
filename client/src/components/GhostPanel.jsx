import React, { useState } from "react";
import { Footprints, Sparkles, Target } from "lucide-react";
import "../sass/components/GhostPanel.scss";

const EngineTelemetry = ({ adaptiveData, conceptId }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!adaptiveData) return null;

  const threshold = 7.82;
  const minReq = 5;

  const score = Number(adaptiveData.changePointScore || 0);
  const status = adaptiveData.status || "unlocked";
  const sess = adaptiveData.timesPlayed || 0;
  const total = adaptiveData.attemptCount || 0;
  const estimate = adaptiveData.estimate || 0;
  const record = adaptiveData.correctnessRecord || [];

  const scoreWeight = Math.min(score / threshold, 1);
  const attemptWeight = Math.min(total / minReq, 1);
  const masteryPercent = (((scoreWeight + attemptWeight) / 2) * 100).toFixed(0);
  const isReady = score >= threshold && total >= minReq;
  const conceptLabel = String(conceptId || "practice path")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const statusLabel = isReady
    ? "Ready to level up"
    : status === "mastered"
      ? "Mastered"
      : status === "locked"
        ? "Locked"
        : "In progress";
  const skillMeter = `${(estimate * 100).toFixed(0)}%`;
  const recentDots = record.slice(-6);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="ghost-debug-panel">
      <div className="ghost-header">
        <div className="ghost-header__label">Progress tracker</div>
        <div className={`status-pill ${status} ${isReady ? "ready" : ""}`}>
          {statusLabel}
        </div>
      </div>

      <div className="ghost-concept">
        <Sparkles size={16} />
        <span>{conceptLabel}</span>
      </div>

      <div className="ghost-progress-card">
        <div className="ghost-progress-card__top">
          <span>Skill meter</span>
          <strong>{masteryPercent}%</strong>
        </div>
        <div className="ghost-progress-bar">
          <div
            className={`fill ${isReady ? "fill--ready" : ""}`}
            style={{ width: `${masteryPercent}%` }}
          />
        </div>
        <p>
          {isReady
            ? "You have enough strong tries to unlock the next step."
            : "Each correct try fills your meter and helps the engine learn with you."}
        </p>
      </div>

      <div className="ghost-dropdown">
        <button
          type="button"
          className="ghost-dropdown__toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Hide practice details" : "Show practice details"}
        </button>

        {isExpanded && (
          <div className="ghost-dropdown__content">
            <div className="ghost-stats-grid">
              <div className="ghost-stat">
                <div className="ghost-stat__icon">
                  <Target size={16} />
                </div>
                <div>
                  <span className="ghost-stat__label">Mastery score</span>
                  <strong className={score >= threshold ? "mastered" : ""}>
                    {score.toFixed(2)} / {threshold}
                  </strong>
                </div>
              </div>

              <div className="ghost-stat">
                <div className="ghost-stat__icon">
                  <Footprints size={16} />
                </div>
                <div>
                  <span className="ghost-stat__label">Practice rounds</span>
                  <strong>
                    {sess} today, {total} total
                  </strong>
                </div>
              </div>

              <div className="ghost-stat">
                <div className="ghost-stat__icon ghost-stat__icon--accent">%</div>
                <div>
                  <span className="ghost-stat__label">Accuracy feel</span>
                  <strong>{skillMeter}</strong>
                </div>
              </div>
            </div>

            <div className="ghost-history">
              <div className="ghost-history__header">
                <span>Recent tries</span>
                <small>Goal: {minReq} strong practice rounds</small>
              </div>
              <div className="history-dots">
                {recentDots.length ? (
                  recentDots.map((isCorrect, index) => (
                    <span
                      key={index}
                      className={`dot ${isCorrect ? "green" : "red"}`}
                      title={isCorrect ? "Correct" : "Try again"}
                    />
                  ))
                ) : (
                  <span className="ghost-history__empty">
                    Your first answer will start the trail.
                  </span>
                )}
              </div>
            </div>

            <div className="ghost-footer">
              <span>
                Guess: {adaptiveData.guessProbability?.toExponential(1) || "0.0e0"}
              </span>
              <span>
                Slip: {adaptiveData.slipProbability?.toExponential(1) || "0.0e0"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngineTelemetry;
