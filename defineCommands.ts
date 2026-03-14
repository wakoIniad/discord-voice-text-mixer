import * as Discord from 'discord.js';
import * as DiscordVoice from '@discordjs/voice';
import * as Whisper from 'nodejs-whisper';
import * as prism from 'prism-media';
import ffmpeg from 'fluent-ffmpeg'
import * as path from 'path';
import * as fs from 'fs';
import * as useModals from './interactionComponent';

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
export type ProcessBase<Depth extends 0|1|2 = 2> = {
    name: string,
    description: string,
    handler: (interaction: Discord.ChatInputCommandInteraction, subhandler_returns: {from: string, value: any[]}) => any,
}&({
    subcommands: _CurrentType[Depth] & {[$: string]:ProcessBase<_TupleSlide[Depth]>}
}|{
    requiredOptions: {
        name: string,
        type: DiscordCommandOptionAilias,
        description: string,
        channelType?: Discord.ChannelType.GuildVoice | Discord.ChannelType.GuildText,
        choices?: {name: string, value: string}[]
    }[],
});
export type Process = {
    processType: ProcessTypeAilias,
} & ProcessBase;
//export type ProcessPack = {[$: string]:ProcessBase}

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
        Reflector.reflections.forEach(f=>f(this.log));
    }
    preinsert(user_id: string) {
        const key = Symbol(user_id);
        const row:LogContent = {
            user_id: user_id,
            content: `文字起こし中...(仮メッセージ)`,
            timestamp: new Date(),
            key: key
        }
        this.log.push(row);
        this.headerMap[user_id]?.push?.(row) ?? (this.headerMap[user_id] = [row]);
        Reflector.reflections.forEach(f=>f(this.log));
        return key;
    }
    removePreinsert(symbol: Symbol) {
        this.log = this.log.filter(log=>log?.key!==symbol);
    }
}

type TranscribeConfigure = {
    language: string,
    model: ConfigureManager["SettingChoices"]["Model"][keyof ConfigureManager["SettingChoices"]["Model"]],
    debug: boolean
}

class ConfigureManager<T extends { [key: string]: any } = { [key: string]: any }> {
    config: T;
    constructor(public path: string, init?: T) {
        try {
            const raw: string = fs.readFileSync(path, {encoding: 'utf-8'});
            this.config = JSON.parse(raw);
        } catch {
            this.config = init??{} as T;
        }
    }
    save() {
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
    },
    Debug: {
        on: true,
        off: false
    }
}
}
const configureManager = new ConfigureManager<TranscribeConfigure>(
    path.join(__dirname, 'configure/transcribe.json'), {
        'debug': true,
        'language': 'ja',
        'model': 'large-v3-turbo'
    }
);
function isKeyOf(val: any, target: object): val is keyof typeof target {
    if(val in target) return true;
    return false;
}
function isMayValueOf<Target,Key extends keyof Target>(val: any, target: Target, key: Key): val is typeof target[Key]{
    if(typeof(val) === typeof(target[key])) return true;
    return false;
}
let usingConnection:DiscordVoice.VoiceConnection;

enum ReflectorType {
    board,
    channel
}
class Reflector {
    static reflections: ((_: any)=>void)[] = [];
    constructor(public type: ReflectorType){}
    //関数参照の配列でいいのにわざわざProxyを使います
    static getProxy(callback: (..._:any[])=>void): object {
        const handler = {
            get(obj: object, prop: string) {

            },
            set() {

            }
        };
        const proxy = new Proxy([], handler);
        return proxy;
    }
    #makeMessageContent(body: string) {
        return `${body}\n\`表示モード\``
    }
    reflect(interaction: Discord.ChatInputCommandInteraction): void {
        let callback: ()=>void = ()=>void 0;
        switch(this.type) {
            case ReflectorType.board:
                interaction.reply({
                    content: this.#makeMessageContent(''),
                    components: useModals.createDefaultMenu(),
                });
                Reflector.reflections.push(
                    async(list: LogContent[]) =>
                        interaction.editReply({
                            content: this.#makeMessageContent((await Promise.all(list.map(async log=>
                                `${(await interaction.guild?.members.fetch(log.user_id))?.displayName} ${log.content}`
                            ))).join('\n')),
                            components: useModals.createDefaultMenu()
                        })
                );
                break;
            case ReflectorType.channel:

                break;
            default:
                break;
        }
        //const proxy = Reflector.getProxy(callback);
    }
    static commandArgumentDefine = {
        reflectorTypes: {
            'board': 'board',
            'channel': 'channel'
        }
    }
    
    static entries(targetHashMap: keyof typeof this.commandArgumentDefine): {
        name: string,
        value: string,
    }[]{
        const hashMap = this.commandArgumentDefine[targetHashMap];
        return Object.entries(hashMap).map(([name, value]) => ({name: name, value: value}));
    }
}

