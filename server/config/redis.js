import { Redis } from "@upstash/redis";

// Upstash Redis client — used for caching and background-job queues
const hasRedisConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

export const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache helper that degrades to a no-op when Redis is not configured,
// so local development works without Upstash credentials.
export const cache = {
  async get(key) {
    if (!redis) return null;
    try {
      return await redis.get(key);
    } catch (error) {
      console.log(`Redis get failed for ${key}: ${error.message}`);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    if (!redis) return;
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.log(`Redis set failed for ${key}: ${error.message}`);
    }
  },

  async del(key) {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.log(`Redis del failed for ${key}: ${error.message}`);
    }
  },
};

export default redis;
