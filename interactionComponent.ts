import Discord from 'discord.js';

export enum useComponentsAilias {
    UserSelector,
    DefaultMenu,
    ShortMessageModal
};

export const component_id = {
    START_MESSAGE: 'start_message',
    SHORT_MESSAGE_INPUT: 'shor_message_input',
    TARGET_USER: 'target_user',
    DISPLAY_MODE: 'display_mode',
    SHORT_MESSAGE_MODAL: 'short_message_modal',
}

export const componentid_lookup = {
    [component_id.TARGET_USER]: 
        useComponentsAilias.UserSelector,
    [component_id.START_MESSAGE]: 
        useComponentsAilias.DefaultMenu,
    [component_id.DISPLAY_MODE]: 
        useComponentsAilias.DefaultMenu,
    [component_id.SHORT_MESSAGE_MODAL]:
        useComponentsAilias.ShortMessageModal,
    [component_id.SHORT_MESSAGE_INPUT]: 
        useComponentsAilias.ShortMessageModal,
}

export function createUserSelector(): Discord.ActionRowBuilder[] {
    const row3 = new Discord.ActionRowBuilder()
        .addComponents(new Discord.StringSelectMenuBuilder()
        .setCustomId(component_id.TARGET_USER)
        .setPlaceholder('対象ユーザー')
        .setMinValues(1)
        .setMaxValues(1));
    return [row3];
}
export function createDefaultMenu(): Discord.ActionRowBuilder[] {
    const rows = [];
    const row1 = new Discord.ActionRowBuilder()
        .addComponents(new Discord.StringSelectMenuBuilder()
        .setCustomId(component_id.DISPLAY_MODE)
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
        .setCustomId(component_id.START_MESSAGE));
    rows.push(row2);
    return rows;
}
export function createShortMessageModal(): Discord.ModalBuilder {
    const modal = new Discord.ModalBuilder()
        .setCustomId(component_id.SHORT_MESSAGE_MODAL)
        .setTitle('ひとこと');

    modal.setComponents(
        new Discord.ActionRowBuilder<Discord.TextInputBuilder>().addComponents(
            new Discord.TextInputBuilder()
            .setCustomId(component_id.SHORT_MESSAGE_INPUT)
            .setLabel('短文を入力')
            .setStyle(Discord.TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(64)
        )
    );
    return modal;
}