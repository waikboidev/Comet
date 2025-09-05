// top imports
const { Events } = require('discord.js');
const registerCommands = require('../functions/deploy_commands.js');
const mongodb = require('../functions/mongodb.js');
const presence = require('../functions/presence.js');
const { loadConfig } = require('../functions/configLoader.js');

const muteManager = require('../functions/muteManager.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    await registerCommands();
    setTimeout(() => {
      console.log(`✅   Ready! Logged in as ${client.user.tag}`);
    }, 3000);

    const specificGuildId = process.env.GUILDID;
    if (!specificGuildId) {
      return console.warn('[WARNING] GuildId not found in .env file. Cannot run guild-specific features.');
    }

    await mongodb.connect();
    await loadConfig(client, specificGuildId);
    await presence.init(client, specificGuildId);
    await muteManager.init(client);

  },
};
