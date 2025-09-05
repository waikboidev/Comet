const muteSchema = require('../schemas/muteSchema');
const ms = require('ms');

const MAX_TIMEOUT_DURATION = ms('28d');

async function checkMutes(client) {
    const mutes = await muteSchema.find();

    for (const mute of mutes) {
        const { guildId, userId, endTime } = mute;
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            await muteSchema.findByIdAndDelete(mute._id);
            continue;
        }
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            await muteSchema.findByIdAndDelete(mute._id);
            continue;
        }

        const now = new Date();
        if (endTime > now) {
            // Mute is still active
            const remainingDuration = endTime.getTime() - now.getTime();
            let timeoutDuration;

            if (remainingDuration > MAX_TIMEOUT_DURATION) {
                timeoutDuration = MAX_TIMEOUT_DURATION;
            } else {
                timeoutDuration = remainingDuration;
            }

            try {
                // Only re-apply timeout if the user is not already timed out or the remaining duration is different
                if (!member.isCommunicationDisabled() || (member.communicationDisabledUntil.getTime() - now.getTime()) < (timeoutDuration - 1000)) {
                     await member.timeout(timeoutDuration, 'Mute duration re-applied after restart.');
                }
            } catch (error) {
                console.error(`Failed to timeout member ${member.user.tag} in guild ${guild.name}:`, error);
            }

        } else {
            // Mute has expired
            try {
                if (member.isCommunicationDisabled()) {
                    await member.timeout(null, 'Mute expired.');
                }
            } catch (error) {
                console.error(`Failed to unmute member ${member.user.tag} in guild ${guild.name}:`, error);
            }
            await muteSchema.findByIdAndDelete(mute._id);
        }
    }
}

function init(client) {
    // Initial check
    checkMutes(client);

    // Check every 5 minutes
    setInterval(() => checkMutes(client), ms('5m'));
}

module.exports = { init };
