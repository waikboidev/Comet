const caseSchema = require('../../schemas/caseSchema');

async function createCase(client, guild, moderator, target, action, reason, duration = null) {
    const caseId = Math.random().toString(36).substring(2, 9);

    const newCase = new caseSchema({
        caseId,
        guildId: guild.id,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        targetId: target.id,
        targetTag: target.user.tag,
        action,
        reason,
        duration,
        createdAt: new Date(),
    });

    await newCase.save();
    return newCase;
}

module.exports = createCase;
