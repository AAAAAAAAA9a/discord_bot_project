const { 
    ActionRowBuilder, 
    EmbedBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder, 
    ButtonStyle,
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle
} = require('discord.js');
const configState = require('../utils/configState');

/**
 * Show the initial gulag configuration view
 * @param {Interaction} interaction - The interaction object
 */
async function showInitialView(interaction) {
    // Get configuration from the session
    const userId = interaction.user.id;
    const gulagConfig = configState.getSessionData(userId, 'gulag') || {};
    
    // Create embed with current config info
    const embed = new EmbedBuilder()
        .setTitle('Konfiguracja Gulaga')
        .setDescription('Użyj przycisków poniżej, aby skonfigurować system gulaga.')
        .setColor(0x3498db);
    
    // Add info about existing gulag config
    let configInfo = '';
    
    if (gulagConfig.enabled) {
        configInfo += '**Status:** ✅ Aktywny\n';
    } else {
        configInfo += '**Status:** ❌ Nieaktywny\n';
    }
    
    if (gulagConfig.gulagRoleId) {
        configInfo += `**Rola gulaga:** <@&${gulagConfig.gulagRoleId}>\n`;
    }
    
    if (gulagConfig.gulagChannelId) {
        configInfo += `**Kanał gulaga:** <#${gulagConfig.gulagChannelId}>\n`;
    }
    
    if (gulagConfig.defaultDuration) {
        configInfo += `**Domyślny czas:** ${gulagConfig.defaultDuration} minut\n`;
    }
    
    if (gulagConfig.welcomeMessage) {
        configInfo += `**Wiadomość powitalna:** ${gulagConfig.welcomeMessage}\n`;
    }
    
    embed.addFields({ name: 'Aktualna konfiguracja', value: configInfo || 'Brak konfiguracji' });
    
    // Create action buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('gulag_toggle')
                .setLabel(gulagConfig.enabled ? 'Wyłącz gulag' : 'Włącz gulag')
                .setStyle(gulagConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('gulag_settings')
                .setLabel('Ustawienia gulaga')
                .setStyle(ButtonStyle.Primary)
        );
    
    // Create save/cancel buttons
    const saveRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('save_gulag')
                .setLabel('Zapisz konfigurację')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel_config')
                .setLabel('Anuluj')
                .setStyle(ButtonStyle.Secondary)
        );
    
    await interaction.reply({
        embeds: [embed],
        components: [actionRow, saveRow],
        ephemeral: true
    });
}

/**
 * Handle button interactions for gulag configuration
 * @param {Interaction} interaction - The button interaction
 * @param {string} buttonAction - The specific button action
 * @param {Array} params - Additional parameters from the button ID
 */
async function handleButtonInteraction(interaction, buttonAction, params) {
    const userId = interaction.user.id;
    
    // Refresh the user's session timeout
    configState.refreshSession(userId);
    
    switch (buttonAction) {
        case 'toggle':
            await toggleGulag(interaction);
            break;
            
        case 'settings':
            await showSettingsModal(interaction);
            break;
            
        default:
            await interaction.reply({
                content: 'Nieznana akcja przycisku konfiguracyjnego!',
                ephemeral: true
            });
    }
}

/**
 * Toggle gulag enabled/disabled
 * @param {Interaction} interaction - The interaction
 */
async function toggleGulag(interaction) {
    const userId = interaction.user.id;
    const gulagConfig = configState.getSessionData(userId, 'gulag') || {};
    
    // Toggle enabled state
    gulagConfig.enabled = !gulagConfig.enabled;
    
    // Ensure we have a default config if not exists
    if (!gulagConfig.gulagRoleId) gulagConfig.gulagRoleId = '';
    if (!gulagConfig.gulagChannelId) gulagConfig.gulagChannelId = '';
    if (!gulagConfig.defaultDuration) gulagConfig.defaultDuration = 60;
    if (!gulagConfig.welcomeMessage) gulagConfig.welcomeMessage = 'Witaj w gulagu! Zostałeś tu umieszczony za złamanie zasad serwera.';
    
    // Update config in session
    configState.setSessionData(userId, 'gulag', gulagConfig);
    
    // Show updated view
    await showInitialView(interaction);
}

/**
 * Show gulag settings modal
 * @param {Interaction} interaction - The interaction
 */
