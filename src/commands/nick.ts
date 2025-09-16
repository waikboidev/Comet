import { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nick")
    .setDescription("Set the nickname of a member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption(option =>
      option
      .setName("user")
      .setDescription("The user of who you want to modify their nickname.")
      .setRequired(true)
    )
    .addStringOption(option =>
      option
      .setName("nickname")
      .setDescription("The input of the new nickname.")
      .setRequired(false)
    ),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const moderator = interaction.user;
    const user = interaction.options.getUser("user", true);
    const nickname = interaction.options.getString("nickname");
    const member = await interaction.guild!.members.fetch(user.id);

    if (!member) {
      await interaction.reply({ content: "<a:red:1412830913057915044> That user is not in this server.", ephemeral: false });
      return;
    }

    const oldNickname = member.nickname || user.displayName;

    if (nickname) {
      if (oldNickname === nickname) {
        await interaction.reply({ content: "<a:red:1412830913057915044> The new nickname cannot be the same as the old nickname.", ephemeral: false });
        return;
      }

      try {
        await member.setNickname(nickname, `This action was fulfilled by ${moderator}`);
        await interaction.reply(`<a:green:1412830885874630779> Updated **${user.username}**'s nickname from **${oldNickname}** to **${nickname}**.`);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: "<a:red:1412830913057915044> I don't have permission to change that user's nickname.", ephemeral: false });
      }
    } else {
      try {
        await member.setNickname(null, `This action was fulfilled by ${moderator}`);
        await interaction.reply(`<a:green:1412830885874630779> **${user.username}**'s nickname was reset.`);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: "<a:red:1412830913057915044> I don't have permission to reset that user's nickname.", ephemeral: false });
      }
    }
  },
}