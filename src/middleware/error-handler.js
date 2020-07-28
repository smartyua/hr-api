const defaultStatus = 404;
const defaultMessage = 'Route is not found!';
const { get } = require('lodash');
const chalk = require('chalk');

const { pinoLogger } = require('./logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  console.log(error);

  const response = {
    message: get(error, 'message') || defaultMessage,
    details: get(error, 'details'),
    stack: process.env.NODE_ENV !== 'production' ? get(error, 'stack') : null,
    code: get(error, 'statusCode') || get(error, 'code') || defaultStatus,
    url: get(req, 'originalUrl'),
    body: get(error.body),
    query: get(error.query)
  };

  if (response.message.indexOf('connect ECONNREFUSED') >= 0) {
    Object.assign(response, {
      details: 'Check please DB health status'
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log(chalk.red('\n-- errorHandler --\n'));
  }

  pinoLogger.error(response);

  return res.status(response.code).send(response);
};

module.exports = errorHandler;
