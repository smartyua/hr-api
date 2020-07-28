const { loadData } = require('../data-loader');

const matchCV = (req, res, next) => {
  const data = loadData();
  return res.json(data);
};

module.exports = {
  matchCV
};
