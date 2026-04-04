import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../store/slices/authSlice";
import { useUpdateUserMutation } from "../store/slices/usersApiSlice";

import PasswordField from "../components/PasswordField";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";

import "../sass/page/resetPassword.scss";

const ResetPassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const hasPassword = Boolean(userInfo?.hasPassword);
  const [updateProfile, { isLoading }] = useUpdateUserMutation();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();

    if ((!currentPassword && hasPassword) || !password || !confirmPassword) {
      setMessage("Please fill in all fields");
      setIsSuccess(false);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "New passwords do not match";
      setMessage(msg);
      toast.error(msg);
      setIsSuccess(false);
      return;
    }

    try {
      const res = await updateProfile({
        _id: userInfo._id,
        ...(hasPassword ? { currentPassword } : {}),
        password,
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      const successMsg = hasPassword
        ? "Password reset successfully!"
        : "Password created successfully!";

      setMessage(successMsg);
      setIsSuccess(true);
      toast.success(successMsg); //

      // 4. Cleanup
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/profile"), 2000);
    } catch (err) {
      setMessage(err?.data?.message || err.error);
      setIsSuccess(false);
    }
  };

  return (
    <div className="reset-password__main">
      <div className="reset-password__container">
        <button
          className="reset-password__back-icon"
          onClick={() => navigate("/profile")}
          title="Back to Profile"
        >
          <ArrowLeft size={50} />
        </button>
        <h1 className="reset-password__header">
          {hasPassword ? "Reset Password" : "Create Password"}
        </h1>
        <p className="reset-password__subtitle">
          {hasPassword
            ? "Please enter your current and new password below."
            : "Add a password below if you also want to sign in with your username and password."}
        </p>

        <form onSubmit={submitHandler} className="reset-password-form">
          {hasPassword && (
            <PasswordField
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              isVisible={showCurrent}
              onPeekStart={() => setShowCurrent(true)}
              onPeekEnd={() => setShowCurrent(false)}
              autoComplete="current-password"
            />
          )}

          <PasswordField
            placeholder={hasPassword ? "New Password" : "Create Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isVisible={showNew}
            onPeekStart={() => setShowNew(true)}
            onPeekEnd={() => setShowNew(false)}
            autoComplete="new-password"
          />

          <PasswordField
            placeholder={
              hasPassword ? "Confirm New Password" : "Confirm Password"
            }
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isVisible={showConfirm}
            onPeekStart={() => setShowConfirm(true)}
            onPeekEnd={() => setShowConfirm(false)}
            autoComplete="new-password"
          />

          {message && (
            <p
              className={`reset-password__message ${isSuccess ? "success" : "error"}`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="reset-password__btn"
            disabled={isLoading}
          >
            {isLoading
              ? "Updating..."
              : hasPassword
                ? "Reset Password"
                : "Create Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
