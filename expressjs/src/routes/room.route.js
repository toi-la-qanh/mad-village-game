const express = require('express');
const { RoomController } = require('../controllers/room.controller.js');
const socket = require("../socketHandle/socket.js");
const auth = require('../middleware/auth.middleware.js');

const router = express.Router();

router.get('/', RoomController.roomIndex);
router.get('/:id', RoomController.getRoom);
router.get('/:id/join', auth, RoomController.roomJoin);
router.post('/', auth, RoomController.roomCreate);
router.patch('/', auth, RoomController.roomUpdate);
router.delete('/:id', auth, RoomController.roomLeave);

module.exports = router;