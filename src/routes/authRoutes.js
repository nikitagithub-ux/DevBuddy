const express = require('express');
const { signup, login } = require('../controllers/authController');
const {setLanguagePreferences} = require('../controllers/languageController');
const auth = require('../middleware/auth');

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);

router.post('/set-language-preferences', auth, setLanguagePreferences);

module.exports = router;