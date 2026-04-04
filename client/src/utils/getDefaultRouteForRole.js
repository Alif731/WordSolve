const getDefaultRouteForRole = (role) => {
  if (role === "teacher") {
    return "/teacher/dashboard";
  }

  return "/home";
};

export default getDefaultRouteForRole;
