const getDefaultRouteForRole = (role, loginCount = 0) => {
  if (role === "teacher") {
    return "/teacher/dashboard";
  }

  if (loginCount <= 1) {
    return "/student-hub";
  }

  return "/home";
};

export default getDefaultRouteForRole;
