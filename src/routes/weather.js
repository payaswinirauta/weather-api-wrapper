const express    = require("express");
const router     = express.Router();
const { getCurrentWeather, getForecast, compareCities } = require("../services/weatherService");
const { successResponse, errorResponse }                = require("../middleware/responseFormatter");
const { compareLimiter }                                = require("../middleware/rateLimiter");

router.get("/compare", compareLimiter, async (req, res, next) => {
  const { cities } = req.query;

  if (!cities) {
    return errorResponse(res,
      "Example: /api/weather/compare?cities=Delhi,Mumbai,Kolkata",
      400
    );
  }

  const cityList = cities.split(",").map((c) => c.trim()).filter(Boolean);

  if (cityList.length < 2) {
    return errorResponse(res, "Provide at least 2 cities to compare", 400);
  }
  if (cityList.length > 5) {
    return errorResponse(res, "Maximum 5 cities allowed", 400);
  }

  try {
    const comparison = await compareCities(cityList);
    return successResponse(res, { count: cityList.length, comparison });
  } catch (err) {
    next(err);
  }
});

router.get("/:city", async (req, res, next) => {
  const { city } = req.params;

  if (!city || city.trim() === "") {
    return errorResponse(res, "City name is required", 400);
  }

  try {
    const weather = await getCurrentWeather(city);
    return successResponse(res, { weather });
  } catch (err) {
    next(err);
  }
});

router.get("/:city/forecast", async (req, res, next) => {
  const { city } = req.params;

  try {
    const forecast = await getForecast(city);
    return successResponse(res, { forecast });
  } catch (err) {
    next(err);
  }
});

module.exports = router;