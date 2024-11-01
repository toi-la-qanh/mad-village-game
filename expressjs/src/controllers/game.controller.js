const Room = require("../models/room.model");
const Game = require("../models/game.model");
const assignTypesOfRole = require("./rule.controller");
const { ObjectId } = require("mongodb");

// Start a new game
const gameStart = async (req, res) => {
  
  const ownerID = req.user;
  const { roomID, roles } = req.query;

  const room = await Room.find({ _id: ObjectId.createFromHexString(roomID) });

  // Check if room is not found
  if (!room) {
    return res.status(404).json({ errors: "Phòng không tồn tại!" });
  }

  // Check the count of the players in the room
  if (room.players.length < 6 || room.players.length > 20) {
    return res
      .status(400)
      .json({ errors: "Số người chơi phải từ 6-20 người!" });
  }

  // Check if the user is the owner of the room
  if (!room.owner.equals(ownerID)) {
    return res
      .status(403)
      .json({ errors: "Chỉ chủ phòng mới có thể bắt đầu trò chơi!" });
  }

  // random function help to randomize the roles and types.
  function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
  }

  // Get the types following the rule of the game
  const types = assignTypesOfRole(room.players.length);
  const player_ids = room.players;

  const game = new Game({
    room: roomID,
    players: {
      player_id: player_ids,
      role: player_ids.map(() => shuffle(roles)),
      type: player_ids.map(() => shuffle(types)),
    },
  });

  await game.save();

  return res.status(200).json({ message: "Trò chơi đã bắt đầu!", game });
};

const gamePlay = async () => {};

// End a game
const gameEnd = async (req, res) => {
  
  const gameID = req.query;
  await Game.deleteOne({ _id: ObjectId.createFromHexString(gameID) });

  return res.status(200).json({ message: "Trò chơi đã kết thúc !" });
};

module.exports = { gameStart, gamePlay, gameEnd };
