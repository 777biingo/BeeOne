const { getUserStats, saveStats } = require('../utils/stats');
const { createStatsEmbed, createButtonRow, createShopRow, createExchangeRow, createShopEmbed } = require('../utils/embed');

async function handleButtonInteraction(interaction) {
  const userId = interaction.user.id;

  // Sprawdź czy klikający jest właścicielem gry (tym, kto użył /start)
  const originalUserId = interaction.message?.interaction?.user?.id;
  if (originalUserId && userId !== originalUserId) {
    return interaction.reply({
      content: '❌ Tylko osoba która użyła /start może klikać przyciski.',
      ephemeral: true,
    });
  }

  const stats = getUserStats(userId);
  const customId = interaction.customId;

  try {
    if (customId === 'click') {
      stats.nectar += stats.nectarPerClick;
      saveStats(userId, stats);
      const embed = createStatsEmbed(userId);
      await interaction.update({ embeds: [embed], components: [createButtonRow()] });
    }

    else if (customId === 'convert') {
      const honeyGained = Math.floor(stats.nectar * stats.conversionRate);
      stats.honey += honeyGained;
      stats.nectar = 0;
      saveStats(userId, stats);
      const embed = createStatsEmbed(userId);
      await interaction.update({ embeds: [embed], components: [createButtonRow()] });
    }

    else if (customId === 'shop') {
      const embed = createShopEmbed();
      await interaction.update({ embeds: [embed], components: [createShopRow()] });
    }

    else if (customId === 'buy_bee') {
      if (stats.honey >= 50) {
        stats.honey -= 50;
        stats.bees += 1;
        stats.nectarPerSecond += 0.5;
        saveStats(userId, stats);
        const embed = createStatsEmbed(userId);
        await interaction.update({ embeds: [embed], components: [createButtonRow()] });
      } else {
        await interaction.reply({ content: '❌ Nie masz wystarczająco miodu!', ephemeral: true });
      }
    }

    else if (customId === 'buy_hive') {
      if (stats.honey >= 200) {
        stats.honey -= 200;
        stats.hives += 1;
        stats.nectarPerSecond += 1;
        saveStats(userId, stats);
        const embed = createStatsEmbed(userId);
        await interaction.update({ embeds: [embed], components: [createButtonRow()] });
      } else {
        await interaction.reply({ content: '❌ Nie masz wystarczająco miodu!', ephemeral: true });
      }
    }

    else if (customId === 'upgrade_bee') {
      if (stats.honey >= 100 && !stats.upgrades.beeUpgrade1) {
        stats.honey -= 100;
        stats.upgrades.beeUpgrade1 = true;
        stats.nectarPerSecond *= 1.5;
        saveStats(userId, stats);
        const embed = createStatsEmbed(userId);
        await interaction.update({ embeds: [embed], components: [createButtonRow()] });
      } else {
        await interaction.reply({ content: '❌ Nie masz wystarczająco miodu lub już masz to ulepszenie!', ephemeral: true });
      }
    }

    else if (customId === 'upgrade_hive') {
      if (stats.honey >= 150 && !stats.upgrades.hiveUpgrade1) {
        stats.honey -= 150;
        stats.upgrades.hiveUpgrade1 = true;
        stats.nectarPerSecond *= 1.3;
        saveStats(userId, stats);
        const embed = createStatsEmbed(userId);
        await interaction.update({ embeds: [embed], components: [createButtonRow()] });
      } else {
        await interaction.reply({ content: '❌ Nie masz wystarczająco miodu lub już masz to ulepszenie!', ephemeral: true });
      }
    }

    else if (customId === 'exchange') {
      const embed = createStatsEmbed(userId);
      await interaction.update({ embeds: [embed], components: [createExchangeRow()] });
    }

    else if (customId === 'honey_to_blue') {
      if (stats.honey >= 1000) {
        stats.honey -= 1000;
        stats.blueHoney += 1;
        saveStats(userId, stats);
        const embed = createStatsEmbed(userId);
        await interaction.update({ embeds: [embed], components: [createExchangeRow()] });
      } else {
        await interaction.reply({ content: '❌ Potrzebujesz 1000 miodu!', ephemeral: true });
      }
    }

    else if (customId === 'blue_to_honey') {
      if (stats.blueHoney >= 1) {
        stats.blueHoney -= 1;
        stats.honey += 1000;
        saveStats(userId, stats);
        const embed = createStatsEmbed(userId);
        await interaction.update({ embeds: [embed], components: [createExchangeRow()] });
      } else {
        await interaction.reply({ content: '❌ Potrzebujesz 1 niebieskiego miodu!', ephemeral: true });
      }
    }

    else if (customId === 'back') {
      const embed = createStatsEmbed(userId);
      await interaction.update({ embeds: [embed], components: [createButtonRow()] });
    }

    else if (customId === 'back_to_main') {
      const embed = createStatsEmbed(userId);
      await interaction.update({ embeds: [embed], components: [createButtonRow()] });
    }
  } catch (error) {
    console.error('Błąd:', error);
    await interaction.reply({ content: '❌ Coś poszło nie tak!', ephemeral: true });
  }
}

module.exports = { handleButtonInteraction };