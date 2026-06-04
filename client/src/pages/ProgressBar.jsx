// import "../sass/page/ProgressBar.scss";
// import {
//   Lock,
//   PlayCircle,
//   Sparkles,
//   Loader2,
//   RefreshCw,
//   Award,
// } from "lucide-react";
// import { useNavigate, Link } from "react-router-dom";
// import { useSelector } from "react-redux";
// import {
//   useGetUserStatusQuery,
//   useSwitchSectionMutation, // 🔥 1. Brought back useSwitchSectionMutation
// } from "../store/slices/gameApiSlice";
// import UserAvatar, { AVATAR_VARIANTS } from "../components/UserAvatar";
// import { toast } from "react-toastify";

// const ProgressBar = () => {
//   const navigate = useNavigate();

//   const { userInfo } = useSelector((state) => state.auth);
//   const currentUsername = userInfo?.username;

//   const {
//     data: status,
//     isLoading,
//     refetch,
//   } = useGetUserStatusQuery(currentUsername, {
//     skip: !currentUsername,
//   });

//   // 🔥 2. Using switchSection again!
//   const [switchSection, { isLoading: isSwitching }] =
//     useSwitchSectionMutation();

//   if (isLoading) {
//     return (
//       <div className="progress-loading">
//         <Loader2 className="spinner" />
//         <span>Loading Page.</span>
//       </div>
//     );
//   }

//   if (!status) return <div className="no-data">No progress data found.</div>;

//   const nodes = Object.entries(status.mastery).map(([id, data]) => ({
//     id,
//     ...data,
//   }));

//   // Read mastery config from API — single source of truth
//   const cfg = status.masteryConfig || {};
//   const minAttempts = cfg.masteryMinAttempts || 5;
//   const scoreThreshold = cfg.masteryScoreThreshold || 5;
//   const windowSize = cfg.windowSize || 5;

//   const calculateHonestProgress = (entry, trulyMastered) => {
//     if (entry.status === "mastered" && trulyMastered) return 100;

//     const isSkipped =
//       entry.status === "mastered" &&
//       !trulyMastered &&
//       entry.attemptCount === 0 &&
//       (entry.adaptiveState?.timesPlayed || 0) === 0;
//     if (isSkipped) return 0;

//     const recentAttempts = entry.lastAttempts || [];
//     const recentSuccesses = recentAttempts.filter(Boolean).length;
//     const targetSuccesses = Math.ceil(
//       windowSize * (cfg.masterySuccessRate || 0.8),
//     );

//     return Math.min((recentSuccesses / targetSuccesses) * 100, 100).toFixed(0);
//   };

//   const curriculumOrder = [
//     "single_add",
//     "single_sub",
//     "multi_add",
//     "multi_sub",
//     "missing_part_equations",
//     "combine_mod1",
//     "combine_mod2",
//     "combine_mod3",
//     "combine_mod4",
//     "combine_mod5",
//     "change_mod1",
//     "change_mod2",
//     "change_mod3",
//     "change_mod4",
//     "change_mod5",
//   ];

//   const practiceIds = ["single_add", "single_sub", "multi_add", "multi_sub"];
//   const equationIds = ["missing_part_equations"];

//   const sections = [
//     {
//       id: "practice",
//       title: "Practice (Arithmetic)",
//       description: "Build your foundation with arithmetic.",
//       nodes: nodes.filter((n) => practiceIds.includes(n.id)),
//     },
//     {
//       id: "equations",
//       title: "Missing Numbers",
//       description: "Find the missing number in equations.",
//       nodes: nodes.filter((n) => equationIds.includes(n.id)),
//     },
//     {
//       id: "schemas",
//       title: "Word Problems",
//       description: "Solve word problems using schemas.",
//       nodes: nodes.filter(
//         (n) => !practiceIds.includes(n.id) && !equationIds.includes(n.id),
//       ),
//     },
//   ];

