const express = require('express');
import { signup } from "../controllers/user.controller.js";
// import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);

module.exports = router;