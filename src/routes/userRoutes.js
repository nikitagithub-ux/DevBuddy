// routes/userRoutes.js
const express = require('express');
const auth = require('../middleware/auth');
const { getProfile, getInitPreferences, connectUsers, getConnectedUsers } = require('../controllers/userController');

const router = express.Router();

router.get('/profile', auth, getProfile);

router.get('/init-preferences', auth, getInitPreferences);

router.post('/connect/:userIdToConnect', auth, connectUsers);

router.get('/connections', auth, getConnectedUsers);

module.exports = router;
