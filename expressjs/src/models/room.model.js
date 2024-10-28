const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    number_of_players: {
        type: Number,
        required: true
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    }]
});

const Room = mongoose.model('Room', RoomSchema);
module.exports = Room;