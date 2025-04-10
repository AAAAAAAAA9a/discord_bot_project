const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to verify')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        const config = ConfigLoader.loadConfig('weryfikacja');
        
        try {
            // Remove unverified role
            if (config.role.niezweryfikowany) {
                await targetMember.roles.remove(config.role.niezweryfikowany);
            }
            
            // Add verified role
            if (config.role.zweryfikowany) {
                await targetMember.roles.add(config.role.zweryfikowany);
            }
            
            // Add member role
            if (config.role.czlonek) {
                await targetMember.roles.add(config.role.czlonek);
            }
            
            // Send success message
            await interaction.reply({
                content: config.wiadomosci.sukces.replace('{user}', targetUser.toString()),
                ephemeral: true
            });
            
            // Log the verification if the log channel is configured
            if (config.kanaly.logi_weryfikacji) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_weryfikacji);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} zweryfikował użytkownika ${targetUser.toString()}`);
                }
            }
        } catch (error) {
            console.error('Error during verification:', error);
            await interaction.reply({
                content: config.wiadomosci.blad,
                ephemeral: true
            });
        }
    }
}
