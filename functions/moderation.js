const { EmbedBuilder } = require('discord.js');
const Case = require('../schemas/caseSchema');
const MessageConfig = require('../schemas/messageConfigSchema');
const ms = require('ms');

function generateCaseId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function getMessage(guildId, action) {
    let config = await MessageConfig.findOne({ guildId });
    if (!config) {
        config = new MessageConfig({ guildId });
        await config.save();
    }
    return config.messages[action];
}

async function getDmMessage(guildId) {
    let config = await MessageConfig.findOne({ guildId });
    if (!config) {
        config = new MessageConfig({ guildId });
        await config.save();
    }
    return config.messages.dm;
}

async function handleModerationAction(interaction, user, action, reason, duration = null) {
    const { guild, member: moderator } = interaction;

    const caseId = generateCaseId();
    let dmSent = true;
    const actionPastTense = {
        ban: 'banned',
        softban: 'soft-banned',
        unban: 'unbanned',
        kick: 'kicked',
        mute: 'muted',
        unmute: 'unmuted',
        warn: 'warned',
        unwarn: 'unwarned'
    }[action] || action;

    try {
        const dmMessageConfig = await getDmMessage(guild.id);
        const dmEmbed = new EmbedBuilder()
            .setTitle(dmMessageConfig.title)
            .setDescription(dmMessageConfig.description.replace('{action}', actionPastTense).replace('{server}', guild.name))
            .addFields(
                { name: 'Moderator', value: moderator.user.tag, inline: true },
                { name: 'Case ID', value: caseId, inline: true },
                { name: 'Reason', value: `\`\`\`${reason}\`\`\`` }
            )
            .setColor('Red');
        
        if (duration) {
            dmEmbed.addFields({ name: 'Duration', value: duration });
        }

        await user.send({ embeds: [dmEmbed] });
    } catch (error) {
        dmSent = false;
    }

    const newCase = new Case({
        caseId,
        guildId: guild.id,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        userId: user.id,
        userTag: user.tag,
        action,
        reason,
        duration,
        dmSent,
    });

    if ((action === 'mute' || action === 'timeout') && duration) {
        const durationMs = ms(duration);
        if (durationMs) {
            newCase.expires = new Date(Date.now() + durationMs);
        }
    }

    await newCase.save();

    const confirmationMessageTemplate = await getMessage(guild.id, action);
    const confirmationMessage = confirmationMessageTemplate
        .replace('{caseId}', caseId)
        .replace('{userTag}', user.tag)
        .replace('{reason}', reason)
        .replace('{action}', actionPastTense);

    await interaction.reply({ content: confirmationMessage, ephemeral: true });

    return { caseId, dmSent };
}

module.exports = {
    handleModerationAction,
    generateCaseId,
    getMessage,
    getDmMessage
};
