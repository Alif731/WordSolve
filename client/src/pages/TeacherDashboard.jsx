import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  CheckCircle2,
  HelpCircle,
  Trophy,
  Activity,
  Eye,
  EyeOff,
  BarChart3,
  AlertCircle,
  Users,
  Calculator, // For Math Attempts
  Target, // For Accuracy
  Award, // For Leaderboard status
  SlidersHorizontal, // For Controls
} from "lucide-react";
import UserAvatar from "../components/UserAvatar";

// API Slices
import {
  useGetLeaderboardQuery,
  useGetLeaderboardStatusQuery,
  useUpdateLeaderboardStatusMutation,
} from "../store/slices/leaderboardApiSlice";

import { useGetClassroomStatsQuery } from "../store/slices/usersApiSlice";
import { useGetRecentActivityQuery } from "../store/slices/usersApiSlice";

import Heatmap from "../components/HeatMap";
import StudentMasteryRoster from "../components/StudentMasteryRoster";

// Styling
import "../sass/page/teacherDashboardPage.scss";
import "../sass/components/heatmap.scss";

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("performance"); // Tab state: 'activity' or 'rankings'
  const [searchTerm, setSearchTerm] = useState(""); // filter student

  const [actionError, setActionError] = useState("");

  // 1. User & Role Context
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === "teacher";
  const displayUsername = userInfo?.username || "Teacher";

  // 2. Data Fetching - Activity Feed (Polls every 3s)
  const { data: recentActivity, isLoading: loadingActivity } =
    useGetRecentActivityQuery(undefined, { pollingInterval: 3000 });

  // 3. Data Fetching - Leaderboard Status
  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useGetLeaderboardStatusQuery(undefined, {
    pollingInterval: 3000,
  });

  // --- Logic for Filtering Activity ---
  const filteredActivity = recentActivity?.filter((activity) =>
    activity.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 4. Mutation - Toggle Leaderboard
  const [updateLeaderboardStatus, { isLoading: isToggling }] =
    useUpdateLeaderboardStatusMutation();

  const { data: leaderboardData, isLoading: isLeaderboardLoading } =
    useGetLeaderboardQuery(5, {
      skip: !statusData,
      pollingInterval: 3000, // live refresh
    });

  // --- Logic & Calculations ---
  const isEnabled = Boolean(statusData?.enabled);
  const entries = leaderboardData?.entries || [];

  const totalAttempts = entries.reduce(
    (sum, entry) => sum + (entry.totalAttempts || 0),
    0,
  );
  const totalCorrect = entries.reduce(
    (sum, entry) => sum + (entry.correctAttempts || 0),
    0,
  );
  const averageAccuracy = entries.length
    ? Number(
        (
          entries.reduce((sum, entry) => sum + (entry.accuracy || 0), 0) /
          entries.length
        ).toFixed(1),
      )
    : 0;

  const toggleLeaderboard = async () => {
    if (isToggling) return;
    setActionError("");
    try {
      await updateLeaderboardStatus(!isEnabled).unwrap();
    } catch (error) {
      setActionError(
        error?.data?.message || "Failed to update leaderboard status",
      );
    }
  };

  const { data: classroomData, isLoading: isLoadingStats } =
    useGetClassroomStatsQuery(undefined, {
      pollingInterval: 3000, //  Add this to sync every 3 seconds
    });

  const strugglingAlerts = useMemo(() => {
    if (!classroomData) return [];

    console.log("DEBUG: Full Classroom Data:", classroomData);

    const alerts = [];
    classroomData.forEach((student) => {
      student.nodes?.forEach((node) => {
        // console.log("DEBUG: Single Node Data:", node); //

        const actualId = node.nodeId || node.conceptId || node.id || node._id;

        const nodeTitle = actualId
          ? actualId.replace(/_/g, " ")
          : "Unknown Node";

        if (node.attempts > 5 && node.score < 4.0) {
          alerts.push({
            id: `${student.id}-${actualId || Math.random()}`,
            name: student.username,
            node: nodeTitle,
            attempts: node.attempts,
            score: Number(node.score).toFixed(2),
          });
        }
      });
    });
    return alerts;
  }, [classroomData]);

  return (
    <div className="teacher-dashboard">
      <header className="teacher-dashboard__hero">
        <div className="player-badge-profile highlight2">
          <span className="highlight1">T</span>eacher{" "}
          <span className="highlight2">P</span>rofile: {displayUsername}
          <span className="avatar-preview" style={{ marginLeft: "10px" }}>
            <UserAvatar
              name={userInfo?.avatarSeed}
              variant={userInfo?.avatar}
              size={35}
            />
          </span>
        </div>

        <Link to="/leaderboard" className="teacher-dashboard__secondaryAction">
          Open Full Leaderboard
        </Link>
      </header>
      {/* 1. TABS AT THE VERY TOP */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "performance" ? "active" : ""}`}
          onClick={() => setActiveTab("performance")}
        >
          <BarChart3 size={18} /> Mastery Insights
        </button>

        <button
          className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          <Activity size={18} /> Live Feed
        </button>
      </div>

      {/* --- TAB 1: MANAGEMENT & RANKINGS --- */}
      {activeTab === "performance" && (
        <div className="animate-fade-in">
          {/* Stats Grid */}
          <section className="teacher-dashboard__grid">
            <article className="teacher-dashboard__stat">
              <span>
                {" "}
                <Award size={16} /> Leaderboard{" "}
              </span>
              <strong>{isEnabled ? "Enabled" : "Disabled"}</strong>
              <small>Visible to Students</small>
            </article>
            <article className="teacher-dashboard__stat">
              <span>
                {" "}
                <Users size={16} />
                Students Ranked{" "}
              </span>
              <strong>{entries.length}</strong>
              <small>Active Participants</small>
            </article>
            <article className="teacher-dashboard__stat">
              <span>
                {" "}
                <Calculator size={16} />
                Total Attempts
              </span>
              <strong>{totalAttempts}</strong>
              <small>Across Preview</small>
            </article>
            <article className="teacher-dashboard__stat">
              <span>
                <Target size={16} />
                Avg. Accuracy
              </span>
              <strong>{averageAccuracy}%</strong>
              <small>Class Performance</small>
            </article>
          </section>

          {/* Classroom Controls */}
          <section className="teacher-dashboard__panel teacher-dashboard__panel--split">
            <div className="control-info">
              <h2>
                {" "}
                <SlidersHorizontal size={18} />
                Classroom Controls
              </h2>
              <p>
                {isEnabled
                  ? "The leaderboard is currently live for all students."
                  : "The leaderboard is hidden."}
              </p>
            </div>
            <button
              className={`teacher-dashboard__action ${isEnabled ? "btn--disable" : "btn--enable"}`}
              onClick={toggleLeaderboard}
              disabled={isToggling}
            >
              {isEnabled ? (
                <>
                  Disable Leaderboard <EyeOff size={18} />
                </>
              ) : (
                <>
                  Enable Leaderboard <Eye size={18} />
                </>
              )}
            </button>
          </section>

          {/* Rankings Table */}
          <section className="teacher-dashboard__panel">
            <div className="teacher-dashboard__panelHeader">
              <h2>
                <Trophy size={20} /> Top Five Rankings
              </h2>
            </div>
            <div className="teacher-dashboard__tableWrapper">
              <table className="teacher-dashboard__table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Correct</th>
                    <th>Attempts</th>
                    <th>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.userId}>
                      <td>#{entry.rank}</td>
                      <td className="teacher-dashboard__studentCell">
                        <div
                          className="teacher-dashboard__avatar-container"
                          style={{
                            marginRight: "12px",
                            display: "inline-block",
                            verticalAlign: "middle",
                          }}
                        >
                          <UserAvatar
                            name={entry.avatarSeed}
                            variant={entry.avatar}
                            size={32}
                          />
                        </div>
                        <span>{entry.username}</span>
                      </td>
                      <td>{entry.correctAttempts}</td>
                      <td>{entry.totalAttempts}</td>
                      <td>{entry.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="teacher-dashboard__panel alert-panel">
            <div className="panel-header">
              <h2>
                <BarChart3 size={18} /> Learning Alerts
              </h2>
              <div className="info-tooltip">
                <HelpCircle size={14} />
                <span className="tooltip-text">
                  Flags students who need help based on high attempts and low
                  scores.
                </span>
              </div>
            </div>

            <div className="alert-list">
              {strugglingAlerts.length > 0 ? (
                strugglingAlerts.map((entry) => {
                  const severity = entry.attempts > 8 ? "high" : "medium";

                  return (
                    <div
                      key={entry.id}
                      className={`intervention-card ${severity}`}
                    >
                      <div className="card-left">
                        <div className="student-profile">
                          <span className="student-name">
                            {entry.name} {""}
                          </span>
                          <span className="intervention-reason">
                            Struggle Area: <i>{entry.node}</i>
                          </span>
                        </div>
                      </div>

                      <div className="card-middle">
                        <div className="stat-pill">
                          <label>Attempts</label>
                          <strong>{entry.attempts}</strong>
                        </div>
                        <div className="stat-pill">
                          <label>AI Confidence</label>
                          <strong className="score-low">{entry.score}</strong>
                        </div>
                      </div>

                      <div className="card-right">
                        <div className="gap-analysis">
                          <label>Mastery Gap</label>
                          <div className="mini-track">
                              <div
                                className="mini-fill"
                                style={{
                                  width: `${Math.max((entry.score / 8) * 100, 2)}%`,
                                }}
                              />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-alerts"> All students are on track!</div>
              )}
            </div>
          </section>
          <Heatmap classroomData={classroomData} />
          <StudentMasteryRoster classroomData={classroomData} />
        </div>
      )}

      {/* --- TAB 2: LIVE PREVIEW ONLY --- */}
      {activeTab === "activity" && (
        <section className="teacher-dashboard__panel live-monitor-mode animate-fade-in">
          <div className="teacher-dashboard__panelHeader">
            <div className="live-indicator">
              <div className="pulse-dot"></div> {/* Added a CSS pulse class */}
              <h2>Real-Time Diagnostic Stream</h2>
            </div>
            <div className="activity-filter-box">
              <Users size={16} />
              <input
                type="text"
                placeholder="Filter by student identifier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="clear-btn">
                  &times;
                </button>
              )}
            </div>
          </div>

          {loadingActivity ? (
            <p className="loading-text">Aggregating classroom telemetry...</p>
          ) : (
            <div className="activity-list activity-list--full">
              {filteredActivity && filteredActivity.length > 0 ? (
                filteredActivity.map((activity) => (
                  <div
                    key={activity._id}
                    className={`activity-item ${activity.isCorrect ? "activity-item--correct" : "activity-item--incorrect"}`}
                  >
                    <div className="activity-icon-container">
                      {activity.isCorrect ? (
                        <CheckCircle2 size={20} className="icon-success" />
                      ) : (
                        <AlertCircle size={20} className="icon-error" />
                      )}
                    </div>
                    <div className="activity-details">
                      <span className="activity-text">
                        <strong className="student-name">
                          {activity.user?.username || "Student"} is
                        </strong>{" "}
                        {activity.isCorrect
                          ? "improving in "
                          : "struggling with "}
                        <strong className="concept-highlight">
                          {activity.conceptId?.replace(/_/g, " ")}
                        </strong>
                      </span>
                      <span className="activity-date">
                        {new Date(activity.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">
                  {searchTerm
                    ? `No diagnostic records for "${searchTerm}"`
                    : "Awaiting student engagement data..."}
                </p>
              )}
            </div>
          )}
          <p className="feed-footer">
            <Activity size={12} /> Real-time updates as students solve problems.
          </p>
        </section>
      )}
    </div>
  );
};

export default TeacherDashboard;
