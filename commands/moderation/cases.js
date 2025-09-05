const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const caseSchema = require('../../schemas/caseSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('case')
        .setDescription('Manage moderation cases.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View a specific case.')
                .addStringOption(option => option.setName('caseid').setDescription('The ID of the case to view.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a specific case.')
                .addStringOption(option => option.setName('caseid').setDescription('The ID of the case to edit.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a specific case.')
                .addStringOption(option => option.setName('caseid').setDescription('The ID of the case to delete.').setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const caseId = interaction.options.getString('caseid');

        if (subcommand === 'view') {
            const caseData = await caseSchema.findOne({ caseId });
            if (!caseData) {
                return interaction.reply({ content: 'Case not found.', flags: 64 });
            }

            const moderator = await interaction.client.users.fetch(caseData.moderatorId).catch(() => null);
            const target = await interaction.client.users.fetch(caseData.targetId).catch(() => null);

            const moderatorTag = moderator ? `${moderator.tag} (${moderator.id})` : 'Unknown';
            const targetTag = target ? `${target.tag} (${target.id})` : 'Unknown';

            const embed = new EmbedBuilder()
                .setTitle(`Case #${caseData.caseId}`)
                .addFields(
                    { name: 'Moderator', value: moderatorTag, inline: true },
                    { name: 'Affected User', value: targetTag, inline: true },
                    { name: 'Action', value: caseData.action, inline: true },
                    { name: 'Date of Punishment', value: `<t:${Math.floor(caseData.createdAt.getTime() / 1000)}:F>`, inline: false },
                    { name: 'Reason', value: caseData.reason, inline: false }
                )
                .setColor('Blue');
            
            if (caseData.duration) {
                embed.addFields({ name: 'Duration', value: caseData.duration, inline: true });
            }

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'edit') {
            const caseData = await caseSchema.findOne({ caseId });
            if (!caseData) {
                return interaction.reply({ content: 'Case not found.', flags: 64 });
            }

            const modal = new ModalBuilder()
                .setCustomId(`edit-case-${caseId}`)
                .setTitle(`Editing Case #${caseId}`);

            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(caseData.reason);

            const actionRow = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);

            const filter = (i) => i.customId === `edit-case-${caseId}` && i.user.id === interaction.user.id;
            try {
                const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 });
                const newReason = modalInteraction.fields.getTextInputValue('reason');
                await caseSchema.updateOne({ caseId }, { reason: newReason });
                await modalInteraction.reply({ content: `Case #${caseId} has been updated.`, flags: 64 });
            } catch (err) {
                // Modal timed out
            }

        } else if (subcommand === 'delete') {
            const caseData = await caseSchema.findOneAndDelete({ caseId });
            if (!caseData) {
                return interaction.reply({ content: 'Case not found.', flags: 64 });
            }
            await interaction.reply({ content: `Case #${caseId} has been deleted.`, flags: 64 });
        }
    },
};