async function showSettingsModal(interaction) {
    const userId = interaction.user.id;
    const gulagConfig = configState.getSessionData(userId, 'gulag') || {};
    
    const modal = new ModalBuilder()
        .setCustomId('gulag_settings')
        .setTitle('Ustawienia gulaga');
        
    const roleIdInput = new TextInputBuilder()
        .setCustomId('gulagRoleId')
        .setLabel('ID roli gulaga')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 123456789012345678')
        .setValue(gulagConfig.gulagRoleId || '')
        .setRequired(true);
        
    const channelIdInput = new TextInputBuilder()
        .setCustomId('gulagChannelId')
        .setLabel('ID kanału gulaga')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 123456789012345678')
        .setValue(gulagConfig.gulagChannelId || '')
        .setRequired(true);
        
    const durationInput = new TextInputBuilder()
        .setCustomId('defaultDuration')
        .setLabel('Domyślny czas w minutach')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 60')
        .setValue(gulagConfig.defaultDuration ? gulagConfig.defaultDuration.toString() : '60')
        .setRequired(true);
        
    const messageInput = new TextInputBuilder()
        .setCustomId('welcomeMessage')
        .setLabel('Wiadomość powitalna w gulagu')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Wpisz wiadomość, która będzie wyświetlana użytkownikom w gulagu')
        .setValue(gulagConfig.welcomeMessage || 'Witaj w gulagu! Zostałeś tu umieszczony za złamanie zasad serwera.')
        .setRequired(true);
        
    const row1 = new ActionRowBuilder().addComponents(roleIdInput);
    const row2 = new ActionRowBuilder().addComponents(channelIdInput);
    const row3 = new ActionRowBuilder().addComponents(durationInput);
    const row4 = new ActionRowBuilder().addComponents(messageInput);
    
    modal.addComponents(row1, row2, row3, row4);
    
    await interaction.showModal(modal);
}

/**
 * Handle select menu interactions for gulag configuration
 * @param {Interaction} interaction - The select menu interaction
 * @param {string} menuAction - The specific menu action
 */
async function handleSelectMenuInteraction(interaction, menuAction) {
    // Currently, we don't have select menus for gulag config
    await interaction.reply({
        content: 'Nieznana akcja menu wyboru w konfiguracji gulaga!',
        ephemeral: true
    });
}

/**
 * Handle modal submit interactions for gulag configuration
 * @param {Interaction} interaction - The modal submit interaction
 * @param {string} modalAction - The specific modal action
 */
async function handleModalSubmit(interaction, modalAction) {
    const userId = interaction.user.id;
    
    // Refresh the user's session timeout
    configState.refreshSession(userId);
    
    switch (modalAction) {
        case 'settings':
            await processSettingsModal(interaction);
            break;
            
        default:
            await interaction.reply({
                content: 'Nieznana akcja formularza konfiguracyjnego!',
                ephemeral: true
            });
    }
}

/**
 * Process gulag settings modal submit
 * @param {Interaction} interaction - The modal interaction
 */
async function processSettingsModal(interaction) {
    const gulagRoleId = interaction.fields.getTextInputValue('gulagRoleId');
    const gulagChannelId = interaction.fields.getTextInputValue('gulagChannelId');
    const defaultDurationStr = interaction.fields.getTextInputValue('defaultDuration');
    const welcomeMessage = interaction.fields.getTextInputValue('welcomeMessage');
    
    // Validate duration is a number
    const defaultDuration = parseInt(defaultDurationStr);
    if (isNaN(defaultDuration) || defaultDuration <= 0) {
        await interaction.reply({
            content: 'Czas musi być liczbą większą od zera!',
            ephemeral: true
        });
        return;
    }
    
    const userId = interaction.user.id;
    const gulagConfig = configState.getSessionData(userId, 'gulag') || {};
    
    // Update config with new values
    gulagConfig.gulagRoleId = gulagRoleId;
    gulagConfig.gulagChannelId = gulagChannelId;
    gulagConfig.defaultDuration = defaultDuration;
    gulagConfig.welcomeMessage = welcomeMessage;
    
    // Set enabled to true if it wasn't set previously
    if (gulagConfig.enabled === undefined) {
        gulagConfig.enabled = true;
    }
    
    // Update config in session
    configState.setSessionData(userId, 'gulag', gulagConfig);
    
    // Show updated view
    await showInitialView(interaction);
}

module.exports = {
    showInitialView,
    handleButtonInteraction,
    handleSelectMenuInteraction,
    handleModalSubmit
};