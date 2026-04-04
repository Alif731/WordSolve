// import "../sass/components/ProgressBar.scss";

// const ProgressBar = ({ status }) => {
//   if (!status) return null;

//   // Flatten mastery map for display
//   const nodes = Object.entries(status.mastery).map(([id, data]) => ({
//     id,
//     ...data,
//   }));

//   // Logic to sync with the "Ghost" Telemetry
//   const calculateHonestProgress = (entry) => {
//     const threshold = 7.82;
//     const minReq = 5;

//     const score = entry.adaptiveState?.changePointScore || 0;
//     const totalAttempts = entry.attemptCount || 0;

//     const scoreWeight = Math.min(score / threshold, 1);
//     const attemptWeight = Math.min(totalAttempts / minReq, 1);

//     // Average the weights: (Score % + Attempts %) / 2
//     return (((scoreWeight + attemptWeight) / 2) * 100).toFixed(0);
//   };

//   return (
//     <div className="dashboard-card progress-map">
//       <h3 className="dashboard-title">Your Progress Map</h3>

//       <div className="dashboard-list">
//         {nodes.map((node) => {
//           const progressPercent = calculateHonestProgress(node);
//           const proficiency = (node.adaptiveState?.estimate * 100 || 0).toFixed(
//             0,
//           );
//           const record = node.adaptiveState?.correctnessRecord || [];

//           return (
//             <div
//               key={node.id}
//               className={`node-item ${node.status || "locked"}`}
//             >
//               {/* --- Node Header --- */}
//               <div className="node-header">
//                 <span className="node-title">{node.id.replace(/_/g, " ")}</span>
//                 <span className={`node-badge ${node.status || "locked"}`}>
//                   {node.status}
//                 </span>
//               </div>

//               {/* --- Stats & Progress (Hidden if locked) --- */}
//               {node.status !== "locked" && (
//                 <div className="node-content">
//                   {/* 🔥 NEW: Knowledge Proficiency Label */}
//                   <div className="proficiency-row">
//                     <label>Proficiency:</label>
//                     <span>{proficiency}%</span>
//                   </div>

//                   <div className="progress-container">
//                     <div className="progress-track">
//                       <div
//                         className={`progress-fill ${node.status}`}
//                         style={{ width: `${progressPercent}%` }} // 🔥 SYNCED WITH GHOST
//                       />
//                     </div>
//                     <div className="progress-text">
//                       Mastery Progress: {progressPercent}%
//                     </div>
//                   </div>

//                   {/* 🔥 NEW: Record Momentum Dots */}
//                   <div className="node-footer">
//                     <div className="record-dots">
//                       {record.slice(-5).map((isCorrect, i) => (
//                         <span
//                           key={i}
//                           className={`dot ${isCorrect ? "green" : "red"}`}
//                         >
//                           ●
//                         </span>
//                       ))}
//                     </div>
//                     <div className="attempt-count">
//                       {node.attemptCount} / 5 Attempts
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default ProgressBar;

import "../sass/page/ProgressBar.scss";
import { Lock, PlayCircle, Sparkles, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetUserStatusQuery } from "../store/slices/gameApiSlice";
import UserAvatar, { AVATAR_VARIANTS } from "../components/UserAvatar";

const ProgressBar = () => {
  // Removed { status } from props
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.auth);
  const currentUsername = userInfo?.username;

  const { data: status, isLoading } = useGetUserStatusQuery(currentUsername, {
    skip: !currentUsername,
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="progress-loading">
        <Loader2 className="spinner" />
        <span>Loading Page.</span>
      </div>
    );
  }

  // If no data is found
  if (!status) return <div className="no-data">No progress data found.</div>;

  const nodes = Object.entries(status.mastery).map(([id, data]) => ({
    id,
    ...data,
  }));

  const calculateHonestProgress = (entry) => {
    const threshold = 8;
    const score = entry.adaptiveState?.changePointScore || 0;
    return (Math.min(score / threshold, 1) * 100).toFixed(0);
  };

  return (
    <div className="student__progress">
      <header className="game-header-profile teacher-dashboard__hero">
        <div className="player-badge-profile highlight2">
          <>
            <span className="highlight1">S</span>tudent{" "}
          </>
          <span className="highlight2">P</span>rofile: {currentUsername}
          <span className="avatar-preview" style={{ marginLeft: "10px" }}>
            <UserAvatar
              name={userInfo?.avatarSeed}
              variant={userInfo?.avatar}
              size={60}
            />
          </span>
        </div>
        <Link to="/leaderboard" className="teacher-dashboard__secondaryAction">
          Open Full Leaderboard
        </Link>
      </header>
      <div className="progress-map-container">
        <div className="progress-page-header">
          <h3 className="map-title">
            <Sparkles size={22} /> Your Knowledge Map
          </h3>
        </div>

        <div className="wizard-nodes-grid">
          {nodes.map((node) => {
            const progress = calculateHonestProgress(node);
            const proficiency = (
              node.adaptiveState?.estimate * 100 || 0
            ).toFixed(0);
            const record = node.adaptiveState?.correctnessRecord || [];
            const isLocked = node.status === "locked";

            return (
              <div key={node.id} className={`wizard-card ${node.status}`}>
                <div className="card-header">
                  <span className="node-name">
                    {node.id.replace(/_/g, " ")}
                  </span>
                  <div className={`status-badge ${node.status}`}>
                    {isLocked ? (
                      <Lock size={12} />
                    ) : node.status === "mastered" ? (
                      "Mastered"
                    ) : (
                      "Active"
                    )}
                  </div>
                </div>

                {!isLocked ? (
                  <div className="card-content">
                    <div className="mastery-section">
                      <div className="label-row">
                        <label>Mastery Progress</label>
                        <span>{progress}%</span>
                      </div>
                      <div className="wizard-track">
                        <div
                          className="wizard-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="skill-orb">
                        <span className="orb-value">{proficiency}%</span>
                        <label>Skill</label>
                      </div>

                      <div className="history-group">
                        <div className="dots">
                          {record.slice(-5).map((isCorrect, i) => (
                            <div
                              key={i}
                              className={`dot ${isCorrect ? "green" : "red"}`}
                            />
                          ))}
                        </div>
                        <span className="attempts">
                          Status: {node.attemptCount} / 5
                        </span>
                      </div>
                    </div>

                    {node.status !== "mastered" && (
                      <button
                        className="practice-btn-mini"
                        onClick={() => navigate("/home")}
                      >
                        Continue <PlayCircle size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="locked-overlay">
                    <p>Complete previous nodes to unlock</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
