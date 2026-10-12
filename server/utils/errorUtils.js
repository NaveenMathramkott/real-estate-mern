// Maps a Mongoose/Mongo error onto an appropriate HTTP status code so
// a malformed ObjectId surfaces as 400 rather than a generic 500.
export const statusFromError = (error) => {
  if (error.name === "CastError") return 400;
  if (error.name === "ValidationError") return 400;
  if (error.code === 11000) return 409;
  return error.statusCode || 500;
};

export const errorResponse = (res, error, fallbackMessage) => {
  if (res.headersSent) return;
  res.status(statusFromError(error)).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};
