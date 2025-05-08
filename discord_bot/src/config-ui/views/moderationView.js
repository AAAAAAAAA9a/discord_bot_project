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
 * Show the initial moderation configuration view
 * @param {Interaction} interaction - The interaction object
 */
async function showInitialView(interaction) {
    // Get configuration from the session
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    
    // Create embed with current config info
    const embed = new EmbedBuilder()
        .setTitle('Konfiguracja Moderacji')
        .setDescription('Użyj przycisków poniżej, aby skonfigurować system moderacji.')
        .setColor(0x3498db);
    
    // Add info about existing moderation config
    let configInfo = '';
    
    if (moderationConfig.logChannelId) {
        configInfo += `**Kanał logów:** <#${moderationConfig.logChannelId}>\n`;
    }
    
    if (moderationConfig.muteRoleId) {
        configInfo += `**Rola wyciszenia:** <@&${moderationConfig.muteRoleId}>\n`;
    }
    
    if (moderationConfig.autoModerationEnabled) {
        configInfo += '**Auto-moderacja:** ✅\n';
        
        if (moderationConfig.bannedWords && moderationConfig.bannedWords.length > 0) {
            configInfo += `**Zakazane słowa:** ${moderationConfig.bannedWords.length}\n`;
        }
        
        if (moderationConfig.warningThresholds) {
            configInfo += '**Progi ostrzeżeń:**\n';
            for (const action in moderationConfig.warningThresholds) {
                configInfo += `- ${action}: ${moderationConfig.warningThresholds[action]} ostrzeżeń\n`;
            }
        }
    } else {
        configInfo += '**Auto-moderacja:** ❌\n';
    }
    
    embed.addFields({ name: 'Aktualna konfiguracja', value: configInfo || 'Brak konfiguracji' });
    
    // Create action buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('mod_general')
                .setLabel('Ustawienia ogólne')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('mod_automod')
                .setLabel(moderationConfig.autoModerationEnabled ? 'Edytuj auto-moderację' : 'Włącz auto-moderację')
                .setStyle(ButtonStyle.Secondary)
        );
    
    // Create save/cancel buttons
    const saveRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('save_mod')
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
 * Handle button interactions for moderation configuration
 * @param {Interaction} interaction - The button interaction
 * @param {string} buttonAction - The specific button action
 * @param {Array} params - Additional parameters from the button ID
 */
async function handleButtonInteraction(interaction, buttonAction, params) {
    const userId = interaction.user.id;
    
    // Refresh the user's session timeout
    configState.refreshSession(userId);
    
    switch (buttonAction) {
        case 'general':
            await showGeneralSettingsModal(interaction);
            break;
            
        case 'automod':
            await handleAutoModSettings(interaction);
            break;
            
        case 'add_banned_word':
            await showAddBannedWordModal(interaction);
            break;
            
        case 'remove_banned_word':
            await showRemoveBannedWordMenu(interaction);
            break;
            
        case 'thresholds':
            await showThresholdsModal(interaction);
            break;
            
        case 'back':
            await showInitialView(interaction);
            break;
            
        default:
            await interaction.reply({
                content: 'Nieznana akcja przycisku konfiguracyjnego!',
                ephemeral: true
            });
    }
}

/**
 * Show general moderation settings modal
 * @param {Interaction} interaction - The interaction
 */
async function showGeneralSettingsModal(interaction) {
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    
    const modal = new ModalBuilder()
        .setCustomId('mod_general')
        .setTitle('Ogólne ustawienia moderacji');
        
    const logChannelInput = new TextInputBuilder()
        .setCustomId('logChannelId')
        .setLabel('ID kanału logów moderacji')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 123456789012345678')
        .setValue(moderationConfig.logChannelId || '')
        .setRequired(true);
        
    const muteRoleInput = new TextInputBuilder()
        .setCustomId('muteRoleId')
        .setLabel('ID roli wyciszenia (mute)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 123456789012345678')
        .setValue(moderationConfig.muteRoleId || '')
        .setRequired(true);
        
    const row1 = new ActionRowBuilder().addComponents(logChannelInput);
    const row2 = new ActionRowBuilder().addComponents(muteRoleInput);
    
    modal.addComponents(row1, row2);
    
    await interaction.showModal(modal);
}

/**
 * Handle auto-moderation settings
 * @param {Interaction} interaction - The interaction
 */
async function handleAutoModSettings(interaction) {
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    
    // If auto-moderation is not enabled, enable it
    if (!moderationConfig.autoModerationEnabled) {
        moderationConfig.autoModerationEnabled = true;
        moderationConfig.bannedWords = moderationConfig.bannedWords || [];
        moderationConfig.warningThresholds = moderationConfig.warningThresholds || {
            mute: 3,
            kick: 5,
            ban: 7
        };
        
        configState.setSessionData(userId, 'moderation', moderationConfig);
    }
    
    // Show auto-moderation settings view
    await showAutoModView(interaction);
}

/**
 * Show auto-moderation configuration view
 * @param {Interaction} interaction - The interaction
 */
