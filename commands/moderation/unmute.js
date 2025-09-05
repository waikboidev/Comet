const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const createCase = require('../../functions/moderation/createCase');
const messageConfig = require('../../schemas/messageConfigSchema');
const muteSchema = require('../../schemas/muteSchema');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmutes a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addStringOption(option =>
            option.setName('user')
                .setDescription('The user to unmute.')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the unmute.')
                .setRequired(false)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name !== 'user') {
            await interaction.respond([]);
            return;
        }

        try {
            const members = await interaction.guild.members.fetch();
            const mutedMembers = members.filter(member => member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now());

            const choices = mutedMembers.map(member => ({ name: `${member.user.tag} (${member.id})`, value: member.id }));

            const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()));

            await interaction.respond(filtered.slice(0, 25));
        } catch (error) {
            console.error('Error in unmute autocomplete:', error);
            await interaction.respond([]);
        }
    },
    async execute(interaction) {
        const targetId = interaction.options.getString('user');
        const target = await interaction.guild.members.fetch(targetId).catch(() => null);
        const reason = interaction.options.getString('reason') || 'No reason provided.';
        const moderator = interaction.member;

        if (!target) {
            return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
        }

        if (!target.isCommunicationDisabled()) {
            return interaction.reply({ content: 'That user is not muted.', ephemeral: true });
        }

        await muteSchema.deleteOne({ guildId: interaction.guild.id, userId: target.id });
        await target.timeout(null, reason);

        const guildConfig = await messageConfig.findOne({ guildId: interaction.guild.id });

        let dmSent = true;
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle(guildConfig?.messages?.dm?.title || 'Comet Moderation')
                .setDescription((guildConfig?.messages?.dm?.description || 'You were {action} in {server}.').replace('{action}', 'unmuted').replace('{server}', interaction.guild.name))
                .addFields(
                    { name: 'Moderator', value: moderator.user.tag, inline: true },
                    { name: 'Reason', value: `\`\`\`${reason}\`\`\`` }
                )
                .setColor('Green');
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            dmSent = false;
        }

        const newCase = await createCase(interaction.client, interaction.guild, moderator, target, 'Unmute', reason);

        const actionMessage = (guildConfig?.messages?.unmute || '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been unmuted for {reason}.')
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
