import { useState, useRef, useEffect } from "react";
import { IoMenuSharp } from "react-icons/io5";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useLogoutMutation } from "../store/slices/usersApiSlice";
import { logout } from "../store/slices/authSlice";
import { apiSlice } from "../store/slices/apiSlice";
import "../sass/components/header.scss";
import UserAvatar from "./UserAvatar";
import { toast } from "react-toastify";

export default function Header() {
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === "teacher";
  const isStudent = userInfo?.role === "student";

  const defaultRoute = userInfo
    ? userInfo.role === "teacher"
      ? "/teacher/dashboard"
      : "/home"
    : "/";

  const guestAuthLink =
    location.pathname === "/teacher/auth"
      ? { to: "/", label: "Student Login" }
      : { to: "/teacher/auth", label: "Teacher Login" };

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();

  const navBarExpandHandler = () => {
    setIsNavExpanded((prevIsNavExpanded) => !prevIsNavExpanded);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logoutHandler = async () => {
    try {
      setShowDropdown(false);
      await logoutApiCall().unwrap();
      dispatch(logout());
      dispatch(apiSlice.util.resetApiState());
      navigate("/");
      toast.success("Logged out successfully.");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav id="navbarParent">
      <ul
        className={`navbar ${!isNavExpanded ? "expanded" : ""} ${userInfo ? "logged-in" : ""}`}
      >
        <li className="navbar__item">
          <Link to={defaultRoute} className="navbar__item__title">
            Maths Wizard
          </Link>
          <div className="navbar__item__icon" onClick={navBarExpandHandler}>
            <IoMenuSharp />
          </div>
        </li>

        {userInfo ? (
          <>
            {isTeacher && (
              <li
                className={`navbar__item navbar__item--nav ${!isNavExpanded ? "expanded" : ""}`}
              >
                <Link to="/teacher/dashboard" className="navbar__item__link">
                  Teacher Dashboard
                </Link>
              </li>
            )}

            {isStudent && (
              <>
                <li
                  className={`navbar__item navbar__item--nav ${!isNavExpanded ? "expanded" : ""}`}
                >
                  <Link to="/student-hub" className="navbar__item__link">
                    Topics
                  </Link>
                </li>
                <li
                  className={`navbar__item navbar__item--nav ${!isNavExpanded ? "expanded" : ""}`}
                >
                  <Link to="/progress" className="navbar__item__link">
                    My Progress
                  </Link>
                </li>
              </>
            )}

            <li
              className={`navbar__item navbar__item--nav ${!isNavExpanded ? "expanded" : ""}`}
            >
              <Link to="/leaderboard" className="navbar__item__link">
                Leaderboard
              </Link>
            </li>

            <li
              className="navbar__item navbar__item--avatar user-dropdown-container"
              ref={dropdownRef}
            >
              <div className="avatar-trigger" onClick={toggleDropdown}>
                <UserAvatar
                  name={userInfo.avatarSeed}
                  variant={userInfo.avatar}
                  size={40}
                />
              </div>

              {showDropdown && (
                <div className="dropdown-menu">
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <div className="dropdown-divider"></div>
                  <a
                    onClick={logoutHandler}
                    className="dropdown-item"
                    style={{ cursor: "pointer" }}
                  >
                    Logout
                  </a>
                </div>
              )}
            </li>
          </>
        ) : (
          <li
            className={`navbar__item navbar__item--nav ${!isNavExpanded ? "expanded" : ""}`}
          >
            <Link to={guestAuthLink.to} className="navbar__item__link">
              {guestAuthLink.label}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
