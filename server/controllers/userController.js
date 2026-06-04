const crypto = require("crypto");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const TeacherSignupCode = require("../models/TeacherSignupCode");
const generateToken = require("../utils/generateToken");
const { clearTokenCookie } = require("../utils/generateToken");
const {
  buildGoogleAuthorizationUrl,
  exchangeGoogleCodeForTokens,
  fetchGoogleUserProfile,
  isGoogleOAuthConfigured,
} = require("../utils/googleOAuth");

const DEFAULT_ROLE = "student";
const VALID_ROLES = ["student", "teacher"];
const DEFAULT_ZPD_NODES = ["single_add"];
const DEFAULT_AVATAR = "beam";
const GOOGLE_STATE_COOKIE = "google_oauth_state";
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;
const AVATAR_VARIANTS = new Set([
  "beam",
  "marble",
  "pixel",
  "ring",
  "sunset",
  "bauhaus",
]);

const readTrimmedString = (value) => (typeof value === "string" ? value.trim() : "");
const readString = (value) => (typeof value === "string" ? value : "");

const validateUsername = (username) => {
  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "Username must be 3-24 characters and use only letters, numbers, or underscores",
    };
  }

  return { error: null };
};

const validatePassword = (password) => {
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

const buildUserResponse = (user) => ({
  _id: user._id,
  username: user.username,
  role: user.role,
  zpdNodes: user.zpdNodes,
  avatar: user.avatar,
  avatarSeed: user.avatarSeed,
  authProvider: user.authProvider,
  loginCount: user.loginCount,
  email: user.email || null,
  hasPassword: Boolean(user.password),
});

const getClientUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");

const getGoogleStateCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV !== "development",
  sameSite: "lax",
  maxAge: 10 * 60 * 1000,
});

const clearGoogleStateCookie = (res) => {
  res.cookie(GOOGLE_STATE_COOKIE, "", {
    ...getGoogleStateCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
};

const getGoogleCallbackRedirect = (message) => {
  const url = new URL("/oauth/callback", getClientUrl());

  if (message) {
    url.searchParams.set("error", message);
  }

  return url.toString();
};

const normalizeUsername = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  return normalized || "student";
};

const getPreferredGoogleUsername = (profile) => {
  const emailPrefix = profile.email ? profile.email.split("@")[0] : "";
  const nameCandidate = normalizeUsername(profile.name);

  if (nameCandidate !== "student") {
    return nameCandidate;
  }

  return normalizeUsername(emailPrefix);
};

const ensureUniqueUsername = async (
  preferredUsername,
  excludeUserId = null,
) => {
  const base = normalizeUsername(preferredUsername);
  let suffix = 0;

  while (true) {
    const suffixText = suffix === 0 ? "" : String(suffix);
    const usernameBase =
      suffix === 0 ? base : base.slice(0, Math.max(1, 24 - suffixText.length));
    const candidate = `${usernameBase}${suffixText}`;
    const existingUser = await User.findOne({
      username: candidate,
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    }).select("_id");

    if (!existingUser) {
      return candidate;
    }

    suffix += 1;
  }
};

const parseRequestedRole = (value) => {
  const normalizedRole = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalizedRole) {
    return { role: null };
  }

  if (!VALID_ROLES.includes(normalizedRole)) {
    return { error: "Invalid role selected" };
  }

  return { role: normalizedRole };
};

const normalizeTeacherCode = (value) =>
  readTrimmedString(value).toUpperCase();

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = async (req, res) => {
  const username = readTrimmedString(req.body?.username);
  const password = readString(req.body?.password);
  const { role: requestedRole, error: roleError } = parseRequestedRole(
    req.body?.role,
  );

  if (!username || !password) {
    res
      .status(400)
      .json({ message: "Please enter both username and password" });
    return;
  }

  if (roleError) {
    res.status(400).json({ message: roleError });
    return;
  }

  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    if (requestedRole && user.role !== requestedRole) {
      res.status(403).json({
        message: `This account belongs to the ${user.role} portal. Please use the ${user.role} login.`,
      });
      return;
    }
    // visual hint count
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    generateToken(res, user._id);
    res.status(200).json(buildUserResponse(user));
    return;
  }

  res.status(401).json({ message: "Invalid username or password" });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const username = readTrimmedString(req.body?.username);
  const password = readString(req.body?.password);
  const teacherCode = normalizeTeacherCode(req.body?.teacherCode);
  const { role: requestedRole, error: roleError } = parseRequestedRole(
    req.body?.role,
  );
  const role = requestedRole || DEFAULT_ROLE;
  const isTeacherRegistration = role === "teacher";

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  const { error: usernameError } = validateUsername(username);
  if (usernameError) {
    res.status(400).json({ message: usernameError });
    return;
  }

  const { error: passwordError } = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ message: passwordError });
    return;
  }

  if (roleError) {
    res.status(400).json({ message: roleError });
    return;
  }

  const userExists = await User.findOne({ username });

  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  if (isTeacherRegistration) {
    if (!teacherCode) {
      res
        .status(400)
        .json({ message: "Teacher sign up requires a registration code" });
      return;
    }

    const matchingTeacherCode = await TeacherSignupCode.findOne({
      code: teacherCode,
      isActive: true,
    }).select("_id");

    if (!matchingTeacherCode) {
      res.status(403).json({ message: "Invalid teacher registration code" });
      return;
    }
  }

  const user = await User.create({
    username,
    password,
    role,
    authProvider: "local",
    mastery: {},
    zpdNodes: isTeacherRegistration ? [] : DEFAULT_ZPD_NODES,
    avatar: DEFAULT_AVATAR,
  });

  generateToken(res, user._id);
  res.status(201).json(buildUserResponse(user));
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  clearGoogleStateCookie(res);
  clearTokenCookie(res);
  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get enabled OAuth providers
