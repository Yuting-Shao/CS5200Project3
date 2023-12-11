const { createClient } = require('redis');
const { getDb } = require('./mongoConnection');

let redisClient = createClient();

redisClient.on('error', (error) => console.log('Redis Client Error', error));

async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw error;
    }
}

async function syncArtworksToRedis() {
    try {
        const db = getDb();
        const artworks = await db.collection('Artwork').find().toArray();

        for (const artwork of artworks) {
            await redisClient.hSet(
                `artworkDetails:${artwork._id}`, {
                title: artwork.title,
                medium: artwork.medium,
                dimension: artwork.dimension,
                price: artwork.price.toString()
            });
        }
        console.log('Artworks synced to Redis successfully.');
    } catch (error) {
        console.error('Error syncing artworks to Redis:', error);
        throw error;
    }
}

async function getRedisClient() {
    if (!redisClient) {
        throw new Error('No Redis Client Found');
    }
    return redisClient;
}

module.exports = { connectRedis, syncArtworksToRedis, getRedisClient };
