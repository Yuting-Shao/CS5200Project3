let express = require('express');
let router = express.Router();
const redisClient = require('../db/redisConnection');

router.get('/create-artwork', (req, res) => {
  res.render('createArtwork');
});

router.get('/', async (req, res) => {
  try {
    const keys = await redisClient.keys('artworkDetails:*');
    const artworks = [];

    for (const key of keys) {
      const artwork = await redisClient.hGetAll(key);

      artwork.id = key.split(':')[1];
      artworks.push(artwork);
    }

    res.render('index', { title: 'Art and Artist Management System', artworks });
  } catch (err) {
    console.error(err);
    res.status(500).render('errorPage', { error: 'Error fetching artworks' });
  }
});


router.post('/artwork', async (req, res) => {
  const { id, title, medium, dimension, price } = req.body;

  if (!id || !title || !medium || !dimension || isNaN(price)) {
    return res.status(400).send('Invalid artwork data');
  }

  try {
    await redisClient.hSet(`artworkDetails:${id}`, {
      title, medium, dimension, price: price.toString()
    });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating/updating artwork');
  }
});

router.delete('/artwork/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send('Invalid artwork ID');
  }

  try {
    await redisClient.del(`artworkDetails:${id}`);
    res.status(200).send('Artwork deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting artwork');
  }
});

router.get('/update-artwork/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const artwork = await redisClient.hGetAll(`artworkDetails:${id}`);
    if (!artwork) {
      return res.status(404).send('Artwork not found');
    }

    res.render('updateArtwork', { artwork: { id, ...artwork } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching artwork details');
  }
});

router.post('/artwork/:id', async (req, res) => {
  const { id } = req.params;
  const { title, medium, dimension, price } = req.body;

  try {
    await redisClient.hSet(`artworkDetails:${id}`, {
      title, medium, dimension, price: price.toString()
    });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating artwork');
  }
});


module.exports = router;
