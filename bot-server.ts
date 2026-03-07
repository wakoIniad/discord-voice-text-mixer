//import {  } from 'nodejs-whisper';
import 'dotenv/config';
import * as Discord from 'discord.js';
import { LocalLogManager } from './error';
import { RootProcessDefine as processDefine } from './defineCommands.js';
import type { Process, ProcessBase } from './defineCommands.js';

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

class Oracle extends Error {
    constructor(identity: string, ...args: any[]) {
        super(...args)
    };
}

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    type ci = Discord.ChatInputCommandInteraction;
    const command = interaction.commandName;
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand(false);
    console.log(command,subcommandGroup,subcommand);
    //type isNested<keyname extends string, outerShell extends any> = 
    //    outerShell[keyof outerShell]|isNested<keyname, outerShell[keyname]>;

    function inference<T>(e:T): e is NonNullable<T> & Exclude<0,T> {
        return !!e;
    }
    try {
        [command, subcommandGroup, subcommand].filter(f=>inference(f)).reduce((context: {
            use:{[$:string]: Process}, prev:string|null, f:((i:ci,...datum:any[])=>any)
        }, now: string|null)=>{
            if(now && now in context.use) {
                context.f = ((prevf, currContext)=>(i:ci, data={from:"", value:[]})=>prevf(i, currContext[now as keyof typeof currContext].handler(i, {
                    from: now,
                    value: data,
                })))(context.f, context.use);
                if('subcommands' in context.use[now]) {
                    context.use = context.use[now].subcommands;
                }
            }
            return context;
        }, { use:processDefine, prev:null, f: f=>f}).f(interaction);
    } catch(e) {
        if(e instanceof Oracle) {
            switch(e.cause) {
                default:
                    await interaction.reply({
                      content: '未整理のエラーが発生しました',
                      flags: Discord.MessageFlags.Ephemeral
                    });
                    break;
            }
            console.log(e);
        } else {
            await interaction.reply({
              content: '未知のエラーが発生しました',
              flags: Discord.MessageFlags.Ephemeral
            });
            console.log(e);
        }
    }

    //try {
    //    getCommandExcuterFunc(commandName)
    //} catch(e) {
    //    if( e instanceof Error ) {
    //        if( e instanceof CommandFaultError) {
    //            BotMessageFormat.Error(BotMessageFormat.ERROR_TYPES.default, e);
    //        } else {
    //            localLogManager.SaveErrorMessage(e);
    //        }
    //    }
    //}
  }
})

client.login(process.env.TOKEN);

console.log("listening server...")