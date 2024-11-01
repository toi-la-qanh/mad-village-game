const express = require('express');
const { roomIndex, roomShow, roomCreate, roomJoin, roomLeave } = require('../controllers/room.controller.js');
const auth = require('../middleware/auth.middleware.js');

const router = express.Router();

router.get('/room', roomIndex);
router.get('/room/:id', roomShow);
// router.get('/room', roomSearch);
router.post('/room/:id/join', auth, roomJoin);
router.post('/room', auth, roomCreate);
router.post('/room/:id/leave', auth, roomLeave);

module.exports = router;