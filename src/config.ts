require('dotenv').config();
export const redisUrl = process.env.UPSTASH_REDIS_REST_URL; // Your Upstash Redis URL
export const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN; // Your Upstash Redis token
