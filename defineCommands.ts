import * as Discord from 'discord.js';
import * as DiscordVoice from '@discordjs/voice';
import * as Whisper from 'nodejs-whisper';
import * as prism from 'prism-media';
import * as ffmpeg from 'fluent-ffmpeg'
import * as path from 'path';
import * as fs from 'fs';
import { timeStamp } from 'console';

enum ProcessTypeAilias {
    command,
    button,
    input,
}

enum DiscordCommandOptionAilias {
    channel,
    string,
    integer,
    boolean,
    user
}

enum DiscordChannelTypeAilias {
    voice,
    text
}

type _TupleSlide = [ 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
type _CurrentType = [ never, any, any ]
type ProcessBase<Depth extends 0|1|2 = 2> = {
    name: string,
    description: string,
    handler: (interaction: Discord.ChatInputCommandInteraction, subhandler_return?: any) => any,
}&({
    subcommands: _CurrentType[Depth] & ProcessBase<_TupleSlide[Depth]>[]
}|{
    requiredOptions: {
        name: string,
        type: DiscordCommandOptionAilias,
        description: string,
        channelType?: Discord.ChannelType.GuildVoice | Discord.ChannelType.GuildText,
        choices?: {name: string, value: string}[]
    }[],
});
type Process = {
    processType: ProcessTypeAilias,
} & ProcessBase;

const context: {
    text?: Discord.TextChannel,
    voice?: Discord.VoiceChannel,
    connection?: DiscordVoice.VoiceConnection
} = {};

interface LogContent {
    user_id: string,
    content: string,
    timestamp: Date,
}
class VoiceChatLogManager {
    log: LogContent[];
    headerMap: {
        [key: string]: LogContent[]
    };
    constructor() {
        this.log = [];
        this.headerMap = {};
    }
    insert(user_id: string, content: string): void {
        const row:LogContent = {
            user_id: user_id,
            content: content,
            timestamp: new Date()
        }
        this.log.push(row);
        this.headerMap[user_id]?.push?.(row) ?? (this.headerMap[user_id] = [row]);
    }
}

type TranscribeConfigure = {
    language: string,
    model: string,
}

class ConfigureManager<T extends { [key: string]: any } = { [key: string]: any }> {
    config: T;
    constructor(public path: string) {
        try {
            const raw: string = fs.readFileSync(path, {encoding: 'utf-8'});
            this.config = JSON.parse(raw);
        } catch {
            this.config = {} as T;
        }
    }
    save() {
        JSON.stringify(this.config);
        fs.writeFileSync(this.path, JSON.stringify(this.config), {encoding: 'utf-8'});
    }
    entries(targetHashMap: keyof typeof this.SettingChoices): {
        name: string,
        value: string,
    }[]{
        const hashMap = this.SettingChoices[targetHashMap];
        return Object.entries(hashMap).map(([name, value]) => ({name: name, value: value}));
    }
    SettingChoices = {
    Model: {
      TINY : 'tiny',
      TINY_EN : 'tiny.en',
      BASE : 'base',
      BASE_EN : 'base.en',
      SMALL : 'small',
      SMALL_EN : 'small.en',
      MEDIUM : 'medium',
      MEDIUM_EN : 'medium.en',
      LARGE_V1 : 'large-v1',
      LARGE : 'large',
      LARGE_V3_TURBO : 'large-v3-turbo'
    },
    Language: {
        japanese: 'ja',
        english: 'en',
        auto: 'auto'
    }
}
}
const configureManager = new ConfigureManager<TranscribeConfigure>(
    path.join(__dirname, 'configure/transcribe.json')
);


const voiceChatLogManager = new VoiceChatLogManager();
export const RootProcessDefine: {[key: string]: Process} = {
    "reflect": {
        "name": "reflect",
        "processType": ProcessTypeAilias.command,
        "description": "ボイスチャンネルの内容を反映",
        "requiredOptions": [
            {
                name: "model",
                type: DiscordCommandOptionAilias.string,
                description: "モデル名",
                choices: [
                    { name: "board", value: "board" }, 
                    { name: "channel", value: "channel" }
                ]
            }
        ],
        "handler": function(interaction: Discord.ChatInputCommandInteraction) {
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
        "subcommands":[ 
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
                "handler": function(interaction: Discord.ChatInputCommandInteraction) {
                    const choice = interaction.options.getString('model', true);
                    return [ 'model', choice ];
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
                "handler": function(interaction: Discord.ChatInputCommandInteraction) {
                    const choice = interaction.options.getString('language', true);
                    return [ 'language', choice ];
                }
            },
        ],
        "handler": function(
            interaction: Discord.ChatInputCommandInteraction, 
            subhandler_return: {
                name: keyof typeof configureManager.config,
                value: string
            }
        ) {
            const { name, value } = subhandler_return;
            if(name in configureManager.config) {
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
        "handler": function(interaction: Discord.ChatInputCommandInteraction) {
            const voiceChannel: Discord.VoiceChannel = interaction.options.getChannel('voice', true);
            const textChannel: Discord.TextChannel = interaction.options.getChannel('text', true);
            const connection: DiscordVoice.VoiceConnection = DiscordVoice.joinVoiceChannel({
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
                const chunks: any[] = [];
                const audioStream = receiver.subscribe(userId, {
                  end: {
                    behavior: DiscordVoice.EndBehaviorType.AfterSilence,
                    duration: 100,
                  },
                });
                audioStream.pipe(opusDecoder).on('data', chunk => {
                    chunks.push(chunk);
                })
                
                const file_path = path.join(__dirname, `tmp_${userId}_${Date.now()}.wav`)
                ffmpeg(audioStream.pipe(opusDecoder))
                    .inputFormat('s16le')
                    .inputOptions(['-ar 48000', '-ac 2'])
                    .audioChannels(1)
                    .audioFrequency(16000)
                    .toFormat('wav')
                    .save(file_path) 
                    .on('end', async() => {
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
                    .on('error', (err:any) => { console.error(err); });
            });
            return true;
        }
    }
}

const Commands = [];
for(const [name, content] of Object.entries(RootProcessDefine)) {
    const {processType} = content;
    if(processType === ProcessTypeAilias.command) {

        type _builderType = [
            Discord.SlashCommandBuilder,
            Discord.SlashCommandSubcommandBuilder,
            Discord.SlashCommandSubcommandGroupBuilder
        ];
        function getOptionRegister<Depth extends 0|1|2>(
            entry: ProcessBase,
            _d = 2
        ) {
            
            function merged<T extends Discord.SlashCommandBuilder|
                Discord.SlashCommandSubcommandBuilder|
                Discord.SlashCommandSubcommandGroupBuilder
            >(target: T) {
                function base() {
                    target.setName(entry.name);
                    target.setDescription(entry.description);
                }
                function addOption(target) {
                    if('requiredOptions' in entry)
                    for(const {name, type, description, ...rest} of entry.requiredOptions) {
                        const base = (option: any) => 
                            (rest.choices ? option.addChoices(...rest.choices) : option,
                            option.setName(name)
                            .setDescription(description)
                            .setRequired(true));

                        switch(type) {
                            case DiscordCommandOptionAilias.channel:
                                builder.addChannelOption(option=>
                                    rest.channelType ? base(option).addChannelTypes(rest.channelType) : base(option)
                                );
                                break;
                            case DiscordCommandOptionAilias.boolean:
                                builder.addBooleanOption(base);
                                break;
                            case DiscordCommandOptionAilias.user:
                                builder.addBooleanOption(base);
                                break;
                            case DiscordCommandOptionAilias.string:
                                builder.addBooleanOption(base);
                                break;
                            case DiscordCommandOptionAilias.integer:
                                builder.addUserOption(base);
                                break;
                        }
                    }
                    return base;
                }
                function addSubcommand() {
                    
                }
                function addSubcommandGroup() {

                }
                
                if('subcommands' in entry)
                for(const subentry of entry.subcommands) {
                    const f = getOptionRegister(subentry, _d-1);
                    [addSubcommand, addSubcommandGroup]
                }
                else if('requiredOptions' in entry) {
                    addOption(target);
                }
            }
            
        }

        const builder = new Discord.SlashCommandBuilder();
        optionRegister<Discord.SlashCommandBuilder>(builder, content);
        Commands.push(builder);
    }
}

export const registerCommandsList = Commands.map(command => command.toJSON());
RootProcessDefine;
SubProcessDefine; 

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