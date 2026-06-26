const { REST, Routes } = require('discord.js');

async function registerCommands(client) {
  const commands = [
    {
      name: 'start',
      description: 'Uruchom grę w klikacza pszczół',
    },
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('📝 Rejestrowanie komend...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Komendy zarejestrowane');
  } catch (error) {
    console.error('❌ Błąd rejestracji komend:', error);
  }
}

module.exports = { registerCommands };