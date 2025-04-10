const { SlashCommandBuilder } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('Send a predefined message')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of message to send')
                .setRequired(true)
                .addChoices(
                    ...getMessageChoices()
                )),
    async execute(interaction) {
        const messageType = interaction.options.getString('type');
        const config = ConfigLoader.loadConfig('wiadomosci');
        
        // Find the message in configuration
        const messageCommand = config.komendy.find(cmd => cmd.nazwa === messageType);
        
        if (messageCommand) {
            await interaction.reply(messageCommand.wiadomosc);
        } else {
            await interaction.reply({ content: 'Message not found in configuration.', ephemeral: true });
        }
    }
};

// Helper function to get message choices from config
function getMessageChoices() {
    const config = ConfigLoader.loadConfig('wiadomosci');
    if (!config.komendy || !Array.isArray(config.komendy)) return [];
    
    return config.komendy.map(cmd => ({
        name: cmd.nazwa,
        value: cmd.nazwa
    }));
}
