const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const createCase = require('../../functions/moderation/createCase');
const messageConfig = require('../../schemas/messageConfigSchema');
const { EmbedBuilder } = require('discord.js');

let banCache = null;
let lastFetch = 0;

async function fetchBans(guild) {
    const now = Date.now();
    if (!banCache || now - lastFetch > 60000) { // Cache for 1 minute
        banCache = await guild.bans.fetch();
        lastFetch = now;
    }
    return banCache;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unbans a user from the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user to unban.')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the unban.')
                .setRequired(false)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const bans = await fetchBans(interaction.guild);
        const choices = bans.map(ban => ({ name: `${ban.user.tag} (${ban.user.id})`, value: ban.user.id }));
        
        const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));
        
        await interaction.respond(filtered.slice(0, 25));
    },
    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided.';
        const moderator = interaction.member;

        try {
            const user = await interaction.client.users.fetch(userId);
            await interaction.guild.members.unban(user, reason);

            await createCase(interaction.client, interaction.guild, moderator, { user }, 'Unban', reason);
            const guildConfig = await messageConfig.findOne({ guildId: interaction.guild.id });

            const actionMessage = (guildConfig?.messages?.unban || '<:checkmark:1400320197851873371> @{userTag} has been unbanned for {reason}.')
                .replace('@{userTag}', user.tag)
                .replace('{reason}', reason);

            let dmSent = true;
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(guildConfig?.messages?.dm?.title || 'Comet Moderation')
                    .setDescription((guildConfig?.messages?.dm?.description || 'You were {action} from {server}.').replace('{action}', 'unbanned').replace('{server}', interaction.guild.name))
                    .addFields(
                        { name: 'Moderator', value: moderator.user.tag, inline: true },
                        { name: 'Reason', value: `\`\`\`${reason}\`\`\`` }
                    )
                    .setColor('Green');
                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                dmSent = false;
            }

            let replyMessage = actionMessage;
            if (!dmSent) {
                replyMessage += '\n*User was not DMed due to their privacy settings.*';
            }

            await interaction.reply(replyMessage);

        } catch (error) {
            console.error(error);
            if (error.code === 10013) { // Unknown User
                return interaction.reply({ content: 'That user does not exist.', ephemeral: true });
            }
            if (error.code === 10026) { // Unknown Ban
                return interaction.reply({ content: 'That user is not banned from this server.', ephemeral: true });
            }
            return interaction.reply({ content: 'An error occurred while trying to unban the user.', ephemeral: true });
        }
    },
};
