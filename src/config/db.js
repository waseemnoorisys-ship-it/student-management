const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB connected ✅")

    // connection events
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected!")
    })

    mongoose.connection.on("error", (err) => {
      console.log("MongoDB error:", err)
    })

  } catch (err) {
    console.log("DB Error:", err.message)
    process.exit(1)
  }
}

module.exports = connectDB