async function showAutoModView(interaction) {
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    
    // Create embed with current auto-mod config info
    const embed = new EmbedBuilder()
        .setTitle('Konfiguracja Auto-Moderacji')
        .setDescription('Użyj przycisków poniżej, aby skonfigurować auto-moderację.')
        .setColor(0x3498db);
    
    // Add info about banned words
    let bannedWordsInfo = 'Brak zakazanych słów';
    if (moderationConfig.bannedWords && moderationConfig.bannedWords.length > 0) {
        bannedWordsInfo = moderationConfig.bannedWords.join(', ');
        if (bannedWordsInfo.length > 1000) {
            bannedWordsInfo = bannedWordsInfo.substring(0, 997) + '...';
        }
    }
    embed.addFields({ name: 'Zakazane słowa', value: bannedWordsInfo });
    
    // Add info about warning thresholds
    let thresholdsInfo = 'Brak progów ostrzeżeń';
    if (moderationConfig.warningThresholds) {
        thresholdsInfo = '';
        for (const action in moderationConfig.warningThresholds) {
            thresholdsInfo += `**${action}:** ${moderationConfig.warningThresholds[action]} ostrzeżeń\n`;
        }
    }
    embed.addFields({ name: 'Progi ostrzeżeń', value: thresholdsInfo });
    
    // Create action buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('mod_add_banned_word')
                .setLabel('Dodaj zakazane słowo')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('mod_remove_banned_word')
                .setLabel('Usuń zakazane słowo')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!moderationConfig.bannedWords || moderationConfig.bannedWords.length === 0)
        );
    
    const thresholdsRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('mod_thresholds')
                .setLabel('Ustaw progi ostrzeżeń')
                .setStyle(ButtonStyle.Secondary)
        );
    
    // Create back button
    const backRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('mod_back')
                .setLabel('Powrót')
                .setStyle(ButtonStyle.Secondary)
        );
    
    await interaction.update({
        embeds: [embed],
        components: [actionRow, thresholdsRow, backRow],
    });
}

/**
 * Show add banned word modal
 * @param {Interaction} interaction - The interaction
 */
async function showAddBannedWordModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('mod_add_banned_word')
        .setTitle('Dodaj zakazane słowo');
        
    const bannedWordInput = new TextInputBuilder()
        .setCustomId('bannedWord')
        .setLabel('Zakazane słowo')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Wpisz słowo, które ma być zakazane')
        .setRequired(true);
        
    const row = new ActionRowBuilder().addComponents(bannedWordInput);
    
    modal.addComponents(row);
    
    await interaction.showModal(modal);
}

/**
 * Show remove banned word select menu
 * @param {Interaction} interaction - The interaction
 */
async function showRemoveBannedWordMenu(interaction) {
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    
    if (!moderationConfig.bannedWords || moderationConfig.bannedWords.length === 0) {
        await interaction.update({
            content: 'Nie ma żadnych zakazanych słów do usunięcia!',
            components: []
        });
        return;
    }
    
    // Create select menu for banned words
    const selectOptions = moderationConfig.bannedWords.map(word => ({
        label: word,
        value: word,
        description: `Usuń zakazane słowo: ${word}`
    }));
    
    // Limit to 25 options (Discord limit)
    const limitedOptions = selectOptions.slice(0, 25);
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('mod_remove_banned_word')
        .setPlaceholder('Wybierz słowo do usunięcia')
        .addOptions(limitedOptions);
        
    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    
    const backButton = new ButtonBuilder()
        .setCustomId('mod_back')
        .setLabel('Powrót')
        .setStyle(ButtonStyle.Secondary);
    
    const backRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
        content: 'Wybierz zakazane słowo do usunięcia:',
        components: [actionRow, backRow],
        embeds: []
    });
}

/**
 * Show warning thresholds modal
 * @param {Interaction} interaction - The interaction
 */
async function showThresholdsModal(interaction) {
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    const thresholds = moderationConfig.warningThresholds || { mute: 3, kick: 5, ban: 7 };
    
    const modal = new ModalBuilder()
        .setCustomId('mod_thresholds')
        .setTitle('Progi ostrzeżeń');
        
    const muteInput = new TextInputBuilder()
        .setCustomId('muteThreshold')
        .setLabel('Próg dla wyciszenia (liczba ostrzeżeń)')
        .setStyle(TextInputStyle.Short)
        .setValue(thresholds.mute ? thresholds.mute.toString() : '3')
        .setRequired(true);
        
    const kickInput = new TextInputBuilder()
        .setCustomId('kickThreshold')
        .setLabel('Próg dla wyrzucenia (liczba ostrzeżeń)')
        .setStyle(TextInputStyle.Short)
        .setValue(thresholds.kick ? thresholds.kick.toString() : '5')
        .setRequired(true);
        
    const banInput = new TextInputBuilder()
        .setCustomId('banThreshold')
        .setLabel('Próg dla bana (liczba ostrzeżeń)')
        .setStyle(TextInputStyle.Short)
        .setValue(thresholds.ban ? thresholds.ban.toString() : '7')
        .setRequired(true);
        
    const row1 = new ActionRowBuilder().addComponents(muteInput);
    const row2 = new ActionRowBuilder().addComponents(kickInput);
    const row3 = new ActionRowBuilder().addComponents(banInput);
    
    modal.addComponents(row1, row2, row3);
    
    await interaction.showModal(modal);
}

