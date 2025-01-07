const express = require("express");
const { roleIndex } = require("../controllers/role.controller.js");
const { GameController } = require("../controllers/game.controller.js");
const auth = require("../middleware/auth.middleware.js");

const router = express.Router();

router.get("/roles", roleIndex);
router.post("/start", auth, GameController.gameStart);

module.exports = router;
