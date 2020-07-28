const pino = require('pino');
const chalk = require('chalk');
const { NODE_ENV } = require('../../config');
const packageJson = require('../../package.json');

const logger = options => pino(options);

module.exports = logger({
  name: packageJson.name,
  level: NODE_ENV !== 'production' ? 'trace' : 'warn',
  enabled: NODE_ENV !== 'test',
  prettyPrint: NODE_ENV !== 'production' ? {
    translateTime: true,
    colorize: chalk.supportsColor
  } : false
});
