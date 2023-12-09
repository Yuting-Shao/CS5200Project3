// connect to redis
const redis = require('redis');

const redisClient = redis.createClient();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
}

connectRedis();

module.exports = redisClient;
