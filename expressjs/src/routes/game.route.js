const express = require("express");
const { GameController } = require("../controllers/game.controller.js");
const { RoleController } = require("../controllers/role.controller.js");
const auth = require("../middleware/auth.middleware.js");

const router = express.Router();

router.get("/roles", RoleController.roleIndex);
router.get("/roles/info", RoleController.roleInfo);
router.post("/start", auth, GameController.gameStart);

module.exports = router;