export let usingReflector:Reflector;

const voiceChatLogManager = new VoiceChatLogManager();
export const RootProcessDefine: {[key: string]: Process} = {
    "reflect": {
        "name": "reflect",
        "processType": ProcessTypeAilias.command,
        "description": "ボイスチャンネルの内容を反映",
        "requiredOptions": [
            {
                name: "type",
                type: DiscordCommandOptionAilias.string,
                description: "表示タイプ",
                choices: Reflector.entries('reflectorTypes')
            }
        ],
        "handler": function(interaction: Discord.ChatInputCommandInteraction) {
            const reflect = interaction.options.getString('type', true);
            if(isKeyOf(reflect ,Reflector.commandArgumentDefine.reflectorTypes)) { 
                switch(reflect) {
                    case 'board':
                        usingReflector = new Reflector(ReflectorType.board);
                        usingReflector.reflect(interaction);
                        break;
                    case 'channel':
                        usingReflector = new Reflector(ReflectorType.channel);
                        usingReflector.reflect(interaction);
                        break;
                }
            }
            return true;
        }
    },
    "config": {
        "name": "config",
        "description": "設定を設定",
        "processType": ProcessTypeAilias.command,
        "subcommands":{
            "debug": {
                "name": "debug",
                "description": "文字起こしに使うWhisperモデル",
                "requiredOptions": [
                    {
                        name: "mode",
                        type: DiscordCommandOptionAilias.string,
                        description: "モード",
                        choices: configureManager.entries('Debug').map(({name, value})=>({name, value:JSON.stringify(value)}))
                    }
                ],
                "handler": function(interaction: Discord.ChatInputCommandInteraction) {
                    const choice = JSON.parse(interaction.options.getString('mode', true));
                    return [ 'debug', choice ];
                }
            },
            "model": {
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
            "lang": {
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
        },
        "handler": function(
            interaction: Discord.ChatInputCommandInteraction, 
            {from, value}: {from: string, value: any[]}
        ) {
            
            const [ item_name, item_value ] = value;
            if(isKeyOf(item_name, configureManager.config)) {
                if(isMayValueOf(item_value, configureManager.config, item_name)) {
                    configureManager.config[item_name] = item_value;
                    configureManager.save();
                }
            }
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
            if(usingConnection)usingConnection.destroy();
            const connection: DiscordVoice.VoiceConnection = usingConnection = DiscordVoice.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });
            context.voice = voiceChannel;
            context.text = textChannel;
            context.connection = connection;
            const receiver = connection.receiver;

            const opusDecoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });

            connection.on('error', error=>console.log);
            connection.on('stateChange', error=>console.log);
            receiver.speaking.on('end', (userId) => {
                console.log(userId, "end");
            });
            receiver.speaking.on('start', (userId) => {
                const chunks: any[] = [];
                const audioStream = receiver.subscribe(userId, {
                  end: {
                    behavior: DiscordVoice.EndBehaviorType.AfterSilence,
                    duration: 100,
                  },
                });
                audioStream.pipe(opusDecoder).on('data', (chunk: any) => {
                    chunks.push(chunk);
                });
                
                const file_path = path.join(__dirname, `tmp/tmp_${userId}_${Date.now()}.wav`)
                //PCM(標本化・離散化された生データ)
                //圧縮する形式の一つがopus(他にもaacなど)
                ffmpeg(audioStream.pipe(opusDecoder))
                //signed 16bit little endian
                .inputFormat('s16le')
                //ar:audio rate, ac:audio channel
                .inputOptions(['-ar 48000', '-ac 2'])
                .audioChannels(1)
                .audioFrequency(16000)
                .toFormat('wav')
                .save(file_path)
                .on('end', async() => {
                        const id = voiceChatLogManager.preinsert(userId);

                        const usingModelName = configureManager.config.model;
                        const text = await Whisper.nodewhisper(file_path, {
                            autoDownloadModelName: usingModelName,
                            modelName: usingModelName,
                            removeWavFileAfterTranscription: true,
                            withCuda: false,
                            whisperOptions: {
                                language: configureManager.config.language
                            }
                        });
                        voiceChatLogManager.insert(userId, text);
                        fs.unlink(file_path, function() {
                            console.log(file_path)
                        });
                        voiceChatLogManager.removePreinsert(id);
                    })
                    .on('error', (err:any) => { console.error(err); });
            });
            
            interaction.reply({
                content: 'test',
                flags: Discord.MessageFlags.Ephemeral
            });
            return true;
        }
    }
}


