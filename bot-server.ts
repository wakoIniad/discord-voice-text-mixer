//import {  } from 'nodejs-whisper';

import * as Discord from 'discord.js';
import { ErrorManager } from './error.ts';
import { Commands as CommandDefine } from './defineCommands.js';

const useCommands = ( CommandDefine as Discord.SlashCommandBuilder[])
    .reduce((result: {[key: string]: Command}, cmd) => {
    const options: string[] = cmd.options.map((opt:Discord.ToAPIApplicationCommandOptions)=>'name' in opt ? opt.name: '').filter(f=>f) as string[];
    
    result[cmd.name] = new Command(cmd.name, options, ()=>true);
    return result;
}, {});

class Command {
    constructor(
        public name: string, 
        public option_names: string[],
        public handle: (...any:[]) => boolean
    ) {}
}

const botStat = {
    'mode': 0b0000,
}

class VoiceData {
    speaker: Discord.User;
    text: string;
    constructor(speaker: Discord.User, text: string) {
        this.speaker = speaker;
        this.text = text;
    }
}

const streams = {
    'voice': [],
    'message': [],
    'server': []
}


const client = new Discord.Client(
    {intents: 
        [ 
            Discord.GatewayIntentBits.Guilds,
            Discord.GatewayIntentBits.GuildMembers,
            Discord.GatewayIntentBits.GuildMessages,
            Discord.GatewayIntentBits.MessageContent,
            Discord.GatewayIntentBits.GuildVoiceStates,
            Discord.GatewayIntentBits.GuildWebhooks
        ]
    }
);

class Board {
    #targetMessage;
    #type
    constructor(type) {
        this.#type = type;
    }
    createBoard(targetChannel: Discord.Channel) {

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

function sendMessage(to: Discord.Channel) {

}

class BotMessageFormat {
    static ERROR_TYPES = {
        default: Symbol('default')
    }
    static Error(baseIdentifier: Symbol, e: Error) {

    }
}

const commandList = [
    new Command() {
        
    }
]

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const commandName = interaction.commandName;
    
    const strValue = interaction.options.getString('オプション名');
    const intValue = interaction.options.getInteger('オプション名');
    const userObj = interaction.options.getUser('ユーザーオプション名');

    try {
        getCommandExcuterFunc(commandName)
    } catch(e: any) {
        if(ErrorManager.isKnownError()) {
            BotMessageFormat.Error(BotMessageFormat.ERROR_TYPES.default, e);
        } else {
            ErrorManager.saveErrorMessage(e);
        }
    }
    return;
  }
})