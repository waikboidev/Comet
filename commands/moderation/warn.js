const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const messageConfig = require('../../schemas/messageConfigSchema');
const warningSchema = require('../../schemas/warningSchema');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warns a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the warning.')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided.';
        const moderator = interaction.member;

        if (!target) {
            return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
        }

        const caseId = Math.random().toString(36).substring(2, 9);

        await new warningSchema({
            guildId: interaction.guild.id,
            userId: target.id,
            moderatorId: moderator.id,
            reason,
            caseId: caseId,
        }).save();

        const guildConfig = await messageConfig.findOne({ guildId: interaction.guild.id });

        let dmSent = true;
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle(guildConfig?.messages?.dm?.title || 'Comet Moderation')
                .setDescription((guildConfig?.messages?.dm?.description || 'You were {action} in {server}.').replace('{action}', 'warned').replace('{server}', interaction.guild.name))
                .addFields(
                    { name: 'Moderator', value: moderator.user.tag, inline: true },
                    { name: 'Case ID', value: caseId, inline: true },
                    { name: 'Reason', value: `\`\`\`${reason}\`\`\`` }
                )
                .setColor('Yellow');
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            dmSent = false;
        }

        const actionMessage = (guildConfig?.messages?.warn || '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been warned for {reason}.')
            .replace('{caseId}', `#${caseId}`)
            .replace('@{userTag}', target.user.tag)
            .replace('{reason}', reason);

        let replyMessage = actionMessage;
        if (!dmSent) {
            replyMessage += '\n*User was not DMed due to their privacy settings.*';
        }

        await interaction.reply(replyMessage);
    },
};
