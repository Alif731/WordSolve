import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, setCredentials } from "../store/slices/authSlice";
import {
  useLazyGetUserProfileQuery,
  useLoginMutation,
  useRegisterMutation,
} from "../store/slices/usersApiSlice";
import { apiSlice } from "../store/slices/apiSlice";
import getDefaultRouteForRole from "../utils/getDefaultRouteForRole";
import PasswordField from "../components/PasswordField";

import "../sass/page/loginPage.scss";

import { toast } from "react-toastify";

const TeacherAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingStoredSession, setIsCheckingStoredSession] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [getUserProfile] = useLazyGetUserProfileQuery();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    let isActive = true;

    const validateStoredSession = async () => {
      if (!userInfo) {
        setIsCheckingStoredSession(false);
        return;
      }

      setIsCheckingStoredSession(true);

      try {
        const profile = await getUserProfile().unwrap();

        if (!isActive) {
          return;
        }

        dispatch(setCredentials({ ...profile }));
        navigate(getDefaultRouteForRole(profile.role), { replace: true });
      } catch (_error) {
        if (!isActive) {
          return;
        }

        dispatch(logout());
        dispatch(apiSlice.util.resetApiState());
        setError("");
        setIsCheckingStoredSession(false);
      }
    };

    validateStoredSession();

    return () => {
      isActive = false;
    };
  }, [dispatch, getUserProfile, navigate, userInfo]);

  const handleModeToggle = () => {
    setIsLogin((prev) => !prev);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setTeacherCode("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const completeLogin = (payload) => {
    dispatch(apiSlice.util.resetApiState());
    dispatch(setCredentials({ ...payload }));

    toast.success(`Welcome to the Dashboard, ${payload.username}!`);
    navigate(getDefaultRouteForRole(payload?.role), { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    try {
      const res = await login({ username, password, role: "teacher" }).unwrap();
      completeLogin(res);
    } catch (err) {
      setError(err?.data?.message || err.error || "Teacher login failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!teacherCode.trim()) {
      setError("Teacher sign up requires a registration code");
      return;
    }

    try {
      const res = await register({
        username,
        password,
        role: "teacher",
        teacherCode,
      }).unwrap();
      completeLogin(res);
      toast.success("Teacher account created!");
    } catch (err) {
      setError(err?.data?.message || err.error || "Teacher sign up failed");
    }
  };
  const videoSrc = isLogin ? "/TG.mp4" : "/TG1.mp4";

  return (
    <div className="login__main">
      <div className="login__img">
        <video
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="bg-video"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
      <div className="login__container">
        {/* <p className="login__eyebrow">WordSolve</p> */}
        <h1 className="login__container__header">Teacher Portal</h1>
        <p className="login__subtitle">
          {isLogin
            ? "Sign in to manage your classroom dashboard."
            : "Create a teacher account with a valid registration code."}
        </p>

        {!isLogin && (
          <p className="login__roleNote">
            Teacher sign-up requires a Teacher ID
          </p>
        )}

        <div className="login__modeSwitch">
          <button
            type="button"
            className={`login__modeBtn ${isLogin ? "active" : ""}`}
            onClick={() => {
              if (!isLogin) handleModeToggle();
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`login__modeBtn ${!isLogin ? "active" : ""}`}
            onClick={() => {
              if (isLogin) handleModeToggle();
            }}
          >
            Sign Up
          </button>
        </div>

        <div className="login__container__form">
          <form
            onSubmit={isLogin ? handleLogin : handleRegister}
            className="login-form"
          >
            {!isLogin && (
              <div className="input__group">
                <input
                  className="login__container__password"
                  type="text"
                  placeholder="Teacher ID"
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value.toUpperCase())}
                />
              </div>
            )}

            <div className="input__group">
              <input
                className="login__container__name"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <PasswordField
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isVisible={showPassword}
              onPeekStart={() => setShowPassword(true)}
              onPeekEnd={() => setShowPassword(false)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            {!isLogin && (
              <PasswordField
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isVisible={showConfirmPassword}
                onPeekStart={() => setShowConfirmPassword(true)}
                onPeekEnd={() => setShowConfirmPassword(false)}
                autoComplete="new-password"
              />
            )}

            {error && <p className="login__error">{error}</p>}

            <button
              type="submit"
              className="loginMain__btn"
              disabled={
                isCheckingStoredSession || isLoginLoading || isRegisterLoading
              }
            >
              {isCheckingStoredSession
                ? "Checking session..."
                : isLoginLoading || isRegisterLoading
                  ? "Loading..."
                : isLogin
                  ? "Teacher Login"
                  : "Teacher Sign Up"}
            </button>

            <p className="login__toggle" onClick={handleModeToggle}>
              {isLogin
                ? "Need a teacher account? Sign Up"
                : "Already registered? Login"}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherAuth;
