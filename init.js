import dotenv from 'dotenv'
import fs from 'fs';
import { registerCommandsList } from './defineCommands.js';
import { REST, Routes } from 'discord.js';

dotenv.config();

fs.writeFileSync('./commands-output.json',JSON.stringify(registerCommandsList, null, 2));

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: registerCommandsList });
    
    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}