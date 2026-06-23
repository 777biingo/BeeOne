const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pfp")
    .setDescription("Zmienia avatar bota")
    .addAttachmentOption(option =>
      option
        .setName("obraz")
        .setDescription("Nowy avatar")
        .setRequired(true)
    ),

  async execute(interaction) {

    const OWNER_ID = "1373176937207304232";

    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: "❌ Nie możesz użyć tej komendy.",
        ephemeral: true
      });
    }

    const image = interaction.options.getAttachment("obraz");

    if (!image.contentType?.startsWith("image/")) {
      return interaction.reply({
        content: "❌ To nie jest obraz.",
        ephemeral: true
      });
    }

    try {
      await interaction.client.user.setAvatar(image.url);

      await interaction.reply({
        content: "✅ Avatar bota został zmieniony."
      });
    } catch (error) {
      console.error(error);

      await interaction.reply({
        content: "❌ Nie udało się zmienić avatara.",
        ephemeral: true
      });
    }
  }
};