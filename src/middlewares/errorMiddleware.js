// const errorMiddleware = (err, req, res, next) => {
//   console.log("ERROR:", err.message)

//   // mongoose duplicate key error
//   if (err.code === 11000) {
//     const field = Object.keys(err.keyValue)[0]
//     return res.status(400).json({
//       error: `${field} already exists`
//     })
//   }

//   // mongoose validation error
//   if (err.name === "ValidationError") {
//     const errors = Object.values(err.errors).map(e => e.message)
//     return res.status(400).json({ error: errors[0] })
//   }

//   // mongoose cast error (invalid id)
//   if (err.name === "CastError") {
//     return res.status(400).json({ error: "Invalid ID format" })
//   }

//   res.status(500).json({ error: err.message })
// }

// module.exports = errorMiddleware