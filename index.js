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

// ===== DB =====
const db = new sqlite3.Database("./data.db");

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  pollen INTEGER DEFAULT 0,
  honey INTEGER DEFAULT 0
)
`);

function getUser(id, cb) {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (id) VALUES (?)", [id]);
      return cb({ id, pollen: 0, honey: 0 });
    }
    cb(row);
  });
}

function addPollen(id, amount) {
  db.run("UPDATE users SET pollen = pollen + ? WHERE id = ?", [amount, id]);
}

function sellHoney(id) {
  db.run(
    "UPDATE users SET honey = honey + pollen * 2, pollen = 0 WHERE id = ?",
    [id]
  );
}

// ===== BOT =====
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

// ===== !play =====
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "!play") {
    getUser(message.author.id, (user) => {
      const embed = new EmbedBuilder()
        .setTitle("🐝 Bee Fisher")
        .setDescription("Zbieraj pyłek i produkuj miód!")
        .addFields(
          { name: "🌸 Pyłek", value: `${user.pollen}` },
          { name: "🍯 Miód", value: `${user.honey}` }
        )
        .setColor("Yellow");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("collect")
          .setLabel("🌸 Zbieraj pyłek")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("sell")
          .setLabel("💰 Sprzedaj")
          .setStyle(ButtonStyle.Success)
      );

      message.reply({ embeds: [embed], components: [row] });
    });
  }
});

// ===== BUTTONY =====
client.on("interactionCreate", (interaction) => {
  if (!interaction.isButton()) return;

  const id = interaction.user.id;

  // 🌸 collect
  if (interaction.customId === "collect") {
    const amount = Math.floor(Math.random() * 10) + 1;

    addPollen(id, amount);

    return interaction.reply({
      content: `🐝 Zebrałeś **${amount} pyłku!**`,
      ephemeral: true
    });
  }

  // 💰 sell
  if (interaction.customId === "sell") {
    sellHoney(id);

    return interaction.reply({
      content: "🍯 Sprzedano cały pyłek na miód!",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);