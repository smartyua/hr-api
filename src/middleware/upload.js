const tmp = require('tmp');
const multer = require('multer');

const rootUploadFolder = tmp.dirSync().name;

const upload = multer({
  dest: rootUploadFolder
});

const uploadJFile = upload.any();

module.exports = {
  uploadJFile
};
