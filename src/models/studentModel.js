const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // basic info
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    rollNumber: {
      type: String,
      unique: true,
      // Only require it if it's NOT a brand new student being created
      required: function () {
        return !this.isNew;
      },
      // required:true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      min: [15, "Too young"],
      max: [40, "Too old"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    // academic info
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "F"],
      default: "C",
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "expelled"],
      default: "active",
    },

    // array of courses enrolled
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course", // reference to Course model
      },
    ],

    // nested object
    address: {
      street: String,
      city: String,
      country: { type: String, default: "Pakistan" },
    },

    // added by which teacher
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// ✅ indexes for faster search
studentSchema.index({ name: "text", email: "text" });
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ status: 1, grade: 1 });

// ✅ auto generate roll number before saving
studentSchema.pre("save", async function (next) {
  if (!this.rollNumber) {
    const count = await mongoose.model("Student").countDocuments();
    this.rollNumber = `STU-${String(count + 1).padStart(4, "0")}`;
    // STU-0001, STU-0002 etc
  }
  next;
});

module.exports = mongoose.model("Student", studentSchema);
