const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../../utils/configLoader');
const warningsDB = require('../../utils/warningsSQLiteDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for the warning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const config = ConfigLoader.loadConfig('moderacja');
        
        try {
            // Store the warning in the database
            const warning = await warningsDB.addWarning(
                interaction.guild.id,
                targetUser.id,
                interaction.user.id,
                reason
            );
            
            // Get the total number of warnings
            const warningCount = await warningsDB.getWarningCount(interaction.guild.id, targetUser.id);
            
            // Send warning message to the user
            try {
                await targetUser.send(`You have been warned in ${interaction.guild.name}. Reason: ${reason}\nThis is warning #${warningCount} on your record.`);
            } catch (err) {
                console.log('Could not send DM to the user');
            }
            
            // Send confirmation message
            const warnMessage = config.wiadomosci.warn
                .replace('{user}', targetUser.toString())
                .replace('{reason}', reason)
                .replace('{count}', warningCount.toString());
                
            await interaction.reply(`${warnMessage}\nWarning ID: \`${warning.id}\` (Total warnings: ${warningCount})`);
            
            // Log the action
            if (config.kanaly.logi_moderacji) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_moderacji);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} ostrzegł użytkownika ${targetUser.toString()}. Powód: ${reason}\nWarning ID: ${warning.id} (Total: ${warningCount})`);
                }
            }
        } catch (error) {
            console.error('Error warning user:', error);
            await interaction.reply({
                content: 'An error occurred while trying to warn the user.',
                ephemeral: true
            });
        }
    }
}
