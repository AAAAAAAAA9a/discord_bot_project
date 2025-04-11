const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');
const ModerationUtils = require('../utils/moderationUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete a specified number of messages')
        .addIntegerOption(option => 
            option.setName('count')
                .setDescription('The number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
        const count = interaction.options.getInteger('count');
        const config = ConfigLoader.loadConfig('moderacja');
        
        try {
            const messages = await interaction.channel.messages.fetch({ limit: count });
            await interaction.channel.bulkDelete(messages);
            
            const clearMessage = ModerationUtils.formatMessage(config.wiadomosci.clear, {
                count: count.toString()
            });
            
            await interaction.reply({
                content: clearMessage,
                ephemeral: true
            });
            
            await ModerationUtils.logAction(interaction, 'usunął', null, { 
                additionalInfo: `${count} wiadomości w kanale ${interaction.channel.toString()}`
            });
        } catch (error) {
            await ModerationUtils.handleError(error, interaction, 'delete messages. Messages older than 14 days cannot be bulk deleted');
        }
    }
}
