const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');
const ModerationUtils = require('../utils/moderationUtils');
const GulagUtils = require('../utils/gulagUtils');

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
        const durationStr = interaction.options.getString('duration') || '1h';
        const config = ConfigLoader.loadConfig('gulag');
        
        // Pobierz domyślny czas trwania kary z konfiguracji
        const defaultDuration = config.czas?.domyslny_czas || 3600;
        
        // Parsuj czas trwania kary
        const durationSeconds = GulagUtils.parseDuration(durationStr, defaultDuration);
        
        // Sprawdź limity czasu trwania kary
        const minDuration = config.czas?.min_czas || 300; // 5 minut
        const maxDuration = config.czas?.max_czas || 2592000; // 30 dni
        
        let actualDuration = durationSeconds;
        if (durationSeconds < minDuration) {
            actualDuration = minDuration;
        } else if (durationSeconds > maxDuration) {
            actualDuration = maxDuration;
        }
        
        // Zapisz oryginalne role użytkownika
        const userRoles = targetMember.roles.cache.filter(role => role.id !== interaction.guild.id).map(role => role.id);
        
        try {
            // Usuń wszystkie role użytkownika
            for (const role of targetMember.roles.cache.values()) {
                if (role.id !== interaction.guild.id) {
                    await targetMember.roles.remove(role);
                }
            }
            
            // Dodaj rolę więźnia
            if (config.role.wiezien) {
                await targetMember.roles.add(config.role.wiezien);
            }
            
            // Zapisz informacje o użytkowniku w gulagu
            const endTime = GulagUtils.addToGulag(
                interaction.guild.id, 
                targetUser.id, 
                userRoles, 
                actualDuration, 
                reason
            );
            
            const endTimeFormatted = new Date(endTime).toLocaleString('pl-PL');
            const durationFormatted = GulagUtils.formatDuration(actualDuration);
            
            console.log(`User ${targetUser.tag} sent to gulag for ${durationFormatted}. Original roles: ${userRoles.join(', ')}`);
            
            // Wyślij potwierdzenie
            const gulagMessage = ModerationUtils.formatMessage(config.wiadomosci.uwieziony, {
                user: targetUser.toString(),
                reason: reason,
                duration: durationFormatted
            });
                
            await interaction.reply(gulagMessage);
            
            // Wyślij wiadomość powitalną na kanale gulagu
            if (config.kanaly.gulag) {
                const gulagChannel = interaction.guild.channels.cache.get(config.kanaly.gulag);
                if (gulagChannel) {
                    const welcomeMessage = ModerationUtils.formatMessage(config.wiadomosci.wiadomosc_powitalna, {
                        user: targetUser.toString(),
                        duration: durationFormatted
                    });
                    await gulagChannel.send(welcomeMessage);
                }
            }
            
            // Wyślij informację na kanał logów
            if (config.kanaly.logi_gulag) {
                const logChannel = interaction.guild.channels.cache.get(config.kanaly.logi_gulag);
                if (logChannel) {
                    await logChannel.send(
                        `${interaction.user.toString()} wysłał ${targetUser.toString()} do gulagu.\n` +
                        `Powód: ${reason}\n` +
                        `Czas: ${durationFormatted}\n` +
                        `Wypuszczenie: ${endTimeFormatted}`
                    );
                }
            }
            
            // Wyślij DM do użytkownika
            try {
                await targetUser.send(
                    `Zostałeś wysłany do gulagu na serwerze ${interaction.guild.name}.\n` +
                    `Powód: ${reason}\n` +
                    `Czas trwania: ${durationFormatted}\n` +
                    `Zostaniesz automatycznie wypuszczony o: ${endTimeFormatted}`
                );
            } catch (error) {
                // Ignoruj błędy DM - użytkownik mógł wyłączyć DM
            }
        } catch (error) {
            await ModerationUtils.handleError(error, interaction, 'send the user to the gulag');
        }
    }
}
