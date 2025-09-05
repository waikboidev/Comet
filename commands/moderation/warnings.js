const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const warningSchema = require('../../schemas/warningSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Displays all warnings for a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view warnings for.')
                .setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getMember('user');

        const warnings = await warningSchema.find({ guildId: interaction.guild.id, userId: target.id });

        if (warnings.length === 0) {
            return interaction.reply({ content: `${target.user.tag} has no warnings.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Warnings for ${target.user.tag}`)
            .setColor('Yellow');

        for (const warning of warnings) {
            const moderator = await interaction.client.users.fetch(warning.moderatorId).catch(() => null);
            const moderatorTag = moderator ? moderator.tag : 'Unknown';
            const date = warning.createdAt ? `<t:${Math.floor(new Date(warning.createdAt).getTime() / 1000)}:R>` : 'Unknown';

            embed.addFields({
                name: `Case #${warning.caseId}`,
                value: `**Moderator:** ${moderatorTag}\n**Reason:** ${warning.reason}\n**Date:** ${date}`,
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
