const mongoose = require("mongoose")

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Course name is required"],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true  // auto converts to uppercase
  },
  description: {
    type: String,
    default: ""
  },
  credits: {
    type: Number,
    required: true,
    min: [1, "Minimum 1 credit"],
    max: [6, "Maximum 6 credits"]
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"  // reference to User model
  }
}, { timestamps: true })

// ✅ index for faster search
courseSchema.index({ name: "text", code: "text" })

module.exports = mongoose.model("Course", courseSchema)