require("dotenv").config();

const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();


// ================= DB =================
const db = new sqlite3.Database("./data.db");

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  pollen INTEGER DEFAULT 0,
  honey INTEGER DEFAULT 0,
  bees TEXT DEFAULT 'common',
  hive INTEGER DEFAULT 1
)
`);

// ================= PSZCZOŁY =================
const bees = {
  common: { name: "🐝 Common Bee", boost: 1, chance: 70 },
  rare: { name: "🟢 Rare Bee", boost: 2, chance: 20 },
  epic: { name: "🟣 Epic Bee", boost: 4, chance: 8 },
  legendary: { name: "🟡 Legendary Bee", boost: 7, chance: 2 }
};

function getBeeBoost(type) {
  return bees[type]?.boost || 1;
}

// ================= RANDOM BEE =================
function rollBee() {
  const roll = Math.random() * 100;
  let sum = 0;

  for (const key of Object.keys(bees)) {
    sum += bees[key].chance;
    if (roll <= sum) return key;
  }

  return "common";
}

// ================= USER =================
function getUser(id, cb) {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
    if (!row) {
      db.run(
        "INSERT INTO users (id, bees, hive) VALUES (?, 'common', 1)",
        [id]
      );
      return cb({ id, pollen: 0, honey: 0, bees: "common", hive: 1 });
    }
    cb(row);
  });
}

function addPollen(id, amount) {
  db.run("UPDATE users SET pollen = pollen + ? WHERE id = ?", [
    amount,
    id
  ]);
}

function sellAll(id) {
  db.run(
    "UPDATE users SET honey = honey + pollen * 2, pollen = 0 WHERE id = ?",
    [id]
  );
}

function upgradeHive(id, current) {
  db.run("UPDATE users SET hive = hive + 1 WHERE id = ?", [id]);
}

// ================= BOT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Map();

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("clientReady", () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
});

// ================= !play =================
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "!play") {
    getUser(message.author.id, (user) => {
      const bee = bees[user.bees];

      const embed = new EmbedBuilder()
        .setTitle("🐝 Bee Fisher")
        .setDescription("Rozwijaj ul i zbieraj miód!")
        .addFields(
          { name: "🌸 Pyłek", value: `${user.pollen}` },
          { name: "🍯 Miód", value: `${user.honey}` },
          { name: "🐝 Pszczoła", value: bee.name },
          { name: "🏠 Ul", value: `Poziom ${user.hive}` }
        )
        .setColor("Yellow");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("collect")
          .setLabel("🌸 Zbieraj")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("sell")
          .setLabel("💰 Sprzedaj")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("hive")
          .setLabel("🏠 Ulepsz ul")
          .setStyle(ButtonStyle.Secondary)
      );

      message.reply({ embeds: [embed], components: [row] });
    });
  }
});

// ================= BUTTONS =================
client.on("interactionCreate", (interaction) => {
  if (!interaction.isButton()) return;

  const id = interaction.user.id;

  // 🌸 COLLECT
  if (interaction.customId === "collect") {
    getUser(id, (user) => {
      const boost = getBeeBoost(user.bees);

      const amount =
        (Math.floor(Math.random() * 10) + 1) *
        boost *
        user.hive;

      // szansa na nową pszczołę
      if (Math.random() < 0.1) {
        const newBee = rollBee();
        db.run("UPDATE users SET bees = ? WHERE id = ?", [newBee, id]);
      }

      addPollen(id, amount);

      interaction.reply({
        content: `🐝 Zebrałeś **${amount} pyłku!**`,
        ephemeral: true
      });
    });
  }

  // 💰 SELL
  if (interaction.customId === "sell") {
    sellAll(id);

    interaction.reply({
      content: "🍯 Sprzedano cały pyłek!",
      ephemeral: true
    });
  }

  // 🏠 HIVE UPGRADE
  if (interaction.customId === "hive") {
    getUser(id, (user) => {
      const cost = user.hive * 50;

      if (user.honey < cost) {
        return interaction.reply({
          content: `❌ Potrzebujesz ${cost} miodu!`,
          ephemeral: true
        });
      }

      db.run(
        "UPDATE users SET honey = honey - ?, hive = hive + 1 WHERE id = ?",
        [cost, id]
      );

      interaction.reply({
        content: `🏠 Ul ulepszony do poziomu ${user.hive + 1}!`,
        ephemeral: true
      });
    });
  }
});
client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Wystąpił błąd.",
        ephemeral: true
      });
    }
  }

});

client.login(process.env.TOKEN);