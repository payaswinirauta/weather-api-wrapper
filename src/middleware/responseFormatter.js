function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success  : true,
    cached   : data.source === "cache",
    timestamp: new Date().toISOString(),
    data,
  });
}

function errorResponse(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success  : false,
    cached   : false,
    timestamp: new Date().toISOString(),
    error    : message,
  });
}

module.exports = { successResponse, errorResponse };