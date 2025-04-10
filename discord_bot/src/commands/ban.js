const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../../utils/configLoader');
const ModerationUtils = require('../../utils/moderationUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for banning')
                .setRequired(false))
        .addIntegerOption(option => 
            option.setName('delete_days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(7))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        const config = ConfigLoader.loadConfig('moderacja');
        
        try {
            // Ban the user
            await interaction.guild.members.ban(targetUser, {
                deleteMessageDays: deleteDays,
                reason: reason
            });
            
            // Send confirmation message
            const banMessage = ModerationUtils.formatMessage(config.wiadomosci.ban, {
                user: targetUser.toString(),
                reason: reason
            });
                
            await interaction.reply(banMessage);
            
            // Log the action
            await ModerationUtils.logAction(interaction, 'zbanował', targetUser, { reason });
        } catch (error) {
            await ModerationUtils.handleError(error, interaction, 'ban the user');
        }
    }
}
