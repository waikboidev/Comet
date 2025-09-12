import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { glob } from 'glob';
import path from 'path';
import { logger } from '../utils/logger';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);

async function registerCommands() {
  const commandFiles = await glob(path.join(__dirname, './commands/**/*.{ts,js}').replace(/\\/g, '/'));
  const commands = [];

  for (const file of commandFiles) {
    const command = await import(file);
    commands.push(command.default.data.toJSON());
  }

  try {
    logger.info('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.BOT_ID!, process.env.GUILD_ID!),
      { body: commands },
    );

    logger.success('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error('Failed to reload application (/) commands.', error);
  }
}

registerCommands();
