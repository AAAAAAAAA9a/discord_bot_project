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
 * Show the initial reaction roles configuration view
 * @param {Interaction} interaction - The interaction object
 */
async function showInitialView(interaction) {
    // Get configuration from the session
    const userId = interaction.user.id;
    const reactionRolesConfig = configState.getSessionData(userId, 'reactionRoles') || {};
    
    // Create embed with current config info
    const embed = new EmbedBuilder()
        .setTitle('Konfiguracja Reaction Roles')
        .setDescription('Użyj przycisków poniżej, aby skonfigurować system Reaction Roles.')
        .setColor(0x3498db);
    
    // Add info about existing reaction roles if any
    if (reactionRolesConfig && Object.keys(reactionRolesConfig).length > 0) {
        let configInfo = '';
        for (const messageId in reactionRolesConfig) {
            configInfo += `**Wiadomość ID:** ${messageId}\n`;
            configInfo += `**Kanał ID:** ${reactionRolesConfig[messageId].channelId}\n`;
            configInfo += '**Role:**\n';
            
            const roles = reactionRolesConfig[messageId].roles || {};
            for (const emoji in roles) {
                configInfo += `- ${emoji}: <@&${roles[emoji]}>\n`;
            }
            configInfo += '\n';
        }
        embed.addFields({ name: 'Aktualna konfiguracja', value: configInfo || 'Brak konfiguracji' });
    } else {
        embed.addFields({ name: 'Aktualna konfiguracja', value: 'Brak konfiguracji' });
    }
    
    // Create action buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('reaction_add')
                .setLabel('Dodaj nowy zestaw')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('reaction_edit')
                .setLabel('Edytuj istniejący')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(Object.keys(reactionRolesConfig || {}).length === 0),
            new ButtonBuilder()
                .setCustomId('reaction_remove')
                .setLabel('Usuń istniejący')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(Object.keys(reactionRolesConfig || {}).length === 0)
        );
    
    // Create save/cancel buttons
    const saveRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('save_reaction')
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
 * Handle button interactions for reaction roles configuration
 * @param {Interaction} interaction - The button interaction
 * @param {string} buttonAction - The specific button action
 * @param {Array} params - Additional parameters from the button ID
 */
async function handleButtonInteraction(interaction, buttonAction, params) {
    const userId = interaction.user.id;
    
    // Refresh the user's session timeout
    configState.refreshSession(userId);
    
    switch (buttonAction) {
        case 'add':
            await showAddReactionRoleModal(interaction);
            break;
            
        case 'edit':
            await showEditSelectMenu(interaction);
            break;
            
        case 'remove':
            await showRemoveSelectMenu(interaction);
            break;
            
        case 'save_message':
            if (params && params[0]) {
                await saveMessageConfig(interaction, params[0]);
            }
            break;
            
        case 'cancel_message':
            await showInitialView(interaction);
            break;
            
        case 'add_role':
            if (params && params[0]) {
                await showAddRoleModal(interaction, params[0]);
            }
            break;
            
        case 'remove_role':
            if (params && params[0]) {
                await showRemoveRoleMenu(interaction, params[0]);
            }
            break;
            
        default:
            await interaction.reply({
                content: 'Nieznana akcja przycisku konfiguracyjnego!',
                ephemeral: true
            });
    }
}

/**
 * Handle select menu interactions for reaction roles configuration
 * @param {Interaction} interaction - The select menu interaction
 * @param {string} menuAction - The specific menu action
 */
async function handleSelectMenuInteraction(interaction, menuAction) {
    const userId = interaction.user.id;
    const selectedValues = interaction.values;
    
    // Refresh the user's session timeout
    configState.refreshSession(userId);
    
    switch (menuAction) {
        case 'edit':
            if (selectedValues && selectedValues[0]) {
                await showMessageConfigView(interaction, selectedValues[0]);
            }
            break;
            
        case 'remove':
            if (selectedValues && selectedValues[0]) {
                await removeReactionRoleConfig(interaction, selectedValues[0]);
            }
            break;
            
        case 'remove_role':
            if (selectedValues && selectedValues[0] && selectedValues[1]) {
                await removeRole(interaction, selectedValues[0], selectedValues[1]);
            }
            break;
            
        default:
            await interaction.reply({
                content: 'Nieznana akcja menu wyboru konfiguracyjnego!',
                ephemeral: true
            });
    }
}

