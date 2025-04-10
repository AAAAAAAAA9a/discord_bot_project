const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const warningsDB = require('../../utils/warningsSQLiteDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delwarn')
        .setDescription('Remove a specific warning from a user')
        .addStringOption(option => 
            option.setName('warning_id')
                .setDescription('The ID of the warning to remove')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for removing the warning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const warningId = interaction.options.getString('warning_id');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            // Find the warning directly by ID
            const warning = await warningsDB.findWarning(warningId);
            
            if (!warning) {
                await interaction.reply({
                    content: `Warning with ID \`${warningId}\` not found.`,
                    ephemeral: true
                });
                return;
            }
            
            const targetUserId = warning.user_id;
            
            // Remove the warning
            const success = await warningsDB.removeWarning(interaction.guild.id, targetUserId, warningId);
            
            if (!success) {
                await interaction.reply({
                    content: 'Failed to remove the warning. Please try again later.',
                    ephemeral: true
                });
                return;
            }
            
            // Get the target user for the response
            let targetUserMention = `User ID: ${targetUserId}`;
            try {
                const targetUser = await interaction.client.users.fetch(targetUserId);
                targetUserMention = targetUser.toString();
            } catch {
                // Could not fetch user, use ID instead
            }
            
            await interaction.reply(`Warning with ID \`${warningId}\` has been removed from ${targetUserMention}.\nReason: ${reason}`);
            
            // Log the action if there's a log channel
            const ConfigLoader = require('../../utils/configLoader');
            const config = ConfigLoader.loadConfig('moderacja');
            
            if (config.kanaly && config.kanaly.logi_moderacji) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_moderacji);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} usunął ostrzeżenie z ID \`${warningId}\` dla użytkownika ${targetUserMention}.\nPowód: ${reason}`);
                }
            }
            
        } catch (error) {
            console.error('Error removing warning:', error);
            await interaction.reply({
                content: 'An error occurred while trying to remove the warning.',
                ephemeral: true
            });
        }
    }
};
