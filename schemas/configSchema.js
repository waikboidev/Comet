const { Schema, model } = require('mongoose');

/**
 * @file Schemas/configSchema.js
 * @description Mongoose schema for storing guild-specific bot configurations.
 * @property {String} guildId - The ID of the guild the configuration belongs to.
 * @property {Object} automod - Settings for the automod feature.
 * @property {Boolean} automod.enabled - Whether the automod is enabled.
 * @property {Object} autoresponder - Settings for the auto-responder feature.
 * @property {Boolean} autoresponder.enabled - Whether the auto-responder is enabled.
 * @property {Object} presence - Settings for the bot's presence.
 * @property {Boolean} presence.enabled - Whether the automatic presence update is enabled.
 */
const configSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    presence: {
        enabled: { type: Boolean, default: true },
    },
});

module.exports = model('Config', configSchema);