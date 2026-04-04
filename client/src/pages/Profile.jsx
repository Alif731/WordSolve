import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGetUserStatusQuery } from "../store/slices/gameApiSlice";
import { useSelector, useDispatch } from "react-redux";
import {
  useUpdateUserMutation,
  useGetRecentActivityQuery,
} from "../store/slices/usersApiSlice";
import { setCredentials } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import "../sass/page/profilePage.scss";
import { CheckCircle2, XCircle, Activity, BarChart3 } from "lucide-react";
import UserAvatar, { AVATAR_VARIANTS } from "../components/UserAvatar";
import { toast } from "react-toastify";

export default function Profile() {
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("beam");
  const [message, setMessage] = useState(null);

  // Tab state defaults to 'performance'
  const [activeTab, setActiveTab] = useState("performance");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const currentUsername = userInfo?.username;
  const hasPassword = Boolean(userInfo?.hasPassword);
  const isGooglePrimary = userInfo?.authProvider === "google";
  const isTeacher = userInfo?.role === "teacher";
  const isStudent = userInfo?.role === "student";

  const { data: status } = useGetUserStatusQuery(currentUsername, {
    skip: !currentUsername,
  });

  const { data: recentActivity, isLoading: loadingActivity } =
    useGetRecentActivityQuery();

  const [updateProfile, { isLoading }] = useUpdateUserMutation();

  useEffect(() => {
    if (userInfo) {
      setUsername(userInfo.username);
      setSelectedAvatar(userInfo.avatar || "beam");
    }
  }, [userInfo]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({
        _id: userInfo._id,
        username,
        avatar: selectedAvatar,
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(null), 3000);
      toast.success(`Profile updated successfully!`);
    } catch (err) {
      setMessage(err?.data?.message || err.error);
    }
  };

  return (
    <div className="profile-page">
      <header className="game-header-profile teacher-dashboard__hero">
        <div className="player-badge-profile highlight2">
          {isTeacher ? (
            <>
              <span className="highlight1">T</span>eacher{" "}
            </>
          ) : (
            <>
              <span className="highlight1">S</span>tudent{" "}
            </>
          )}
          <span className="highlight2">P</span>rofile: {currentUsername}
          <span className="avatar-preview" style={{ marginLeft: "10px" }}>
            <UserAvatar
              name={userInfo?.avatarSeed}
              variant={userInfo?.avatar}
              size={60}
            />
          </span>
        </div>
        <div className="student__link">
          <Link
            to="/leaderboard"
            className="teacher-dashboard__secondaryAction"
          >
            Open Full Leaderboard
          </Link>
          <Link to="/progress" className="teacher-dashboard__secondaryAction">
            My Progress
          </Link>
        </div>
      </header>

      {/* TABS (Only visible for students, teachers just see settings) */}
      {isStudent && (
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "performance" ? "active" : ""}`}
            onClick={() => setActiveTab("performance")}
          >
            <BarChart3 size={18} /> Profile
          </button>

          <button
            className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            <Activity size={18} /> Recent Activity
          </button>
        </div>
      )}

      {/* <main
        className="profile-layout"
        style={{ display: isTeacher ? "block" : "grid" }}
      > */}
      <main
        className="profile-layout"
        style={{
          display: isTeacher || activeTab === "activity" ? "block" : "grid",
        }}
      >
        <div className="profile-main-content">
          {/* TAB 1: PERFORMANCE & SETTINGS */}
          {activeTab === "performance" && (
            <div className="animate-fade-in">
              {isStudent && (
                <section className="profile-section">
                  <h2 className="profile-section-title">Learning Summary</h2>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-label">Role</span>
                      <span className="stat-value">{userInfo?.role}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Unlocked</span>
                      <span className="stat-value">
                        {status
                          ? Object.values(status.mastery).filter(
                              (m) => m.status !== "locked",
                            ).length
                          : 0}
                      </span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Mastered</span>
                      <span className="stat-value">
                        {status
                          ? Object.values(status.mastery).filter(
                              (m) => m.status === "mastered",
                            ).length
                          : 0}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* Profile Settings (Visible to both Student and Teacher) */}
              <div className="profile-settings-row">
                <section className="profile-section avatar-card">
                  <h2 className="profile-section-title">Choose Your Avatar</h2>

                  <div className="avatar-grid">
                    {AVATAR_VARIANTS.map((variant) => (
                      <div
                        key={variant}
                        className={`avatar-option ${selectedAvatar === variant ? "selected" : ""}`}
                        onClick={() => setSelectedAvatar(variant)}
                        style={{
                          cursor: "pointer",
                          padding: "10px",
                          borderRadius: "16px",
                          border:
                            selectedAvatar === variant
                              ? "3px solid #5850ec"
                              : "3px solid transparent",
                          background:
                            selectedAvatar === variant
                              ? "#f3f4f6"
                              : "transparent",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* Generates a unique SVG based on their username and the chosen style! */}
                        <UserAvatar
                          name={userInfo.avatarSeed}
                          variant={variant}
                          size={60}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                    <button
                      className="profile-btn"
                      onClick={handleUpdateProfile}
                      disabled={
                        isLoading || selectedAvatar === userInfo?.avatar
                      }
                    >
                      Confirm Avatar Style
                    </button>
                  </div>
                </section>

                <section className="profile-section account-card">
                  <h2 className="profile-section-title">Account Settings</h2>
                  {isGooglePrimary && (
                    <p className="profile-auth-note">
                      Signed in with Google{" "}
                      {userInfo?.email ? ` as ${userInfo.email}` : ""}.{" "}
                      {hasPassword
                        ? "You can use Google or your password when you come back."
                        : "Add a password below if you also want to sign in with your username."}
                    </p>
                  )}
                  <form onSubmit={handleUpdateProfile} className="profile-form">
                    <div className="input__group">
                      <label>Username</label>
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="profile-btn"
                      disabled={isLoading || username === userInfo?.username}
                    >
                      {isLoading ? "Updating..." : "Update Username"}
                    </button>
                  </form>
                  <p
                    className="password-link"
                    onClick={() => navigate("/reset-password")}
                  >
                    {hasPassword
                      ? "Need to change your password?"
                      : "Want to add a password for direct sign-in?"}{" "}
                    <span className="highlight-text">
                      {hasPassword ? "Reset Password" : "Create Password"}
                    </span>
                  </p>
                  {message && (
                    <p
                      className={`profile-message ${message.includes("successfully") ? "success" : "error"}`}
                    >
                      {message}
                    </p>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: RECENT ACTIVITY */}
          {activeTab === "activity" && (
            <div className="animate-fade-in">
              {isStudent && (
                <section className="profile-section">
                  <h2 className="profile-section-title">Recent Activity</h2>

                  {loadingActivity ? (
                    <p className="loading-text">Loading activity...</p>
                  ) : (
                    <div className="activity-list">
                      {recentActivity && recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                          <div
                            key={activity._id}
                            className={`activity-item ${
                              activity.isCorrect
                                ? "activity-item--correct"
                                : "activity-item--incorrect"
                            }`}
                          >
                            <div className="activity-icon-container">
                              {activity.isCorrect ? (
                                <CheckCircle2
                                  size={20}
                                  className="icon-success"
                                />
                              ) : (
                                <XCircle size={20} className="icon-error" />
                              )}
                            </div>

                            <div className="activity-details">
                              <span className="activity-text">
                                Solved{" "}
                                <strong>
                                  {activity.conceptId?.replace(/_/g, " ")}
                                </strong>{" "}
                                problem
                              </span>
                              <span className="activity-date">
                                {new Date(
                                  activity.timestamp,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="activity-empty-state animate-fade-in">
                          <div className="icon-wrapper">
                            <Activity size={40} />
                          </div>
                          <p>
                            No recent activity found. <br />
                            Solve your first problem to start tracking your
                            progress here.
                          </p>
                          <p></p>
                          <Link to="/home" className="start-learning-btn">
                            Start Learning Now
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        {/* {isStudent && activeTab === "performance" && (
          <aside className="sidebar-section">
            <ProgressBar status={status} />
          </aside>
        )} */}
      </main>
    </div>
  );
}
