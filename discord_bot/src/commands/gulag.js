const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../../utils/configLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gulag')
        .setDescription('Send a user to the gulag')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to send to the gulag')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for sending to gulag')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Duration of the punishment (e.g., 1h, 1d)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const duration = interaction.options.getString('duration') || 'Indefinite';
        const config = ConfigLoader.loadConfig('gulag');
        
        // Store the user's original roles to restore them later
        const userRoles = targetMember.roles.cache.filter(role => role.id !== interaction.guild.id).map(role => role.id);
        
        try {
            // Remove all roles from the user except @everyone
            for (const role of targetMember.roles.cache.values()) {
                if (role.id !== interaction.guild.id) { // Skip @everyone role
                    await targetMember.roles.remove(role);
                }
            }
            
            // Add the prisoner role
            if (config.role.wiezien) {
                await targetMember.roles.add(config.role.wiezien);
            }
            
            // Store the user's roles and punishment info in a database or config file
            // This would typically involve a database, but for simplicity we're just logging it
            console.log(`User ${targetUser.tag} sent to gulag. Original roles: ${userRoles.join(', ')}`);
            
            // Send notification messages
            const gulagMessage = config.wiadomosci.uwieziony
                .replace('{user}', targetUser.toString())
                .replace('{reason}', reason)
                .replace('{duration}', duration);
                
            await interaction.reply(gulagMessage);
            
            // Send a message to the gulag channel if configured
            if (config.kanaly.gulag) {
                const gulagChannel = interaction.guild.channels.cache.get(config.kanaly.gulag);
                if (gulagChannel) {
                    const welcomeMessage = config.wiadomosci.wiadomosc_powitalna
                        .replace('{user}', targetUser.toString())
                        .replace('{duration}', duration);
                    await gulagChannel.send(welcomeMessage);
                }
            }
            
            // Log the action
            if (config.kanaly.logi_gulag) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_gulag);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} wysłał ${targetUser.toString()} do gulagu.\nPowód: ${reason}\nCzas: ${duration}`);
                }
            }
        } catch (error) {
            console.error('Error sending user to gulag:', error);
            await interaction.reply({
                content: 'An error occurred while trying to send the user to the gulag.',
                ephemeral: true
            });
        }
    }
}
