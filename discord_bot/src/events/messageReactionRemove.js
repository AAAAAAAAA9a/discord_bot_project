const { Events } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');

module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        // Don't respond to bot reactions
        if (user.bot) return;
        
        // Handle partial reactions and messages
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }
        
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Error fetching message:', error);
                return;
            }
        }
        
        // Get the config
        const config = ConfigLoader.loadConfig('reakcje_role');
        
        // Find role by emoji
        const roleConfig = config.role_reakcje.find(role => role.emoji === reaction.emoji.name);
        
        // If we found a matching role configuration
        if (roleConfig) {
            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            
            try {
                await member.roles.remove(roleConfig.rola_id);
                
                // Try to send a DM to the user
                try {
                    const roleRemovedMessage = config.wiadomosci.rola_usunieta.replace('{role}', roleConfig.nazwa);
                    await user.send(roleRemovedMessage);
                } catch (error) {
                    console.log('Could not send DM to user');
                }
            } catch (error) {
                console.error('Error removing role:', error);
            }
        }
    }
};
