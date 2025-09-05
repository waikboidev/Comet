module.exports = {
    customId: 'sample_select_menu',
    async execute(interaction) {
        const selectedValue = interaction.values[0];
        await interaction.reply({ content: `You selected: ${selectedValue}`, ephemeral: true });
    },
};
