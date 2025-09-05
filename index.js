require('events').defaultMaxListeners = 50;
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageTyping] });

// ---- SET LAUNCH TIME HERE ----
client.launchTime = new Date();
// ------------------------------

// ---- INITIALIZE CONFIG OBJECT ----
client.config = {};
// ----------------------------------

// Console Logging Setup
// This will log to the console and also log to discord via a command
client.consoleMessages = [];

const getSydneyTime = () => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
}).format(new Date());

console.log = (message) => {
    const time = getSydneyTime();
    client.consoleMessages.push(`[${time}] [LOG] ${message}`);
    process.stdout.write(`[${time}] [LOG] ${message}\n`);
};

console.error = (...args) => {
    const time = getSydneyTime();
    const messageParts = args.map(arg => {
        if (arg instanceof Error) {
            return arg.stack; // Use the full stack for Error objects
        }
        if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg, null, 2); // Pretty-print other objects
        }
        return arg;
    });
    const fullMessage = messageParts.join(' ');
    client.consoleMessages.push(`[${time}] [ERROR] ${fullMessage}`);
    process.stderr.write(`[${time}] [ERROR] ${fullMessage}\n`);
};

console.warn = (message) => {
    const time = getSydneyTime();
    client.consoleMessages.push(`[${time}] [WARNING] ${message}`);
    process.stderr.write(`[${time}] [WARNING] ${message}\n`);
};

console.info = (message) => {
    const time = getSydneyTime();
    client.consoleMessages.push(`[${time}] [INFO] ${message}`);
    process.stderr.write(`[${time}] [INFO] ${message}\n`);
};
// Console Logging Setup End

client.commands = new Collection();
client.commandsDisabled = false; // Initialize commandsDisabled flag
client.commandsDisabledNote = null; // Initialize commandsDisabledNote
client.commandsDisabledReason = 'Command Hibernation'; // Initialize commandsDisabledReason
client.modApplications = new Map(); // To track users in the mod application process

const commandsPath = path.join(__dirname, 'commands');
const commandSources = fs.readdirSync(commandsPath);

for (const source of commandSources) {
    const sourcePath = path.join(commandsPath, source);
    const stat = fs.statSync(sourcePath);

    let commandFiles = [];

    if (stat.isDirectory()) {
        // If it's a directory, read the .js files inside it
        commandFiles = fs.readdirSync(sourcePath)
            .filter(file => file.endsWith('.js'))
            .map(file => path.join(sourcePath, file));
    } else if (stat.isFile() && source.endsWith('.js')) {
        // If it's a .js file itself, add its path to the list
        commandFiles.push(sourcePath);
    }

    for (const filePath of commandFiles) {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventSources = fs.readdirSync(eventsPath); // Gets both files and folders

for (const source of eventSources) {
    const sourcePath = path.join(eventsPath, source);
    const stat = fs.statSync(sourcePath);

    let eventFiles = [];

    // Check if the source is a subfolder
    if (stat.isDirectory()) {
        // Read all .js files from the subfolder
        const filesInFolder = fs.readdirSync(sourcePath).filter(file => file.endsWith('.js'));
        for (const file of filesInFolder) {
            eventFiles.push(path.join(sourcePath, file)); // Add full path
        }
    } 
    // Check if the source is a plain .js file in the root events folder
    else if (stat.isFile() && source.endsWith('.js')) {
        eventFiles.push(sourcePath); // Add full path
    }

    // Process all found event files (whether from a folder or as a standalone file)
    for (const filePath of eventFiles) {
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

client.login(process.env.TOKEN);
