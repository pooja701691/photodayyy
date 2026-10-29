const Redis = require('ioredis');
require('dotenv').config();

const isTls = process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://');

const redisConfig = process.env.REDIS_URL
  ? {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    }
  : {
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
    redisClient = process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
        })
      : new Redis(redisConfig);

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection Error:', err.message);
    });
    redisClient.on('connect', () => {
      console.log(
        '[Redis] Connected successfully' +
          (process.env.REDIS_URL ? ' via REDIS_URL' : ` to ${redisConfig.host}:${redisConfig.port}`)
      );
    });
  }
  return redisClient;
}

module.exports = {
  redisConfig,
  getRedisClient,
};

