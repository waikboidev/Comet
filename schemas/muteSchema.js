const { Schema, model } = require('mongoose');

const muteSchema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    originalDuration: {
        type: Number,
        required: true,
    }
});

module.exports = model('mute', muteSchema);
