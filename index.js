require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

// ================= DATABASE =================
const db = new sqlite3.Database("./data.db");

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  pollen INTEGER DEFAULT 0,
  honey INTEGER DEFAULT 0,
  bees TEXT DEFAULT 'common'
)
`);

// ================= BEES =================
const bees = {
  common: { name: "🐝 Common Bee", boost: 1 },
  rare: { name: "🟢 Rare Bee", boost: 2 },
  epic: { name: "🟣 Epic Bee", boost: 4 },
  legendary: { name: "🟡 Legendary Bee", boost: 7 }
};

function getBeeBoost(type) {
  return bees[type]?.boost || 1;
}

// ================= USER =================
function getUser(id, cb) {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
    if (!row) {
      db.run(
        "INSERT INTO users (id, bees) VALUES (?, 'common')",
        [id]
      );
      return cb({ id, pollen: 0, honey: 0, bees: "common" });
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

// ================= BOT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("clientReady", () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
});

// ================= COMMANDS =================
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  // !play
  if (message.content === "!play") {
    getUser(message.author.id, (user) => {
      const bee = bees[user.bees];

      const embed = new EmbedBuilder()
        .setTitle("🐝 Bee Fisher")
        .setDescription("Zbieraj pyłek i rozwijaj swoje pszczoły!")
        .addFields(
          { name: "🌸 Pyłek", value: `${user.pollen}` },
          { name: "🍯 Miód", value: `${user.honey}` },
          { name: "🐝 Pszczoła", value: bee.name },
          { name: "⚡ Boost", value: `x${bee.boost}` }
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
          .setStyle(ButtonStyle.Success)
      );

      message.reply({ embeds: [embed], components: [row] });
    });
  }

  // !bee
  if (message.content === "!bee") {
    getUser(message.author.id, (user) => {
      const bee = bees[user.bees];

      const embed = new EmbedBuilder()
        .setTitle("🐝 Twoja pszczoła")
        .setDescription(`Posiadasz: **${bee.name}**`)
        .addFields({ name: "⚡ Boost", value: `x${bee.boost}` })
        .setColor("Yellow");

      message.reply({ embeds: [embed] });
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
        (Math.floor(Math.random() * 10) + 1) * boost;

      addPollen(id, amount);

      interaction.reply({
        content: `🐝 Zebrałeś **${amount} pyłku!** (x${boost})`,
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
});

// ================= LOGIN =================
client.login(process.env.TOKEN);