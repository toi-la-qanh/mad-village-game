const { checkSchema, validationResult } = require("express-validator");
const Room = require("../models/room.model");
const { ObjectId } = require("mongodb");

class RoomController {
  static listenForEvents(io, socket) {
    socket.on("room:join", (roomID) => {
      socket.join(roomID);
      console.log(`User ${socket.user} has joined the room ${roomID}`);
      io.to(roomID).emit("room:update", roomID);
    });
    socket.on("room:check", async (roomID) => {
      const room = await Room.findById(roomID);
      if (!room) {
        return io.to(roomID).emit("room:check:response", {
          roomID: null,
          isInRoom: null,
        });
      }
      if (room.players.includes(socket.user)) {
        return io.to(roomID).emit("room:check:response", {
          roomID: roomID,
          isInRoom: true,
        });
      }
      return io.to(roomID).emit("room:check:response", {
        roomID: roomID,
        isInRoom: false,
      });
    });
    socket.on("room:leave", (roomID) => {
      if (!socket.rooms.has(roomID)) {
        socket.leave(roomID);
      }
      console.log(`User ${socket.user} has left the room ${roomID}`);
      io.to(roomID).emit("room:update", roomID);
    });
  }

  static roomIndex = async (req, res) => {
    // Get the last room id from the query params (or set it to null for initial load)
    const lastRoomId = req.query.lastRoomId || null;
    const limit = 10; // We want to fetch 10 rooms per request

    let rooms;

    // If it's the initial load, no `lastRoomId` will be provided
    if (!lastRoomId) {
      rooms = await Room.find().limit(limit).populate("owner", "name"); // Fetch the first 10 rooms
    } else {
      // If `lastRoomId` is provided, fetch the next 10 rooms after the last one
      rooms = await Room.find({ _id: { $gt: lastRoomId } })
        .limit(limit)
        .populate("owner", "name");
    }

    if (rooms.length === 0) {
      return res.status(404).json({ errors: "Hiện chưa có phòng chờ !" });
    }

    const roomDetails = rooms.map((room) => ({
      roomID: room._id,
      capacity: room.capacity,
      ownerName: room.owner?.name,
      playerCount: room.players.length,
    }));

    const newLastRoomId = rooms[rooms.length - 1]._id;
    return res.status(200).json({
      rooms: roomDetails,
      newLastRoomId, // Return the id of the last room for the next request
    });
  };

  static getRoom = [
    checkSchema({
      id: {
        notEmpty: {
          errorMessage: "Mã phòng không được để trống !",
        },
        isMongoId: {
          errorMessage: "Mã phòng không hợp lệ !",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { id } = req.params;

      const room = await Room.findById(id)
        .populate("owner", "name")
        .populate("players", "name _id");

      if (!room) {
        return res.status(404).json({ errors: "Không tìm thấy phòng này!" });
      }

      const roomData = {
        roomID: room._id,
        capacity: room.capacity,
        owner: room.owner,
        players: room.players.map((player) => ({
          id: player._id,
          name: player.name,
        })),
        playerCount: room.players.length,
      };

      return res.status(200).json({ roomData });
    },
  ];

  static roomCreate = [
    checkSchema({
      capacity: {
        notEmpty: {
          errorMessage: "Số người chơi không được để trống !",
        },
        isInt: {
          options: { min: 6, max: 20 },
          errorMessage: "Số người chơi phải từ 6-20 người !",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const owner = req.user;
      const checkIfUserInRoom = await Room.findOne({ players: owner });

      if (checkIfUserInRoom) {
        return res.status(400).json({
          errors: "Không thể tạo phòng khi bạn đang ở trong một phòng khác !",
        });
      }

      const { capacity } = req.body;

      const room = new Room({
        capacity,
        owner: owner,
        players: [owner],
      });

      await room.save();

      const roomID = room._id;

      return res
        .status(200)
        .json({ message: "Tạo phòng thành công !", roomID });
    },
  ];

  static roomJoin = [
    checkSchema({
      id: {
        notEmpty: {
          errorMessage: "Mã phòng không được để trống !",
        },
        isMongoId: {
          errorMessage: "Mã phòng không hợp lệ !",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      const id = req.params.id;

      const room = await Room.findOne({
        _id: ObjectId.createFromHexString(id),
      });

      if (!room) {
        return res.status(404).json({ error: "Không tìm thấy phòng này !" });
      }

      if (room.players.length >= room.capacity) {
        return res.status(400).json({ error: "Phòng đã đầy !" });
      }

      const user = req.user;
      if (room.players.includes(user)) {
        return res.status(400).json({
          errors:
            "Không thể vào phòng này vì bạn đang ở trong một phòng khác !",
        });
      }

      room.players.push(user);
      await room.save();
      const roomID = room._id;

      return res
        .status(200)
        .json({ message: "Tham gia phòng thành công!", roomID: roomID });
    },
  ];

  static roomLeave = async (req, res) => {
    const id = req.params.id;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ errors: "Không tìm thấy phòng này !" });
    }

    const user = req.user;
    if (user.toString() === room.owner.toString()) {
      if (room.players.length > 1) {
        return res.status(400).json({
          errors:
            "Bạn phải nhường chức chủ phòng cho một ai đó trước khi rời khỏi phòng!",
        });
      }
      await room.deleteOne();
      return res.status(200).json({ message: "Xoá phòng thành công!" });
    }
    room.players.remove(user);

    await room.save();
    const roomID = room._id;

    return res
      .status(200)
      .json({ message: "Rời phòng thành công!", roomID: roomID });
  };
}

module.exports = { RoomController };
