"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentid_lookup = exports.component_id = exports.useComponentsAilias = void 0;
exports.createUserSelector = createUserSelector;
exports.createDefaultMenu = createDefaultMenu;
exports.createShortMessageModal = createShortMessageModal;
const discord_js_1 = __importDefault(require("discord.js"));
var useComponentsAilias;
(function (useComponentsAilias) {
    useComponentsAilias[useComponentsAilias["UserSelector"] = 0] = "UserSelector";
    useComponentsAilias[useComponentsAilias["DefaultMenu"] = 1] = "DefaultMenu";
    useComponentsAilias[useComponentsAilias["ShortMessageModal"] = 2] = "ShortMessageModal";
})(useComponentsAilias || (exports.useComponentsAilias = useComponentsAilias = {}));
;
exports.component_id = {
    START_MESSAGE: 'start_message',
    SHORT_MESSAGE_INPUT: 'shor_message_input',
    TARGET_USER: 'target_user',
    DISPLAY_MODE: 'display_mode',
    SHORT_MESSAGE_MODAL: 'short_message_modal',
};
exports.componentid_lookup = {
    [exports.component_id.TARGET_USER]: useComponentsAilias.UserSelector,
    [exports.component_id.START_MESSAGE]: useComponentsAilias.DefaultMenu,
    [exports.component_id.DISPLAY_MODE]: useComponentsAilias.DefaultMenu,
    [exports.component_id.SHORT_MESSAGE_MODAL]: useComponentsAilias.ShortMessageModal,
    [exports.component_id.SHORT_MESSAGE_INPUT]: useComponentsAilias.ShortMessageModal,
};
function createUserSelector() {
    const row3 = new discord_js_1.default.ActionRowBuilder()
        .addComponents(new discord_js_1.default.StringSelectMenuBuilder()
        .setCustomId(exports.component_id.TARGET_USER)
        .setPlaceholder('対象ユーザー')
        .setMinValues(1)
        .setMaxValues(1));
    return [row3];
}
function createDefaultMenu() {
    const rows = [];
    const row1 = new discord_js_1.default.ActionRowBuilder()
        .addComponents(new discord_js_1.default.StringSelectMenuBuilder()
        .setCustomId(exports.component_id.DISPLAY_MODE)
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
    const row2 = new discord_js_1.default.ActionRowBuilder()
        .addComponents(new discord_js_1.default.ButtonBuilder()
        .setLabel('メッセージを入力')
        .setStyle(discord_js_1.default.ButtonStyle.Primary)
        .setCustomId(exports.component_id.START_MESSAGE));
    rows.push(row2);
    return rows;
}
function createShortMessageModal() {
    const modal = new discord_js_1.default.ModalBuilder()
        .setCustomId(exports.component_id.SHORT_MESSAGE_MODAL)
        .setTitle('ひとこと');
    modal.setComponents(new discord_js_1.default.ActionRowBuilder().addComponents(new discord_js_1.default.TextInputBuilder()
        .setCustomId(exports.component_id.SHORT_MESSAGE_INPUT)
        .setLabel('短文を入力')
        .setStyle(discord_js_1.default.TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(64)));
    return modal;
}
