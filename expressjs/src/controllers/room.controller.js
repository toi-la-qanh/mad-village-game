const { checkSchema, validationResult } = require("express-validator");
const Room = require("../models/room.model");
const { ObjectId } = require("mongodb");

class RoomController {
  static listenForEvents(io, socket) {
    // Join user to the room when they join the room page (client-side)
    socket.on("room:join", (roomID) => {
      socket.join(roomID);
      console.log(`User ${socket.user} has joined the room ${roomID}`);
      io.to(roomID).emit("room:update", roomID);
    });

    // Remove user from the room when they leave the room page (client-side)
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

      const { id } = req.params;
      const room = await Room.findById(id);
      const user = req.user;

      if (!room) {
        return res.status(404).json({ errors: "Không tìm thấy phòng này !" });
      }

      if (
        room.players.length >= room.capacity &&
        !room.players.includes(user)
      ) {
        return res.status(400).json({ errors: "Phòng đã đầy !" });
      }

      // Check if user is already in the room
      if (!room.players.includes(user)) {
        // If user is not in the room, add them
        room.players.push(user);
        await room.save();
      }

      const roomID = room._id;

      return res
        .status(200)
        .json({ message: "Vào phòng thành công!", roomID: roomID });
    },
  ];

  static roomLeave = [
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
    },
  ];

  static roomUpdate = [
    checkSchema({
      id: {
        notEmpty: {
          errorMessage: "Mã phòng không được để trống !",
        },
        isMongoId: {
          errorMessage: "Mã phòng không hợp lệ !",
        },
      },
      capacity: {
        optional: true,
        isInt: {
          options: { min: 1 },
          errorMessage:
            "Số người trong phòng phải là số nguyên dương lớn hơn 0 !",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const room = await Room.findById(id);

      if (!room) {
        return res.status(404).json({ errors: "Không tìm thấy phòng này !" });
      }

      const user = req.user;
      // Check if user is already in the room
      if (!room.owner.includes(user)) {
        return res.status(403).json({
          errors: "Bạn không có quyền chỉnh sửa thông tin trong phòng này!",
        });
      }

      const { capacity } = req.body;

      if (capacity < room.players.length) {
        return res
          .status(400)
          .json({
            errors:
              "Số lượng người không được nhỏ hơn số người hiện tại ở trong phòng!",
          });
      }

      if (capacity) await room.updateOne({ capacity });
      const roomID = room._id;

      return res
        .status(200)
        .json({ message: "Cập nhật phòng thành công!", roomID: roomID });
    },
  ];
}

module.exports = { RoomController };
