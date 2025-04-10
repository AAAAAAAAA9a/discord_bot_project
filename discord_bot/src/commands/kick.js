const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../../utils/configLoader');

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
            const kickMessage = config.wiadomosci.kick
                .replace('{user}', targetUser.toString())
                .replace('{reason}', reason);
                
            await interaction.reply(kickMessage);
            
            // Log the action
            if (config.kanaly.logi_moderacji) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_moderacji);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} wyrzucił użytkownika ${targetUser.toString()}. Powód: ${reason}`);
                }
            }
        } catch (error) {
            console.error('Error kicking user:', error);
            await interaction.reply({
                content: 'An error occurred while trying to kick the user.',
                ephemeral: true
            });
        }
    }
}
