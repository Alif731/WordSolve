const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const connectDB = require("./config/db");

const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const isProduction = process.env.NODE_ENV === "production";
const weakSecrets = new Set([
  "secret",
  "jwtsecret",
  "changeme",
  "password",
  "supersecretkey123",
]);
const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(
  /\/+$/,
  "",
);

if (isProduction) {
  const jwtSecret = process.env.JWT_SECRET || "";
  if (jwtSecret.length < 32 || weakSecrets.has(jwtSecret.toLowerCase())) {
    throw new Error(
      "JWT_SECRET is missing or weak. Set a strong production secret (32+ chars).",
    );
  }

  if (!process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL is missing in production.");
  }

  if (process.env.USE_MEMORY_DB === "true" || !process.env.MONGO_URI || process.env.MONGO_URI.includes("localhost")) {
    throw new Error("Production must use a real MongoDB Atlas URI, not localhost or memory DB.");
  }
}

const shouldSeedDemoUser =
  process.env.NODE_ENV !== "production" &&
  process.env.SEED_DEMO_USER === "true";

connectDB().then(() => {
  if (shouldSeedDemoUser) {
    require("./utils/seeder")();
  }
});

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);

// Apply size limits to prevent abuse
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "8kb" }));
// codeql[js/missing-token-validation]
// cookieParser is flagged by CodeQL because we are utilizing cookie-based sessions.
// We implement custom CSRF protection globally via the csrfGuard middleware (enforcing Origin/Referer verification against CLIENT_URL),
// which protects all state-changing endpoints in a MERN/SPA environment.
app.use(cookieParser());

const { globalLimiter } = require("./middleware/rateLimitMiddleware");
const { csrfGuard } = require("./middleware/csrfMiddleware");

// Apply global rate limiting
app.use("/api/", globalLimiter);

// Apply CSRF protection
app.use(csrfGuard);

const learningRoutes = require("./routes/learningRoutes");
const userRoutes = require("./routes/userRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const teacherRoutes = require("./routes/teacherRoutes");

app.use("/api/learning", learningRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/teacher", teacherRoutes);

app.get("/", (_req, res) => {
  res.send("API is running...");
});

const { errorHandler } = require("./middleware/errorMiddleware");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
