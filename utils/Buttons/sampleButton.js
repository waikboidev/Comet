module.exports = {
    customId: 'sample_button',
    async execute(interaction) {
        await interaction.reply({ content: 'This is a sample button response!', ephemeral: true });
    },
};
