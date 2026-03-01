//import {  } from 'nodejs-whisper';

import * as Discord from 'discord.js';
import { LocalLogManager } from './error.ts';
import { Commands as CommandDefine } from './defineCommands.js';
import { EndBehaviorType, VoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { createWriteStream } from 'fs';

const useCommands = ( CommandDefine as Discord.SlashCommandBuilder[])
    .reduce((result: {[key: string]: Command}, cmd) => {
    const options: {type: string, name: string}[] = [];
    for(const option of cmd.options) {
        if('name' in option && 'type' in option && typeof(option.name) == 'string' && typeof(option.type) == 'string') {
            options.push({ type: option.type, name: option.name });
        }
    }
    result[cmd.name] = new Command(cmd.name, options, ()=>true);
    return result;
}, {});

class Command {
    constructor(
        public name: string, 
        public option_names: {type: string, name: string}[],
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


// connection は既に確立されているものとします
const receiver = connection.receiver;

receiver.speaking.on('start', (userId) => {

    const audioStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence, 
            duration: 100, 
        },
    });

    const outputStream = createWriteStream(`./recordings/${userId}-${Date.now()}.opus`);
    audioStream.pipe(outputStream);

    audioStream.on('end', () => {
    });
});

class Board {
    #type
    constructor(type: string) {
        this.#type = type;
    }
    createBoard(originInteraction: Discord.Integration) {
        const modal = new Discord.ModalBuilder()
        .setCustomId('myModal')
        .setTitle('プロフィール編集');
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
]

class CommandFaultError extends Error {
    constructor(...param: any[]) {
        super(...param);
    }
}

const localLogManager = new LocalLogManager();

function createUserSelector(): Discord.ActionRowBuilder[] {
const row3 = new Discord.ActionRowBuilder()
  .addComponents(
    new Discord.StringSelectMenuBuilder()
      .setCustomId('target-user')
      .setPlaceholder('対象ユーザー')
      .setMinValues(1)
      .setMaxValues(1)
  );
  return [row3]
}

function createDefaultMenu(): Discord.ActionRowBuilder[] {
    const rows = [];

    // Action Row 1
    const row1 = new Discord.ActionRowBuilder()
      .addComponents(
        new Discord.StringSelectMenuBuilder()
          .setCustomId('display_mode')
          .setPlaceholder('表示モード')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions([
            {
              label: '現在話している人のみ',
              value: 'speaker',
              default: true
            },
            {
              label: 'ユーザーごと',
              value: 'earch-user'
            },
            {
              label: 'ログ形式',
              value: 'stack'
            },
            {
              label: '特定のユーザー',
              value: 'specific-user'
            }
          ])
      );
    rows.push(row1);

    const row2 = new Discord.ActionRowBuilder()
      .addComponents(
        new Discord.ButtonBuilder()
          .setLabel('メッセージを入力')
          .setStyle(Discord.ButtonStyle.Primary)
          .setCustomId('start_message')
      );
    rows.push(row2);
    
    return rows;
}

function createShortMessageModal() {
    const modal = new Discord.ModalBuilder()
      .setCustomId('short_message_modal')
      .setTitle('ひとこと');

    modal.setComponents(
        new Discord.ActionRowBuilder<Discord.TextInputBuilder>().addComponents(
            new Discord.TextInputBuilder()
            .setCustomId('shor_message_input')
            .setLabel('短文を入力')
            .setStyle(Discord.TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(64)
        )
    );
    return modal;
}


client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const commandName = interaction.commandName;
    
    if(commandName in useCommands){
        let optarr = [];
        for(const {type, name} of useCommands[commandName].option_names) {
            //@ts-ignore
            let opt;
            //@ts-ignore
            if(opt = interaction?.options?.[{
                'string':  'getString',
                'channel': 'getChannel'
            }?.[type]]?.(name, true)) {
                optarr.push(opt);
            };

        }
        
    }

    try {
        getCommandExcuterFunc(commandName)
    } catch(e) {
        if( e instanceof Error ) {
            if( e instanceof CommandFaultError) {
                BotMessageFormat.Error(BotMessageFormat.ERROR_TYPES.default, e);
            } else {
                localLogManager.SaveErrorMessage(e);
            }
        }
    }
    return;
  }
})