/**
 * Handle modal submit interactions for reaction roles configuration
 * @param {Interaction} interaction - The modal submit interaction
 * @param {string} modalAction - The specific modal action
 */
async function handleModalSubmit(interaction, modalAction) {
    const userId = interaction.user.id;
    
    // Refresh the user's session timeout
    configState.refreshSession(userId);
    
    switch (modalAction) {
        case 'add':
            await processAddReactionRole(interaction);
            break;
            
        case 'add_role':
            await processAddRole(interaction);
            break;
            
        default:
            await interaction.reply({
                content: 'Nieznana akcja formularza konfiguracyjnego!',
                ephemeral: true
            });
    }
}

/**
 * Show modal for adding a new reaction role configuration
 * @param {Interaction} interaction - The interaction
 */
async function showAddReactionRoleModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('reaction_add')
        .setTitle('Dodaj nową konfigurację Reaction Roles');
        
    const messageIdInput = new TextInputBuilder()
        .setCustomId('messageId')
        .setLabel('ID wiadomości do reakcji')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 123456789012345678')
        .setRequired(true);
        
    const channelIdInput = new TextInputBuilder()
        .setCustomId('channelId')
        .setLabel('ID kanału z wiadomością')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 123456789012345678')
        .setRequired(true);
        
    const row1 = new ActionRowBuilder().addComponents(messageIdInput);
    const row2 = new ActionRowBuilder().addComponents(channelIdInput);
    
    modal.addComponents(row1, row2);
    
    await interaction.showModal(modal);
}

/**
 * Process the add reaction role modal submission
 * @param {Interaction} interaction - The modal interaction
 */
async function processAddReactionRole(interaction) {
    const messageId = interaction.fields.getTextInputValue('messageId');
    const channelId = interaction.fields.getTextInputValue('channelId');
    
    const userId = interaction.user.id;
    const reactionRolesConfig = configState.getSessionData(userId, 'reactionRoles') || {};
    
    // Add new config entry
    reactionRolesConfig[messageId] = {
        channelId: channelId,
        roles: {}
    };
    
    // Update config in session
    configState.setSessionData(userId, 'reactionRoles', reactionRolesConfig);
    
    // Show message config view
    await showMessageConfigView(interaction, messageId);
}

/**
 * Show select menu for editing reaction role configurations
 * @param {Interaction} interaction - The interaction
 */
async function showEditSelectMenu(interaction) {
    const userId = interaction.user.id;
    const reactionRolesConfig = configState.getSessionData(userId, 'reactionRoles') || {};
    
    if (Object.keys(reactionRolesConfig).length === 0) {
        await interaction.update({
            content: 'Nie ma żadnych konfiguracji Reaction Roles do edycji!',
            components: []
        });
        return;
    }
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('reaction_edit')
        .setPlaceholder('Wybierz konfigurację do edycji');
        
    for (const messageId in reactionRolesConfig) {
        selectMenu.addOptions({
            label: `Wiadomość: ${messageId}`,
            value: messageId,
            description: `Kanał: ${reactionRolesConfig[messageId].channelId}`
        });
    }
    
    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    
    const backButton = new ButtonBuilder()
        .setCustomId('reaction_cancel_message')
        .setLabel('Powrót')
        .setStyle(ButtonStyle.Secondary);
    
    const backRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
        content: 'Wybierz konfigurację Reaction Roles do edycji:',
        components: [actionRow, backRow],
        embeds: []
    });
}

/**
 * Show select menu for removing reaction role configurations
 * @param {Interaction} interaction - The interaction
 */
async function showRemoveSelectMenu(interaction) {
    const userId = interaction.user.id;
    const reactionRolesConfig = configState.getSessionData(userId, 'reactionRoles') || {};
    
    if (Object.keys(reactionRolesConfig).length === 0) {
        await interaction.update({
            content: 'Nie ma żadnych konfiguracji Reaction Roles do usunięcia!',
            components: []
        });
        return;
    }
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('reaction_remove')
        .setPlaceholder('Wybierz konfigurację do usunięcia');
        
    for (const messageId in reactionRolesConfig) {
        selectMenu.addOptions({
            label: `Wiadomość: ${messageId}`,
            value: messageId,
            description: `Kanał: ${reactionRolesConfig[messageId].channelId}`
        });
    }
    
    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    
    const backButton = new ButtonBuilder()
        .setCustomId('reaction_cancel_message')
        .setLabel('Powrót')
        .setStyle(ButtonStyle.Secondary);
    
    const backRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
        content: 'Wybierz konfigurację Reaction Roles do usunięcia:',
        components: [actionRow, backRow],
        embeds: []
    });
}

