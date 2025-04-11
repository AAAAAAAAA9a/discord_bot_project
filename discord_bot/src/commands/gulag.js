const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');
const ModerationUtils = require('../utils/moderationUtils');

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
        
        const userRoles = targetMember.roles.cache.filter(role => role.id !== interaction.guild.id).map(role => role.id);
        
        try {
            for (const role of targetMember.roles.cache.values()) {
                if (role.id !== interaction.guild.id) {
                    await targetMember.roles.remove(role);
                }
            }
            
            if (config.role.wiezien) {
                await targetMember.roles.add(config.role.wiezien);
            }
            
            console.log(`User ${targetUser.tag} sent to gulag. Original roles: ${userRoles.join(', ')}`);
            
            const gulagMessage = ModerationUtils.formatMessage(config.wiadomosci.uwieziony, {
                user: targetUser.toString(),
                reason: reason,
                duration: duration
            });
                
            await interaction.reply(gulagMessage);
            
            if (config.kanaly.gulag) {
                const gulagChannel = interaction.guild.channels.cache.get(config.kanaly.gulag);
                if (gulagChannel) {
                    const welcomeMessage = ModerationUtils.formatMessage(config.wiadomosci.wiadomosc_powitalna, {
                        user: targetUser.toString(),
                        duration: duration
                    });
                    await gulagChannel.send(welcomeMessage);
                }
            }
            
            if (config.kanaly.logi_gulag) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_gulag);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} wysłał ${targetUser.toString()} do gulagu.\nPowód: ${reason}\nCzas: ${duration}`);
                }
            }
        } catch (error) {
            await ModerationUtils.handleError(error, interaction, 'send the user to the gulag');
        }
    }
}
