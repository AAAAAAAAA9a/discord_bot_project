require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize collections for commands and events
client.commands = new Collection();
client.events = new Collection();

// Load commands from main commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Load commands from config-ui/commands directory
const configUiCommandsPath = path.join(__dirname, 'config-ui/commands');
if (fs.existsSync(configUiCommandsPath)) {
    const configUiCommandFiles = fs.readdirSync(configUiCommandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of configUiCommandFiles) {
        const filePath = path.join(configUiCommandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`[INFO] Loaded config UI command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The config UI command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Import database for proper shutdown handling
const warningsDB = require('./utils/warningsSQLiteDB');

// Add proper shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('exit', () => gracefulShutdown('exit'));

function gracefulShutdown(signal) {
    console.log(`Received ${signal}. Closing database connections and shutting down...`);
    
    // Close the database connection properly
    if (warningsDB && typeof warningsDB.close === 'function') {
        warningsDB.close();
    }
    
    // Exit with success code
    if (signal !== 'exit') {
        process.exit(0);
    }
}

// Login to Discord
client.login(process.env.TOKEN);
