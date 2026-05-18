const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [3, "Name too short"],
    maxlength: [50, "Name too long"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ["admin", "teacher", "student"],
    default: "teacher"
  }
}, { timestamps: true })

// ✅ mongoose hook - hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next
})

// ✅ virtual field - not stored in DB
userSchema.virtual("displayName").get(function() {
  return `${this.name} (${this.role})`
})

// ✅ instance method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password)
}

module.exports = mongoose.model("User", userSchema)