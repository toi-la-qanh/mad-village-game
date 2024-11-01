const express = require('express');
const roleIndex = require('../controllers/role.controller.js');
const { gameStart, gameEnd } = require('../controllers/game.controller.js');
const auth = require('../middleware/auth.middleware.js');

const router = express.Router();

router.get('/role', roleIndex);
router.post('/game/start', auth, gameStart);
router.post('/game/end', auth, gameEnd);

module.exports = router;