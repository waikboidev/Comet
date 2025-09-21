import { SlashCommandBuilder, CommandInteraction, AttachmentBuilder, PermissionFlagsBits } from 'discord.js';
import { FileModel } from '../schemas/file';

module.exports = {
  data: [
    new SlashCommandBuilder()
      .setName('save-file')
      .setDescription('Save a file to the database.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
        option.setName('name').setDescription('Name to save the file as.').setRequired(true)
      )
      .addAttachmentOption(option =>
        option.setName('file').setDescription('File to save.').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('get-file')
      .setDescription('Retrieve a file from the database.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
        option.setName('name').setDescription('Name of the file to retrieve.').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('remove-file')
      .setDescription('Remove a file from the database (confirmation required).')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
        option.setName('name').setDescription('Name of the file to remove.').setRequired(true)
      ),
  ],
  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.commandName;
    if (command === 'save-file') {
      const name = interaction.options.getString('name', true);
      const file = interaction.options.getAttachment('file', true);
      try {
        const res = await fetch(file.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        await FileModel.create({ name, data: buffer, uploader: interaction.user.id });
        await interaction.reply({ content: `✅ File "${name}" saved successfully.`, ephemeral: true });
      } catch (err) {
        await interaction.reply({ content: `❌ Failed to save file: ${err}`, ephemeral: true });
      }
    } else if (command === 'get-file') {
      const name = interaction.options.getString('name', true);
      const fileDoc = await FileModel.findOne({ name });
      if (!fileDoc) {
        await interaction.reply({ content: `❌ File "${name}" not found.`, ephemeral: true });
        return;
      }
      const attachment = new AttachmentBuilder(fileDoc.data, { name: `${name}` });
      await interaction.reply({ content: `✅ Here is your file:`, files: [attachment], ephemeral: true });
    } else if (command === 'remove-file') {
      const name = interaction.options.getString('name', true);
      const fileDoc = await FileModel.findOne({ name });
      if (!fileDoc) {
        await interaction.reply({ content: `❌ File "${name}" not found.`, ephemeral: true });
        return;
      }
      // Fetch uploader's username
      const uploaderId = fileDoc.uploader;
      let uploaderName = uploaderId;
      try {
        const userObj = await interaction.client.users.fetch(uploaderId);
        uploaderName = userObj.username;
      } catch {}
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`remove-file-yes-${name}`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`remove-file-no-${name}`)
            .setLabel('No')
            .setStyle(ButtonStyle.Success)
        );
      await interaction.reply({
        content: `Are you sure you want to delete **${name}** created by **${uploaderName}**?`,
        components: [row],
        ephemeral: true
      });
    }
  },
  async handleButton(interaction: import('discord.js').ButtonInteraction) {
    if (!interaction.isButton()) return;
    const customId = interaction.customId;
    if (customId.startsWith('remove-file-yes-')) {
      const name = customId.replace('remove-file-yes-', '');
      const fileDoc = await FileModel.findOne({ name });
      if (!fileDoc) {
        await interaction.update({ content: `❌ File "${name}" not found.`, components: [] });
        return;
      }
      await FileModel.deleteOne({ name });
      await interaction.update({ content: `✅ File "${name}" has been removed.`, components: [] });
    } else if (customId.startsWith('remove-file-no-')) {
      const name = customId.replace('remove-file-no-', '');
      await interaction.update({ content: `❌ File "${name}" was not removed.`, components: [] });
    }
  }
};