/*type Slice<RefTuple, Indexer, Start extends number, Count extends number, 
_Counter extends number[] = []> = 
    RefTuple[Start] | Slice<RefTuple, Indexer, Start extends number, Count extends number, 
[..._Counter]>;*/

const Commands = [];
for(const [name, content] of Object.entries(RootProcessDefine)) {
    const {processType} = content;
    if(processType === ProcessTypeAilias.command) {

        type s0 = Discord.SlashCommandBuilder;
        type s1 = Discord.SlashCommandSubcommandBuilder
        type s2 = Discord.SlashCommandSubcommandGroupBuilder
        type _builderType = [
            s0,
            s1,
            s1|s0,
            s2,
            s1|s2,
            s0|s1|s2
        ];
        type _builderTypeOrder = [
            s0, s1, s2
        ]
        //型パズルの途中(コンパイル後のJSはそのまま動く)
        function getOptionRegister(
            ...entries: ProcessBase[]
        ): [number, 
            <Depth extends 0|1|2=0,
            >(t:_builderTypeOrder[Depth])=>_builderTypeOrder[Depth][]
        ] {
            return entries.reduce(
                (
                    res: [
                        number, 
                        <Depth extends 0|1|2=0,
                        >(t:_builderTypeOrder[Depth])=>_builderTypeOrder[Depth][]
                    ], 
                    entry
                ) => {
                function base(
                    target: Discord.SlashCommandBuilder|
                    Discord.SlashCommandSubcommandBuilder|
                    Discord.SlashCommandSubcommandGroupBuilder
                ) {
                    target.setName(entry.name);
                    target.setDescription(entry.description);
                    return target;
                }

                function addOption(
                    target: Discord.SlashCommandBuilder | Discord.SlashCommandSubcommandBuilder
                ) {
                    if('requiredOptions' in entry)
                    for(const {name, type, description, ...rest} of entry.requiredOptions) {
                        const base = (option: any) => 
                            (rest.choices && option?.addChoices?.(...rest.choices),
                            option.setName(name)
                            .setDescription(description)
                            .setRequired(true));
                        switch(type) {
                            case DiscordCommandOptionAilias.channel:
                                target.addChannelOption(option=>
                                    rest.channelType ? base(option).addChannelTypes(rest.channelType) : base(option)
                                );
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
                function addSubcommand(
                    target: Discord.SlashCommandBuilder | Discord.SlashCommandSubcommandGroupBuilder,
                    nextProcess: (a:Discord.SlashCommandSubcommandBuilder)=>Discord.SlashCommandSubcommandBuilder
                ) {
                    target.addSubcommand(sub=>nextProcess(sub));
                    return target;
                }
                function addSubcommandGroup(
                    target: Discord.SlashCommandBuilder, 
                    nextProcess: (a:Discord.SlashCommandSubcommandGroupBuilder)=>Discord.SlashCommandSubcommandGroupBuilder
                ) {
                    target.addSubcommandGroup(group=>nextProcess(group));
                    return target;
                }

                if('subcommands' in entry) {
                    const [i, fs]:[
                        number, 
                        ((_:_builderType[5])=>_builderType[5])[]
                    ] = getOptionRegister(...Object.values(entry.subcommands));

                    let T = (a:_builderType[5]) => base(a);
                    T = fs.reduce((f, F)=> ((target) => ((
                        (target:_builderType[5]) => [addSubcommand, addSubcommandGroup][i](
                        target,
                        F
                    )
                    ) (f(target)) ) ) ,a => base(a) );
                    res[0] = i;
                    res[1].push(T);
                }
                else if('requiredOptions' in entry)
                    res[1].push((target)=>addOption(base(target)))
                return res;
                //}
            },[0,[]])
        }

        const builder = new Discord.SlashCommandBuilder();
        const [_, OptionRegister] = getOptionRegister(content);
        OptionRegister[0](builder);
        Commands.push(builder);
    }
}

export const registerCommandsList = Commands.map(command => command.toJSON());

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