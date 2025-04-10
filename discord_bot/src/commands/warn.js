const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../../utils/configLoader');
const warningsDB = require('../../utils/warningsSQLiteDB');
const ModerationUtils = require('../../utils/moderationUtils');

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
            await ModerationUtils.sendDM(
                targetUser, 
                `You have been warned in ${interaction.guild.name}. Reason: ${reason}\nThis is warning #${warningCount} on your record.`
            );
            
            // Send confirmation message
            const warnMessage = ModerationUtils.formatMessage(config.wiadomosci.warn, {
                user: targetUser.toString(),
                reason: reason,
                count: warningCount.toString()
            });
                
            await interaction.reply(`${warnMessage}\nWarning ID: \`${warning.id}\` (Total warnings: ${warningCount})`);
            
            // Log the action
            await ModerationUtils.logAction(interaction, 'ostrzegł', targetUser, {
                reason: reason,
                additionalInfo: `Warning ID: ${warning.id} (Total: ${warningCount})`
            });
        } catch (error) {
            await ModerationUtils.handleError(error, interaction, 'warn the user');
        }
    }
}
