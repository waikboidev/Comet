const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const warningSchema = require('../../schemas/warningSchema');
const caseSchema = require('../../schemas/caseSchema');
const messageConfig = require('../../schemas/messageConfigSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Removes a specific warning from a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove a warning from.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('caseid')
                .setDescription('The ID of the case to remove.')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const targetUser = interaction.options.getUser('user');

        if (focusedOption.name !== 'caseid' || !targetUser) {
            await interaction.respond([]);
            return;
        }

        try {
            console.log(`[DEBUG] unwarn autocomplete: Fetching warnings for user ${targetUser.id}`);
            const warnings = await warningSchema.find({ guildId: interaction.guild.id, userId: targetUser.id });
            console.log(`[DEBUG] unwarn autocomplete: Found ${warnings.length} warnings. Data:`, JSON.stringify(warnings, null, 2));
            
            const choices = warnings.map(warning => {
                const reason = warning.reason.length > 50 ? `${warning.reason.substring(0, 47)}...` : warning.reason;
                return {
                    name: `${warning.caseId} || ${reason}`,
                    value: warning.caseId
                };
            });
            console.log(`[DEBUG] unwarn autocomplete: Generated ${choices.length} choices.`);

            const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()));
            console.log(`[DEBUG] unwarn autocomplete: Filtered to ${filtered.length} choices.`);

            await interaction.respond(filtered.slice(0, 25));
        } catch (error) {
            console.error('[ERROR] unwarn autocomplete:', error);
            await interaction.respond([]);
        }
    },
    async execute(interaction) {
        const target = interaction.options.getMember('user');
        const caseId = interaction.options.getString('caseid');

        const warning = await warningSchema.findOneAndDelete({ guildId: interaction.guild.id, userId: target.id, caseId: caseId });

        if (!warning) {
            return interaction.reply({ content: `No warning found for ${target.user.tag} with Case ID #${caseId}.`, ephemeral: true });
        }

        await caseSchema.findOneAndDelete({ caseId: caseId });

        const guildConfig = await messageConfig.findOne({ guildId: interaction.guild.id });
        const actionMessage = (guildConfig?.messages?.unwarn || '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been unwarned')
            .replace('{caseId}', `#${caseId}`)
            .replace('@{userTag}', target.user.tag);

        await interaction.reply(actionMessage);
    },
};
