const mongoose = require("mongoose");
const {
  INTERACTION_MODES,
  INPUT_MODES,
  MODULE_STAGES,
  QUESTION_TYPES,
  SCHEMA_KINDS,
} = require("../utils/backendAnswerValidation");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: QUESTION_TYPES,
    default: "direct",
  },
  concept: { type: String },
  operands: [{ type: Number }],
  difficulty: { type: Number, default: 1 },
  options: [{ type: String }],
  schemaKind: {
    type: String,
    enum: SCHEMA_KINDS,
    default: "practice",
  },
  interactionMode: {
    type: String,
    enum: INTERACTION_MODES,
    default: "direct_answer",
  },
  unknownSlot: { type: String },
  moduleStage: {
    type: String,
    enum: MODULE_STAGES,
    default: "practice",
  },
  practiceMode: { type: String },
  promptTitle: { type: String },
  inputMode: {
    type: String,
    enum: INPUT_MODES,
    default: "text_answer",
  },
  stageIndex: { type: Number },
  stageLabel: { type: String },
  stageTotal: { type: Number },
  helperText: { type: String },

  visualData: {
    // --- Bar Model Fields ---
    parts: [
      {
        value: Number,
        label: String,
        color: String,
      },
    ],
    showTotal: Boolean,

    // --- Icon Model Fields (Moved INSIDE here) ---
    operator: String, // Stores "+" or "-"
    groups: [
      {
        count: Number,
        icon: String, // "apple", "car", etc.
        label: String,
      },
    ],
    dragOptions: [String],

    // --- Match-The-Following Fields ---
    leftItems: [
      {
        id: String,
        type: String,
        content: String,
        groups: [
          {
            count: Number,
            icon: String,
          },
        ],
        operator: String,
        matchId: String,
      },
    ],
    rightItems: [
      {
        id: String,
        type: String,
        content: String,
      },
    ],
  },

  equationSpec: { type: mongoose.Schema.Types.Mixed },
  barModelSpec: { type: mongoose.Schema.Types.Mixed },
  validation: { type: mongoose.Schema.Types.Mixed },
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  generatedByAI: { type: Boolean, default: false },
  verifiedByTeacher: { type: Boolean, default: true },
});
// const conceptSchema = new mongoose.Schema(
//   {
//     id: { type: String, required: true, unique: true }, // e.g., 'add_single'
//     title: { type: String, required: true },
//     description: { type: String },
//     prerequisites: [{ type: String }], // List of concept IDs
//     questions: [questionSchema],
//   },
//   { timestamps: true },
// );
const conceptSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    prerequisites: [{ type: String }],

    questions: [
      {
        text: { type: String, required: true },
        correctAnswer: { type: String, required: true },
        type: {
          type: String,
          enum: QUESTION_TYPES,
          default: "direct",
        },
        difficulty: { type: Number, default: 1 },
        options: [String],

        operands: [Number],
        schemaKind: {
          type: String,
          enum: SCHEMA_KINDS,
          default: "practice",
        },
        interactionMode: {
          type: String,
          enum: INTERACTION_MODES,
          default: "direct_answer",
        },
        unknownSlot: String,
        moduleStage: {
          type: String,
          enum: MODULE_STAGES,
          default: "practice",
        },
        practiceMode: String,
        promptTitle: String,
        inputMode: {
          type: String,
          enum: INPUT_MODES,
          default: "text_answer",
        },
        stageIndex: Number,
        stageLabel: String,
        stageTotal: Number,
        helperText: String,

        visualData: mongoose.Schema.Types.Mixed,
        equationSpec: mongoose.Schema.Types.Mixed,
        barModelSpec: mongoose.Schema.Types.Mixed,
        validation: mongoose.Schema.Types.Mixed,

        explanation: String,
        generatedByAI: { type: Boolean, default: false },
        verifiedByTeacher: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true },
);

conceptSchema.statics.findQuestion = async function (conceptId, questionId) {
  const concept = await this.findOne({ id: conceptId });
  if (!concept) return { concept: null, question: null };
  const question = concept.questions.id(questionId);
  return { concept, question };
};

module.exports = mongoose.model("Concept", conceptSchema);
