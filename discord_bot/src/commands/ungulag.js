const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');
const GulagUtils = require('../utils/gulagUtils');

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
            // Sprawdź, czy użytkownik jest w gulagu
            if (!GulagUtils.isInGulag(interaction.guild.id, targetUser.id) && 
                (config.role.wiezien && !targetMember.roles.cache.has(config.role.wiezien))) {
                await interaction.reply({
                    content: 'Ten użytkownik nie jest w gulagu.',
                    ephemeral: true
                });
                return;
            }
            
            // Usuń rolę więźnia
            if (config.role.wiezien) {
                await targetMember.roles.remove(config.role.wiezien);
            }
            
            // Pobierz dane o użytkowniku z gulagu i usuń go z listy
            const userData = GulagUtils.removeFromGulag(interaction.guild.id, targetUser.id);
            
            // Przywróć oryginalne role użytkownika, jeśli są dostępne
            if (userData && userData.originalRoles && userData.originalRoles.length > 0) {
                for (const roleId of userData.originalRoles) {
                    try {
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (role) {
                            await targetMember.roles.add(role);
                        }
                    } catch (e) {
                        console.error(`Nie można przywrócić roli ${roleId}:`, e);
                    }
                }
                console.log(`Przywrócono ${userData.originalRoles.length} ról użytkownikowi ${targetUser.tag}`);
            } else {
                // Jeśli nie ma oryginalnych ról, dodaj podstawowe role
                const verificationConfig = ConfigLoader.loadConfig('weryfikacja');
                if (verificationConfig.rola_zweryfikowany) {
                    await targetMember.roles.add(verificationConfig.rola_zweryfikowany);
                }
            }
            
            // Wyślij potwierdzenie
            const releaseMessage = config.wiadomosci.uwolniony
                .replace('{user}', targetUser.toString());
                
            await interaction.reply(releaseMessage);
            
            // Wyślij informację na kanał logów
            if (config.kanaly.logi_gulag) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_gulag);
                if (logChannel) {
                    await logChannel.send(`${interaction.user.toString()} uwolnił ${targetUser.toString()} z gulagu (ręczne zwolnienie).`);
                }
            }
            
            // Wyślij DM do użytkownika
            try {
                await targetUser.send(`Zostałeś wypuszczony z gulagu na serwerze ${interaction.guild.name} przez ${interaction.user.tag}.`);
            } catch (error) {
                // Ignoruj błędy DM
            }
        } catch (error) {
            console.error('Error releasing user from gulag:', error);
            await interaction.reply({
                content: 'Wystąpił błąd podczas próby uwolnienia użytkownika z gulagu.',
                ephemeral: true
            });
        }
    }
}
