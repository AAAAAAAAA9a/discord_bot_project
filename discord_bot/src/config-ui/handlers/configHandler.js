const { ActionRowBuilder } = require('discord.js');
const ConfigLoader = require('../../utils/configLoader');
const configState = require('../utils/configState');
const reactionRolesView = require('../views/reactionRolesView');
const verificationView = require('../views/verificationView');
const moderationView = require('../views/moderationView');
const gulagView = require('../views/gulagView');

/**
 * Handle the config command and its subcommands
 * @param {Interaction} interaction - The interaction object
 * @param {string} subcommand - The subcommand name
 */
async function handleConfigCommand(interaction, subcommand) {
    // Create a new config session for this user
    configState.createSession(interaction.user.id);
    
    switch (subcommand) {
        case 'reaction-roles':
            // Load current config
            const reactionRolesConfig = ConfigLoader.loadConfig('reakcje_role');
            // Store in temporary state
            configState.setSessionData(interaction.user.id, 'reactionRoles', reactionRolesConfig);
            // Show the initial configuration UI
            await reactionRolesView.showInitialView(interaction);
            break;
            
        case 'verification':
            const verificationConfig = ConfigLoader.loadConfig('weryfikacja');
            configState.setSessionData(interaction.user.id, 'verification', verificationConfig);
            await verificationView.showInitialView(interaction);
            break;
            
        case 'moderation':
            const moderationConfig = ConfigLoader.loadConfig('moderacja');
            configState.setSessionData(interaction.user.id, 'moderation', moderationConfig);
            await moderationView.showInitialView(interaction);
            break;
            
        case 'gulag':
            const gulagConfig = ConfigLoader.loadConfig('gulag');
            configState.setSessionData(interaction.user.id, 'gulag', gulagConfig);
            await gulagView.showInitialView(interaction);
            break;
            
        default:
            await interaction.reply({ content: 'Nieznana podkomenda konfiguracyjna!', ephemeral: true });
    }
}

/**
 * Handle button interactions related to configuration
 * @param {Interaction} interaction - The button interaction
 * @param {string} action - The button action identifier
 */
async function handleButtonInteraction(interaction, action) {
    const parts = action.split('_');
    const configType = parts[0];
    const buttonAction = parts.slice(1).join('_');
    
    // Verify user has an active config session
    if (!configState.hasSession(interaction.user.id)) {
        await interaction.reply({ 
            content: 'Sesja konfiguracyjna wygasła. Użyj ponownie komendy `/config`', 
            ephemeral: true 
        });
        return;
    }
    
    switch (configType) {
        case 'reaction':
            await reactionRolesView.handleButtonInteraction(interaction, buttonAction, []);
            break;
            
        case 'verify':
            await verificationView.handleButtonInteraction(interaction, buttonAction, []);
            break;
            
        case 'mod':
            await moderationView.handleButtonInteraction(interaction, buttonAction, []);
            break;
            
        case 'gulag':
            await gulagView.handleButtonInteraction(interaction, buttonAction, []);
            break;
            
        case 'save':
            await handleSaveConfig(interaction, buttonAction);
            break;
            
        case 'cancel':
            configState.deleteSession(interaction.user.id);
            await interaction.update({ 
                content: 'Konfiguracja anulowana.', 
                components: [],
                embeds: []
            });
            break;
            
        default:
            await interaction.reply({ 
                content: 'Nieznany typ akcji konfiguracyjnej!', 
                ephemeral: true 
            });
    }
}

/**
 * Handle select menu interactions related to configuration
 * @param {Interaction} interaction - The select menu interaction
 * @param {string} action - The select menu action identifier
 */
async function handleSelectMenuInteraction(interaction, action) {
    const [configType, menuAction] = action.split('_');
    
    // Verify user has an active config session
    if (!configState.hasSession(interaction.user.id)) {
        await interaction.reply({ 
            content: 'Sesja konfiguracyjna wygasła. Użyj ponownie komendy `/config`', 
            ephemeral: true 
        });
        return;
    }
    
    switch (configType) {
        case 'reaction':
            await reactionRolesView.handleSelectMenuInteraction(interaction, menuAction);
            break;
            
        case 'verify':
            await verificationView.handleSelectMenuInteraction(interaction, menuAction);
            break;
            
        case 'mod':
            await moderationView.handleSelectMenuInteraction(interaction, menuAction);
            break;
            
        case 'gulag':
            await gulagView.handleSelectMenuInteraction(interaction, menuAction);
            break;
            
        default:
            await interaction.reply({ 
                content: 'Nieznany typ akcji konfiguracyjnej!', 
                ephemeral: true 
            });
    }
}

/**
 * Handle modal submit interactions related to configuration
 * @param {Interaction} interaction - The modal submit interaction
 * @param {string} action - The modal action identifier
 */
async function handleModalSubmit(interaction, action) {
    // Wyodrębnij typ konfiguracji (pierwszy segment), resztę traktuj jako modalAction
    const parts = action.split('_');
    const configType = parts[0];
    const modalAction = parts.slice(1).join('_');
    
    // Verify user has an active config session
    if (!configState.hasSession(interaction.user.id)) {
        await interaction.reply({ 
            content: 'Sesja konfiguracyjna wygasła. Użyj ponownie komendy `/config`', 
            ephemeral: true 
        });
        return;
    }
    
    switch (configType) {
        case 'reaction':
            await reactionRolesView.handleModalSubmit(interaction, modalAction);
            break;
            
        case 'verify':
            await verificationView.handleModalSubmit(interaction, modalAction);
            break;
            
        case 'mod':
            await moderationView.handleModalSubmit(interaction, modalAction);
            break;
            
        case 'gulag':
            await gulagView.handleModalSubmit(interaction, modalAction);
            break;
            
        default:
            await interaction.reply({ 
                content: 'Nieznany typ akcji konfiguracyjnej!', 
                ephemeral: true 
            });
    }
}

/**
 * Handle saving the configuration
 * @param {Interaction} interaction - The interaction
 * @param {string} configType - The configuration type to save
 */
async function handleSaveConfig(interaction, configType) {
    const userId = interaction.user.id;
    let configData, configFileName;
    let success = false;
    
    switch (configType) {
        case 'reaction':
            configData = configState.getSessionData(userId, 'reactionRoles');
            configFileName = 'reakcje_role';
            break;
            
        case 'verify':
            configData = configState.getSessionData(userId, 'verification');
            configFileName = 'weryfikacja';
            break;
            
        case 'mod':
            configData = configState.getSessionData(userId, 'moderation');
            configFileName = 'moderacja';
            break;
            
        case 'gulag':
            configData = configState.getSessionData(userId, 'gulag');
            configFileName = 'gulag';
            break;
            
        default:
            await interaction.update({ 
                content: 'Nieznany typ konfiguracji do zapisania!', 
                components: [],
                embeds: []
            });
            return;
    }
    
    if (configData) {
        success = ConfigLoader.saveConfig(configFileName, configData);
    }
    
    if (success) {
        configState.deleteSession(userId);
        await interaction.update({ 
            content: `Konfiguracja ${configFileName} została zapisana pomyślnie!`, 
            components: [],
            embeds: []
        });
    } else {
        await interaction.update({ 
            content: `Wystąpił problem podczas zapisywania konfiguracji ${configFileName}!`,
            components: []
        });
    }
}

module.exports = {
    handleConfigCommand,
    handleButtonInteraction,
    handleSelectMenuInteraction,
    handleModalSubmit
};