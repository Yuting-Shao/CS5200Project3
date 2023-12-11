let express = require('express');
let router = express.Router();
const { getRedisClient } = require('../db/redisConnection');
const { ObjectId } = require('mongodb');
const { isUUID, isObjectId } = require('../utils/utils');

const {
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
} = require('../db/dbOperations');

router.get('/create-artist-cache', (req, res) => {
  res.render('createArtistCache');
});

router.get('/redis-cache', async (req, res) => {
  try {
    const redisClient = await getRedisClient();
    const artistKeys = await redisClient.keys('productiveArtistArtworks:*');
    const artists = [];

    for (const key of artistKeys) {
      const artistID = key.split(':')[1];
      const artistName = key.split(':')[2];
      const artworkIDs = await redisClient.zRange(key, 0, -1);

      artists.push({ artistID, artistName, artworkIDs });
    }

    res.render('cache', { title: 'Productive Artists in Redis', artists });
  } catch (err) {
    console.error(err);
    res.status(500).render('errorPage', { error: 'Error fetching artworks from Redis' });
  }
});

router.post('/create-productive-artist', async (req, res) => {
  const { artistID, artistName, artworkIDs } = req.body;

  if (!artistID || !artistName || !artworkIDs) {
    return res.status(400).send('Invalid artist data');
  }

  const artworkIDList = artworkIDs.split(',').map(id => id.trim()).filter(id => id);

  try {
    const redisClient = await getRedisClient();

    for (const [index, artworkID] of artworkIDList.entries()) {
      await redisClient.zAdd(`productiveArtistArtworks:${artistID}:${artistName}`, {
        score: index,
        value: artworkID
      });
    }

    res.redirect('/redis-cache');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating/updating productive artist');
  }
});

router.delete('/productive-artist/:id/:name', async (req, res) => {
  const { id, name } = req.params;

  if (!id || !name) {
    return res.status(400).send('Invalid artist details');
  }

  try {
    const redisClient = await getRedisClient();
    console.log(`Deleting productive artist: ${id}:${name}`);
    await redisClient.del(`productiveArtistArtworks:${id}:${name}`);
    res.status(200).send('Productive artist deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting productive artist');
  }
});

router.get('/update-productive-artist/:id/:name', async (req, res) => {
  const { id, name } = req.params;

  try {
    const redisClient = await getRedisClient();
    const artworkIDs = await redisClient.zRange(`productiveArtistArtworks:${id}:${name}`, 0, -1);

    res.render('updateProductiveArtistArtworks', { id, name, artworkIDs });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching artwork details');
  }
});

router.post('/update-productive-artist-artworks/:id/:name', async (req, res) => {
  const { id, name } = req.params;
  const { artworkIDs } = req.body;

  try {
    const redisClient = await getRedisClient();

    await redisClient.del(`productiveArtistArtworks:${id}:${name}`);

    const artworkIDArray = artworkIDs.split(',').map(id => id.trim()).filter(id => id);

    for (let i = 0; i < artworkIDArray.length; i++) {
      await redisClient.zAdd(`productiveArtistArtworks:${id}:${name}`, { score: i, value: artworkIDArray[i] });
    }

    res.redirect('/redis-cache');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating productive artist artworks');
  }
});


/* Previous routes */
/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    const artists = await getArtists();
    res.render('index', { title: 'Art and Artist Management System', artists });
  } catch (error) {
    next(error);
  }
});

/* GET artworks page. */
router.get('/artworks', async function (req, res, next) {
  try {
    const artworks = await getAllArtworks();
    res.render('allArtworks', { artworks });
  } catch (error) {
    next(error);
  }
});

/* GET artworks by a specific artist. */
router.get('/artist/:artistID', async function (req, res, next) {
  try {
    const artistID = req.params.artistID;
    const artworks = await getArtworksByArtist(artistID);
    res.render('artworks', { artistID, artworks });
  } catch (error) {
    next(error);
  }
});

/* Render a form to create a new artist. */
router.get('/artistCreate/new', function (req, res, next) {
  res.render('createArtist', { title: 'Create Artist' });
});

/* Handle form submission to create a new artist. */
router.post('/artist', async function (req, res, next) {
  try {
    await createArtist(req.body);
    res.redirect('/');
  } catch (error) {
    console.error('Error creating artist:', error);
    res.render('createArtist', { title: 'Create Artist', error: 'Error creating artist' });
  }
});

/* Render a form to update an existing artist. */
router.get('/artist/:artistID/edit', async function (req, res, next) {
  try {
    const artistID = req.params.artistID;
    if (!isUUID(artistID) && !isObjectId(artistID)) {
      throw new Error("Invalid artist ID format");
    }
    const artist = await getArtistById(artistID);
    res.render('updateArtist', { artist });
  } catch (error) {
    next(error);
  }
});

/* Handle form submission to update an existing artist. */
router.put('/artist/:artistID', async function (req, res, next) {
  try {
    const artistID = req.params.artistID;
    if (!isUUID(artistID) && !isObjectId(artistID)) {
      throw new Error("Invalid artist ID format");
    }
    await updateArtist(artistID, req.body);
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

/* Handle deletion of an artist. */
router.delete('/artist/:artistID', async function (req, res, next) {
  try {
    const artistID = req.params.artistID;
    if (!isUUID(artistID) && !isObjectId(artistID)) {
      throw new Error("Invalid artist ID format");
    }
    await deleteArtist(artistID);
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

/* Render a form to create a new artwork. */
router.get('/artwork/new', function (req, res, next) {
  res.render('createArtwork', { title: 'Create Artwork' });
});

/* Handle form submission to create a new artwork. */
router.post('/artwork', async function (req, res, next) {
  try {
    await createArtwork(req.body);
    res.redirect('/artworks');
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.render('createArtwork', { error: 'Error creating artwork' });
  }
});

/* Render a form to update an existing artwork. */
router.get('/artwork/:artworkID/edit', async function (req, res, next) {
  try {
    const artworkID = req.params.artworkID;
    const artwork = await getArtworkById(artworkID);
    res.render('updateArtwork', { artwork });
  } catch (error) {
    next(error);
  }
});

/* Handle form submission to update an existing artwork. */
router.put('/artwork/:artworkID', async function (req, res, next) {
  try {
    const artworkID = req.params.artworkID;
    await updateArtwork(artworkID, req.body);
    res.redirect('/artworks');
  } catch (error) {
    next(error);
  }
});

/* Handle deletion of an artwork. */
router.delete('/artwork/:artworkID', async function (req, res, next) {
  try {
    const artworkID = req.params.artworkID;
    if (!isUUID(artworkID) && !isObjectId(artworkID)) {
      throw new Error("Invalid artwork ID format");
    }
    await deleteArtwork(artworkID);
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});


module.exports = router;
