// config/redis.js
const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),  // Retry strategy for reconnection
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});


redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

module.exports = redisClient;