/**
 * Show the message configuration view for a specific message ID
 * @param {Interaction} interaction - The interaction
 * @param {string} messageId - The message ID to configure
 */
async function showMessageConfigView(interaction, messageId) {
    const userId = interaction.user.id;
    const reactionRolesConfig = configState.getSessionData(userId, 'reactionRoles') || {};
    
    if (!reactionRolesConfig[messageId]) {
        await interaction.update({
            content: `Konfiguracja dla wiadomości ${messageId} nie istnieje!`,
            components: []
        });
        return;
    }
    
    const messageConfig = reactionRolesConfig[messageId];
    
    // Create embed with message config info
    const embed = new EmbedBuilder()
        .setTitle(`Konfiguracja Reaction Roles - Wiadomość: ${messageId}`)
        .setDescription('Użyj przycisków poniżej, aby zarządzać rolami dla tej wiadomości.')
        .setColor(0x3498db)
        .addFields(
            { name: 'ID wiadomości', value: messageId },
            { name: 'ID kanału', value: messageConfig.channelId }
        );
    
    // Add info about roles if any
    if (messageConfig.roles && Object.keys(messageConfig.roles).length > 0) {
        let rolesInfo = '';
        for (const emoji in messageConfig.roles) {
            rolesInfo += `${emoji}: <@&${messageConfig.roles[emoji]}>\n`;
        }
        embed.addFields({ name: 'Skonfigurowane role', value: rolesInfo });
    } else {
        embed.addFields({ name: 'Skonfigurowane role', value: 'Brak skonfigurowanych ról' });
    }
    
    // Create action buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`reaction_add_role_${messageId}`)
                .setLabel('Dodaj rolę')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`reaction_remove_role_${messageId}`)
                .setLabel('Usuń rolę')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!messageConfig.roles || Object.keys(messageConfig.roles).length === 0)
        );
    
    // Create save/cancel buttons
    const saveRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`reaction_save_message_${messageId}`)
                .setLabel('Zapisz zmiany')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('reaction_cancel_message')
                .setLabel('Powrót')
                .setStyle(ButtonStyle.Secondary)
        );
    
    await interaction.update({
        embeds: [embed],
        components: [actionRow, saveRow],
        content: null
    });
}

/**
 * Show modal for adding a role to a reaction roles message
 * @param {Interaction} interaction - The interaction
 * @param {string} messageId - The message ID
 */
async function showAddRoleModal(interaction, messageId) {
    const modal = new ModalBuilder()
        .setCustomId(`reaction_add_role_${messageId}`)
        .setTitle('Dodaj rolę do Reaction Roles');
        
    const emojiInput = new TextInputBuilder()
        .setCustomId('emoji')
        .setLabel('Emoji dla reakcji')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 👍 lub :thumbsup:')
        .setRequired(true);
        
    const roleIdInput = new TextInputBuilder()
        .setCustomId('roleId')
        .setLabel('ID roli')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Przykład: 123456789012345678')
        .setRequired(true);
        
    const row1 = new ActionRowBuilder().addComponents(emojiInput);
    const row2 = new ActionRowBuilder().addComponents(roleIdInput);
    
    modal.addComponents(row1, row2);
    
    await interaction.showModal(modal);
}

/**
 * Process the add role modal submission
 * @param {Interaction} interaction - The modal interaction
 */
