require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { connectDB, getDb } = require('./db');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.once('ready', async () => {
    await connectDB();
    console.log(`Zalogowano jako ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const db = getDb();
    const userId = message.author.id;

    if (message.content === '!zbieraj') {
        let user = await db.collection('users').findOne({ userId });
        if (!user) {
            user = { userId, honey: 0, bees: 1, lastHarvest: 0 };
            await db.collection('users').insertOne(user);
        }

        const now = Date.now();
        if (now - user.lastHarvest < 60000) {
            return message.reply("Twoje pszczoły odpoczywają! Wróć za chwilę.");
        }

        const collected = Math.floor(Math.random() * 10 * user.bees) + 1;
        await db.collection('users').updateOne(
            { userId }, 
            { $inc: { honey: collected }, $set: { lastHarvest: now } }
        );

        message.reply(`🐝 Zebrałeś ${collected} miodu! Masz teraz łącznie ${user.honey + collected} miodu.`);
    }
});

client.login(process.env.TOKEN);
