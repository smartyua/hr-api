const _ = require('lodash');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const date = moment().format('YYYY-MM');
const fullStorage = `${path.resolve('')}/storage/${date}`;
const storage = `/storage/${date}`;

const upload = (req, res, next) => {
  try {
    const { files } = req;

    const response = files.map(file => {
      const filePath = _.get(file, 'path');
      const fileName = _.get(file, 'filename');
      const fileExt = _.get(file, 'originalname')
        .split('.')
        .pop()
        .trim() || '';

      if (!fs.existsSync(fullStorage)) {
        fs.mkdirSync(fullStorage);
      }

      const newFile = `${fullStorage}/${fileName}.${fileExt}`;
      const newFileRes = `${storage}/${fileName}.${fileExt}`;
      fs.createReadStream(filePath).pipe(fs.createWriteStream(newFile));

      fs.unlinkSync(filePath);
      return { src: newFileRes };
    });

    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  upload
};