async function processAddRole(interaction) {
    const customId = interaction.customId;
    const messageId = customId.split('_').pop();
    
    const emoji = interaction.fields.getTextInputValue('emoji');
    const roleId = interaction.fields.getTextInputValue('roleId');
    
    const userId = interaction.user.id;
    const reactionRolesConfig = configState.getSessionData(userId, 'reactionRoles') || {};
    
    if (!reactionRolesConfig[messageId]) {
        await interaction.reply({
            content: `Konfiguracja dla wiadomości ${messageId} nie istnieje!`,
            ephemeral: true
        });
        return;
    }
    
    // Add or update role
    if (!reactionRolesConfig[messageId].roles) {
        reactionRolesConfig[messageId].roles = {};
    }
    
    reactionRolesConfig[messageId].roles[emoji] = roleId;
    
    // Update config in session
    configState.setSessionData(userId, 'reactionRoles', reactionRolesConfig);
    
    // Show updated message config view
    await showMessageConfigView(interaction, messageId);
}

/**
 * Show select menu for removing a role from a reaction roles message
 * @param {Interaction} interaction - The interaction
 * @param {string} messageId - The message ID
 */
async function showRemoveRoleMenu(interaction, messageId) {
    const userId = interaction.user.id;
    const reactionRolesConfig = configState.getSessionData(userId, 'reactionRoles') || {};
    
    if (!reactionRolesConfig[messageId] || 
        !reactionRolesConfig[messageId].roles ||
        Object.keys(reactionRolesConfig[messageId].roles).length === 0) {
        await interaction.update({
            content: `Nie ma żadnych ról do usunięcia dla wiadomości ${messageId}!`,
            components: []
        });
        return;
    }
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`reaction_remove_role_${messageId}`)
        .setPlaceholder('Wybierz rolę do usunięcia');
        
    for (const emoji in reactionRolesConfig[messageId].roles) {
        const roleId = reactionRolesConfig[messageId].roles[emoji];
        selectMenu.addOptions({
            label: `${emoji}: ${roleId}`,
            value: emoji,
            description: `Usuń rolę ${roleId} dla emoji ${emoji}`
        });
    }
    
    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    
    const backButton = new ButtonBuilder()
        .setCustomId(`reaction_save_message_${messageId}`)
        .setLabel('Powrót')
        .setStyle(ButtonStyle.Secondary);
    
    const backRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
        content: 'Wybierz rolę do usunięcia:',
        components: [actionRow, backRow],
        embeds: []
    });
}

/**
 * Remove a role from a reaction roles configuration
 * @param {Interaction} interaction - The interaction
 * @param {string} messageId - The message ID
 * @param {string} emoji - The emoji to remove
 */
async function removeRole(interaction, messageId, emoji) {
    const userId = interaction.user.id;
    const reactionRolesConfig = configState.getSessionData(userId, 'reactionRoles') || {};
    
    if (!reactionRolesConfig[messageId] || !reactionRolesConfig[messageId].roles) {
        await interaction.update({
            content: `Konfiguracja dla wiadomości ${messageId} nie istnieje lub nie ma ról!`,
            components: []
        });
        return;
    }
    
    // Remove the role
    delete reactionRolesConfig[messageId].roles[emoji];
    
    // Update config in session
    configState.setSessionData(userId, 'reactionRoles', reactionRolesConfig);
    
    // Show updated message config view
    await showMessageConfigView(interaction, messageId);
}

/**
 * Remove a reaction role configuration
 * @param {Interaction} interaction - The interaction
 * @param {string} messageId - The message ID to remove
 */
async function removeReactionRoleConfig(interaction, messageId) {
    const userId = interaction.user.id;
    const reactionRolesConfig = configState.getSessionData(userId, 'reactionRoles') || {};
    
    if (!reactionRolesConfig[messageId]) {
        await interaction.update({
            content: `Konfiguracja dla wiadomości ${messageId} nie istnieje!`,
            components: []
        });
        return;
    }
    
    // Remove the config
    delete reactionRolesConfig[messageId];
    
    // Update config in session
    configState.setSessionData(userId, 'reactionRoles', reactionRolesConfig);
    
    // Show initial view
    await showInitialView(interaction);
}

/**
 * Save the message configuration and return to initial view
 * @param {Interaction} interaction - The interaction
 * @param {string} messageId - The message ID
 */
async function saveMessageConfig(interaction, messageId) {
    // We don't need to do anything specific here since the changes
    // are already saved to the temporary state on each action
    
    // Show initial view
    await showInitialView(interaction);
}

module.exports = {
    showInitialView,
    handleButtonInteraction,
    handleSelectMenuInteraction,
    handleModalSubmit
};