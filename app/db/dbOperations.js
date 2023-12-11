const { getDb } = require('./mongoConnection');
const { ObjectId } = require('mongodb');
const { isUUID, isObjectId } = require('../utils/utils');

async function getArtists() {
    try {
        const db = getDb();
        return await db.collection('Artist').find().toArray();
    } catch (error) {
        console.error('Error getting artists:', error);
        throw error;
    }
}

async function createArtist(data) {
    try {
        const db = getDb();
        const artistData = { ...data, artworks: [] };
        const result = await db.collection('Artist').insertOne(artistData);

        if (result.acknowledged) {
            return await db.collection('Artist').findOne({ _id: result.insertedId });
        } else {
            throw new Error('Artist creation not acknowledged');
        }
    } catch (error) {
        console.error('Error creating artist:', error);
        throw error;
    }
}

async function updateArtist(artistID, data) {
    try {
        const db = getDb();
        let query = {};

        if (isUUID(artistID)) {
            query._id = artistID;
        } else if (isObjectId(artistID)) {
            query._id = new ObjectId(artistID);
        } else {
            throw new Error("Invalid artist ID format");
        }

        await db.collection('Artist').updateOne(query, { $set: data });
        return { _id: artistID, ...data };
    } catch (error) {
        console.error('Error updating artist:', error);
        throw error;
    }
}

async function getArtistById(artistID) {
    try {
        const db = getDb();
        let query = {};

        if (isUUID(artistID)) {
            query._id = artistID;
        } else if (isObjectId(artistID)) {
            query._id = new ObjectId(artistID);
        } else {
            throw new Error("Invalid artist ID format");
        }

        return await db.collection('Artist').findOne(query);
    } catch (error) {
        console.error('Error getting artist by ID:', error);
        throw error;
    }
}

async function deleteArtist(artistID) {
    try {
        const db = getDb();
        let query = {};

        if (isUUID(artistID)) {
            query._id = artistID;
        } else if (isObjectId(artistID)) {
            query._id = new ObjectId(artistID);
        } else {
            throw new Error("Invalid artist ID format");
        }

        await db.collection('Artist').deleteOne(query);
        return { artistID };
    } catch (error) {
        console.error('Error deleting artist:', error);
        throw error;
    }
}

async function getAllArtworks() {
    try {
        const db = getDb();
        return await db.collection('Artwork').find().toArray();
    } catch (error) {
        console.error('Error getting all artworks:', error);
        throw error;
    }
}

async function createArtwork(data) {
    try {
        const db = getDb();
        let artistId = null;

        // Check if artistId is provided and is a valid ObjectId
        if (data.artistId && ObjectId.isValid(data.artistId)) {
            artistId = new ObjectId(data.artistId);
        } else {
            // If artistId is not valid, create a new ObjectId for the artist
            artistId = new ObjectId();
        }

        // Insert the artwork document
        const artworkResult = await db.collection('Artwork').insertOne(data);
        const artworkId = artworkResult.insertedId;

        // Check if artist exists
        const artistExists = await db.collection('Artist').findOne({ _id: artistId });

        if (artistExists) {
            // If artist exists, push the new artworkId to their artworks array
            await db.collection('Artist').updateOne(
                { _id: artistId },
                { $push: { artworks: artworkId } }
            );
        } else {
            // If artist does not exist, create a new artist with the new artworkId
            await db.collection('Artist').insertOne({
                _id: artistId,
                artworks: [artworkId],
            });
        }

        if (artworkResult.acknowledged) {
            return await db.collection('Artwork').findOne({ _id: artworkResult.insertedId });
        } else {
            throw new Error('Artwork creation not acknowledged');
        }
    } catch (error) {
        console.error('Error creating artwork:', error);
        throw error;
    }
}

async function updateArtwork(artworkID, data) {
    try {
        const db = getDb();
        let query = {};

        if (isUUID(artworkID)) {
            query._id = artworkID;
        } else if (isObjectId(artworkID)) {
            query._id = new ObjectId(artworkID);
        } else {
            throw new Error("Invalid artwork ID format");
        }

        await db.collection('Artwork').updateOne(query, { $set: data });
    } catch (error) {
        console.error('Error updating artwork:', error);
        throw error;
    }
}

async function getArtworkById(artworkID) {
    try {
        const db = getDb();
        let query = {};

        if (isUUID(artworkID)) {
            query._id = artworkID;
        } else if (isObjectId(artworkID)) {
            query._id = new ObjectId(artworkID);
        } else {
            throw new Error("Invalid artwork ID format");
        }

        return await db.collection('Artwork').findOne(query);
    } catch (error) {
        console.error('Error getting artwork by ID:', error);
        throw error;
    }
}

async function getArtworksByArtist(artistID) {
    try {
        const db = getDb();
        const artist = await db.collection('Artist').findOne({ _id: artistID });
        if (!artist || !artist.artworks) {
            return [];
        }

        return await db.collection('Artwork').find({ _id: { $in: artist.artworks } }).toArray();
    } catch (error) {
        console.error('Error getting artworks by artist ID:', error);
        throw error;
    }
}

async function deleteArtwork(artworkID) {
    try {
        const db = getDb();
        let query = {};

        // Determine the format of artworkID and construct the query
        if (isUUID(artworkID)) {
            query._id = artworkID;
        } else if (isObjectId(artworkID)) {
            query._id = new ObjectId(artworkID);
        } else {
            throw new Error("Invalid artwork ID format");
        }

        // First, find the artwork to get the artist's ID
        const artwork = await db.collection('Artwork').findOne(query);
        if (!artwork) {
            throw new Error("Artwork not found");
        }

        // Delete the artwork
        await db.collection('Artwork').deleteOne(query);

        // If the artwork has an associated artist, update the artist's artworks array
        if (artwork.artist && artwork.artist._id) {
            await db.collection('Artist').updateOne(
                { _id: artwork.artist._id },
                { $pull: { artworks: artwork._id } }
            );
        }

        return { artworkID };
    } catch (error) {
        console.error('Error deleting artwork:', error);
        throw error;
    }
}

module.exports = {
    getArtists,
    createArtist,
    updateArtist,
    getArtistById,
    deleteArtist,
    getAllArtworks,
    createArtwork,
    updateArtwork,
    getArtworkById,
    getArtworksByArtist,
    deleteArtwork
};