//   // 🔥 3. We kept this brilliant logic so the UI knows which section is active!
//   let activeSectionId = null;
//   const currentConceptId = status?.zpdNodes?.[0];

//   if (currentConceptId) {
//     const matchingSection = sections.find((sec) =>
//       sec.nodes.some((n) => n.id === currentConceptId),
//     );
//     if (matchingSection) {
//       activeSectionId = matchingSection.id;
//     }
//   }

//   // 🔥 4. Reverted back to simply passing sectionId
//   const handleSwitchSection = async (sectionId) => {
//     try {
//       // Send the broad section word ("practice", "equations", etc.) to the backend
//       await switchSection({ sectionId }).unwrap();

//       // Force UI to refresh the active badge
//       await refetch();

//       toast.success("Ready to learn!");
//       navigate("/home");
//     } catch (error) {
//       toast.error("Failed to switch section.");
//       console.error("Switch Error:", error);
//     }
//   };

//   const renderNodes = (sectionNodes) => {
//     const sortedNodes = [...sectionNodes].sort((a, b) => {
//       const aIdx = curriculumOrder.indexOf(a.id);
//       const bIdx = curriculumOrder.indexOf(b.id);
//       return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
//     });

//     return (
//       <div className="wizard-nodes-grid" style={{ marginTop: "20px" }}>
//         {sortedNodes.map((node) => {
//           const record =
//             node.lastAttempts || node.adaptiveState?.correctnessRecord || [];
//           const recentSuccesses = record.filter(Boolean).length;
//           const recentSuccessRate =
//             record.length > 0 ? recentSuccesses / record.length : 0;

//           const trulyMastered =
//             node.attemptCount >= minAttempts &&
//             recentSuccessRate >= (cfg.masterySuccessRate || 0.8) &&
//             node.adaptiveState?.changePointScore >= scoreThreshold;

//           const progress = calculateHonestProgress(node, trulyMastered);
//           const proficiency =
//             node.attemptCount > 0
//               ? (((node.successCount || 0) / node.attemptCount) * 100).toFixed(
//                   0,
//                 )
//               : 0;
//           const isLocked = node.status === "locked";
//           const isSkipped =
//             node.status === "mastered" &&
//             !trulyMastered &&
//             node.attemptCount === 0 &&
//             (node.adaptiveState?.timesPlayed || 0) === 0;
//           const displayStatus =
//             node.status === "mastered" && !trulyMastered && !isSkipped
//               ? "unlocked"
//               : node.status;

//           return (
//             <div key={node.id} className={`wizard-card ${displayStatus}`}>
//               <div className="card-header">
//                 <span className="node-name">{node.id.replace(/_/g, " ")}</span>
//                 <div
//                   className={`status-badge ${isSkipped ? "skipped" : displayStatus}`}
//                 >
//                   {isLocked ? (
//                     <Lock size={12} />
//                   ) : isSkipped ? (
//                     "Skipped"
//                   ) : displayStatus === "mastered" ? (
//                     "Mastered"
//                   ) : (
//                     "Active"
//                   )}
//                 </div>
//               </div>

//               {!isLocked ? (
//                 <div className="card-content">
//                   <div className="mastery-section">
//                     <div className="label-row">
//                       <label>Mastery Progress</label>
//                       <span>{progress}%</span>
//                     </div>
//                     <div className="wizard-track">
//                       <div
//                         className="wizard-fill"
//                         style={{ width: `${progress}%` }}
//                       />
//                     </div>
//                   </div>

//                   <div className="card-footer">
//                     <div className="skill-orb">
//                       <span className="orb-value">{proficiency}%</span>
//                       <label>Skill</label>
//                     </div>

//                     <div className="history-group">
//                       <div className="dots">
//                         {record.slice(-windowSize).map((isCorrect, i) => (
//                           <div
//                             key={i}
//                             className={`dot ${isCorrect ? "green" : "red"}`}
//                           />
//                         ))}
//                       </div>
//                       <span className="attempts">
//                         Attempts: {node.attemptCount}
//                       </span>
//                     </div>
//                   </div>

