const Redis = require('ioredis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
};

// Singleton connection instance for reuse
let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);
    redisClient.on('error', (err) => {
      console.error('[Redis] Connection Error:', err.message);
    });
    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully to ' + redisConfig.host + ':' + redisConfig.port);
    });
  }
  return redisClient;
}

module.exports = {
  redisConfig,
  getRedisClient,
};
