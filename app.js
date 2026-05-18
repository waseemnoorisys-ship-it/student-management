require("dotenv").config()
const express = require("express")
const cors = require("cors")
const connectDB = require("./src/config/db")
const authRoutes    = require("./src/routes/authRoutes")
const studentRoutes = require("./src/routes/studentRoutes")
const courseRoutes  = require("./src/routes/courseRoutes")
// const errorMiddleware = require("./src/middlewares/errorMiddleware")

const app = express()

connectDB()

app.use(cors())
app.use(express.json())
app.use(express.static("frontend"))
app.use("/api/auth",     authRoutes)
app.use("/api/students", studentRoutes)
app.use("/api/courses",  courseRoutes)

// app.use(errorMiddleware)

const PORT = process.env.PORT || 8000
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`))