import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, Play } from "lucide-react";
import "../sass/components/MasteryModal.scss";

const MasteryModal = ({
  isOpen,
  moduleName,
  moduleId,
  score,
  attempts,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleReturnToMap = () => {
    navigate("/progress", {
      state: { justMasteredId: moduleId },
    });
  };

  return (
    <div className="mastery-modal-overlay">
      <div className="mastery-modal-content">
        {/* FIX: This wrapper handles the clipped ribbon without cutting off the trophy */}
        <div className="modal-ribbon-wrapper"></div>

        {/* The icon container is now outside the overflow-hidden area */}
        <div className="modal-icon-container">
          <Trophy size={36} className="trophy-icon" />
        </div>

        <h2 className="modal-title">Module Mastered!</h2>
        <p className="modal-subtitle">
          You have successfully mastered <strong>{moduleName}</strong>.
        </p>

        <div className="stats-container">
          <div className="stat-box">
            <span className="stat-label">Accuracy: </span>
            <span className="stat-value">{score}%</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Attempts: </span>
            <span className="stat-value">{attempts}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="primary-btn" onClick={handleReturnToMap}>
            <Sparkles size={18} />
            Claim Reward
          </button>

          <button className="secondary-btn" onClick={onClose}>
            <Play size={18} />
            Continue Playing
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasteryModal;
