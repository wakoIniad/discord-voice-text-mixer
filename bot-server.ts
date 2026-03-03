//import {  } from 'nodejs-whisper';

import * as Discord from 'discord.js';
import { LocalLogManager } from './error.ts';
import { RootProcessDefine as processDefine } from './defineCommands.js';
import type { Process, ProcessBase } from './defineCommands.js';
import { EndBehaviorType, VoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { createWriteStream } from 'fs';

/*const useCommands = ( CommandDefine as Discord.SlashCommandBuilder[])
    .reduce((result: {[key: string]: Command}, cmd) => {
    const options: {type: string, name: string}[] = [];
    for(const option of cmd.options) {
        if('name' in option && 'type' in option && typeof(option.name) == 'string' && typeof(option.type) == 'string') {
            options.push({ type: option.type, name: option.name });
        }
    }
    result[cmd.name] = new Command(cmd.name, options, ()=>true);
    return result;
}, {});*/

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
    type ci = Discord.ChatInputCommandInteraction;
    const command = interaction.commandName;
    const subcommandGroup = interaction.options.getSubcommand(false);
    const subcommand = interaction.options.getSubcommand(false);
    
    const [dp2,dp3]:(string|null)[] = [subcommandGroup, subcommand];

    //type isNested<keyname extends string, outerShell extends any> = 
    //    outerShell[keyof outerShell]|isNested<keyname, outerShell[keyname]>;

    function inference<T>(e:T): e is NonNullable<T> & Exclude<0,T> {
        return !!e;
    }
    [command, dp2, dp3].filter(f=>inference(f)).reduce((context: {
        use:{[$:string]: Process}, prev:string|null, prevf:((...datum:any[])=>any)
    }, now: string)=>{
        const { use, prev, prevf } = context;
        if(prev) {
            if(now) {
                if(now in use) {
                    if('subcommands' in use[now]) {
                        context.prevf = 
                            (data: any[])=>(i:ci)=>use[now as keyof typeof use].handler(i, data)
                        ()=>context.prevf(
                        )
                        context.use = use[now].subcommands;
                    }
                    //const t: ProcessBase = use[now as keyof typeof use];
                    //context.prevf = 
                }
            }
        } else {
            context.prev = now;
        }
        return context;
    }, { use:processDefine, prev:null, prevf: $=>$});
    for(const dn of ) {
        if(dn in use) {

        }
    }
    if(command in processDefine){
        const use = processDefine[command];
            if(dn) {
                if('subcommands' in use) {
                const use_dp2 = use.subcommands;
                if(dp3) {

                }
            }
            }
        }
        try {
            processDefine[command].handler(interaction);
        } catch {
            
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