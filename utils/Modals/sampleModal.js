module.exports = {
    customId: 'sample_modal',
    async execute(interaction) {
        const favoriteColor = interaction.fields.getTextInputValue('favoriteColorInput');
        await interaction.reply({ content: `Your favorite color is ${favoriteColor}!`, ephemeral: true });
    },
};
