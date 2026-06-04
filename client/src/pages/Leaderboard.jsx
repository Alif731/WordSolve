import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { Crown, Settings, Eye, EyeOff, Medal } from "lucide-react";
import UserAvatar from "../components/UserAvatar";

import {
  useGetLeaderboardStatusQuery,
  useGetLeaderboardQuery,
  useUpdateLeaderboardStatusMutation,
} from "../store/slices/leaderboardApiSlice";

import "../sass/page/leaderboardPage.scss";

const Leaderboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === "teacher";
  const isStudent = userInfo?.role === "student";

  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useGetLeaderboardStatusQuery();

  const [updateLeaderboardStatus, { isLoading: isToggling }] =
    useUpdateLeaderboardStatusMutation();

  const isEnabled = Boolean(statusData?.enabled);
  const shouldFetchLeaderboard = useMemo(
    () => Boolean(statusData) && (isEnabled || isTeacher),
    [statusData, isEnabled, isTeacher],
  );

  const {
    data: leaderboardData,
    isLoading: isLeaderboardLoading,
    isError: isLeaderboardError,
    error: leaderboardError,
  } = useGetLeaderboardQuery(50, { skip: !shouldFetchLeaderboard }); // show leaderboard for 50

  /**
   * Sorts the leaderboard entries.
   * Primary criteria: Highest number of correct attempts.
   * Secondary criteria (Tie-breaker): Highest accuracy percentage.
   */
  // const sortedLeaderboard = useMemo(() => {
  //   if (!leaderboardData?.entries) return [];

  //   // 1. Sort the data
  //   const sorted = [...leaderboardData.entries].sort((a, b) => {
  //     // Primary: Who has the most correct answers?
  //     if (b.correctAttempts !== a.correctAttempts) {
  //       return b.correctAttempts - a.correctAttempts;
  //     }
  //     // Tie-Breaker: If correct answers are tied, who has the better accuracy?
  //     return b.accuracy - a.accuracy;
  //   });

  //   // 2. Re-assign the rank numbers (1, 2, 3...) based on the new sorted order
  //   return sorted.map((entry, index) => ({
  //     ...entry,
  //     rank: index + 1,
  //   }));
  // }, [leaderboardData]);

  /**
   * Sorts the leaderboard entries using a "True Mastery Score"
   * Combines Correct Answers, Accuracy, AND Total Questions Attempted.
   */

  const sortedLeaderboard = useMemo(() => {
    if (!leaderboardData?.entries) return [];

    // 1. Calculate a unified "Power Score" for each student
    const entriesWithScores = [...leaderboardData.entries].map((entry) => {
      // Base Score: Punishes spamming (e.g., 10 correct * 0.50 accuracy = 5 base points)
      const baseScore = entry.correctAttempts * (entry.accuracy / 100);

      // Volume Bonus: Rewards hard work (e.g., +0.1 points just for trying a question)
      // This ensures a student who did 100 questions beats a student who did 1 question!
      const volumeBonus = entry.totalAttempts * 0.1;

      // Final unified score
      const powerScore = baseScore + volumeBonus;

      return { ...entry, powerScore };
    });

    // 2. Sort everyone by their new Power Score (highest to lowest)
    const sorted = entriesWithScores.sort(
      (a, b) => b.powerScore - a.powerScore,
    );

    // 3. Re-assign the rank numbers (1, 2, 3...) based on the new order
    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [leaderboardData]);

  const toggleLeaderboard = async () => {
    if (!isTeacher || isToggling) return;
    await updateLeaderboardStatus(!isEnabled).unwrap();
  };

  return (
    <div className="leaderboard-page animate-fade-in">
      <header className="leaderboard-header teacher-dashboard__hero">
        <div className="title-wrapper">
          <Crown size={36} className="header-icon" />
          <div>
            <h1>Class Rankings</h1>
            <p>Friendly competition powered by real-time learning.</p>
          </div>
          {isTeacher && (
            <button
              className={`control-btn ${isEnabled ? "red" : "green"}`}
              onClick={toggleLeaderboard}
              disabled={isToggling}
            >
              {isToggling ? (
                "Updating..."
              ) : isEnabled ? (
                <>
                  Disable Leaderboard <EyeOff size={18} />
                </>
              ) : (
                <>
                  Enable Leaderboard <Eye size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {isStatusLoading ? (
        <div className="leaderboard-panel loading-state">
          Synchronizing data...
        </div>
      ) : isStatusError ? (
        <div className="leaderboard-panel error-state">
          {statusError?.data?.message || "Failed to load leaderboard settings"}
        </div>
      ) : (
        <>
          {/* TABLE PANEL */}
          {!isEnabled && !isTeacher ? (
            <div className="leaderboard-panel empty-state">
              <EyeOff size={32} className="text-gray" />
              <h3>Leaderboard Hidden</h3>
              <p>Your teacher has temporarily disabled the rankings.</p>
            </div>
          ) : isLeaderboardLoading ? (
            <div className="leaderboard-panel loading-state">
              Calculating ranks...
            </div>
          ) : isLeaderboardError ? (
            <div className="leaderboard-panel error-state">
              {leaderboardError?.data?.message || "Failed to load leaderboard"}
            </div>
          ) : (
            <section className="leaderboard-panel table-panel">
              <div className="status-info">
                <Settings size={20} className="text-gray" />
                <span className="label-text">Visibility Status:</span>
                <span
                  className={`status-badge ${isEnabled ? "active" : "inactive"}`}
                >
                  {isEnabled ? "Live & Enabled" : "Hidden & Disabled"}
                </span>
              </div>

              {leaderboardData?.entries?.length ? (
                <div className="leaderboard-table-wrapper">
                  <table className="leaderboard-table">
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
                      {/* {leaderboardData.entries.map((entry) => ( */}
                      {sortedLeaderboard.map((entry) => (
                        <tr
                          key={entry.userId}
                          className={`rank-row ${entry.rank <= 3 ? `top-${entry.rank}` : ""}`}
                        >
                          <td className="rank-cell">
                            {entry.rank === 1 && (
                              <Medal size={35} color="#fbbf24" />
                            )}
                            {entry.rank === 2 && (
                              <Medal size={35} color="#94a3b8" />
                            )}
                            {entry.rank === 3 && (
                              <Medal size={35} color="#f16e09" />
                            )}
                            {entry.rank > 3 && `#${entry.rank}`}
                          </td>
                          <td className="student-cell">
                            <span className="avatar">
                              <UserAvatar
                                name={entry.avatarSeed}
                                variant={entry.avatar}
                                size={32}
                              />
                            </span>
                            <span className="student-name">
                              {entry.username}
                            </span>
                          </td>
                          <td>{entry.correctAttempts}</td>
                          <td>{entry.totalAttempts}</td>
                          <td>
                            <span className="accuracy-pill">
                              {entry.accuracy}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="leaderboard__empty-state animate-fade-in">
                  <p>
                    {isStudent
                      ? "Your journey to the top begins here."
                      : "No scores have been recorded yet."}
                  </p>

                  {/* Dynamic Link */}
                  <Link
                    to={isStudent ? "/home" : "/teacher/dashboard"}
                    className="leaderboard-action-btn"
                  >
                    {isStudent ? "Start Journey" : "Classroom Insight"}
                  </Link>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
