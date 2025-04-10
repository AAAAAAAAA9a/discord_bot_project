const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ungulag')
        .setDescription('Release a user from the gulag')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to release from the gulag')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        const config = ConfigLoader.loadConfig('gulag');
        
        try {
            // Check if the user has the prisoner role
            if (config.role.wiezien && !targetMember.roles.cache.has(config.role.wiezien)) {
                await interaction.reply({
                    content: 'This user is not in the gulag.',
                    ephemeral: true
                });
                return;
            }
            
            // Remove the prisoner role
            if (config.role.wiezien) {
                await targetMember.roles.remove(config.role.wiezien);
            }
            
            // Here we would restore the user's original roles from a database
            // For now, we'll just give them back the default member role
            const verificationConfig = ConfigLoader.loadConfig('weryfikacja');
            if (verificationConfig.role.czlonek) {
                await targetMember.roles.add(verificationConfig.role.czlonek);
            }
            if (verificationConfig.role.zweryfikowany) {
                await targetMember.roles.add(verificationConfig.role.zweryfikowany);
            }
            
            // Send notification messages
            const releaseMessage = config.wiadomosci.uwolniony
                .replace('{user}', targetUser.toString());
                
            await interaction.reply(releaseMessage);
            
            // Log the action
            if (config.kanaly.logi_gulag) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_gulag);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} uwolnił ${targetUser.toString()} z gulagu.`);
                }
            }
        } catch (error) {
            console.error('Error releasing user from gulag:', error);
            await interaction.reply({
                content: 'An error occurred while trying to release the user from the gulag.',
                ephemeral: true
            });
        }
    }
}
