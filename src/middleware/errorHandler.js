const { errorResponse } = require("./responseFormatter");

function errorHandler(err, req, res, next) {
  console.error(`❌ [${new Date().toISOString()}] ${err.message}`);

  if (err.statusCode === 404) {
    return errorResponse(res, err.message, 404);
  }

  if (err.response) {
    return errorResponse(res, `Upstream API error: ${err.response.status}`, 502);
  }

  if (err.code === "ECONNABORTED" || err.request) {
    return errorResponse(res, "Cannot reach Open-Meteo. Check your internet connection.", 503);
  }

  return errorResponse(res, "Internal server error", 500);
}

module.exports = errorHandler;