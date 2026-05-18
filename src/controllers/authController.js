const User = require("../models/userModel")
const jwt = require("jsonwebtoken")
const Joi = require("joi")

// validation schemas
const registerSchema = Joi.object({
  name:     Joi.string().min(3).max(50).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role:     Joi.string().valid("admin", "teacher", "student").optional()
})

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required()
})

// REGISTER
const register = async (req, res, next) => {
  try {
    // validate input
    const { error } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { name, email, password, role } = req.body

    // check existing user
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ error: "Email already registered" })
    }

    // create user - password auto hashed by mongoose hook
    const user = await User.create({ name, email, password, role })

    res.status(201).json({
      message: "Registered successfully!",
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    })
  } catch (err) {
    next(err)
  }
}

// LOGIN
const login = async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { email, password } = req.body

    // find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // use instance method to compare password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ error: "Wrong password" })
    }

    // create token
    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.json({
      message: "Login successful!",
      token,
      user: { id: user._id, name: user.name, role: user.role }
    })
  } catch (err) {
    next(err)
  }
}

// GET MY PROFILE
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password") // exclude password
      .lean()
    res.json(user)
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, getProfile }