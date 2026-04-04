import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, setCredentials } from "../store/slices/authSlice";
import {
  useGetOAuthProvidersQuery,
  useLazyGetUserProfileQuery,
  useLoginMutation,
  useRegisterMutation,
} from "../store/slices/usersApiSlice";
import { apiSlice } from "../store/slices/apiSlice";
import getDefaultRouteForRole from "../utils/getDefaultRouteForRole";
import PasswordField from "../components/PasswordField";
import { toast } from "react-toastify";

import "../sass/page/loginPage.scss";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");
const backendBaseUrl = apiBaseUrl.endsWith("/api")
  ? apiBaseUrl.slice(0, -4)
  : apiBaseUrl;
const googleOAuthUrl = `${backendBaseUrl}/api/users/oauth/google`;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingStoredSession, setIsCheckingStoredSession] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [getUserProfile] = useLazyGetUserProfileQuery();
  const {
    data: oauthProviders,
    isLoading: isOAuthProvidersLoading,
    isError: isOAuthProvidersError,
  } = useGetOAuthProvidersQuery();

  const { userInfo } = useSelector((state) => state.auth);
  const googleEnabled = Boolean(oauthProviders?.google);

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
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const completeLogin = (payload) => {
    sessionStorage.removeItem("visualHintCount");
    sessionStorage.removeItem("lastHintProblemId");
    sessionStorage.removeItem("matchHintCount");
    sessionStorage.removeItem("lastMatchHintId");

    // THE NEW RULE: If it's their 1st login, give 2 hints. Otherwise, give 1.
    const maxHints = payload?.loginCount <= 1 ? 2 : 1;
    sessionStorage.setItem("maxHintsAllowed", maxHints);

    dispatch(apiSlice.util.resetApiState());
    dispatch(setCredentials({ ...payload }));

    toast.success(`Welcome back, ${payload.username}!`);
    navigate(getDefaultRouteForRole(payload?.role), { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    try {
      const res = await login({ username, password, role: "student" }).unwrap();
      completeLogin(res);
    } catch (err) {
      setError(err?.data?.message || err.error || "Login failed");
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

    try {
      const res = await register({
        username,
        password,
        role: "student",
      }).unwrap();
      toast.success("Account created successfully!");
      completeLogin(res);
    } catch (err) {
      setError(err?.data?.message || err.error || "Registration failed");
    }
  };

  const handleGoogleSignIn = () => {
    setError("");

    if (!googleEnabled) {
      return;
    }

    sessionStorage.removeItem("visualHintCount");
    sessionStorage.removeItem("lastHintProblemId");
    sessionStorage.removeItem("matchHintCount");
    sessionStorage.removeItem("lastMatchHintId");

    window.location.assign(googleOAuthUrl);
  };

  const oauthTooltip = isOAuthProvidersLoading
    ? "Checking Google sign-in availability"
    : isOAuthProvidersError
      ? "Could not reach the server"
      : googleEnabled
        ? ""
        : "Credentials not added";

  const videoSrc = isLogin ? "/BG.mp4" : "/BG1.mp4";
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
        <h1 className="login__container__header">WordSolve</h1>
        <p className="login__subtitle">
          {isLogin
            ? "Welcome back. Ready for more math challenges?"
            : "Create your account and start your math journey."}
        </p>

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
                  ? "Login"
                  : "Sign Up"}
            </button>

            <div className="login__divider">
              <span>or</span>
            </div>

            <div
              className={`login__oauthControl ${googleEnabled ? "" : "login__oauthControl--disabled"}`}
              data-tooltip={oauthTooltip}
            >
              <button
                type="button"
                className={`login__oauthBtn ${googleEnabled ? "" : "login__oauthBtn--disabled"}`}
                onClick={handleGoogleSignIn}
                disabled={!googleEnabled}
              >
                {isLogin ? "Continue with Google" : "Sign up with Google"}
              </button>
            </div>

            <p className="login__toggle" onClick={handleModeToggle}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Login"}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
