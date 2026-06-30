require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const embedDrafts = new Map();

client.once('ready', () => {
    console.log(`Zalogowano jako ${client.user.tag}!`);
    client.application.commands.set([{
        name: 'embed-stworz',
        description: 'Otwiera kreator embedów'
    }]);
});

client.on(Events.InteractionCreate, async interaction => {
    const uid = interaction.user.id;

    // 1. Komenda /embed-stworz
    if (interaction.isChatInputCommand() && interaction.commandName === 'embed-stworz') {
        const embed = new EmbedBuilder().setTitle('Kreator').setDescription('Użyj przycisków').setColor(0x4974FF);
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_title').setLabel('Tytuł').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_desc').setLabel('Treść').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_color').setLabel('Kolor HEX').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_image').setLabel('Obraz').setStyle(ButtonStyle.Secondary)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_save').setLabel('Gotowe').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('btn_download').setLabel('Pobierz JSON').setStyle(ButtonStyle.Secondary)
        );
        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }

    // 2. Obsługa przycisków -> otwieranie Modali
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_download') {
            return interaction.reply({ content: `\`\`\`json\n${JSON.stringify(embedDrafts.get(uid) || {}, null, 2)}\n\`\`\``, ephemeral: true });
        }
        if (interaction.customId === 'btn_save') {
            return interaction.reply({ content: 'Embed gotowy!', ephemeral: true });
        }

        const map = { btn_title: ['Tytuł', 'Wpisz tytuł'], btn_desc: ['Treść', 'Wpisz treść'], btn_color: ['Kolor', 'Wpisz HEX (np. 4974FF)'], btn_image: ['Obraz', 'Wpisz URL lub "server"'] };
        const data = map[interaction.customId];
        
        if (data) {
            const modal = new ModalBuilder().setCustomId(`modal_${interaction.customId}`).setTitle(data[0]);
            const input = new TextInputBuilder().setCustomId('val').setLabel(data[1]).setStyle(interaction.customId === 'btn_desc' ? TextInputStyle.Paragraph : TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }
    }

    // 3. Obsługa Modali -> zapisywanie danych
    if (interaction.isModalSubmit()) {
        const val = interaction.fields.getTextInputValue('val');
        const draft = embedDrafts.get(uid) || {};
        
        if (interaction.customId === 'modal_btn_title') draft.title = val;
        if (interaction.customId === 'modal_btn_desc') draft.description = val;
        if (interaction.customId === 'modal_btn_color') draft.color = parseInt(val.replace('#', ''), 16);
        if (interaction.customId === 'modal_btn_image') draft.image = val;
        
        embedDrafts.set(uid, draft);
        
        const finalEmbed = new EmbedBuilder()
            .setTitle(draft.title || 'Brak')
            .setDescription(draft.description || 'Brak')
            .setColor(draft.color || 0x4974FF);
        
        if (draft.image) {
            const url = draft.image === 'server' ? interaction.guild.iconURL() : draft.image;
            finalEmbed.setThumbnail(url);
        }
        
        await interaction.update({ embeds: [finalEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
