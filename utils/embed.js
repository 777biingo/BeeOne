const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserStats } = require('./stats');

function createStatsEmbed(userId) {
  const stats = getUserStats(userId);
  const nectarToHoney = Math.floor(stats.nectar * stats.conversionRate);

  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🐝 Pszczelarz - Klikacz Nektaru')
    .addFields(
      {
        name: '📊 Zasoby',
        value: `Nektar: **${Math.floor(stats.nectar)}**\nMiód: **${stats.honey}**\nNiebieski Miód: **${stats.blueHoney}**`,
        inline: false,
      },
      {
        name: '🐝 Pszczoły',
        value: `Liczba: **${stats.bees}**\nZbieranie/s: **${stats.nectarPerSecond.toFixed(2)}**`,
        inline: true,
      },
      {
        name: '🏠 Ule',
        value: `Liczba: **${stats.hives}**\nUlepszenia: ${stats.upgrades.hiveUpgrade1 ? '✅' : '❌'} ${stats.upgrades.hiveUpgrade2 ? '✅' : '❌'}`,
        inline: true,
      },
      {
        name: '⚙️ Konwersja',
        value: `Nektar → Miód: ${Math.floor(stats.nectar)} → **${nectarToHoney}** (${(stats.conversionRate * 100).toFixed(0)}%)`,
        inline: false,
      }
    )
    .setFooter({ text: 'Kliknij przyciski poniżej aby grać' });
}

function createButtonRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('click').setLabel('🖱️ Kliknij').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('convert').setLabel('🍯 Przetwórz').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('shop').setLabel('🛒 Sklep').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('exchange').setLabel('💙 Wymiana').setStyle(ButtonStyle.Danger)
  );
}

function createShopRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('buy_bee').setLabel('🐝 Pszczoła (50)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('buy_hive').setLabel('🏠 Ul (200)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('upgrade_bee').setLabel('⬆️ Pszczoły (100)').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('upgrade_hive').setLabel('⬆️ Ule (150)').setStyle(ButtonStyle.Secondary)
  );
}

function createExchangeRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('honey_to_blue').setLabel('💛→💙 1000:1').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('blue_to_honey').setLabel('💙→💛 1:1000').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('back').setLabel('⬅️ Wróć').setStyle(ButtonStyle.Secondary)
  );
}

function createShopEmbed() {
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🛒 Sklep')
    .addFields(
      { name: '🐝 Pszczoła', value: 'Koszt: 50 miodu\nZbiera: +0.5 nektaru/s', inline: true },
      { name: '🏠 Ul', value: 'Koszt: 200 miodu\nZbiera: +1 nektaru/s', inline: true },
      { name: '⬆️ Ulepsz Pszczoły', value: 'Koszt: 100 miodu\nZbieranie: +50%', inline: true },
      { name: '⬆️ Ulepsz Ule', value: 'Koszt: 150 miodu\nZbieranie: +30%', inline: true }
    );
}

module.exports = { createStatsEmbed, createButtonRow, createShopRow, createExchangeRow, createShopEmbed };