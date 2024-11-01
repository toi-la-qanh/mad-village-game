const { checkSchema, validationResult } = require("express-validator");
const Room = require("../models/room.model");
const { ObjectId } = require("mongodb");

const roomIndex = [
  checkSchema({
    _id: {
      optional: true,
      notEmpty: {
        errorMessage: "Mã phòng không được để trống !",
      },
      isMongoId: {
        errorMessage: "Mã phòng không hợp lệ !",
      },
    },
    owner: {
      optional: true,
      notEmpty: {
        errorMessage: "Tên chủ phòng không được để trống !",
      },
    },
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array(), value: req.query });
    }

    const { _id, owner } = req.query;
    
    const rooms = await Room.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerInfo",
        },
      },
      {
        $unwind: {
          path: "$ownerInfo",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          $or: [
            { _id: _id ? ObjectId.createFromHexString(_id) : { $exists: true } },
            { "$ownerInfo.name": owner ? owner : { $exists: true } },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          capacity: 1,
          playerCount: { $size: "$players" },
          ownerName: "$ownerInfo.name",
        },
      },
    ]);

    if (rooms.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phòng này!" });
    }

    return res.status(200).json({ rooms });
  },
];

const roomShow = [
  checkSchema({
    id: {
      notEmpty: {
        errorMessage: "Mã phòng không được để trống",
      },
      isMongoId: {
        errorMessage: "Mã phòng không hợp lệ", // Optional: Validate if it's a valid MongoDB ID
      },
    },
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array(), value: req.query });
    }

    const { id } = req.params.id;

    const room = await Room.find({ _id: ObjectId.createFromHexString(id) });

    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng này!" });
    }

    const current_players_count = room.players.length;

    return res.status(200).json({ message: "Tìm được phòng: ", room, current_players_count });
  },
];

const roomCreate = [
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
      return res.status(422).json({ errors: errors.array(), value: req.query });
    }

    const owner = req.user;
    const checkIfUserInRoom = await Room.findOne({ players: owner });

    if (checkIfUserInRoom) {
      return res.status(400).json({
        errors: "Không thể tạo phòng khi bạn đang ở trong một phòng khác !",
      });
    }

    const { capacity } = req.query;

    const room = new Room({
      capacity,
      owner: owner,
      players: [owner],
    });

    await room.save();

    return res.status(200).json({ message: "Tạo phòng thành công !", room });
  },
];

const roomJoin = async (req, res) => {
  const id = req.params;
  const room = await Room.find({ _id: ObjectId.createFromHexString(id) });

  if (!room) {
    return res.status(404).json({ error: "Không tìm thấy phòng này !" });
  }

  const user = req.user;
  const checkIfUserInOtherRoom = await Room.findOne({ players: user });

  if (checkIfUserInOtherRoom) {
    return res.status(400).json({
      errors: "Không thể vào phòng này vì bạn đang ở trong một phòng khác !",
    });
  }

  room.players.push(user);
  await room.save();

  return res.status(200).json({ message: "Tham gia phòng thành công!" });
};

const roomLeave = async (req, res) => {};

module.exports = {
  roomIndex,
  roomShow,
  roomCreate,
  roomJoin,
  roomLeave,
};
