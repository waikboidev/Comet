const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const createCase = require('../../functions/moderation/createCase');
const messageConfig = require('../../schemas/messageConfigSchema');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Soft-bans a user from the server (kicks and deletes recent messages).')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to soft-ban.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the soft-ban.')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided.';
        const moderator = interaction.member;

        if (!target) {
            return interaction.reply({ content: 'That user is not in this server.', flags: 64 });
        }

        if (!target.kickable) {
            return interaction.reply({ content: 'I cannot kick that user. They may have a higher role than me.', flags: 64 });
        }

        const guildConfig = await messageConfig.findOne({ guildId: interaction.guild.id });

        let dmSent = true;
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle(guildConfig?.messages?.dm?.title || 'Comet Moderation')
                .setDescription((guildConfig?.messages?.dm?.description || 'You were {action} from {server}.').replace('{action}', 'soft-banned').replace('{server}', interaction.guild.name))
                .addFields(
                    { name: 'Moderator', value: moderator.user.tag, inline: true },
                    { name: 'Reason', value: `\`\`\`${reason}\`\`\`` }
                )
                .setColor('Orange');
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            dmSent = false;
        }

        await target.ban({ reason, deleteMessageSeconds: 604800 }); // Ban and delete last 7 days of messages
        await interaction.guild.members.unban(target.id, 'Softban');


        const newCase = await createCase(interaction.client, interaction.guild, moderator, target, 'Softban', reason);

        const actionMessage = (guildConfig?.messages?.softban || '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been soft-banned for {reason}.')
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
