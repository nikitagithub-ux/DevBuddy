const express = require('express');
const router = express.Router();

const searchLanguage = require('../controllers/searchController');

router.get('/:language', searchLanguage);

module.exports = router;
