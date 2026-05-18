const Student = require("../models/studentModel")
const Joi = require("joi")

// validation
const studentSchema = Joi.object({
  name:   Joi.string().min(3).required(),
  email:  Joi.string().email().required(),
  phone:  Joi.string().min(10).required(),
  age:    Joi.number().min(15).max(40).required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  grade:  Joi.string().valid("A","B","C","D","F").optional(),
  gpa:    Joi.number().min(0).max(4).optional(),
  status: Joi.string().valid("active","inactive","graduated","expelled").optional(),
  address: Joi.object({
    street:  Joi.string().optional(),
    city:    Joi.string().optional(),
    country: Joi.string().optional()
  }).optional()
})

// ─── CREATE STUDENT ──────────────────────────────────────
const createStudent = async (req, res, next) => {
  try {
    const { error } = studentSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    // check duplicate email
    const existing = await Student.findOne({ email: req.body.email })
    if (existing) {
      return res.status(400).json({ error: "Email already exists" })
    }

    const student = await Student.create({
      ...req.body,
      addedBy: req.user.id // from auth middleware
    })

    res.status(201).json({
      message: "Student added successfully!",
      student
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET ALL STUDENTS with search + filter + pagination ──
const getStudents = async (req, res, next) => {
  try {
    const {
      name, email, status, grade,
      gender, city, minGpa, maxGpa,
      minAge, maxAge,
      page = 1, limit = 10,
      sortBy = "createdAt", order = "desc"
    } = req.query

    // build filter dynamically
    const filter = {}

    // text search
    if (name)  filter.name  = { $regex: name,  $options: "i" }
    if (email) filter.email = { $regex: email, $options: "i" }

    // exact match
    if (status) filter.status = status
    if (grade)  filter.grade  = grade
    if (gender) filter.gender = gender

    // nested field filter
    if (city) filter["address.city"] = { $regex: city, $options: "i" }

    // range filter
    if (minGpa || maxGpa) {
      filter.gpa = {}
      if (minGpa) filter.gpa.$gte = Number(minGpa)
      if (maxGpa) filter.gpa.$lte = Number(maxGpa)
    }

    if (minAge || maxAge) {
      filter.age = {}
      if (minAge) filter.age.$gte = Number(minAge)
      if (maxAge) filter.age.$lte = Number(maxAge)
    }

    // pagination
    const skip      = (page - 1) * limit
    const sortOrder = order === "asc" ? 1 : -1

    // get students with populate
    const students = await Student.find(filter)
      .populate("addedBy", "name email")   // get teacher details
      .populate("courses", "name code")    // get course details
      .skip(skip)
      .limit(Number(limit))
      .sort({ [sortBy]: sortOrder })
      .lean()

    // total count
    const total = await Student.countDocuments(filter)

    res.json({
      students,
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / limit)
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET ONE STUDENT ─────────────────────────────────────
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("addedBy", "name email")
      .populate("courses", "name code credits")
      .lean()

    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    res.json({ message: "Student found", student })
  } catch (err) {
    next(err)
  }
}

// ─── UPDATE STUDENT ──────────────────────────────────────
const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after", runValidators: true }
    ).lean()

    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    res.json({ message: "Student updated successfully", student })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE STUDENT ──────────────────────────────────────
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id)
    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }
    res.json({ message: "Student deleted successfully" })
  } catch (err) {
    next(err)
  }
}

// ─── ENROLL IN COURSE ────────────────────────────────────
const enrollCourse = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $push: { courses: req.body.courseId } }, // push to array
      { returnDocument: "after" }
    ).populate("courses", "name code")

    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    res.json({ message: "Enrolled successfully", student })
  } catch (err) {
    next(err)
  }
}

// ─── UNENROLL FROM COURSE ────────────────────────────────
const unenrollCourse = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $pull: { courses: req.body.courseId } }, // pull from array
      { returnDocument: "after" }
    )

    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    res.json({ message: "Unenrolled successfully" })
  } catch (err) {
    next(err)
  }
}

// ─── AGGREGATION — STATISTICS ────────────────────────────
const getStatistics = async (req, res, next) => {
  try {
    const stats = await Student.aggregate([

      // Stage 1 - group by grade
      {
        $group: {
          _id:          "$grade",
          totalStudents: { $sum: 1 },
          averageGpa:    { $avg: "$gpa" },
          maxGpa:        { $max: "$gpa" },
          minGpa:        { $min: "$gpa" }
        }
      },

      // Stage 2 - sort by grade
      { $sort: { _id: 1 } },

      // Stage 3 - rename _id to grade
      {
        $project: {
          grade:         "$_id",
          totalStudents: 1,
          averageGpa:    { $round: ["$averageGpa", 2] },
          maxGpa:        1,
          minGpa:        1,
          _id:           0
        }
      }
    ])

    // count by status
    const statusStats = await Student.aggregate([
      {
        $group: {
          _id:   "$status",
          count: { $sum: 1 }
        }
      }
    ])

    // count by gender
    const genderStats = await Student.aggregate([
      {
        $group: {
          _id:   "$gender",
          count: { $sum: 1 }
        }
      }
    ])

    // count by city
    const cityStats = await Student.aggregate([
      {
        $group: {
          _id:   "$address.city",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 } // top 5 cities
    ])

    res.json({
      gradeStats:  stats,
      statusStats,
      genderStats,
      cityStats,
      totalStudents: await Student.countDocuments()
    })
  } catch (err) {
    next(err)
  }
}

// ─── TOP STUDENTS ────────────────────────────────────────
const getTopStudents = async (req, res, next) => {
  try {
    const topStudents = await Student.aggregate([
      // only active students
      { $match: { status: "active" } },

      // sort by gpa highest first
      { $sort: { gpa: -1 } },

      // top 10 only
      { $limit: 10 },

      // select only needed fields
      {
        $project: {
          name:       1,
          rollNumber: 1,
          gpa:        1,
          grade:      1,
          email:      1
        }
      }
    ])

    res.json({ topStudents })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  enrollCourse,
  unenrollCourse,
  getStatistics,
  getTopStudents
}