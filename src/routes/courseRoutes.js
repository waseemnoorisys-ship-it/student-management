const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const {
  createCourse, getCourses, getCourseWithStudents
} = require("../controllers/courseController")

router.post("/",         authMiddleware, createCourse)
router.get("/",          authMiddleware, getCourses)
router.get("/:id",       authMiddleware, getCourseWithStudents)

module.exports = router