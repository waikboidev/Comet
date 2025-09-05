const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const createCase = require('../../functions/moderation/createCase');
const messageConfig = require('../../schemas/messageConfigSchema');
const muteSchema = require('../../schemas/muteSchema');
const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mutes a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('The duration of the mute (e.g., 1h, 1d, 7d).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the mute.')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getMember('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided.';
        const moderator = interaction.member;

        if (!target) {
            return interaction.reply({ content: 'That user is not in this server.', flags: 64 });
        }

        if (!target.moderatable) {
            return interaction.reply({ content: 'I cannot mute that user. They may have a higher role than me.', flags: 64 });
        }

        const durationMs = ms(durationStr);
        if (!durationMs) {
            return interaction.reply({ content: 'Invalid duration format.', flags: 64 });
        }

        const maxTimeoutDuration = 28 * 24 * 60 * 60 * 1000; // 28 days in ms
        let timeoutDuration = durationMs;

        if (durationMs > maxTimeoutDuration) {
            timeoutDuration = maxTimeoutDuration;
            const endTime = new Date(Date.now() + durationMs);
            await muteSchema.findOneAndUpdate(
                { guildId: interaction.guild.id, userId: target.id },
                { endTime, originalDuration: durationMs },
                { upsert: true }
            );
        }

        const guildConfig = await messageConfig.findOne({ guildId: interaction.guild.id });

        let dmSent = true;
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle(guildConfig?.messages?.dm?.title || 'Comet Moderation')
                .setDescription((guildConfig?.messages?.dm?.description || 'You were {action} in {server}.').replace('{action}', 'muted').replace('{server}', interaction.guild.name))
                .addFields(
                    { name: 'Moderator', value: moderator.user.tag, inline: true },
                    { name: 'Duration', value: durationStr, inline: true },
                    { name: 'Reason', value: `\`\`\`${reason}\`\`\`` }
                )
                .setColor('Yellow');
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            dmSent = false;
        }

        await target.timeout(timeoutDuration, reason);

        const newCase = await createCase(interaction.client, interaction.guild, moderator, target, 'Mute', reason, durationStr);

        const actionMessage = (guildConfig?.messages?.mute || '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been muted for {reason}.')
            .replace('{caseId}', `#${newCase.caseId}`)
            .replace('@{userTag}', target.user.tag)
            .replace('{reason}', reason);

        let replyMessage = actionMessage;
        if (!dmSent) {
            replyMessage += '\n*User was not DMed due to their privacy settings.*';
        }

        await interaction.reply(replyMessage);
    },
};
