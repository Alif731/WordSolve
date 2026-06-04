const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const isProduction = process.env.NODE_ENV === "production";

  console.error("Express Error:", err.message);

  res.status(statusCode).json({
    message: err.message || "An unexpected server error occurred",
    stack: isProduction ? undefined : err.stack,
  });
};

module.exports = { errorHandler };
