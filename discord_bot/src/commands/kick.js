const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');
const ModerationUtils = require('../utils/moderationUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for kicking')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const config = ConfigLoader.loadConfig('moderacja');
        
        try {
            // Check if the bot can kick the user
            if (!targetMember.kickable) {
                await interaction.reply({
                    content: 'I cannot kick this user. They may have higher permissions than me.',
                    ephemeral: true
                });
                return;
            }
            
            // Kick the user
            await targetMember.kick(reason);
            
            // Send confirmation message
            const kickMessage = ModerationUtils.formatMessage(config.wiadomosci.kick, {
                user: targetUser.toString(),
                reason: reason
            });
                
            await interaction.reply(kickMessage);
            
            // Log the action using utility
            await ModerationUtils.logAction(interaction, 'wyrzucił', targetUser, { reason });
        } catch (error) {
            await ModerationUtils.handleError(error, interaction, 'kick the user');
        }
    }
}
