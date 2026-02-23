require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

(async()=>{
    const commands = [
        new SlashCommandBuilder()
            .setName('monitor')
            .setDescription('サーバーの情報を公開')
            .addChoices()
            .toJSON(),
        new SlashCommandBuilder()
            .setName('board')
            .setDescription('現在の発言内容がリアルタイムで更新されるボードを表示')
            .toJSON(),



        new SlashCommandBuilder()
            .setName('connect')
            .setDescription('指定されたボイスチャットとテキストチャットをリンク')
            .addStringOption(option => 
                option.setName('voice').setDescription('ボイスチャンネル').setRequired(true)
            )
            .addStringOption(option => 
                option.setName('text').setDescription('テキストチャンネル').setRequired(true)
            )
            .toJSON(),
        new SlashCommandBuilder()
            .setName('ovveride')
            .setDescription('ボイスチャット/テキストチャットでリンク設定を上書き')
            .addChannelOption(opt => opt.setName('target').setDescription('チャンネル').setRequired(true))
            .toJSON(),
        new SlashCommandBuilder()
            .setName('transfer-url')
            .setDescription('議事録などのために、文字起こしの転送先URLを追加')
            .addStringOption(opt => opt.setName('target').setDescription('ポスト先URL').setRequired(true))
            .toJSON(),
        new SlashCommandBuilder()
            .setName('transfer-channel')
            .setDescription('議事録などのために、文字起こしの転送先チャンネルを追加')
            .addChannelOption(opt => opt.setName('target').setDescription('チャンネル').setRequired(true))
            .toJSON(),
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
})();