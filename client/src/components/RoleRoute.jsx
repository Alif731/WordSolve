import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import getDefaultRouteForRole from "../utils/getDefaultRouteForRole";

const RoleRoute = ({ allowedRoles = [] }) => {
  const { userInfo } = useSelector((state) => state.auth);

  if (!userInfo) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(userInfo.role)) {
    return <Navigate to={getDefaultRouteForRole(userInfo.role)} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
