const { ActivityType } = require('discord.js');

/**
 * @file functions/presence.js
 * @description Initializes and manages the bot's presence, updating it with the server's member count.
 */

let updateActivity = null;

module.exports = {
  /**
   * Initializes the presence update interval.
   * @param {Client} client - The Discord client instance.
   * @param {String} guildId - The ID of the guild to monitor.
   */
  init: async (client, guildId) => {
    console.log(client.config.presence.enabled ? '✅   Automatic presence is enabled.' : '❌   Automatic presence has been disabled.');

    updateActivity = async () => {
      try {
        // Re-check the config on each interval to respond to live changes from the ?!cfg command.
        if (!client.config.presence.enabled) {
          return;
        }

        const guild = await client.guilds.fetch(guildId);
        if (!guild) {
          return console.warn(`[WARNING] Guild with ID ${guildId} not found for presence update.`);
        }

        await guild.fetch(); // Ensure member count is up-to-date
        const memberCount = guild.memberCount;
        const activityString = `${memberCount} members`;

        // Only set the activity if it has changed to avoid unnecessary API calls.
        if (client.user.presence.activities[0]?.name !== activityString) {
            client.user.setActivity(activityString, { type: ActivityType.Watching });
            console.log(`[Presence] Updated activity to: Watching ${memberCount} members`);
        }
      } catch (error) {
        console.error('[ERROR] Failed to update activity or fetch guild:', error);
      }
    };

    await updateActivity();
    setInterval(updateActivity, 20000);
  },

  updateActivity: () => updateActivity?.()
};
