const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../../utils/configLoader');

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
            // Fetch and delete messages
            const messages = await interaction.channel.messages.fetch({ limit: count });
            await interaction.channel.bulkDelete(messages);
            
            // Send confirmation message
            const clearMessage = config.wiadomosci.clear.replace('{count}', count);
            await interaction.reply({
                content: clearMessage,
                ephemeral: true
            });
            
            // Log the action
            if (config.kanaly.logi_moderacji) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_moderacji);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} usunął ${count} wiadomości w kanale ${interaction.channel.toString()}.`);
                }
            }
        } catch (error) {
            console.error('Error deleting messages:', error);
            await interaction.reply({
                content: 'An error occurred while trying to delete messages. Messages older than 14 days cannot be bulk deleted.',
                ephemeral: true
            });
        }
    }
}
