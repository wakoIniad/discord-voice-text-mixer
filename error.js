"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalLogManager = exports.MyLib = void 0;
const fs_1 = __importDefault(require("fs"));
/*import pino from 'pino';

const logger = pino({
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          destination: 1
        }
      },
      {
        target: 'pino/file',
        options: {
          destination: './logs/app.log',
          mkdir: true
        }
      }
    ]
  }
});*/
class IdentifiableError extends Error {
    $knownErrors = [];
    $identifier;
    constructor(identifier, ...arg) {
        super(...arg);
        this.$identifier = identifier;
    }
}
class MyLib {
    static getPaddingOp(char, length, preprocess = $ => String($), postprocess = $ => $) {
        return function (raw) {
            raw = preprocess(raw);
            return postprocess([char.repeat(Math.max(0, length - raw.length)), raw]).join();
        };
    }
    static ANSIFormatTarget = {
        background: 30, //'38',
        text: 40, //'48'
    };
    static ANSIColorMode = {
        full: [8, 2],
        byte: [8, 5],
        bit3: [0],
        bit4: [0],
    };
    static ANSIFormatOption = {
        bold: 1,
        faint: 2,
        italic: 3,
        underline: 4,
        reverse: 7,
    };
    static getTimeStamp(format, DateObject = new Date()) {
        const head4 = this.getPaddingOp('0', 4);
        const head2 = this.getPaddingOp('0', 2);
        const tail3 = this.getPaddingOp('0', 3, Function.prototype.call.bind(Array.prototype.toReversed));
        const data = {
            "YYYY": head4(DateObject.getUTCFullYear()),
            "MM": head2(DateObject.getUTCMonth()),
            "DD": head2(DateObject.getUTCDate()),
            "hh": head2(DateObject.getUTCHours()),
            "mm": head2(DateObject.getUTCMinutes()),
            "ss": head2(DateObject.getUTCSeconds()),
            "SSS": tail3(DateObject.getUTCMilliseconds()),
        };
        for (const [key, value] of Object.entries(data)) {
            format = format.replaceAll(key, value);
        }
        return format;
    }
    static CreateTextFormatOp(target, rgb, colorMode, options = []) {
        const use_code = [...this.ANSIColorMode[colorMode]];
        use_code[0] += this.ANSIFormatTarget[target];
        const intense_diff = 60;
        const rgbmax = 256;
        const toAnsiEscapeSequence = (...arr) => {
            `\x1b[${arr.join(';')}m`;
        };
        const reset_code = toAnsiEscapeSequence(0);
        const [add_base, self] = {
            full: () => [0, `${rgb[0]};${rgb[1]};${rgb[2]}`],
            byte: () => [0, `${16 + 36 * (Math.floor(rgb[0] / rgbmax * 6)) + 6 * (Math.floor(rgb[1])) + (Math.floor(rgb[2]))}`],
            bit3: () => {
                const i = (rgb[0] + rgb[1] + rgb[2]) / 3;
                return [0, `${4 * +(rgb[0] > i) + 2 * +(rgb[1] > i) + 1 * +(rgb[2] > i)}`];
            },
            /**use auto determinded intense*/
            bit4: () => {
                const i = (rgb[0] + rgb[1] + rgb[2]) / 3;
                return [intense_diff * +(i >= rgbmax / 2), `${4 * +(rgb[0] > i) + 2 * +(rgb[1] > i) + 1 * +(rgb[2] > i)}`];
            }
        }[colorMode]();
        const start_code = toAnsiEscapeSequence(...options.map(opt => this.ANSIFormatOption[opt]), `${use_code[0] + add_base}`, ...use_code.slice(1), self);
        return function (text) {
            return `${start_code}${text}${reset_code}`;
        };
    }
}
exports.MyLib = MyLib;
class LocalLogManager {
    #LOG_FILE_FORMAT;
    #MAX_LOGFILE_LINE_COUNT;
    savestream;
    viewstream;
    constructor(LOG_FILE_FORMAT = './logs/err/{#}.log', MAX_LOGFILE_LINE_COUNT = 1024, logstream = process.stdout) {
        this.#LOG_FILE_FORMAT = LOG_FILE_FORMAT;
        this.#MAX_LOGFILE_LINE_COUNT = MAX_LOGFILE_LINE_COUNT;
        this.savestream = this.#createStream();
        this.viewstream = logstream;
    }
    #createStream() {
        const logfile_path = this.#LOG_FILE_FORMAT.replace(/\{\#\}/, MyLib.getTimeStamp('YYYYMMDD'));
        const logStream = fs_1.default.createWriteStream(logfile_path, { flags: 'a' });
        return logStream;
    }
    defaultErrorFormatter = function (error) {
        return `<${error.message}>\n` +
            `${error.stack}`;
    };
    SaveErrorMessage(e) {
        const date = new Date();
        if (!this.savestream.writable)
            this.savestream = this.#createStream();
        const text = `[${MyLib.getTimeStamp('YYYY/MM/DD hh:mm:ss', date)}]` +
            `${this.defaultErrorFormatter(e)}`;
        this.savestream.write(text);
    }
    isKnownError() {
    }
}
exports.LocalLogManager = LocalLogManager;