// @route   GET /api/users/oauth/providers
// @access  Public
const getOAuthProviders = (_req, res) => {
  res.json({
    google: isGoogleOAuthConfigured(),
  });
};

// @desc    Redirect user to Google OAuth
// @route   GET /api/users/oauth/google
// @access  Public
const startGoogleOAuth = (_req, res) => {
  if (!isGoogleOAuthConfigured()) {
    res.redirect(
      getGoogleCallbackRedirect("Google sign-in is not configured yet."),
    );
    return;
  }

  const state = crypto.randomBytes(24).toString("hex");
  res.cookie(GOOGLE_STATE_COOKIE, state, getGoogleStateCookieOptions());
  res.redirect(buildGoogleAuthorizationUrl(state));
};

// @desc    Handle Google OAuth callback
// @route   GET /api/users/oauth/google/callback
// @access  Public
const handleGoogleOAuthCallback = async (req, res) => {
  const code = String(req.query?.code || "");
  const state = String(req.query?.state || "");
  const providerError = String(req.query?.error || "");
  const cookieState = String(req.cookies?.[GOOGLE_STATE_COOKIE] || "");

  clearGoogleStateCookie(res);

  if (!isGoogleOAuthConfigured()) {
    res.redirect(
      getGoogleCallbackRedirect("Google sign-in is not configured yet."),
    );
    return;
  }

  if (providerError) {
    res.redirect(getGoogleCallbackRedirect("Google sign-in was cancelled."));
    return;
  }

  if (!code || !state || !cookieState || state !== cookieState) {
    res.redirect(
      getGoogleCallbackRedirect("Google sign-in could not be verified."),
    );
    return;
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens(code);
    const googleProfile = await fetchGoogleUserProfile(tokens.access_token);
    const email = String(googleProfile.email || "").toLowerCase();

    if (!googleProfile.sub || !email || !googleProfile.email_verified) {
      throw new Error("Google account is missing a verified email address.");
    }

    let user = await User.findOne({ googleId: googleProfile.sub });

    if (!user) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = await User.create({
        username: await ensureUniqueUsername(
          getPreferredGoogleUsername(googleProfile),
        ),
        email,
        googleId: googleProfile.sub,
        authProvider: "google",
        role: DEFAULT_ROLE,
        mastery: {},
        zpdNodes: DEFAULT_ZPD_NODES,
        avatar: DEFAULT_AVATAR,
      });
    } else {
      let shouldSave = false;

      if (!user.googleId) {
        user.googleId = googleProfile.sub;
        shouldSave = true;
      }

      if (!user.email) {
        user.email = email;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    }

    generateToken(res, user._id);
    res.redirect(getGoogleCallbackRedirect());
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    res.redirect(
      getGoogleCallbackRedirect("Google sign-in failed. Please try again."),
    );
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(buildUserResponse(user));
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const requestedUsername = readTrimmedString(req.body?.username);
  const nextPassword = readString(req.body?.password);
  const currentPassword = readString(req.body?.currentPassword);
  const requestedAvatar = readTrimmedString(req.body?.avatar);
  const requestedAvatarSeed = readTrimmedString(req.body?.avatarSeed); // 1. Avatar don't change for existing user

  if (requestedUsername && requestedUsername !== user.username) {
    const { error: usernameError } = validateUsername(requestedUsername);
    if (usernameError) {
      res.status(400).json({ message: usernameError });
      return;
    }

    const existingUser = await User.findOne({
      username: requestedUsername,
      _id: { $ne: user._id },
    }).select("_id");

    if (existingUser) {
      res.status(400).json({ message: "Username is already taken" });
      return;
    }

    user.username = requestedUsername;
  }

  // Update the Style (beam, pixel, etc.)
  if (requestedAvatar) {
    if (!AVATAR_VARIANTS.has(requestedAvatar)) {
      res.status(400).json({ message: "Invalid avatar style selected" });
      return;
    }

    user.avatar = requestedAvatar;
  }

  // 2. Update the Seed (the actual face pattern)
  if (requestedAvatarSeed) {
    if (requestedAvatarSeed.length > 64) {
      res.status(400).json({ message: "Avatar seed is too long" });
      return;
    }

    user.avatarSeed = requestedAvatarSeed;
  }

  if (nextPassword) {
    if (user.password) {
      if (!currentPassword) {
        res.status(400).json({
          message: "Please provide your current password to change it",
        });
        return;
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        res.status(401).json({ message: "Invalid current password" });
        return;
      }
    }

    const { error: passwordError } = validatePassword(nextPassword);
    if (passwordError) {
      res.status(400).json({ message: passwordError });
      return;
    }

    user.password = nextPassword;
  }

  const updatedUser = await user.save();
  // 3. buildUserResponse will now include the seed in the return JSON
  res.json(buildUserResponse(updatedUser));
};

// @desc    Get user recent activity (or all activity if teacher)
// @route   GET /api/users/recent-activity
// @access  Private
const getUserRecentActivity = async (req, res) => {
  // 1. Logic: If teacher, find ALL student attempts. If student, find ONLY theirs.
  const query = req.user.role === "teacher" ? {} : { user: req.user._id };

  const attempts = await Attempt.find(query)
    // 2. This part is CRITICAL: It reaches into the User collection
    // to grab the student's name and avatar so the teacher knows who solved it.
    .populate("user", "username avatar avatarSeed")
    .sort({ timestamp: -1 })
    .limit(req.user.role === "teacher" ? 50 : 5);

  res.json(attempts);
};

module.exports = {
  authUser,
  registerUser,
  logoutUser,
  getOAuthProviders,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  getUserProfile,
  updateUserProfile,
  getUserRecentActivity,
};
