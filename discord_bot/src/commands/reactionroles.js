const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ConfigLoader = require('../../utils/configLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionroles')
        .setDescription('Create a reaction roles message')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send the reaction roles message to')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const config = ConfigLoader.loadConfig('reakcje_role');
        
        try {
            if (!channel.isTextBased()) {
                await interaction.reply({ content: 'The selected channel must be a text channel.', ephemeral: true });
                return;
            }
            
            // Create an embed for the reaction roles
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Role Selection')
                .setDescription(config.wiadomosci.wybierz_role);
                
            // Add fields for each role
            config.role_reakcje.forEach(role => {
                embed.addFields({ name: `${role.emoji} ${role.nazwa}`, value: `React with ${role.emoji} to get this role.`, inline: true });
            });
            
            // Send the message and add reactions
            const message = await channel.send({ embeds: [embed] });
            
            // Add reactions to the message
            for (const role of config.role_reakcje) {
                await message.react(role.emoji);
            }
            
            await interaction.reply({ content: 'Reaction roles message created successfully!', ephemeral: true });
        } catch (error) {
            console.error('Error creating reaction roles:', error);
            await interaction.reply({
                content: 'An error occurred while setting up reaction roles.',
                ephemeral: true
            });
        }
    }
}
