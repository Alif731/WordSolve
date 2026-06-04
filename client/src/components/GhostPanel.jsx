import React from "react";
import { Activity } from "lucide-react";
import "../sass/components/GhostPanel.scss";

const GhostPanel = ({ adaptiveData, conceptId, masteryConfig }) => {
  // If no data is arriving, show a "Waiting" state instead of nothing
  if (!adaptiveData) return null;

  // Read thresholds from server config (no more hardcoding!)
  const threshold = masteryConfig?.masteryScoreThreshold || 5;
  const minReq = masteryConfig?.masteryMinAttempts || 5;

  // Extract values with strict fallbacks
  const score = Number(adaptiveData.changePointScore || 0);
  const displayScore = Math.min(score, threshold);
  const ucb = Number(adaptiveData.ucb || 0);
  const status = adaptiveData.status || "unlocked";
  const total = adaptiveData.attemptCount || 0;
  const success = adaptiveData.successCount || 0;
  const record =
    adaptiveData.lastAttempts || adaptiveData.correctnessRecord || [];

  const accuracyPercent = total > 0 ? (success / total) * 100 : 0;

  // Honest Progress Math
  const scoreWeight = Math.min(score / threshold, 1);
  const attemptWeight = Math.min(total / minReq, 1);
  const masteryPercent = (((scoreWeight + attemptWeight) / 2) * 100).toFixed(0);

  const isReady = score >= threshold && total >= minReq;

  // Only show in development
  if (!import.meta.env.DEV) return null;

  return (
    <div className="ghost-debug-panel">
      <div className="ghost-header">
        <Activity size={14} /> <span>ENGINE TELEMETRY</span>
      </div>

      <div className="ghost-row">
        <label>Node ID:</label>
        <span className="node-name">{conceptId || "N/A"}</span>
      </div>

      <div className="ghost-row">
        <label>Status:</label>
        <span className={`status-pill ${status} ${isReady ? "ready" : ""}`}>
          {isReady ? "READY" : status.toUpperCase()}
        </span>
      </div>

      <hr className="ghost-divider" />

      {/* --- DATA ROWS --- */}
      <div className="ghost-row">
        <label>Mastery Score:</label>
        <span className={score >= threshold ? "mastered" : ""}>
          {displayScore.toFixed(2)} / {threshold}
        </span>
      </div>

      <div className="ghost-row">
        <label>Knowledge Est:</label>
        <span>{accuracyPercent.toFixed(0)}% accuracy</span>
      </div>

      <div className="ghost-row">
        <label>UCB Priority:</label>
        <span>{ucb.toFixed(3)}</span>
      </div>

      <div className="ghost-row">
        <label>Mastery Progress:</label>
        <span>{masteryPercent}%</span>
      </div>

      {/* --- PROGRESS BAR --- */}
      <div className="ghost-progress-bar">
        <div
          className="fill"
          style={{
            width: `${masteryPercent}%`,
            background: isReady
              ? "#4ade80"
              : "linear-gradient(90deg, #a855f7, #6366f1)",
          }}
        />
      </div>

      <div className="ghost-row attempts-row">
        <label>Attempts:</label>
        <span>
          {total} <small>(Min:{minReq})</small>
        </span>
      </div>

      {/* --- FOOTER STATS --- */}
      <div className="ghost-row mini-labels">
        <span>
          G: {((adaptiveData.guessProbability || 0) * 100).toFixed(0)}%
        </span>
        <span>
          S: {((adaptiveData.slipProbability || 0) * 100).toFixed(0)}%
        </span>
      </div>

      <div className="ghost-row mini-labels history-section">
        <label>Record:</label>
        <div className="history-dots">
          {record.map((isCorrect, i) => (
            <span key={i} className={`dot ${isCorrect ? "green" : "red"}`}>
              ●
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GhostPanel;
