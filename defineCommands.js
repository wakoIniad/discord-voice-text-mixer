"use strict";
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
exports.registerCommandsList = exports.RootProcessDefine = void 0;
const Discord = __importStar(require("discord.js"));
const DiscordVoice = __importStar(require("@discordjs/voice"));
const Whisper = __importStar(require("nodejs-whisper"));
const prism = __importStar(require("prism-media"));
const ffmpeg = __importStar(require("fluent-ffmpeg"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
var ProcessTypeAilias;
(function (ProcessTypeAilias) {
    ProcessTypeAilias[ProcessTypeAilias["command"] = 0] = "command";
    ProcessTypeAilias[ProcessTypeAilias["button"] = 1] = "button";
    ProcessTypeAilias[ProcessTypeAilias["input"] = 2] = "input";
})(ProcessTypeAilias || (ProcessTypeAilias = {}));
var DiscordCommandOptionAilias;
(function (DiscordCommandOptionAilias) {
    DiscordCommandOptionAilias[DiscordCommandOptionAilias["channel"] = 0] = "channel";
    DiscordCommandOptionAilias[DiscordCommandOptionAilias["string"] = 1] = "string";
    DiscordCommandOptionAilias[DiscordCommandOptionAilias["integer"] = 2] = "integer";
    DiscordCommandOptionAilias[DiscordCommandOptionAilias["boolean"] = 3] = "boolean";
    DiscordCommandOptionAilias[DiscordCommandOptionAilias["user"] = 4] = "user";
})(DiscordCommandOptionAilias || (DiscordCommandOptionAilias = {}));
var DiscordChannelTypeAilias;
(function (DiscordChannelTypeAilias) {
    DiscordChannelTypeAilias[DiscordChannelTypeAilias["voice"] = 0] = "voice";
    DiscordChannelTypeAilias[DiscordChannelTypeAilias["text"] = 1] = "text";
})(DiscordChannelTypeAilias || (DiscordChannelTypeAilias = {}));
const context = {};
class VoiceChatLogManager {
    log;
    headerMap;
    constructor() {
        this.log = [];
        this.headerMap = {};
    }
    insert(user_id, content) {
        const row = {
            user_id: user_id,
            content: content,
            timestamp: new Date()
        };
        this.log.push(row);
        this.headerMap[user_id]?.push?.(row) ?? (this.headerMap[user_id] = [row]);
    }
}
class ConfigureManager {
    path;
    config;
    constructor(path) {
        this.path = path;
        try {
            const raw = fs.readFileSync(path, { encoding: 'utf-8' });
            this.config = JSON.parse(raw);
        }
        catch {
            this.config = {};
        }
    }
    save() {
        JSON.stringify(this.config);
        fs.writeFileSync(this.path, JSON.stringify(this.config), { encoding: 'utf-8' });
    }
    entries(targetHashMap) {
        const hashMap = this.SettingChoices[targetHashMap];
        return Object.entries(hashMap).map(([name, value]) => ({ name: name, value: value }));
    }
    SettingChoices = {
        Model: {
            TINY: 'tiny',
            TINY_EN: 'tiny.en',
            BASE: 'base',
            BASE_EN: 'base.en',
            SMALL: 'small',
            SMALL_EN: 'small.en',
            MEDIUM: 'medium',
            MEDIUM_EN: 'medium.en',
            LARGE_V1: 'large-v1',
            LARGE: 'large',
            LARGE_V3_TURBO: 'large-v3-turbo'
        },
        Language: {
            japanese: 'ja',
            english: 'en',
            auto: 'auto'
        }
    };
}
const configureManager = new ConfigureManager(path.join(__dirname, 'configure/transcribe.json'));
const voiceChatLogManager = new VoiceChatLogManager();
exports.RootProcessDefine = {
    "reflect": {
        "name": "reflect",
        "processType": ProcessTypeAilias.command,
        "description": "ボイスチャンネルの内容を反映",
        "requiredOptions": [
            {
                name: "type",
                type: DiscordCommandOptionAilias.string,
                description: "表示タイプ",
                choices: [
                    { name: "board", value: "board" },
                    { name: "channel", value: "channel" }
                ]
            }
        ],
        "handler": function (interaction) {
            const choice = interaction.options.getString('model', true);
            configureManager.config.model = choice;
            configureManager.save();
            return true;
        }
    },
    "config": {
        "name": "config",
        "description": "設定を設定",
        "processType": ProcessTypeAilias.command,
        "subcommands": [
            {
                "name": "model",
                "description": "文字起こしに使うWhisperモデル",
                "requiredOptions": [
                    {
                        name: "model",
                        type: DiscordCommandOptionAilias.string,
                        description: "モデル名",
                        choices: configureManager.entries('Model')
                    }
                ],
                "handler": function (interaction) {
                    const choice = interaction.options.getString('model', true);
                    return ['model', choice];
                }
            },
            {
                "name": "lang",
                "description": "文字起こしの言語",
                "requiredOptions": [
                    {
                        name: "language",
                        type: DiscordCommandOptionAilias.string,
                        description: "voice channel",
                        choices: configureManager.entries('Language'),
                    },
                ],
                "handler": function (interaction) {
                    const choice = interaction.options.getString('language', true);
                    return ['language', choice];
                }
            },
        ],
        "handler": function (interaction, subhandler_return) {
            const { name, value } = subhandler_return;
            if (name in configureManager.config) {
                configureManager.config[name] = value;
            }
            configureManager.save();
            return true;
        }
    },
    "connect": {
        "name": "connect",
        "processType": ProcessTypeAilias.command,
        "description": "ボイスチャンネルとテキストチャンネルを設定",
        "requiredOptions": [
            {
                name: "voice",
                type: DiscordCommandOptionAilias.channel,
                channelType: Discord.ChannelType.GuildVoice,
                description: "voice channel"
            },
            {
                name: "text",
                type: DiscordCommandOptionAilias.channel,
                channelType: Discord.ChannelType.GuildVoice,
                description: "text channel"
            }
        ],
        "handler": function (interaction) {
            const voiceChannel = interaction.options.getChannel('voice', true);
            const textChannel = interaction.options.getChannel('text', true);
            const connection = DiscordVoice.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            });
            context.voice = voiceChannel;
            context.text = textChannel;
            context.connection = connection;
            const receiver = connection.receiver;
            const opusDecoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
            receiver.speaking.on('start', (userId) => {
                const chunks = [];
                const audioStream = receiver.subscribe(userId, {
                    end: {
                        behavior: DiscordVoice.EndBehaviorType.AfterSilence,
                        duration: 100,
                    },
                });
                audioStream.pipe(opusDecoder).on('data', chunk => {
                    chunks.push(chunk);
                });
                const file_path = path.join(__dirname, `tmp_${userId}_${Date.now()}.wav`);
                ffmpeg(audioStream.pipe(opusDecoder))
                    .inputFormat('s16le')
                    .inputOptions(['-ar 48000', '-ac 2'])
                    .audioChannels(1)
                    .audioFrequency(16000)
                    .toFormat('wav')
                    .save(file_path)
                    .on('end', async () => {
                    const usingModelName = configureManager.config.model ?? 'large-v3-turbo';
                    const text = await Whisper.nodewhisper(file_path, {
                        autoDownloadModelName: usingModelName,
                        modelName: usingModelName,
                        removeWavFileAfterTranscription: true,
                        withCuda: true,
                        whisperOptions: {
                            language: configureManager.config.language ?? 'ja'
                        }
                    });
                    voiceChatLogManager.insert(userId, text);
                })
                    .on('error', (err) => { console.error(err); });
            });
            return true;
        }
    }
};
/*type Slice<RefTuple, Indexer, Start extends number, Count extends number,
_Counter extends number[] = []> =
    RefTuple[Start] | Slice<RefTuple, Indexer, Start extends number, Count extends number,
[..._Counter]>;*/
const Commands = [];
for (const [name, content] of Object.entries(exports.RootProcessDefine)) {
    const { processType } = content;
    if (processType === ProcessTypeAilias.command) {
        function getOptionRegister(...entries) {
            return entries.reduce((res, entry) => {
                function base(target) {
                    target.setName(entry.name);
                    target.setDescription(entry.description);
                    return target;
                }
                function addOption(target) {
                    if ('requiredOptions' in entry)
                        for (const { name, type, description, ...rest } of entry.requiredOptions) {
                            const base = (option) => (rest.choices && option?.addChoices?.(...rest.choices),
                                option.setName(name)
                                    .setDescription(description)
                                    .setRequired(true));
                            switch (type) {
                                case DiscordCommandOptionAilias.channel:
                                    target.addChannelOption(option => rest.channelType ? base(option).addChannelTypes(rest.channelType) : base(option));
                                    break;
                                case DiscordCommandOptionAilias.boolean:
                                    target.addBooleanOption(base);
                                    break;
                                case DiscordCommandOptionAilias.user:
                                    target.addUserOption(base);
                                    break;
                                case DiscordCommandOptionAilias.string:
                                    target.addStringOption(base);
                                    break;
                                case DiscordCommandOptionAilias.integer:
                                    target.addIntegerOption(base);
                                    break;
                            }
                        }
                    return target;
                }
                function addSubcommand(target, nextProcess) {
                    target.addSubcommand(sub => nextProcess(sub));
                    return target;
                }
                function addSubcommandGroup(target, nextProcess) {
                    target.addSubcommandGroup(group => nextProcess(group));
                    return target;
                }
                if ('subcommands' in entry) {
                    const [i, fs] = getOptionRegister(...entry.subcommands);
                    for (const [subentry, f] of entry.subcommands.map((E, at) => [E, fs[at]])) {
                        //const [i, f]: [number, (target: any)=>any] = getOptionRegister(subentry);
                        const next = (target) => [addSubcommand, addSubcommandGroup][i](base(target), f);
                        res[1].push(next);
                    }
                    res[0] = i;
                }
                else if ('requiredOptions' in entry)
                    res[1].push((target) => addOption(base(target)));
                return res;
                //}
            }, [0, []]);
        }
        const builder = new Discord.SlashCommandBuilder();
        const [_, OptionRegister] = getOptionRegister(content);
        OptionRegister[0](builder);
        Commands.push(builder);
    }
}
exports.registerCommandsList = Commands.map(command => command.toJSON());
//
//
//
//export const Commands = [
//    
//    new SlashCommandBuilder()
//        .setName('monitor')
//        .setDescription('サーバーの情報を公開'),
//    new SlashCommandBuilder()
//        .setName('board')
//        .setDescription('現在の発言内容がリアルタイムで更新されるボードを表示'),
//    new SlashCommandBuilder()
//        .setName('connect')
//        .setDescription('指定されたボイスチャットとテキストチャットをリンク')
//        .addStringOption(option => 
//            option.setName('voice').setDescription('ボイスチャンネル').setRequired(true)
//        )
//        .addStringOption(option => 
//            option.setName('text').setDescription('テキストチャンネル').setRequired(true)
//        ),
//    /*new SlashCommandBuilder()
//        .setName('ovveride-voice')
//        .setDescription('ボイスチャットの設定を上書き')
//        .addChannelOption(opt => opt.setName('voice').setDescription('チャンネル').setRequired(true)),
//    new SlashCommandBuilder()
//        .setName('ovveride-text')
//        .setDescription('テキストチャットの設定を上書き')
//        .addChannelOption(opt => opt.setName('text').setDescription('チャンネル').setRequired(true)),*/
//    new SlashCommandBuilder()
//        .setName('set-formatter')
//        .setDescription('文字起こしのフォーマットを指定してJSON形式から変換')
//        .addStringOption(opt => opt.setName('format').setDescription('フォーマット文字列').setRequired(true)),
//    new SlashCommandBuilder()
//        .setName('transfer-url')
//        .setDescription('議事録などのために、文字起こしの転送先URLを追加(JSON形式)')
//        .addStringOption(opt => opt.setName('url').setDescription('ポスト先URL').setRequired(true)),
//    new SlashCommandBuilder()
//        .setName('transfer-channel')
//        .setDescription('議事録などのために、文字起こしの転送先チャンネルを追加')
//        .addChannelOption(opt => opt.setName('text').setDescription('チャンネル').setRequired(true)),
//];