/**
 * Handle select menu interactions for moderation configuration
 * @param {Interaction} interaction - The select menu interaction
 * @param {string} menuAction - The specific menu action
 */
async function handleSelectMenuInteraction(interaction, menuAction) {
    const userId = interaction.user.id;
    const selectedValue = interaction.values[0];
    
    // Refresh the user's session timeout
    configState.refreshSession(userId);
    
    switch (menuAction) {
        case 'remove_banned_word':
            await removeBannedWord(interaction, selectedValue);
            break;
            
        default:
            await interaction.reply({
                content: 'Nieznana akcja menu wyboru konfiguracyjnego!',
                ephemeral: true
            });
    }
}

/**
 * Remove a banned word
 * @param {Interaction} interaction - The interaction
 * @param {string} word - The word to remove
 */
async function removeBannedWord(interaction, word) {
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    
    if (!moderationConfig.bannedWords) {
        await interaction.update({
            content: 'Lista zakazanych słów jest pusta!',
            components: []
        });
        return;
    }
    
    // Filter out the word
    moderationConfig.bannedWords = moderationConfig.bannedWords.filter(w => w !== word);
    
    // Update config in session
    configState.setSessionData(userId, 'moderation', moderationConfig);
    
    // Show auto-mod view
    await showAutoModView(interaction);
}

/**
 * Handle modal submit interactions for moderation configuration
 * @param {Interaction} interaction - The modal submit interaction
 * @param {string} modalAction - The specific modal action
 */
async function handleModalSubmit(interaction, modalAction) {
    const userId = interaction.user.id;
    
    // Refresh the user's session timeout
    configState.refreshSession(userId);
    
    switch (modalAction) {
        case 'general':
            await processGeneralSettingsModal(interaction);
            break;
            
        case 'add_banned_word':
            await processAddBannedWordModal(interaction);
            break;
            
        case 'thresholds':
            await processThresholdsModal(interaction);
            break;
            
        default:
            await interaction.reply({
                content: 'Nieznana akcja formularza konfiguracyjnego!',
                ephemeral: true
            });
    }
}

/**
 * Process general settings modal submit
 * @param {Interaction} interaction - The modal interaction
 */
async function processGeneralSettingsModal(interaction) {
    const logChannelId = interaction.fields.getTextInputValue('logChannelId');
    const muteRoleId = interaction.fields.getTextInputValue('muteRoleId');
    
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    
    // Update config with new values
    moderationConfig.logChannelId = logChannelId;
    moderationConfig.muteRoleId = muteRoleId;
    
    // Update config in session
    configState.setSessionData(userId, 'moderation', moderationConfig);
    
    // Show updated view
    await showInitialView(interaction);
}

/**
 * Process add banned word modal submit
 * @param {Interaction} interaction - The modal interaction
 */
async function processAddBannedWordModal(interaction) {
    const bannedWord = interaction.fields.getTextInputValue('bannedWord');
    
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    
    // Initialize bannedWords array if it doesn't exist
    if (!moderationConfig.bannedWords) {
        moderationConfig.bannedWords = [];
    }
    
    // Add word if it doesn't already exist
    if (!moderationConfig.bannedWords.includes(bannedWord)) {
        moderationConfig.bannedWords.push(bannedWord);
    }
    
    // Update config in session
    configState.setSessionData(userId, 'moderation', moderationConfig);
    
    // Show auto-mod view
    await showAutoModView(interaction);
}

/**
 * Process thresholds modal submit
 * @param {Interaction} interaction - The modal interaction
 */
async function processThresholdsModal(interaction) {
    const muteThreshold = parseInt(interaction.fields.getTextInputValue('muteThreshold'));
    const kickThreshold = parseInt(interaction.fields.getTextInputValue('kickThreshold'));
    const banThreshold = parseInt(interaction.fields.getTextInputValue('banThreshold'));
    
    // Validate input
    if (isNaN(muteThreshold) || isNaN(kickThreshold) || isNaN(banThreshold)) {
        await interaction.reply({
            content: 'Progi muszą być liczbami!',
            ephemeral: true
        });
        return;
    }
    
    const userId = interaction.user.id;
    const moderationConfig = configState.getSessionData(userId, 'moderation') || {};
    
    // Update thresholds
    moderationConfig.warningThresholds = {
        mute: muteThreshold,
        kick: kickThreshold,
        ban: banThreshold
    };
    
    // Update config in session
    configState.setSessionData(userId, 'moderation', moderationConfig);
    
    // Show auto-mod view
    await showAutoModView(interaction);
}

module.exports = {
    showInitialView,
    handleButtonInteraction,
    handleSelectMenuInteraction,
    handleModalSubmit
};