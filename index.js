require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { registerCommands } = require('./commands/register');
const { handleButtonInteraction } = require('./handlers/buttonHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once('ready', async () => {
  console.log(`✅ Bot zalogowany jako ${client.user.tag}`);
  await registerCommands(client);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    if (interaction.commandName === 'start') {
      const { createStatsEmbed, createButtonRow } = require('./utils/embed');
      const { getUserStats } = require('./utils/stats');
      
      const userId = interaction.user.id;
      getUserStats(userId);
      
      const embed = createStatsEmbed(userId);
      await interaction.reply({ embeds: [embed], components: [createButtonRow()], ephemeral: false });
    }
  } else if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);