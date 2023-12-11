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

async function syncToRedis() {
    try {
        const db = getDb();
        const artists = await db.collection('Artist').find().toArray();

        for (const artist of artists) {
            if (artist.artworks.length > 3) {
                for (const artworkID of artist.artworks) {
                    // get the createionDate of the artwork from the Artwork collection
                    const artwork = await db.collection('Artwork').findOne({ _id: artworkID });
                    // add the artwork to the sorted set with the creationDate as the score
                    const timestamp = new Date(artwork.creationDate).getTime();
                    await redisClient.zAdd(`productiveArtistArtworks:${artist._id}:${artist.name}`, { score: timestamp, value: artworkID });
                }
            }
        }
        console.log('Productive artists synced to Redis successfully.');
    } catch (error) {
        console.error('Error syncing productive artists to Redis:', error);
        throw error;
    }
}

async function getRedisClient() {
    if (!redisClient) {
        throw new Error('No Redis Client Found');
    }
    return redisClient;
}

module.exports = { connectRedis, syncToRedis, getRedisClient };
