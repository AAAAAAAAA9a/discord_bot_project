const { PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('./configLoader');

/**
 * Utility functions for moderation commands
 */
class ModerationUtils {
    /**
     * Log a moderation action to the configured log channel
     * @param {Interaction} interaction - Discord interaction object
     * @param {string} actionKey - Key for the action message in config
     * @param {User} targetUser - User who is the target of the action
     * @param {Object} options - Additional options
     * @param {string} [options.reason] - Reason for the action
     * @param {string} [options.duration] - Duration for time-based actions
     * @param {number} [options.count] - Count for numeric actions
     * @param {string} [options.additionalInfo] - Any additional info to add to the log
     */
    static async logAction(interaction, actionKey, targetUser, options = {}) {
        const config = ConfigLoader.loadConfig('moderacja');
        
        if (config.kanaly?.logi_moderacji) {
            const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_moderacji);
            if (logChannel) {
                let logMessage = `${interaction.user.toString()} ${actionKey} użytkownika ${targetUser.toString()}`;
                
                if (options.reason) {
                    logMessage += `. Powód: ${options.reason}`;
                }
                
                if (options.additionalInfo) {
                    logMessage += `\n${options.additionalInfo}`;
                }
                
                await logChannel.send(logMessage);
            }
        }
    }
    
    /**
     * Format a moderation message from the config template
     * @param {string} template - Message template with placeholders
     * @param {Object} replacements - Values to replace placeholders
     * @returns {string} - Formatted message
     */
    static formatMessage(template, replacements) {
        let message = template;
        
        for (const [key, value] of Object.entries(replacements)) {
            message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        
        return message;
    }
    
    /**
     * Handle errors in moderation commands with consistent messaging
     * @param {Error} error - The error that occurred
     * @param {Interaction} interaction - Discord interaction object
     * @param {string} actionName - Name of the action that failed
     */
    static async handleError(error, interaction, actionName) {
        console.error(`Error ${actionName}:`, error);
        
        const errorMessage = interaction.replied 
            ? { content: `An error occurred while trying to ${actionName}.`, ephemeral: true }
            : { content: `An error occurred while trying to ${actionName}.`, ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
    
    /**
     * Send a direct message to a user with error handling
     * @param {User} user - User to send the message to
     * @param {string} content - Message content
     * @param {boolean} [logErrors=true] - Whether to log errors
     * @returns {boolean} - Whether the message was sent successfully
     */
    static async sendDM(user, content, logErrors = true) {
        try {
            await user.send(content);
            return true;
        } catch (error) {
            if (logErrors) {
                console.log(`Could not send DM to user ${user.tag}`);
            }
            return false;
        }
    }
}

module.exports = ModerationUtils;
