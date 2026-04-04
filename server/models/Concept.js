const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "direct",
      "distractor",
      "comparison_trap",
      "algebraic",
      "conceptual",
      "visual",
      "icons_items",
    ],
    default: "direct",
  },
  concept: { type: String },
  operands: [{ type: Number }],
  difficulty: { type: Number, default: 1 },
  options: [{ type: String }],

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
          enum: [
            "direct",
            "distractor",
            "comparison_trap",
            "algebraic",
            "conceptual",
            "visual",
            "icons_items",
          ],
          default: "direct",
        },
        difficulty: { type: Number, default: 1 },
        options: [String],

        operands: [Number],

        // visualData: {
        //   showTotal: Boolean,
        //   operator: String,
        //   dragOptions: [String],

        //   parts: [{
        //     value: Number,
        //     label: String,
        //     color: String
        //   }],

        //   groups: [{
        //     count: Number,
        //     icon: String,
        //     label: String
        //   }]
        // },
        visualData: mongoose.Schema.Types.Mixed,

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
