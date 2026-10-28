const express = require('express');
const router = express.Router();
const { getLiveWeather, getGitHubIssues } = require('../controllers/externalApiController');

router.get('/weather', getLiveWeather);
router.get('/github/issues', getGitHubIssues);

module.exports = router;
