const { Events } = require('discord.js');
const configHandler = require('../config-ui/handlers/configHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Obsługa poleceń slash
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
                
                const errorReply = { content: 'There was an error while executing this command!', ephemeral: true };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorReply);
                } else {
                    await interaction.reply(errorReply);
                }
            }
            return;
        }

        // Obsługa przycisków (button interactions)
        if (interaction.isButton()) {
            try {
                const customId = interaction.customId;
                
                // Sprawdzanie, czy to interakcja konfiguracyjna
                if (customId.startsWith('reaction_') || customId.startsWith('verify_') || 
                    customId.startsWith('mod_') || customId.startsWith('gulag_') ||
                    customId.startsWith('save_') || customId.startsWith('cancel_')) {
                    await configHandler.handleButtonInteraction(interaction, customId);
                }
            } catch (error) {
                console.error('Error handling button interaction:');
                console.error(error);
                
                const errorReply = { content: 'Wystąpił błąd podczas przetwarzania akcji!', ephemeral: true };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorReply);
                } else {
                    await interaction.reply(errorReply);
                }
            }
            return;
        }

        // Obsługa menu wyboru (select menu)
        if (interaction.isStringSelectMenu()) {
            try {
                const customId = interaction.customId;
                
                // Sprawdzanie, czy to interakcja konfiguracyjna
                if (customId.startsWith('reaction_') || customId.startsWith('verify_') || 
                    customId.startsWith('mod_') || customId.startsWith('gulag_')) {
                    await configHandler.handleSelectMenuInteraction(interaction, customId);
                }
            } catch (error) {
                console.error('Error handling select menu interaction:');
                console.error(error);
                
                const errorReply = { content: 'Wystąpił błąd podczas przetwarzania wyboru!', ephemeral: true };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorReply);
                } else {
                    await interaction.reply(errorReply);
                }
            }
            return;
        }

        // Obsługa modalnych formularzy (modal submit)
        if (interaction.isModalSubmit()) {
            try {
                const customId = interaction.customId;
                
                // Sprawdzanie, czy to interakcja konfiguracyjna
                if (customId.startsWith('reaction_') || customId.startsWith('verify_') || 
                    customId.startsWith('mod_') || customId.startsWith('gulag_')) {
                    await configHandler.handleModalSubmit(interaction, customId);
                }
            } catch (error) {
                console.error('Error handling modal submit:');
                console.error(error);
                
                const errorReply = { content: 'Wystąpił błąd podczas przetwarzania formularza!', ephemeral: true };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorReply);
                } else {
                    await interaction.reply(errorReply);
                }
            }
            return;
        }
    }
};