//                   {node.status !== "mastered" && (
//                     <div
//                       style={{
//                         textAlign: "center",
//                         marginTop: "1rem",
//                         color: "#0071e9",
//                         fontSize: "0.9rem",
//                         fontStyle: "italic",
//                       }}
//                     >
//                       Actively Learning
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div className="locked-overlay">
//                   <p>Complete previous nodes to unlock</p>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   return (
//     <div className="student__progress">
//       <header className="game-header-profile teacher-dashboard__hero">
//         <div className="player-badge-profile highlight2">
//           <>
//             <span className="highlight1">S</span>tudent{" "}
//           </>
//           <span className="highlight2" style={{ marginLeft: "10px" }}>
//             {" "}
//             P
//           </span>
//           rofile: {currentUsername}
//           <span className="avatar-preview" style={{ marginLeft: "10px" }}>
//             <UserAvatar
//               name={userInfo?.avatarSeed}
//               variant={userInfo?.avatar}
//               size={60}
//             />
//           </span>
//         </div>
//         <Link to="/leaderboard" className="teacher-dashboard__secondaryAction">
//           <Award size={22} style={{ marginRight: "6px" }} /> Open Full
//           Leaderboard
//         </Link>
//       </header>
//       <div className="progress-map-container" style={{ paddingBottom: "50px" }}>
//         <div className="progress-page-header">
//           <div className="map-title player-badge highlight2">
//             <Sparkles
//               size={22}
//               style={{ color: "#f2cc8f", marginRight: "6px" }}
//             />{" "}
//             <span className="highlight1"> Y</span>
//             <span style={{ marginRight: "6px" }}>our</span>
//             <span className="highlight1">K</span>
//             <span style={{ marginRight: "6px" }}>nowledge</span>
//             <span className="highlight2">M</span>ap
//             <strong style={{ marginLeft: "0.4rem" }}></strong>
//           </div>
//         </div>

//         <div className="sections-container">
//           {sections.map((section) => {
//             const isActiveSection = activeSectionId === section.id;
//             const isTouched =
//               section.nodes.some(
//                 (n) =>
//                   n.attemptCount > 0 || (n.adaptiveState?.timesPlayed || 0) > 0,
//               ) || isActiveSection;

//             return (
//               <div key={section.id} className="progress-section">
//                 <div className="progress-section__header">
//                   <div className="progress-section__text">
//                     <h4 className="progress-section__title">{section.title}</h4>
//                     <p className="progress-section__description">
//                       {section.description}
//                     </p>
//                   </div>

//                   {isActiveSection ? (
//                     <div className="active-section-badge">
//                       <Sparkles size={16} />
//                       <span>Currently Active</span>
//                     </div>
//                   ) : (
//                     <button
//                       className="progress-section__button"
//                       onClick={() => handleSwitchSection(section.id)}
//                       disabled={isSwitching}
//                     >
//                       {isSwitching ? (
//                         <Loader2 size={18} className="spinner" />
//                       ) : (
//                         <span className="button-content">
//                           <RefreshCw size={18} className="button-icon" />
//                           Switch to this Section
//                         </span>
//                       )}
//                     </button>
//                   )}
//                 </div>

//                 <div className="progress-section__nodes">
//                   {isTouched ? (
//                     renderNodes(section.nodes)
//                   ) : (
//                     <div
//                       className="no-data"
//                       style={{
//                         marginTop: "20px",
//                         color: "#94a3b8",
//                         textAlign: "center",
//                       }}
//                     >
//                       Not started yet.
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProgressBar;
import "../sass/page/ProgressBar.scss";
import { useEffect } from "react";
import {
  Lock,
  Play,
  // PlayCircle,
  Sparkles,
  Loader2,
  RefreshCw,
  Award,
} from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetUserStatusQuery,
  useSwitchSectionMutation,
} from "../store/slices/gameApiSlice";
import UserAvatar, { AVATAR_VARIANTS } from "../components/UserAvatar";
import { toast } from "react-toastify";

const ProgressBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const justMasteredId = location.state?.justMasteredId;

  // --- THE AUTO-SCROLL MAGIC ---
  useEffect(() => {
    if (justMasteredId) {
      const scrollTimer = setTimeout(() => {
        const targetCard = document.getElementById(`card-${justMasteredId}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);

      return () => clearTimeout(scrollTimer);
    }
  }, [justMasteredId]);

  const { userInfo } = useSelector((state) => state.auth);
  const currentUsername = userInfo?.username;

  const {
    data: status,
    isLoading,
    // refetch,
  } = useGetUserStatusQuery(currentUsername, {
    skip: !currentUsername,
  });

  const [switchSection, { isLoading: isSwitching }] =
    useSwitchSectionMutation();

  if (isLoading) {
    return (
      <div className="progress-loading">
        <Loader2 className="spinner" />
        <span>Loading Page.</span>
      </div>
    );
  }

  if (!status) return <div className="no-data">No progress data found.</div>;

  const nodes = Object.entries(status.mastery).map(([id, data]) => ({
    id,
    ...data,
  }));

  const cfg = status.masteryConfig || {};
  const minAttempts = cfg.masteryMinAttempts || 5;
  const scoreThreshold = cfg.masteryScoreThreshold || 5;
  const windowSize = cfg.windowSize || 5;

  const calculateHonestProgress = (entry, trulyMastered) => {
    if (entry.status === "mastered" && trulyMastered) return 100;

    const isSkipped =
      entry.status === "mastered" &&
      !trulyMastered &&
      entry.attemptCount === 0 &&
      (entry.adaptiveState?.timesPlayed || 0) === 0;
    if (isSkipped) return 0;

    const recentAttempts = entry.lastAttempts || [];
    const recentSuccesses = recentAttempts.filter(Boolean).length;
    const targetSuccesses = Math.ceil(
      windowSize * (cfg.masterySuccessRate || 0.8),
    );

    return Math.min((recentSuccesses / targetSuccesses) * 100, 100).toFixed(0);
  };

  const curriculumOrder = [
    "single_add",
    "single_sub",
    "multi_add",
    "multi_sub",
    "missing_part_easy",
    "missing_part_hard",
    "combine_mod1",
    "combine_mod2",
    "combine_mod3",
    "combine_mod4",
    "combine_mod5",
    "change_mod1",
    "change_mod2",
    "change_mod3",
    "change_mod4",
    "change_mod5",
    "change_mod6",
  ];

  const practiceIds = ["single_add", "single_sub", "multi_add", "multi_sub"];
  const equationIds = ["missing_part_easy", "missing_part_hard"];

  const sections = [
    {
      id: "practice",
      title: "Practice (Arithmetic)",
      description: "Build your foundation with arithmetic.",
      nodes: nodes.filter((n) => practiceIds.includes(n.id)),
    },
    {
      id: "equations",
      title: "Missing Numbers",
      description: "Find the missing number in equations.",
      nodes: nodes.filter((n) => equationIds.includes(n.id)),
    },
    {
      id: "schemas",
      title: "Word Problems",
      description: "Solve word problems using schemas.",
      nodes: nodes.filter(
        (n) => !practiceIds.includes(n.id) && !equationIds.includes(n.id),
      ),
    },
  ];

  let activeSectionId = null;
  const currentConceptId = status?.zpdNodes?.[0];

  if (currentConceptId) {
    const matchingSection = sections.find((sec) =>
      sec.nodes.some((n) => n.id === currentConceptId),
    );
    if (matchingSection) {
      activeSectionId = matchingSection.id;
    }
  }

  const handleSwitchSection = async (sectionId) => {
    try {
      await switchSection({ sectionId }).unwrap();
      toast.success("Ready to learn!");
      setTimeout(() => {
        navigate("/home");
      }, 100);
    } catch (error) {
      toast.error("Failed to switch section.");
      console.error("Switch Error:", error);
    }
  };

  // 🔥 1. Extracted Card Logic
  const renderCard = (node) => {
    const record =
      node.lastAttempts || node.adaptiveState?.correctnessRecord || [];
    const recentSuccesses = record.filter(Boolean).length;
    const recentSuccessRate =
      record.length > 0 ? recentSuccesses / record.length : 0;

    const trulyMastered =
      node.attemptCount >= minAttempts &&
      recentSuccessRate >= (cfg.masterySuccessRate || 0.8) &&
      node.adaptiveState?.changePointScore >= scoreThreshold;

    const progress = calculateHonestProgress(node, trulyMastered);
    const proficiency =
      node.attemptCount > 0
        ? (((node.successCount || 0) / node.attemptCount) * 100).toFixed(0)
        : 0;
    const isLocked = node.status === "locked";
    const isSkipped =
      node.status === "mastered" &&
      !trulyMastered &&
      node.attemptCount === 0 &&
      (node.adaptiveState?.timesPlayed || 0) === 0;
    const displayStatus =
      node.status === "mastered" && !trulyMastered && !isSkipped
        ? "unlocked"
        : node.status;

    return (
      <div
        key={node.id}
        id={`card-${node.id}`}
        className={`wizard-card ${displayStatus}`}
      >
        {/* --- MASTERY STICKER OVERLAY --- */}
        {displayStatus === "mastered" && !isSkipped && (
          <div className="mastery-sticker-overlay">
            <div
              className={`sticker-seal ${justMasteredId === node.id ? "animate-pop" : "static"}`}
            >
              <span className="sticker-star">★</span>
              <span className="sticker-text">MASTERED</span>
            </div>
          </div>
        )}

        <div className="card-header">
          <span className="node-name">
            {node.id.includes("_mod")
              ? node.id.split("_").slice(1).join(" ")
              : node.id.replace(/_/g, " ")}
          </span>
          <div
            className={`status-badge ${isSkipped ? "skipped" : displayStatus}`}
          >
            {isLocked ? (
              <Lock size={12} />
            ) : isSkipped ? (
              "Skipped"
            ) : displayStatus === "mastered" ? (
              "Completed"
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

            {/* NEW ACCURACY ROW */}
            {/* <div className="accuracy-row">
              <span>Accuracy</span>
              <span>{Math.round(recentSuccessRate * 100)}%</span>
            </div> */}

            <div className="card-footer">
              <div className="skill-orb">
                <span className="orb-value">{proficiency}%</span>
                <label>Accuracy</label>
              </div>

              <div className="history-group">
                <div className="dots">
                  {record.slice(-windowSize).map((isCorrect, i) => (
                    <div
                      key={i}
                      className={`dot ${isCorrect ? "green" : "red"}`}
                    />
                  ))}
                </div>
                <span className="attempts">Attempts: {node.attemptCount}</span>
              </div>
            </div>

            {node.status !== "mastered" && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "1rem",
                  color: "#0071e9",
                  fontSize: "0.9rem",
                  fontStyle: "italic",
                }}
              >
                Actively Learning
              </div>
            )}
          </div>
        ) : (
          <div className="locked-overlay">
            <p>Complete previous nodes to unlock</p>
          </div>
        )}
      </div>
    );
  };

  // 🔥 2. Grouping Logic inside renderNodes
  const renderNodes = (sectionNodes, sectionId) => {
    const sortedNodes = [...sectionNodes].sort((a, b) => {
      const aIdx = curriculumOrder.indexOf(a.id);
      const bIdx = curriculumOrder.indexOf(b.id);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });

    // If it's the Word Problems section, GROUP THEM!
    if (sectionId === "schemas") {
      const grouped = sortedNodes.reduce((acc, node) => {
        // e.g. "combine_mod1" -> "combine"
        const type = node.id.split("_")[0];
        if (!acc[type]) acc[type] = [];
        acc[type].push(node);
        return acc;
      }, {});

      return (
        <div className="schema-groups-wrapper">
          {Object.entries(grouped).map(([type, nodesGroup]) => (
            <div key={type} className="schema-group">
              <div className="schema-group__header">
                <h4 className={`schema-title text-${type}`}>{type} Schema</h4>
                <div className="schema-divider"></div>
              </div>

              <div className="wizard-nodes-grid">
                {nodesGroup.map((node) => renderCard(node))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Default layout for Practice and Equations
    return (
      <div className="wizard-nodes-grid" style={{ marginTop: "20px" }}>
        {sortedNodes.map((node) => renderCard(node))}
      </div>
    );
  };

  return (
    <div className="student__progress">
      <header className="game-header-profile teacher-dashboard__hero">
        <div className="player-badge-profile highlight2">
          <>
            <span className="highlight1">S</span>tudent{" "}
          </>
          <span className="highlight2" style={{ marginLeft: "10px" }}>
            {" "}
            P
          </span>
          rofile: {currentUsername}
          <span className="avatar-preview" style={{ marginLeft: "10px" }}>
            <UserAvatar
              name={userInfo?.avatarSeed}
              variant={userInfo?.avatar}
              size={60}
            />
          </span>
        </div>
        <Link to="/leaderboard" className="teacher-dashboard__secondaryAction">
          <Award size={22} style={{ marginRight: "6px" }} /> Open Full
          Leaderboard
        </Link>
      </header>

      <div className="progress-map-container" style={{ paddingBottom: "50px" }}>
        <div className="progress-page-header">
          <div className="map-title player-badge highlight2">
            <Sparkles
              size={22}
              style={{ color: "#f2cc8f", marginRight: "6px" }}
            />{" "}
            <span className="highlight1"> Y</span>
            <span style={{ marginRight: "6px" }}>our</span>
            <span className="highlight1">K</span>
            <span style={{ marginRight: "6px" }}>nowledge</span>
            <span className="highlight2">M</span>ap
            <strong style={{ marginLeft: "0.4rem" }}></strong>
          </div>
        </div>

        <div className="sections-container">
          {sections.map((section) => {
            const isActiveSection = activeSectionId === section.id;
            const isTouched =
              section.nodes.some(
                (n) =>
                  n.attemptCount > 0 || (n.adaptiveState?.timesPlayed || 0) > 0,
              ) || isActiveSection;

            return (
              <div key={section.id} className="progress-section">
                <div className="progress-section__header">
                  <div className="progress-section__text">
                    <h4 className="progress-section__title">{section.title}</h4>
                    <p className="progress-section__description">
                      {section.description}
                    </p>
                  </div>

                  {isActiveSection ? (
                    <>
                      <div className="active-section-controls">
                        <div className="active-section-badge">
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <Sparkles size={16} /> Currently Active
                          </span>
                        </div>
                        <button
                          className="active-section-badge resume-button"
                          onClick={() => {
                            navigate("/home", {
                              state: { forceRefetch: true },
                            });
                          }}
                        >
                          <Play size={16} fill="currentColor" /> Resume Journey
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      className="progress-section__button"
                      onClick={() => handleSwitchSection(section.id)}
                      disabled={isSwitching}
                    >
                      {isSwitching ? (
                        <Loader2 size={18} className="spinner" />
                      ) : (
                        <span className="button-content">
                          <RefreshCw size={18} className="button-icon" />
                          Switch to this Section
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="progress-section__nodes">
                  {/* 🔥 PASS section.id HERE SO IT KNOWS WHEN TO GROUP */}
                  {isTouched ? (
                    renderNodes(section.nodes, section.id)
                  ) : (
                    <div
                      className="no-data"
                      style={{
                        marginTop: "20px",
                        color: "#94a3b8",
                        textAlign: "center",
                      }}
                    >
                      Not started yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
