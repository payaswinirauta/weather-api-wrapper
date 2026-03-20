const axios = require("axios");
const redis = require("../config/redis");

const CACHE_TTL = 600;

const WMO_CODES = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Heavy drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
  85: "Slight snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

async function getCache(key) {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

async function setCache(key, data) {
  try {
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
  } catch { }
}

async function getCoordinates(city) {
  const cacheKey = `geo:${city.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await axios.get(url, { timeout: 8000 });

  if (!res.data.results || res.data.results.length === 0) {
    const err = new Error(`City "${city}" not found`);
    err.statusCode = 404;
    throw err;
  }

  const place = res.data.results[0];
  const coords = {
    lat    : place.latitude,
    lon    : place.longitude,
    city   : place.name,
    country: place.country,
    region : place.admin1 || "",
  };

  try { await redis.setex(cacheKey, 604800, JSON.stringify(coords)); } catch {}
  return coords;
}

async function getCurrentWeather(city) {
  const cacheKey = `weather:current:${city.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`⚡ Cache HIT  → ${city}`);
    return { source: "cache", ...cached };
  }

  console.log(`🌐 Cache MISS → fetching: ${city}`);
  const coords = await getCoordinates(city);

  const res = await axios.get("https://api.open-meteo.com/v1/forecast", {
    params: {
      latitude : coords.lat,
      longitude: coords.lon,
      current  : [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m",
        "wind_direction_10m",
        "precipitation",
        "uv_index",
        "visibility",
      ].join(","),
      wind_speed_unit: "kmh",
      timezone       : "auto",
    },
    timeout: 8000,
  });

  const c = res.data.current;
  const data = {
    city             : coords.city,
    region           : coords.region,
    country          : coords.country,
    temperature_c    : c.temperature_2m,
    feels_like_c     : c.apparent_temperature,
    humidity_percent : c.relative_humidity_2m,
    wind_speed_kmh   : c.wind_speed_10m,
    precipitation_mm : c.precipitation,
    uv_index         : c.uv_index,
    visibility_m     : c.visibility,
    condition        : WMO_CODES[c.weather_code] || "Unknown",
    observed_at      : c.time,
    fetched_at       : new Date().toISOString(),
  };

  await setCache(cacheKey, data);
  return { source: "live", ...data };
}

async function getForecast(city) {
  const cacheKey = `weather:forecast:${city.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`⚡ Cache HIT  → forecast: ${city}`);
    return { source: "cache", ...cached };
  }

  console.log(`🌐 Cache MISS → fetching forecast: ${city}`);
  const coords = await getCoordinates(city);

  const res = await axios.get("https://api.open-meteo.com/v1/forecast", {
    params: {
      latitude     : coords.lat,
      longitude    : coords.lon,
      daily        : [
        "temperature_2m_max",
        "temperature_2m_min",
        "weather_code",
        "precipitation_sum",
        "precipitation_probability_max",
        "wind_speed_10m_max",
        "uv_index_max",
        "sunrise",
        "sunset",
      ].join(","),
      timezone     : "auto",
      forecast_days: 7,
    },
    timeout: 8000,
  });

  const d = res.data.daily;
  const forecast = d.time.map((date, i) => ({
    date               : date,
    max_temp_c         : d.temperature_2m_max[i],
    min_temp_c         : d.temperature_2m_min[i],
    condition          : WMO_CODES[d.weather_code[i]] || "Unknown",
    precipitation_mm   : d.precipitation_sum[i],
    rain_chance_percent: d.precipitation_probability_max[i],
    max_wind_kmh       : d.wind_speed_10m_max[i],
    uv_index_max       : d.uv_index_max[i],
    sunrise            : d.sunrise[i],
    sunset             : d.sunset[i],
  }));

  const data = {
    city      : coords.city,
    country   : coords.country,
    days      : forecast,
    fetched_at: new Date().toISOString(),
  };

  await setCache(cacheKey, data);
  return { source: "live", ...data };
}

async function compareCities(cities) {
  const results = await Promise.allSettled(
    cities.map((city) => getCurrentWeather(city.trim()))
  );
  return results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    return { city: cities[i], error: result.reason.message || "Failed" };
  });
}

module.exports = { getCurrentWeather, getForecast, compareCities };