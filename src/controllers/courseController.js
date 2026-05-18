const Course = require("../models/courseModel")
const Student = require("../models/studentModel")
const Joi = require("joi")

const courseSchema = Joi.object({
  name:        Joi.string().min(3).required(),
  code:        Joi.string().min(2).required(),
  description: Joi.string().optional(),
  credits:     Joi.number().min(1).max(6).required()
})

// CREATE COURSE
const createCourse = async (req, res, next) => {
  try {
    const { error } = courseSchema.validate(req.body)
    if (error) return res.status(400).json({ error: error.details[0].message })

    const course = await Course.create({
      ...req.body,
      teacher: req.user.id
    })

    res.status(201).json({ message: "Course created!", course })
  } catch (err) {
    next(err)
  }
}

// GET ALL COURSES
const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate("teacher", "name email")
      .lean()
    res.json({ total: courses.length, courses })
  } catch (err) {
    next(err)
  }
}

// GET COURSE WITH STUDENTS
const getCourseWithStudents = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("teacher", "name email")
      .lean()

    if (!course) return res.status(404).json({ error: "Course not found" })

    // find all students enrolled in this course
    const students = await Student.find({ courses: req.params.id })
      .select("name rollNumber email gpa grade")
      .lean()

    res.json({ course, students, totalEnrolled: students.length })
  } catch (err) {
    next(err)
  }
}

module.exports = { createCourse, getCourses, getCourseWithStudents }