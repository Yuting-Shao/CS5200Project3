const { MongoClient } = require('mongodb');

const url = "mongodb://127.0.0.1:27017";
const dbName = "CS5200Project3";

let db;

const connectMongoDB = async () => {
    try {
        const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected successfully to MongoDB');
        db = client.db(dbName);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

const getDb = () => {
    if (!db) {
        throw new Error('No Database Found');
    }
    return db;
};

module.exports = { connectMongoDB, getDb };
