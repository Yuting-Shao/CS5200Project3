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

router.get('/create-artwork-cache', (req, res) => {
  res.render('createArtworkCache');
});

router.get('/redis-cache', async (req, res) => {
  try {
    const redisClient = await getRedisClient();
    const keys = await redisClient.keys('artworkDetails:*');
    const artworks = [];

    for (const key of keys) {
      const artwork = await redisClient.hGetAll(key);

      artwork.id = key.split(':')[1];
      artworks.push(artwork);
    }

    res.render('cache', { title: 'Artwork Cache in Redis', artworks });
  } catch (err) {
    console.error(err);
    res.status(500).render('errorPage', { error: 'Error fetching artworks' });
  }
});


router.post('/artwork-cache', async (req, res) => {
  const { id, title, medium, dimension, price } = req.body;

  if (!id || !title || !medium || !dimension || isNaN(price)) {
    return res.status(400).send('Invalid artwork data');
  }

  try {
    const redisClient = await getRedisClient();
    await redisClient.hSet(`artworkDetails:${id}`, {
      title, medium, dimension, price: price.toString()
    });
    res.redirect('/redis-cache');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating/updating artwork');
  }
});

router.delete('/artwork-cache/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send('Invalid artwork ID');
  }

  try {
    const redisClient = await getRedisClient();
    await redisClient.del(`artworkDetails:${id}`);
    res.status(200).send('Artwork deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting artwork');
  }
});

router.get('/update-artwork-cache/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const redisClient = await getRedisClient();
    const artwork = await redisClient.hGetAll(`artworkDetails:${id}`);
    if (!artwork) {
      return res.status(404).send('Artwork not found');
    }

    res.render('updateArtworkCache', { artwork: { id, ...artwork } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching artwork details');
  }
});

router.post('/artwork-cache/:id', async (req, res) => {
  const { id } = req.params;
  const { title, medium, dimension, price } = req.body;

  try {
    const redisClient = await getRedisClient();
    await redisClient.hSet(`artworkDetails:${id}`, {
      title, medium, dimension, price: price.toString()
    });
    res.redirect('/redis-cache');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating artwork');
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
