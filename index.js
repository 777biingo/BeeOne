require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { connectDB, getDb } = require('./db');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', async () => {
    await connectDB();
    console.log(`Zalogowano jako ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    
    const db = getDb();
    const userId = message.author.id;
    const args = message.content.split(' ');
    const command = args[0];

    // Pobranie profilu
    let user = await db.collection('users').findOne({ userId });
    if (!user) {
        user = { userId, honey: 0, bees: 1, honeyPrice: 10 };
        await db.collection('users').insertOne(user);
    }

    if (command === '!zbieraj') {
        const gain = Math.floor(Math.random() * 5 * user.bees) + 1;
        await db.collection('users').updateOne({ userId }, { $inc: { honey: gain } });
        message.reply(`🐝 Zebrałeś ${gain} miodu!`);
    }

    if (command === '!sklep') {
        message.reply(`💰 Stan konta: ${user.honey} miodu. Koszt nowej pszczoły: ${user.bees * 50}. Komenda: !ulepsz`);
    }

    if (command === '!ulepsz') {
        const cost = user.bees * 50;
        if (user.honey < cost) return message.reply("Nie masz wystarczająco miodu!");
        await db.collection('users').updateOne({ userId }, { $inc: { honey: -cost, bees: 1 } });
        message.reply(`✅ Ulepszono! Masz teraz ${user.bees + 1} pszczół.`);
    }
});

client.login(process.env.TOKEN);
