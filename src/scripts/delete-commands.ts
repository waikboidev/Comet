import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { logger } from '../utils/logger';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);

async function deleteCommands() {
    try {
        logger.info('Started deleting all application commands.');
        const commands = await rest.get(Routes.applicationGuildCommands(process.env.BOT_ID!, process.env.GUILD_ID!)) as any[];

        for (const command of commands) {
            await rest.delete(Routes.applicationGuildCommand(process.env.BOT_ID!, process.env.GUILD_ID!, command.id));
            logger.info(`Deleted command: ${command.name}`);
        }

        logger.success('Successfully deleted all application commands.');
    } catch (error) {
        logger.error('Failed to delete all application commands.', error);
    }
}

deleteCommands();
