const configSchema = require('../schemas/configSchema');

/**
 * @file functions/configLoader.js
 * @description Loads the bot's configuration from MongoDB into the client object.
 */

/**
 * Fetches the configuration for a given guild from the database.
 * If no configuration exists, it creates a default one.
 * The loaded config is then attached to the client object.
 * @param {Client} client - The Discord client instance.
 * @param {String} guildId - The ID of the guild to load the config for.
 * @returns {Promise<Object>} The loaded or newly created configuration object.
 */
async function loadConfig(client, guildId) {
    try {
        let config = await configSchema.findOne({ guildId });

        if (!config) {
            console.log(`No config found for guild ${guildId}. Creating a default one.`);
            config = new configSchema({
                guildId,
                // Default settings can be adjusted here
                presence: { enabled: true },
            });
            await config.save();
        }

        // Attach the configuration to the client object for global access
        client.config = config;
        console.log('✅   Configuration loaded successfully.');
        return config;
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Fallback to a default config object in case of DB error
        client.config = {
            presence: { enabled: false },
        };
        return client.config;
    }
}

module.exports = { loadConfig };