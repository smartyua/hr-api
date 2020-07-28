const { get } = require('lodash');

const responseFormatter = (req, res, next) => {
  let statusCode = 200;

  const { response } = req;

  if (typeof response === 'object') {
    if (response.userData && response.userData.passwordHash) {
      delete response.userData.passwordHash;
      delete response.userData.password;
    }

    if (response.statusCode || response.code) {
      statusCode = get(response, 'statusCode') || get(response, 'code');
      delete response.code;
    }

    return res.status(statusCode).json(response);
  }

  return next(req);
};

module.exports = responseFormatter;
