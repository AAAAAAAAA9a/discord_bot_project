const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const configHandler = require('../handlers/configHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure bot settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand => 
            subcommand
                .setName('reaction-roles')
                .setDescription('Configure reaction roles system'))
        .addSubcommand(subcommand => 
            subcommand
                .setName('verification')
                .setDescription('Configure verification system'))
        .addSubcommand(subcommand => 
            subcommand
                .setName('moderation')
                .setDescription('Configure moderation settings'))
        .addSubcommand(subcommand => 
            subcommand
                .setName('gulag')
                .setDescription('Configure gulag system')),
        
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        await configHandler.handleConfigCommand(interaction, subcommand);
    }
};
