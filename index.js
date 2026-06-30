require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const data = new Map(); // Przechowuje stan embeda dla każdego użytkownika

client.on(Events.InteractionCreate, async interaction => {
    const uid = interaction.user.id;
    if (!data.has(uid)) data.set(uid, { title: 'Tytuł', desc: 'Opis', color: 0x4974FF, timestamp: false });

    // 1. KOMENDA /embed-stworz
    if (interaction.isChatInputCommand() && interaction.commandName === 'embed-stworz') {
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_text').setLabel('TEKST').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_color').setLabel('KOLOR').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_extras').setLabel('DODATKI').setStyle(ButtonStyle.Primary)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_images').setLabel('OBRAZY').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_save').setLabel('GOTOWE').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('btn_download').setLabel('POBIERZ').setStyle(ButtonStyle.Secondary)
        );
        await interaction.reply({ embeds: [new EmbedBuilder().setTitle('Kreator')], components: [row1, row2] });
    }

    // 2. PRZYCISKI (Otwieranie Modali)
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_download') {
            const d = data.get(uid);
            return interaction.reply({ content: `\`\`\`Tytuł:\`\`\`\n${d.title}\n\n\`\`\`Treść:\`\`\`\n${d.desc}\n\n\`\`\`Kolor:\`\`\`\n#${d.color.toString(16)}`, ephemeral: true });
        }
        if (interaction.customId === 'btn_save') return interaction.reply({ content: 'Zapisano!', ephemeral: true });

        // Definicje formularzy
        const modals = {
            btn_text: { id: 'm_text', title: 'TEKST', inputs: [{ id: 'title', label: 'Tytuł' }, { id: 'desc', label: 'Opis', style: TextInputStyle.Paragraph }] },
            btn_color: { id: 'm_color', title: 'KOLOR', inputs: [{ id: 'hex', label: 'HEX' }] },
            btn_extras: { id: 'm_extras', title: 'DODATKI', inputs: [{ id: 'author', label: 'Autor' }, { id: 'footer', label: 'Stopka' }, { id: 'ts', label: 'Timestamp (tak/nie)' }, { id: 'auth_icon', label: 'Ikonka autora' }, { id: 'foot_icon', label: 'Ikonka stopki' }] },
            btn_images: { id: 'm_images', title: 'OBRAZY', inputs: [{ id: 'thumb', label: 'Thumbnail' }, { id: 'main', label: 'Main image' }] }
        };

        const m = modals[interaction.customId];
        const modal = new ModalBuilder().setCustomId(m.id).setTitle(m.title);
        m.inputs.forEach(i => modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(i.id).setLabel(i.label).setStyle(i.style || TextInputStyle.Short))));
        await interaction.showModal(modal);
    }

    // 3. OBSŁUGA FORMULARZY
    if (interaction.isModalSubmit()) {
        const d = data.get(uid);
        if (interaction.customId === 'm_text') { d.title = interaction.fields.getTextInputValue('title'); d.desc = interaction.fields.getTextInputValue('desc'); }
        if (interaction.customId === 'm_color') d.color = parseInt(interaction.fields.getTextInputValue('hex').replace('#', ''), 16);
        if (interaction.customId === 'm_extras') {
            d.author = interaction.fields.getTextInputValue('author');
            d.footer = interaction.fields.getTextInputValue('footer');
            d.ts = interaction.fields.getTextInputValue('ts').toLowerCase() === 'tak';
            d.auth_i = interaction.fields.getTextInputValue('auth_icon');
            d.foot_i = interaction.fields.getTextInputValue('foot_icon');
        }
        if (interaction.customId === 'm_images') { d.thumb = interaction.fields.getTextInputValue('thumb'); d.main = interaction.fields.getTextInputValue('main'); }

        const eb = new EmbedBuilder().setTitle(d.title).setDescription(d.desc).setColor(d.color);
        if (d.author) eb.setAuthor({ name: d.author, iconURL: d.auth_i || null });
        if (d.footer) eb.setFooter({ text: d.footer, iconURL: d.foot_i === 'server' ? interaction.guild.iconURL() : d.foot_i });
        if (d.ts) eb.setTimestamp();
        if (d.thumb) eb.setThumbnail(d.thumb);
        if (d.main) eb.setImage(d.main);

        await interaction.update({ embeds: [eb] });
    }
});

client.login(process.env.DISCORD_TOKEN);
