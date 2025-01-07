const express = require('express');
const { RoomController } = require('../controllers/room.controller.js');
const auth = require('../middleware/auth.middleware.js');

const router = express.Router();

router.get('/', RoomController.roomIndex);
router.get('/:id', RoomController.getRoom);
router.post('/:id/join', auth, RoomController.roomJoin);
router.post('/', auth, RoomController.roomCreate);
router.post('/:id/leave', auth, RoomController.roomLeave);
router.post('/:id/delete', auth, RoomController.roomDelete);

module.exports = router;