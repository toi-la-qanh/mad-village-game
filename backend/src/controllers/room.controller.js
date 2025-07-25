const { checkSchema, validationResult } = require("express-validator");
const Room = require("../models/room.model");
const redis = require("../database/redis");
const bcrypt = require("bcrypt");

class RoomController {
  static async listenForEvents(io, socket) {
    // Join user to the room when they join the room page (client-side)
    socket.on("room:join", (roomID) => {
      socket.join(roomID);
      console.log(`User ${socket.user} has joined the room ${roomID}`);
      io.to(roomID).emit("room:update", roomID);
    });

    // Remove user from the room when they leave the room page (client-side)
    socket.on("room:leave", (roomID) => {
      socket.leave(roomID);
      console.log(`User ${socket.user} has left the room ${roomID}`);
      io.to(roomID).emit("room:update", roomID);
    });

    socket.on("room:refresh", (roomID) => {
      io.to(roomID).emit("room:update", roomID);
    });
  }

  /**
   * Method to get all the rooms data
   */
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
      return res.status(404).json({ errors: req.t("room.errors.noRooms") });
    }

    // Filter out rooms where the owner name is missing
    const validRooms = rooms.filter((room) => room.owner && room.owner.name);

    // If any room has no owner name, delete that room
    if (validRooms.length !== rooms.length) {
      // Deleting rooms without an owner name from the database
      const invalidRooms = rooms.filter(
        (room) => !room.owner || !room.owner.name
      );
      for (const room of invalidRooms) {
        await Room.findByIdAndDelete(room._id);
      }
    }

    const roomDetails = validRooms.map((room) => ({
      roomID: room._id,
      capacity: room.capacity,
      ownerName: room.owner?.name,
      playerCount: room.players.length,
    }));

    const newLastRoomId = validRooms[validRooms.length - 1]?._id;
    return res.status(200).json({
      rooms: roomDetails,
      newLastRoomId, // Return the id of the last room for the next request
    });
  };

  /**
   * Method to get the specific room data
   */
  static getRoom = [
    checkSchema({
      id: {
        notEmpty: {
          errorMessage: "room.errors.idEmpty",
        },
        isMongoId: {
          errorMessage: "room.errors.idInvalid",
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
        return res.status(404).json({ errors: req.t("room.errors.notFound") });
      }

      // If the owner name is not found, it means that the user's account was deleted, so we can delete the room
      if (!room.owner || !room.owner.name) {
        await room.deleteOne();
        return res.status(404).json({ errors: req.t("room.errors.notFound") });
      }

      // Filter out players with missing names and remove them from the room
      const validPlayers = room.players.filter(
        (player) => player && player.name
      );
      const invalidPlayers = room.players.filter(
        (player) => !player || !player.name
      );

      // If there are invalid players, update the room
      if (invalidPlayers.length > 0) {
        const invalidPlayerIds = invalidPlayers.map((player) => player._id);
        await Room.updateOne(
          { _id: id },
          { $pull: { players: { _id: { $in: invalidPlayerIds } } } }
        );
      }

      const roomData = {
        _id: room._id,
        capacity: room.capacity,
        owner: room.owner,
        players: validPlayers.map((player) => ({
          id: player._id,
          name: player.name,
        })),
        playerCount: validPlayers.length,
        password: room.password,
      };

      return res.status(200).json({ roomData });
    },
  ];

  /**
   * Method to create a room
   */
  static roomCreate = [
    checkSchema({
      capacity: {
        notEmpty: {
          errorMessage: "room.errors.capacityEmpty",
        },
        isInt: {
          options: { min: 6, max: 20 },
          errorMessage: "room.errors.capacityInvalid",
        },
      },
      password: {
        optional: true,
        isLength: {
          options: { min: 6, max: 30 },
          errorMessage: "room.errors.passwordInvalid",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        // Map and translate error messages
        const translatedErrors = errors.array().map(err => ({
          ...err,
          msg: req.t(err.msg) || err.msg
        }));
        return res.status(422).json({ errors: translatedErrors });
      }

      const owner = req.user;
      const checkIfUserInRoom = await Room.findOne({ players: owner });

      if (checkIfUserInRoom) {
        return res.status(400).json({
          errors: req.t("room.errors.cannotCreateRoom"),
        });
      }

      const { capacity, password } = req.body;

      // Hash the password if provided
      let hashedPassword;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const room = new Room({
        capacity,
        owner: owner,
        players: [owner],
        ...(hashedPassword && { password: hashedPassword }),
      });

      await room.save();

      // Store room in redis for later use
      await redis.set(
        `user:${req.user}`,
        JSON.stringify({ roomID: room._id, gameID: null }),
        "EX",
        86400
      );

      return res
        .status(200)
        .json({ message: req.t("room.messages.createSuccess"), roomID: room._id });
    },
  ];

  /**
   * Method to add a user to the specific room
   */
  static roomJoin = [
    checkSchema({
      id: {
        in: ["params"],
        notEmpty: {
          errorMessage: "room.errors.idEmpty",
        },
        isMongoId: {
          errorMessage: "room.errors.idInvalid",
        },
      },
      password: {
        in: ["body"],
        optional: true,
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Map and translate error messages
        const translatedErrors = errors.array().map(err => ({
          ...err,
          msg: req.t(err.msg) || err.msg
        }));
        return res.status(422).json({ errors: translatedErrors });
      }

      const { id } = req.params;
      const room = await Room.findById(id);
      const user = req.user;

      if (!room) {
        return res.status(404).json({ errors: req.t("room.errors.notFound") });
      }

      // Check if user is already in the room
      const isUserInRoom = room.players.some((player) => player.equals(user));

      if (isUserInRoom) {
        return res.status(200).json({
          message: req.t("room.messages.alreadyInRoom"),
          roomID: room._id,
        });
      }

      // Check if the room is full
      if (room.players.length >= room.capacity) {
        return res.status(400).json({ errors: req.t("room.errors.roomFull") });
      }

      // Check password if required
      if (room.password) {
        const { password } = req.body;
        if (!password) {
          return res
            .status(403)
            .json({ errors: req.t("room.errors.passwordRequired") });
        }

        const passwordMatch = await bcrypt.compare(password, room.password);
        if (!passwordMatch) {
          return res.status(403).json({ errors: req.t("room.errors.passwordIncorrect") });
        }
      }

      // Add user to room
      room.players.push(user);
      await room.save();

      // Store room in redis for later use
      await redis.set(
        `user:${req.user}`,
        JSON.stringify({ roomID: room._id, gameID: null }),
        'EX',
        86400
      );

      return res
        .status(200)
        .json({ message: req.t("room.messages.joinSuccess"), roomID: room._id });
    },
  ];

  /**
   * Method to allow user to leave the specific room
   */
  static roomLeave = [
    checkSchema({
      id: {
        notEmpty: {
          errorMessage: "room.errors.idEmpty",
        },
        isMongoId: {
          errorMessage: "room.errors.idInvalid",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Map and translate error messages
        const translatedErrors = errors.array().map(err => ({
          ...err,
          msg: req.t(err.msg) || err.msg
        }));
        return res.status(422).json({ errors: translatedErrors });
      }

      const { id } = req.params;
      const room = await Room.findById(id);

      if (!room) {
        return res.status(404).json({ errors: req.t("room.errors.notFound") });
      }

      const user = req.user;
      if (user.toString() === room.owner.toString()) {
        if (room.players.length > 1) {
          return res.status(400).json({
            errors:
              req.t("room.errors.mustLeaveOwner"),
          });
        }
        
        await room.deleteOne();
        return res.status(200).json({ message: req.t("room.messages.deleteSuccess") });
      }

      room.players = room.players.filter(
        (playerId) => !playerId.equals(user._id)
      );

      await room.save();

      await redis.del(`user:${user}`);

      return res
        .status(200)
        .json({ message: req.t("room.messages.leaveSuccess"), roomID: room._id });
    },
  ];

  /**
   * Method to update the specific room data
   */
  static roomUpdate = [
    checkSchema({
      id: {
        notEmpty: {
          errorMessage: "room.errors.idEmpty",
        },
        isMongoId: {
          errorMessage: "room.errors.idInvalid",
        },
      },
      capacity: {
        optional: true,
        isInt: {
          options: { min: 1 },
          errorMessage:
            "room.errors.capacityInvalid",
        },
      },
      password: {
        optional: true,
        isString: { errorMessage: "room.errors.passwordInvalid" },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Map and translate error messages
        const translatedErrors = errors.array().map(err => ({
          ...err,
          msg: req.t(err.msg) || err.msg
        }));
        return res.status(422).json({ errors: translatedErrors });
      }

      const { id } = req.params;
      const room = await Room.findById(id);

      if (!room) {
        return res.status(404).json({ errors: req.t("room.errors.notFound") });
      }

      const user = req.user;
      // Check if user is already in the room
      if (!room.owner.equals(user)) {
        return res.status(403).json({
          errors: req.t("room.errors.noPermissionToUpdate"),
        });
      }

      const { capacity, password } = req.body;
      const updateData = {};

      // Validate capacity if provided
      if (capacity) {
        if (capacity < room.players.length) {
          return res.status(400).json({
            errors:
              req.t("room.errors.capacityTooSmall"),
          });
        }
        updateData.capacity = capacity;
      }

      // Hash password if provided
      if (password) {
        updateData.hashedPassword = await bcrypt.hash(password, 10);
      }

      // Update room with validated data
      await Room.findByIdAndUpdate(id, updateData);

      return res
        .status(200)
        .json({ message: req.t("room.messages.updateSuccess"), roomID: room._id });
    },
  ];

  /**
   * Method to remove a user out from the specific room
   */
  static roomKick = [
    checkSchema({
      id: {
        notEmpty: {
          errorMessage: "room.errors.idEmpty",
        },
        isMongoId: {
          errorMessage: "room.errors.idInvalid",
        },
      },
      user_id: {
        notEmpty: {
          errorMessage: "room.errors.userIdEmpty",
        },
        isMongoId: {
          errorMessage: "room.errors.userIdInvalid",
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
        return res.status(404).json({ errors: req.t("room.errors.notFound") });
      }

      const user = req.user;
      // Check if user is already in the room
      if (!room.owner.equals(user)) {
        return res.status(403).json({
          errors: req.t("room.errors.noPermissionToKick"),
        });
      }

      const { user_id } = req.body;

      // Prevent owner from kicking themselves
      if (user_id === user.toString()) {
        return res.status(400).json({
          error: req.t("room.errors.cannotKickOwner"),
        });
      }

      // Check if the user is part of the room (i.e., they exist in the room's players)
      const playerIndex = room.players.findIndex(
        (player) => player._id.toString() === user_id
      );

      // If user not found in the room
      if (playerIndex === -1) {
        return res
          .status(404)
          .json({ errors: req.t("room.errors.userNotFound") });
      }

      // Remove the user from the players array
      room.players.splice(playerIndex, 1);

      // Save the updated room document
      await room.save();

      await redis.del(`user:${user_id}`);

      return res.status(200).json({
        message: req.t("room.messages.kickSuccess"),
        roomID: room._id,
      });
    },
  ];
}

module.exports = { RoomController };
