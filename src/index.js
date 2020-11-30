/**
 * Load environment variables
 * @see https://www.npmjs.com/package/dotenv
 */
require('dotenv').config();

const chalk = require('chalk');
const app = require('./app');
const config = require('../config');
const { pinoLogger } = require('./middleware/logger');

const { PORT, NODE_ENV } = config;

// console.clear();
console.log(`NODE_ENV = ${NODE_ENV}\n`);

/**
 * Connect to the database and start application
 */

(async () => {
  try {
    app.listen(PORT, () => pinoLogger.info(chalk.green(`START UP LOADING (port - ${PORT})`)));
  } catch (error) {
    pinoLogger.error(error);
  }
})();
