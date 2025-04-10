const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const warningsDB = require('../../utils/warningsSQLiteDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Clear all warnings from a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to clear warnings from')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for clearing the warnings')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            // Get current warnings count for logging
            const warnings = await warningsDB.getWarnings(interaction.guild.id, targetUser.id);
            const warningCount = warnings.length;
            
            if (warningCount === 0) {
                await interaction.reply(`${targetUser.toString()} has no warnings to clear.`);
                return;
            }
            
            // Clear all warnings
            const success = await warningsDB.clearWarnings(interaction.guild.id, targetUser.id);
            
            if (!success) {
                await interaction.reply({
                    content: 'Failed to clear warnings. Please try again later.',
                    ephemeral: true
                });
                return;
            }
            
            await interaction.reply(`Cleared all warnings (${warningCount}) from ${targetUser.toString()}.\nReason: ${reason}`);
            
            // Log the action
            const ConfigLoader = require('../../utils/configLoader');
            const config = ConfigLoader.loadConfig('moderacja');
            
            if (config.kanaly && config.kanaly.logi_moderacji) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_moderacji);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} usunął wszystkie ostrzeżenia (${warningCount}) dla użytkownika ${targetUser.toString()}.\nPowód: ${reason}`);
                }
            }
            
            // Try to notify the user
            try {
                await targetUser.send(`All your warnings in ${interaction.guild.name} have been cleared.\nReason: ${reason}`);
            } catch (err) {
                console.log('Could not send DM to the user');
            }
            
        } catch (error) {
            console.error('Error clearing warnings:', error);
            await interaction.reply({
                content: 'An error occurred while trying to clear warnings.',
                ephemeral: true
            });
        }
    }
};
