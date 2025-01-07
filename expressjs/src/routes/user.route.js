const express = require('express');
const { UserController } = require('../controllers/user.controller.js');
const auth = require('../middleware/auth.middleware.js');

const router = express.Router();

router.get('/', auth, UserController.getLoggedInUser);
router.post('/signup', UserController.signup);
router.post('/signin', UserController.signin);

module.exports = router;