const express = require('express');
const { RoomController } = require('../controllers/room.controller.js');
const auth = require('../middleware/auth.middleware.js');
const { rateLimit } = require("express-rate-limit");

const router = express.Router();

// Set the rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { errors: 'req.t("rateLimit.errors.tooManyRequests")' },
});

router.get('/', RoomController.roomIndex);
router.get('/:id', RoomController.getRoom);
router.post('/:id/join', auth, RoomController.roomJoin);
router.post('/', auth, limiter, RoomController.roomCreate);
router.patch('/:id', auth, limiter, RoomController.roomUpdate);
router.delete('/:id/leave', auth, RoomController.roomLeave);
router.patch('/:id/kick', auth, RoomController.roomKick);

module.exports = router;