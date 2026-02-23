//import {  } from 'nodejs-whisper';
import { ActivityType, Client, Collection, Events, GatewayIntentBits} from 'discord.js';
import type { CommandInteraction, User } from "discord.js";
import { BotCommandError, ErrorManager } from './error.ts';

const botStat = {
    'mode': 0b0000,
}

class VoiceData {
    speaker: User;
    text: string;
    constructor(speaker: User, text: string) {
        this.speaker = speaker;
        this.text = text;
    }
}

const streams = {
    'voice': [],
    'message': [],
    'server': []
}


const client = new Client(
    {intents: 
        [ 
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildWebhooks
        ]
    }
);

class Board {
    #targetMessage;
    #type
    constructor(type) {
        this.#type = type;
    }
    display() {

    }
    dispose() {

    }
    $streamData() {

    }
}

function getCommandExcuterFunc(commandName: string) {
    switch(commandName) {
        case 'monitor':
            return function() {

            };
        case 'connect':
            return function() {

            }
    }
}

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const commandName = interaction.commandName;
    
    const strValue = interaction.options.getString('オプション名');
    const intValue = interaction.options.getInteger('オプション名');
    const userObj = interaction.options.getUser('ユーザーオプション名');

    try {
        getCommandExcuterFunc(commandName)
    } catch(e) {
        if(e.identifier in BotCommandError.PublicErrorMessages) {
            ErrorManager.sendErrorMessage(e);
        } else {
            ErrorManager.saveErrorMessage(e);
        }
    }
    return;
  }
})