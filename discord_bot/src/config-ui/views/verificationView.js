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
 * Show the initial verification configuration view
 * @param {Interaction} interaction - The interaction object
 */
async function showInitialView(interaction) {
    // Get configuration from the session
    const userId = interaction.user.id;
    const verificationConfig = configState.getSessionData(userId, 'verification') || {};
    
    // Create embed with current config info
    const embed = new EmbedBuilder()
        .setTitle('Konfiguracja Weryfikacji')
        .setDescription('Użyj przycisków poniżej, aby skonfigurować system weryfikacji.')
        .setColor(0x3498db);
    
    // Add info about existing verification config
    let configInfo = '';
    configInfo += `**Aktywna:** ${verificationConfig.enabled ? '✅' : '❌'}\n`;
    
    if (verificationConfig.roleId) {
        configInfo += `**Rola po weryfikacji:** <@&${verificationConfig.roleId}>\n`;
    }

    if (verificationConfig.channelId) {
        configInfo += `**Kanał weryfikacji:** <#${verificationConfig.channelId}>\n`;
    }
    
    if (verificationConfig.message) {
        configInfo += `**Wiadomość weryfikacyjna:** ${verificationConfig.message}\n`;
    }
    
    embed.addFields({ name: 'Aktualna konfiguracja', value: configInfo || 'Brak konfiguracji' });
    
    // Create action buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('verify_toggle')
                .setLabel(verificationConfig.enabled ? 'Wyłącz weryfikację' : 'Włącz weryfikację')
                .setStyle(verificationConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('verify_settings')
                .setLabel('Ustawienia weryfikacji')
                .setStyle(ButtonStyle.Primary)
        );
    
    // Create save/cancel buttons
    const saveRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('save_verify')
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
 * Handle button interactions for verification configuration
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
            await toggleVerification(interaction);
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
 * Toggle verification enabled/disabled
 * @param {Interaction} interaction - The interaction
 */
async function toggleVerification(interaction) {
    const userId = interaction.user.id;
    const verificationConfig = configState.getSessionData(userId, 'verification') || {};
    
    // Toggle enabled state
    verificationConfig.enabled = !verificationConfig.enabled;
    
    // Ensure we have a default config if not exists
    if (!verificationConfig.roleId) verificationConfig.roleId = '';
    if (!verificationConfig.channelId) verificationConfig.channelId = '';
    if (!verificationConfig.message) verificationConfig.message = 'Zweryfikuj się aby uzyskać dostęp do serwera!';
    
    // Update config in session
    configState.setSessionData(userId, 'verification', verificationConfig);
    
    // Show updated view
    await showInitialView(interaction);
}

/**
 * Show verification settings modal
 * @param {Interaction} interaction - The interaction
 */
async function showSettingsModal(interaction) {
    const userId = interaction.user.id;
    const verificationConfig = configState.getSessionData(userId, 'verification') || {};
    
    const modal = new ModalBuilder()
        .setCustomId('verify_settings')
        .setTitle('Ustawienia weryfikacji');
        
    const roleIdInput = new TextInputBuilder()
        .setCustomId('roleId')
        .setLabel('ID roli po weryfikacji')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 123456789012345678')
        .setValue(verificationConfig.roleId || '')
        .setRequired(true);
        
    const channelIdInput = new TextInputBuilder()
        .setCustomId('channelId')
        .setLabel('ID kanału weryfikacji')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 123456789012345678')
        .setValue(verificationConfig.channelId || '')
        .setRequired(true);
        
    const messageInput = new TextInputBuilder()
        .setCustomId('message')
        .setLabel('Wiadomość weryfikacyjna')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Wpisz wiadomość, która będzie wyświetlana przy weryfikacji')
        .setValue(verificationConfig.message || 'Zweryfikuj się aby uzyskać dostęp do serwera!')
        .setRequired(true);
        
    const row1 = new ActionRowBuilder().addComponents(roleIdInput);
    const row2 = new ActionRowBuilder().addComponents(channelIdInput);
    const row3 = new ActionRowBuilder().addComponents(messageInput);
    
    modal.addComponents(row1, row2, row3);
    
    await interaction.showModal(modal);
}

/**
 * Handle select menu interactions for verification configuration
 * @param {Interaction} interaction - The select menu interaction
 * @param {string} menuAction - The specific menu action
 */
async function handleSelectMenuInteraction(interaction, menuAction) {
    // Currently, we don't have select menus for verification config
    await interaction.reply({
        content: 'Nieznana akcja menu wyboru w konfiguracji weryfikacji!',
        ephemeral: true
    });
}

/**
 * Handle modal submit interactions for verification configuration
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
 * Process verification settings modal submit
 * @param {Interaction} interaction - The modal interaction
 */
async function processSettingsModal(interaction) {
    const roleId = interaction.fields.getTextInputValue('roleId');
    const channelId = interaction.fields.getTextInputValue('channelId');
    const message = interaction.fields.getTextInputValue('message');
    
    const userId = interaction.user.id;
    const verificationConfig = configState.getSessionData(userId, 'verification') || {};
    
    // Update config with new values
    verificationConfig.roleId = roleId;
    verificationConfig.channelId = channelId;
    verificationConfig.message = message;
    
    // Set enabled to true if it wasn't set previously
    if (verificationConfig.enabled === undefined) {
        verificationConfig.enabled = true;
    }
    
    // Update config in session
    configState.setSessionData(userId, 'verification', verificationConfig);
    
    // Show updated view
    await showInitialView(interaction);
}

module.exports = {
    showInitialView,
    handleButtonInteraction,
    handleSelectMenuInteraction,
    handleModalSubmit
};