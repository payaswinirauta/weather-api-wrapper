require("dotenv").config();
const express        = require("express");
const morgan         = require("morgan");
const path           = require("path");
const weatherRoutes  = require("./src/routes/weather");
const errorHandler   = require("./src/middleware/errorHandler");
const { apiLimiter } = require("./src/middleware/rateLimiter");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(morgan("dev"));
app.use("/api", apiLimiter);

// ── Serve frontend HTML ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/weather", weatherRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error  : `Route not found: ${req.method} ${req.originalUrl}`,
    hint   : "Try GET /api/weather/Delhi",
  });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n✅ Weather API is running!`);
  console.log(`👉 Open in browser: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/weather/Delhi`);
  console.log(`📋 Morgan logging : ON`);
  console.log(`🛡️  Rate limiting  : ON\n`);
});