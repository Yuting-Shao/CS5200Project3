let createError = require('http-errors');
let express = require('express');
let methodOverride = require('method-override');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let indexRouter = require('./routes/index');
const { connectMongoDB } = require('./db/mongoConnection');
const { connectRedis, syncArtworksToRedis } = require('./db/redisConnection');

let app = express();

async function initializeApp() {
  try {
    // establish MongoDB connection
    await connectMongoDB();
    console.log("MongoDB connected");

    // establish Redis connection
    await connectRedis();
    console.log("Redis connected");
    await syncArtworksToRedis();
    console.log("Artworks synced to Redis");

    app.use(methodOverride('_method'));

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', indexRouter);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
      next(createError(404));
    });

    // error handler
    app.use(function (err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error');
    });
  } catch (error) {
    console.error('Failed to initialize the app:', error);
    process.exit(1); // exit the process in case of initialization failure
  }
}

initializeApp();

module.exports = app;
