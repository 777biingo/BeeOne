require("dotenv").config();

const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// ================= DATABASE =================

const db = new sqlite3.Database("./data.db");

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      pollen INTEGER DEFAULT 0,
      honey INTEGER DEFAULT 0,
      bees INTEGER DEFAULT 1,
      hive INTEGER DEFAULT 1,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      lastCollect INTEGER DEFAULT 0
    )
  `);

});

// ================= BOT =================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.commands = new Map();

// ================= COMMANDS =================

if (!fs.existsSync("./commands")) {
  fs.mkdirSync("./commands");
}

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {

  const command = require(`./commands/${file}`);

  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }

}

// ================= USER =================

function getUser(id) {

  return new Promise((resolve, reject) => {

    db.get(
      "SELECT * FROM users WHERE id = ?",
      [id],
      (err, row) => {

        if (err) return reject(err);

        if (!row) {

          db.run(
            `
            INSERT INTO users
            (id, pollen, honey, bees, hive, level, xp, lastCollect)
            VALUES (?,0,0,1,1,1,0,0)
            `,
            [id],
            (err2) => {

              if (err2) return reject(err2);

              resolve({
                id,
                pollen: 0,
                honey: 0,
                bees: 1,
                hive: 1,
                level: 1,
                xp: 0,
                lastCollect: 0
              });

            }
          );

        } else {
          resolve(row);
        }

      }
    );

  });

}

// ================= EMBED =================

function createMainEmbed(user) {

  return new EmbedBuilder()
    .setColor("Yellow")
    .setTitle("🐝 Bee Fisher")
    .setDescription(
      "Zbieraj pyłek, sprzedawaj miód i rozwijaj swój ul."
    )
    .addFields(
      {
        name: "🌸 Pyłek",
        value: `${user.pollen}`,
        inline: true
      },
      {
        name: "🍯 Miód",
        value: `${user.honey}`,
        inline: true
      },
      {
        name: "🐝 Pszczoły",
        value: `${user.bees}`,
        inline: true
      },
      {
        name: "🏠 Ul",
        value: `Poziom ${user.hive}`,
        inline: true
      },
      {
        name: "⭐ Poziom",
        value: `${user.level}`,
        inline: true
      },
      {
        name: "✨ XP",
        value: `${user.xp}`,
        inline: true
      }
    );

}

function createButtons() {

  return new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId("collect")
      .setLabel("🌸 Zbieraj")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("sell")
      .setLabel("🍯 Sprzedaj")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("upgrade")
      .setLabel("🏠 Ulepsz")
      .setStyle(ButtonStyle.Secondary)

  );

}

// ================= READY =================

client.once("ready", () => {

  console.log(
    `✅ Zalogowano jako ${client.user.tag}`
  );

});

// ================= INTERACTIONS =================

client.on("interactionCreate", async interaction => {

  try {

    // ===== SLASH COMMANDS =====

    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "play") {

        const user = await getUser(
          interaction.user.id
        );

        return interaction.reply({
          embeds: [createMainEmbed(user)],
          components: [createButtons()]
        });

      }

      const command =
        client.commands.get(
          interaction.commandName
        );

      if (!command) return;

      return command.execute(interaction);

    }

    // ===== BUTTONS =====

    if (!interaction.isButton()) return;

    const user = await getUser(
      interaction.user.id
    );

    // ================= COLLECT =================

    if (interaction.customId === "collect") {

      const cooldown = 5000;

      const diff =
        Date.now() - user.lastCollect;

      if (diff < cooldown) {

        const left = Math.ceil(
          (cooldown - diff) / 1000
        );

        return interaction.reply({
          content:
            `⏳ Poczekaj jeszcze ${left}s`,
          ephemeral: true
        });

      }

      const earned =
        Math.floor(Math.random() * 10) +
        5 +
        (user.bees * 2) +
        user.hive;

      const xpGain =
        Math.floor(Math.random() * 5) + 1;

      db.run(
        `
        UPDATE users
        SET pollen = pollen + ?,
            xp = xp + ?,
            lastCollect = ?
        WHERE id = ?
        `,
        [
          earned,
          xpGain,
          Date.now(),
          interaction.user.id
        ]
      );

      let newXp =
        user.xp + xpGain;

      let newLevel =
        user.level;

      if (newXp >= user.level * 100) {

        newXp = 0;
        newLevel++;

        db.run(
          `
          UPDATE users
          SET level = ?, xp = ?
          WHERE id = ?
          `,
          [
            newLevel,
            newXp,
            interaction.user.id
          ]
        );

      }

      const updated =
        await getUser(
          interaction.user.id
        );

      return interaction.update({
        embeds: [
          createMainEmbed(updated)
        ],
        components: [
          createButtons()
        ]
      });

    }

    // ================= SELL =================

    if (interaction.customId === "sell") {

      const honeyGain =
        user.pollen * 2;

      db.run(
        `
        UPDATE users
        SET honey = honey + ?,
            pollen = 0
        WHERE id = ?
        `,
        [
          honeyGain,
          interaction.user.id
        ]
      );

      const updated =
        await getUser(
          interaction.user.id
        );

      return interaction.update({
        embeds: [
          createMainEmbed(updated)
        ],
        components: [
          createButtons()
        ]
      });

    }

    // ================= UPGRADE =================

    if (interaction.customId === "upgrade") {

      const cost =
        user.hive * 100;

      if (user.honey < cost) {

        return interaction.reply({
          content:
            `❌ Potrzebujesz ${cost} miodu.`,
          ephemeral: true
        });

      }

      db.run(
        `
        UPDATE users
        SET honey = honey - ?,
            hive = hive + 1
        WHERE id = ?
        `,
        [
          cost,
          interaction.user.id
        ]
      );

      const updated =
        await getUser(
          interaction.user.id
        );

      return interaction.update({
        embeds: [
          createMainEmbed(updated)
        ],
        components: [
          createButtons()
        ]
      });

    }

  } catch (err) {

    console.error(err);

    if (
      interaction.isRepliable() &&
      !interaction.replied &&
      !interaction.deferred
    ) {
      interaction.reply({
        content: "❌ Wystąpił błąd.",
        ephemeral: true
      });
    }

  }

});

// ================= LOGIN =================

client.login(process.env.TOKEN);