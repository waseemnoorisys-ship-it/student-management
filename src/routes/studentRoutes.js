const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const {
  createStudent, getStudents, getStudentById,
  updateStudent, deleteStudent, enrollCourse,
  unenrollCourse, getStatistics, getTopStudents
} = require("../controllers/studentController")

router.post("/",                   authMiddleware, createStudent)
router.get("/",                    authMiddleware, getStudents)
router.get("/statistics",          authMiddleware, getStatistics)
router.get("/top",                 authMiddleware, getTopStudents)
router.get("/:id",                 authMiddleware, getStudentById)
router.put("/:id",                 authMiddleware, updateStudent)
router.delete("/:id",              authMiddleware, deleteStudent)
router.post("/:id/enroll",         authMiddleware, enrollCourse)
router.post("/:id/unenroll",       authMiddleware, unenrollCourse)

module.exports = router