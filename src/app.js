/**
 * 3d party packages
 */
const express = require('express');
const chalk = require('chalk');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
// const passport = require('passport');

const config = require('../config');
const routes = require('./routes');
const responseFormatter = require('./middleware/response-formatter');
const errorHandler = require('./middleware/error-handler');
const { reqLogger } = require('./middleware/logger');

// const jwtStrategy = require('./middleware/passport-jwt');
// const localStrategy = require('./middleware/passport-local');

// Middlewares
// passport.use(jwtStrategy);
// passport.use(localStrategy);

const { NODE_ENV } = config;
const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(helmet());
app.disable('etag');
app.use(bodyParser.json({ limit: config.bodyParser.limit }));
app.use('/storage', express.static(`${__dirname}/../storage`));

app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: config.bodyParser.limit
  })
);

app.use(reqLogger);
app.use(routes);

// main response formatter middleware
app.use(responseFormatter);

// error response formatter middleware
app.use(errorHandler);

/**
 * Handle interraption by SIGTERM or SIGINT
 */
const exit = async () => {
  const message = 'Application was closed...\n\n';
  reqLogger(NODE_ENV === 'production' ? message : chalk.green(`\n\n${message}\n\n`));

  if (process.env.NODE_ENV !== 'test') {
    process.exit(0);
  }
};

process.on('SIGTERM', exit);
process.on('SIGINT', exit);

app.close = exit;

module.exports = app;
