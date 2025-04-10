const { Events } = require('discord.js');
const ConfigLoader = require('./configLoader');

/**
 * Utility functions for handling reaction-based role assignments
 */
class ReactionUtils {
    /**
     * Handle partial reactions and messages by fetching complete data
     * @param {MessageReaction} reaction - The reaction to process
     * @returns {Promise<boolean>} - True if fetching was successful, false otherwise
     */
    static async fetchPartials(reaction) {
        // Handle partial reactions
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return false;
            }
        }
        
        // Handle partial messages
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Error fetching message:', error);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Process a role reaction (add or remove)
     * @param {MessageReaction} reaction - The reaction object
     * @param {User} user - The user who reacted
     * @param {boolean} isAdding - Whether we're adding (true) or removing (false) the role
     */
    static async processRoleReaction(reaction, user, isAdding) {
        // Don't respond to bot reactions
        if (user.bot) return;
        
        // Fetch partials if needed
        if (!await this.fetchPartials(reaction)) return;
        
        // Get the config
        const config = ConfigLoader.loadConfig('reakcje_role');
        
        // Find role by emoji
        const roleConfig = config.role_reakcje.find(role => role.emoji === reaction.emoji.name);
        
        // If we found a matching role configuration
        if (roleConfig) {
            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            
            try {
                // Add or remove role based on isAdding flag
                if (isAdding) {
                    await member.roles.add(roleConfig.rola_id);
                    this.sendRoleNotification(user, config.wiadomosci.rola_dodana, roleConfig.nazwa);
                } else {
                    await member.roles.remove(roleConfig.rola_id);
                    this.sendRoleNotification(user, config.wiadomosci.rola_usunieta, roleConfig.nazwa);
                }
            } catch (error) {
                console.error(`Error ${isAdding ? 'adding' : 'removing'} role:`, error);
            }
        }
    }
    
    /**
     * Send a DM notification about role changes
     * @param {User} user - The user to notify
     * @param {string} messageTemplate - Message template from config
     * @param {string} roleName - Name of the role
     */
    static async sendRoleNotification(user, messageTemplate, roleName) {
        try {
            const message = messageTemplate.replace('{role}', roleName);
            await user.send(message);
        } catch (error) {
            console.log('Could not send DM to user');
        }
    }
}

module.exports = ReactionUtils;
