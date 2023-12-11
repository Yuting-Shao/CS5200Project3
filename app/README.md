# Node + Express application that can create, display, modify and delete the data structure in Redis

## Frontend
### Redis Cache Page (localhost:3000/redis-cache)
Create Most Productive Artist: A navigation option to create a new most productive artist. Clicking this link directs the user to a form for entering new artist artworks into Redis.

Most Productive Artists Listing: Displays a list of all Artists stored in Redis (the artists who has more than 3 artworks). Each entry includes:

Update Button: Redirects to a form for updating the artist's artworks.

Delete Button: Removes the artist from Redis.

### Views
All frontend views are located in the views folder and use the EJS templating engine.

## Backend
### Routes
Backend routes are defined in routes/index.js.
The routes handle HTTP requests for creating, updating, deleting, and fetching artwork data.

If the MongoDB database is updated, the changes will be synced to Redis as needed.

## Redis Connection
The connection to the Redis server is managed in db/redisConnection.js.
