import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Footprints,
  Target,
} from "lucide-react";
import "../sass/components/GhostPanel.scss";

const TELEMETRY_STATE_KEY = "wordsolve.telemetry.expanded";

const EngineTelemetry = ({ adaptiveData, conceptId }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(TELEMETRY_STATE_KEY) === "true";
  });

  useEffect(() => {
    window.sessionStorage.setItem(TELEMETRY_STATE_KEY, String(isExpanded));
  }, [isExpanded]);

  if (!adaptiveData || !import.meta.env.DEV) return null;

  const threshold = 8;
  const minReq = 5;

  const score = Number(adaptiveData.changePointScore || 0);
  const status = adaptiveData.status || "unlocked";
  const sess = adaptiveData.timesPlayed || 0;
  const total = adaptiveData.attemptCount || 0;
  const record = adaptiveData.correctnessRecord || [];

  const scoreWeight = Math.max(0, Math.min(score / threshold, 1));
  const masteryPercent = (scoreWeight * 100).toFixed(0);
  const roundsRemaining = Math.max(minReq - total, 0);
  const hasScoreTarget = score >= threshold;
  const isReady = hasScoreTarget && total >= minReq;
  const conceptLabel = String(conceptId || "practice path")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const statusLabel = isReady
    ? "Ready to level up"
    : hasScoreTarget
      ? `${roundsRemaining} more round${roundsRemaining === 1 ? "" : "s"}`
    : status === "mastered"
      ? "Mastered"
      : status === "locked"
        ? "Locked"
        : "In progress";
  const recentDots = record.slice(-6);

  return (
    <div
      className={`ghost-debug-panel ${isExpanded ? "is-expanded" : "is-collapsed"}`}
    >
      <button
        type="button"
        className="ghost-toggle-card"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <div className="ghost-toggle-card__copy">
          <span className="ghost-header__label">Progress</span>
          <strong>{conceptLabel}</strong>
          <small>{isExpanded ? "Hide details" : "Show details"}</small>
        </div>

        <div className="ghost-toggle-card__meta">
          <div className={`status-pill ${status} ${isReady ? "ready" : ""}`}>
            {statusLabel}
          </div>
          <div className="ghost-toggle-arrow" aria-hidden="true">
            {isExpanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </div>
        </div>
      </button>

      <div className="ghost-toggle-progress">
        <div className="ghost-toggle-progress__top">
          <span>Skill meter</span>
          <strong>{masteryPercent}%</strong>
        </div>
        <div className="ghost-progress-bar ghost-progress-bar--mini">
          <div
            className={`fill ${isReady ? "fill--ready" : ""}`}
            style={{ width: `${masteryPercent}%` }}
          />
        </div>
        {isExpanded && (
          <p className="ghost-toggle-progress__note">
            {isReady
              ? "Ready for the next step."
              : hasScoreTarget
                ? `${roundsRemaining} more strong round${roundsRemaining === 1 ? "" : "s"} needed.`
              : "Strong correct answers move this forward."}
          </p>
        )}
      </div>

      {isExpanded && (
        <div className="ghost-panel-body">
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

            <div className="ghost-stat ghost-stat--history">
              <div className="ghost-stat__icon ghost-stat__icon--accent">
                {recentDots.length || 0}
              </div>
              <div>
                <span className="ghost-stat__label">Recent tries</span>
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
                    <span className="ghost-history__empty">No tries yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineTelemetry;
