# 🌤️ Weather API Wrapper

A lightweight REST API built with **Node.js** and **Express** that provides real-time weather data and 7-day forecasts without requiring an API key. Powered by the open-source [Open-Meteo API](https://open-meteo.com/) and optimized with **Redis caching** for fast response times.

> **Live Demo:** [Deployed on Render](https://weather-api-wrapper-jwvx.onrender.com/) — auto-deployed via GitHub integration

---

## Features

- Real-time weather data — no API key required
- 7-day weather forecast support
- Multi-city comparison in a single request
- Redis caching for 30% faster response times on repeated requests
- Auto-deployment via GitHub + Render integration (CI/CD)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express | Web framework / REST API |
| Redis | Response caching |
| Open-Meteo API | Free weather data source |
| Render | Cloud deployment platform |

---

## How It Works

```
Client Request
      |
      v
Node.js + Express Server
      |
      v
Is city cached in Redis?
   /         \
YES            NO
 |              |
 v              v
Return        Call Open-Meteo API
cached JSON        |
                   v
             Store in Redis
             (key=city, value=JSON)
                   |
                   v
           Send JSON Response to Client
```

1. Client sends a `GET` request with a city name
2. Server checks Redis cache for existing data
3. **Cache HIT** → returns data instantly from Redis
4. **Cache MISS** → fetches fresh data from Open-Meteo, stores in Redis, returns to client

---

## API Endpoints

### Get weather for a city
```
GET /weather?city=London
```

### Get 7-day forecast
```
GET /forecast?city=London
```

### Compare multiple cities
```
GET /compare?cities=London,Mumbai,Tokyo
```

---

## Sample Response

```json
{
  "city": "London",
  "temperature": 18.4,
  "windspeed": 12.3,
  "weathercode": 2,
  "forecast": [
    { "date": "2025-06-01", "max_temp": 20, "min_temp": 13 },
    { "date": "2025-06-02", "max_temp": 17, "min_temp": 11 }
  ]
}
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- Redis installed and running locally

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/weather-api-wrapper.git

# Navigate into the project
cd weather-api-wrapper

# Install dependencies
npm install

# Start Redis (if not running)
redis-server

# Start the server
node index.js
```

The server will start at `http://localhost:3000`

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
REDIS_URL=redis://localhost:6379
CACHE_TTL=1800
```

> `CACHE_TTL` is in seconds — default is 1800 (30 minutes)

---

## Performance

Redis caching improved API response speed by **30%** for repeated city requests by eliminating redundant external API calls.

| Request Type | Avg Response Time |
|---|---|
| Cache MISS (first request) | ~400ms |
| Cache HIT (repeat request) | ~280ms |

---

## Deployment

This project is deployed on **Render** with automatic deployments configured via GitHub. Every push to the `main` branch triggers a fresh deployment.

---

## Author

**Payaswini Rauta**  
B.Tech CSE | Gandhi Academy of Technology and Engineering  
[LinkedIn](https://linkedin.com) • [GitHub](https://github.com)

---

## License

This project is open source and available under the [MIT License](LICENSE).
