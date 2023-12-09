# Node + Express application that can create, display, modify and delete `Artwork Details Caching` in Redis

## Frontend
### Home Page
Create Artwork: A navigation option to create a new artwork. Clicking this link directs the user to a form for entering new artwork details into Redis.

Artwork Listing: Displays a list of all artworks stored in Redis. Each artwork entry includes:

Update Button: Redirects to a form for updating the artwork's details.

Delete Button: Removes the artwork from Redis.

### Views
All frontend views are located in the views folder and use the EJS templating engine.

## Backend
### Routes
Backend routes are defined in routes/index.js.
The routes handle HTTP requests for creating, updating, deleting, and fetching artwork data.

## Redis Connection
The connection to the Redis server is managed in db/redisConnection.js.
