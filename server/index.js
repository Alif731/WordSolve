const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
}

const shouldSeedDemoUser =
  process.env.NODE_ENV !== "production" &&
  process.env.SEED_DEMO_USER !== "false";

connectDB().then(() => {
  if (shouldSeedDemoUser) {
    require("./utils/seeder")();
  }
});

const app = express();

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
