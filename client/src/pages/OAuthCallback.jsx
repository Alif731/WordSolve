import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setCredentials } from "../store/slices/authSlice";
import { apiSlice } from "../store/slices/apiSlice";
import { useLazyGetUserProfileQuery } from "../store/slices/usersApiSlice";
import getDefaultRouteForRole from "../utils/getDefaultRouteForRole";
import "../sass/page/loginPage.scss";

const LOADING_MESSAGE = "Finishing your Google sign-in...";

const OAuthCallback = () => {
  const [message, setMessage] = useState(LOADING_MESSAGE);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [getUserProfile] = useLazyGetUserProfileQuery();
  const error = searchParams.get("error");
  const showBackButton = Boolean(error) || message !== LOADING_MESSAGE;

  useEffect(() => {
    let isCancelled = false;

    const finishSignIn = async () => {
      if (error) {
        setMessage(error);
        return;
      }

      try {
        const profile = await getUserProfile().unwrap();

        if (isCancelled) {
          return;
        }

        dispatch(apiSlice.util.resetApiState());
        dispatch(setCredentials({ ...profile }));
        navigate(getDefaultRouteForRole(profile.role), { replace: true });
      } catch (err) {
        if (!isCancelled) {
          setMessage(err?.data?.message || err?.error || "Google sign-in could not be completed.");
        }
      }
    };

    finishSignIn();

    return () => {
      isCancelled = true;
    };
  }, [dispatch, error, getUserProfile, navigate]);

  return (
    <div className="login__main">
      <div className="login__container login__container--compact">
        <p className="login__eyebrow">WordSolve</p>
        <h1 className="login__container__header">Google Sign-In</h1>
        <p className="login__subtitle">{message}</p>
        {showBackButton && (
          <button type="button" className="loginMain__btn" onClick={() => navigate("/", { replace: true })}>
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
