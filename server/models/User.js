const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); // for Avatar ID

const adaptiveStateSchema = new mongoose.Schema(
  {
    timesPlayed: { type: Number, default: 0 },
    correctnessSum: { type: Number, default: 0 },
    estimate: { type: Number, default: 0 },
    ucb: { type: Number, default: 0 },
    lcb: { type: Number, default: 0 },
    timeAdded: { type: Number, default: 0 },
    guessProbability: { type: Number, default: 0 },
    slipProbability: { type: Number, default: 0 },
    changePointScore: { type: Number, default: 0 },
    changePointIndex: { type: Number, default: 0 },
    correctnessRecord: [{ type: Boolean }],
    changePointLog: [{ type: Number }],
  },
  { _id: false },
);

const masteryStateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["locked", "unlocked", "mastered"],
      default: "locked",
    },
    successCount: { type: Number, default: 0 },
    attemptCount: { type: Number, default: 0 },
    lastAttempts: [{ type: Boolean }],
    adaptiveState: {
      type: adaptiveStateSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required() {
        return this.authProvider === "local";
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: { type: String, enum: ["student", "teacher"], default: "student" },
    mastery: {
      type: Map,
      of: masteryStateSchema,
    },
    zpdNodes: [{ type: String }],
    avatar: { type: String, default: "beam" },
    avatarSeed: {
      // So Avatar won't change dynamically for existing User
      type: String,
      default: () => crypto.randomBytes(10).toString("hex"),
    },
    streak: {
      type: Number,
      default: 0,
    },
    maxStreak: {
      type: Number,
      default: 0,
    },
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }

  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
