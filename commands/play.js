const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Uruchamia Bee Fisher"),

  async execute() {
    // Obsługa jest w index.js
  }
};