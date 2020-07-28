const path = require('path');

const pathUrl = path.resolve(process.cwd(), '.env');

require('dotenv').config({ path: pathUrl });

module.exports = {
  bodyParser: {
    limit: '50mb'
  },
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV
};
