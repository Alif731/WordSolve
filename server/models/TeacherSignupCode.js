const mongoose = require('mongoose');

const teacherSignupCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    label: {
      type: String,
      trim: true,
      default: 'Teacher access code',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('TeacherSignupCode', teacherSignupCodeSchema);
