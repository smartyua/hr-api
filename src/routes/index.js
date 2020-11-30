// routes

const express = require('express');
// const passport = require('passport');

const router = express.Router({ strict: true });

// const jwtAuthorizer = passport.authenticate('jwt', { session: false });

const { uploadJFile } = require('../middleware/upload');

const { upload } = require('../endpoints/upload');

const { matchCV } = require('../endpoints/match');

router.post('/upload', uploadJFile, upload);
router.post('/match', matchCV);

module.exports = router;
