import dotenv from 'dotenv'
import fs from 'fs';
import { Commands as CommandDefine } from './defineCommands.js';
import { REST, Routes } from 'discord.js';

dotenv.config();

const Commands = CommandDefine.map(command=>command.toJSON());
fs.writeFileSync('./commands-output.json',JSON.stringify(Commands, null, 2));

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: Commands });
    
    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}