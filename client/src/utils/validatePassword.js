export const validatePassword = (password) => {
  if (typeof password !== "string") {
    return { error: "Password must be a string" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long" };
  }
  if (password.length > 72) {
    return { error: "Password must be 72 characters or fewer" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { error: "Password must contain at least one letter" };
  }
  if (!/\d/.test(password)) {
    return { error: "Password must contain at least one number" };
  }

  return { error: null };
};
