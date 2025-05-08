require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

// Load commands from the main commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Load commands from the config-ui/commands directory
const configUiCommandsPath = path.join(__dirname, 'config-ui/commands');
if (fs.existsSync(configUiCommandsPath)) {
    const configUiCommandFiles = fs.readdirSync(configUiCommandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of configUiCommandFiles) {
        const filePath = path.join(configUiCommandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`[INFO] Loaded config UI command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The config UI command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            process.env.GUILD_ID
                ? Routes.applicationGuildCommands(process.env.APPLICATION_ID, process.env.GUILD_ID)
                : Routes.applicationCommands(process.env.APPLICATION_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
