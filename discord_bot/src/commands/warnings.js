const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const warningsDB = require('../../utils/warningsSQLiteDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to check warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        try {
            // Get all warnings for the user
            const warnings = await warningsDB.getWarnings(interaction.guild.id, targetUser.id);
            
            if (!warnings || warnings.length === 0) {
                await interaction.reply(`${targetUser.toString()} has no warnings.`);
                return;
            }
            
            // Create an embed to display the warnings
            const embed = new EmbedBuilder()
                .setTitle(`Warnings for ${targetUser.tag}`)
                .setColor('#FF9900')
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ text: `Total warnings: ${warnings.length}` })
                .setTimestamp();
            
            // Add fields for each warning (limit to 25 due to embed field limit)
            const displayWarnings = warnings.slice(0, 25);
            
            for (const warning of displayWarnings) {
                let moderatorInfo = "Unknown Moderator";
                
                try {
                    const moderator = await interaction.client.users.fetch(warning.moderator_id);
                    moderatorInfo = moderator.tag;
                } catch {
                    // Moderator couldn't be fetched, use default
                }
                
                const date = new Date(warning.timestamp);
                const dateString = date.toLocaleString();
                
                embed.addFields({
                    name: `Warning ID: ${warning.id}`,
                    value: `**Reason:** ${warning.reason}\n**Moderator:** ${moderatorInfo}\n**Date:** ${dateString}`
                });
            }
            
            if (warnings.length > 25) {
                embed.addFields({
                    name: `And ${warnings.length - 25} more warnings...`,
                    value: 'Use the ID of a specific warning with `/delwarn` to remove it.'
                });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error checking warnings:', error);
            await interaction.reply({
                content: 'An error occurred while trying to check warnings.',
                ephemeral: true
            });
        }
    }
};
