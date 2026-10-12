// 404 handler for unmatched routes
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

// Central error handler. Keeps the response shape consistent across the API.
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  console.log(errorHandler.name, err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid identifier" });
  }

  if (err.code === 11000) {
    return res
      .status(409)
      .json({ success: false, message: "Duplicate record" });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};
