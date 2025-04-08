const redis = require("redis");
const dotenv = require("dotenv");
dotenv.config();

// Create a new Redis client and connect to the default Redis server (localhost:6379)
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

// Handle Redis connection success
client.on("connect", () => {
  console.log("Connected to Redis");
});

// Handle Redis connection error
client.on("error", (err) => {
  console.error("Redis error:", err);
});

// Export the Redis client for use in other parts of your app
module.exports = client;
