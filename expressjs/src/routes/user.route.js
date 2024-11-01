const express = require('express');
const { getLoggedInUser, signup } = require('../controllers/user.controller.js');
const auth = require('../middleware/auth.middleware.js');

const router = express.Router();

router.get('/user', auth, getLoggedInUser);
router.post('/signup', signup);

module.exports = router;