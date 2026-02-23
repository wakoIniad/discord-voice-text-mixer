
import { SlashCommandBuilder } from 'discord.js';

export const Commands = [
    new SlashCommandBuilder()
        .setName('monitor')
        .setDescription('サーバーの情報を公開'),
    new SlashCommandBuilder()
        .setName('board')
        .setDescription('現在の発言内容がリアルタイムで更新されるボードを表示'),
    new SlashCommandBuilder()
        .setName('connect')
        .setDescription('指定されたボイスチャットとテキストチャットをリンク')
        .addStringOption(option => 
            option.setName('voice').setDescription('ボイスチャンネル').setRequired(true)
        )
        .addStringOption(option => 
            option.setName('text').setDescription('テキストチャンネル').setRequired(true)
        ),
    /*new SlashCommandBuilder()
        .setName('ovveride-voice')
        .setDescription('ボイスチャットの設定を上書き')
        .addChannelOption(opt => opt.setName('voice').setDescription('チャンネル').setRequired(true)),
    new SlashCommandBuilder()
        .setName('ovveride-text')
        .setDescription('テキストチャットの設定を上書き')
        .addChannelOption(opt => opt.setName('text').setDescription('チャンネル').setRequired(true)),*/
    new SlashCommandBuilder()
        .setName('set-formatter')
        .setDescription('文字起こしのフォーマットを指定してJSON形式から変換')
        .addStringOption(opt => opt.setName('format').setDescription('フォーマット文字列').setRequired(true)),
    new SlashCommandBuilder()
        .setName('transfer-url')
        .setDescription('議事録などのために、文字起こしの転送先URLを追加(JSON形式)')
        .addStringOption(opt => opt.setName('url').setDescription('ポスト先URL').setRequired(true)),
    new SlashCommandBuilder()
        .setName('transfer-channel')
        .setDescription('議事録などのために、文字起こしの転送先チャンネルを追加')
        .addChannelOption(opt => opt.setName('text').setDescription('チャンネル').setRequired(true)),
];