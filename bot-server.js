"use strict";
//import {  } from 'nodejs-whisper';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const Discord = __importStar(require("discord.js"));
const error_ts_1 = require("./error.ts");
const defineCommands_js_1 = require("./defineCommands.js");
const voice_1 = require("@discordjs/voice");
const fs_1 = require("fs");
const useCommands = defineCommands_js_1.Commands
    .reduce((result, cmd) => {
    const options = [];
    for (const option of cmd.options) {
        if ('name' in option && 'type' in option && typeof (option.name) == 'string' && typeof (option.type) == 'string') {
            options.push({ type: option.type, name: option.name });
        }
    }
    result[cmd.name] = new Command(cmd.name, options, () => true);
    return result;
}, {});
class Command {
    name;
    option_names;
    handle;
    constructor(name, option_names, handle) {
        this.name = name;
        this.option_names = option_names;
        this.handle = handle;
    }
}
const botStat = {
    'mode': 0b0000,
};
class VoiceData {
    speaker;
    text;
    constructor(speaker, text) {
        this.speaker = speaker;
        this.text = text;
    }
}
const streams = {
    'voice': [],
    'message': [],
    'server': []
};
const client = new Discord.Client({ intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.GuildWebhooks
    ]
});
// connection は既に確立されているものとします
const receiver = connection.receiver;
receiver.speaking.on('start', (userId) => {
    const audioStream = receiver.subscribe(userId, {
        end: {
            behavior: voice_1.EndBehaviorType.AfterSilence,
            duration: 100,
        },
    });
    const outputStream = (0, fs_1.createWriteStream)(`./recordings/${userId}-${Date.now()}.opus`);
    audioStream.pipe(outputStream);
    audioStream.on('end', () => {
    });
});
class Board {
    #type;
    constructor(type) {
        this.#type = type;
    }
    createBoard(originInteraction) {
        const modal = new Discord.ModalBuilder()
            .setCustomId('myModal')
            .setTitle('プロフィール編集');
    }
    dispose() {
    }
    $streamData() {
    }
}
function getCommandExcuterFunc(commandName) {
    switch (commandName) {
        case 'monitor':
            return function () {
            };
        case 'connect':
            return function () {
            };
    }
}
function sendMessage(to) {
}
class BotMessageFormat {
    static ERROR_TYPES = {
        default: Symbol('default')
    };
    static Error(baseIdentifier, e) {
    }
}
const commandList = [];
class CommandFaultError extends Error {
    constructor(...param) {
        super(...param);
    }
}
const localLogManager = new error_ts_1.LocalLogManager();
function createUserSelector() {
    const row3 = new Discord.ActionRowBuilder()
        .addComponents(new Discord.StringSelectMenuBuilder()
        .setCustomId('target-user')
        .setPlaceholder('対象ユーザー')
        .setMinValues(1)
        .setMaxValues(1));
    return [row3];
}
function createDefaultMenu() {
    const rows = [];
    // Action Row 1
    const row1 = new Discord.ActionRowBuilder()
        .addComponents(new Discord.StringSelectMenuBuilder()
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
    ]));
    rows.push(row1);
    const row2 = new Discord.ActionRowBuilder()
        .addComponents(new Discord.ButtonBuilder()
        .setLabel('メッセージを入力')
        .setStyle(Discord.ButtonStyle.Primary)
        .setCustomId('start_message'));
    rows.push(row2);
    return rows;
}
function createShortMessageModal() {
    const modal = new Discord.ModalBuilder()
        .setCustomId('short_message_modal')
        .setTitle('ひとこと');
    modal.setComponents(new Discord.ActionRowBuilder().addComponents(new Discord.TextInputBuilder()
        .setCustomId('shor_message_input')
        .setLabel('短文を入力')
        .setStyle(Discord.TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(64)));
    return modal;
}
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        if (commandName in useCommands) {
            let optarr = [];
            for (const { type, name } of useCommands[commandName].option_names) {
                //@ts-ignore
                let opt;
                //@ts-ignore
                if (opt = interaction?.options?.[{
                    'string': 'getString',
                    'channel': 'getChannel'
                }?.[type]]?.(name, true)) {
                    optarr.push(opt);
                }
                ;
            }
        }
        try {
            getCommandExcuterFunc(commandName);
        }
        catch (e) {
            if (e instanceof Error) {
                if (e instanceof CommandFaultError) {
                    BotMessageFormat.Error(BotMessageFormat.ERROR_TYPES.default, e);
                }
                else {
                    localLogManager.SaveErrorMessage(e);
                }
            }
        }
        return;
    }
});
