import fs from 'fs';
import { color } from 'three/tsl';
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

export class BotCommandError extends Error {
    static PublicErrorMessages = {

    }
    $identifier: string;
    constructor(identifier: string, ...arg: any[]) {
        super(...arg)
        this.$identifier = identifier
    }
    sendErrorMessage() {

    }
}

export type MyLibRGB = [ number, number, number ];
export class MyLib {
    static getPaddingOp (
        char: string, 
        length: number, 
        preprocess: ($:any) => string = $ => String($),
        postprocess : ($:string[]) => string[] = $ => $
    ): ((c:any) => string) {
        return function(raw: any): string {
            raw = preprocess(raw);
            return postprocess([char.repeat(Math.max(0, length - raw.length)), raw]).join()
        }
    }

    static readonly TerminalFormatTarget = {
        background: 30,//'38',
        text: 40,//'48'
    } as const;

    static readonly TerminalColorMode = {
        full:   [8,2],
        byte:   [8,5],
        bit3:   [0],
        bit4:   [0],
    } as const;
    
    static CreateTextFormatOp(
        target: keyof typeof this.TerminalFormatTarget,
        rgb: MyLibRGB,
        colorMode: keyof typeof this.TerminalColorMode
    ) {
        const use_code = [...this.TerminalColorMode[colorMode]]
        use_code[0] += this.TerminalFormatTarget[target];

        const intense_diff = 60;
        const rgbmax = 256;
        const toAnsiEscapeSequence = (...arr: any[]) => {
            `\x1b[${arr.join(';')}m`;
        }
        const reset_code    = toAnsiEscapeSequence(0);
        const [add_base, self] = ({
            full:():[number, string]=>[0,`${rgb[0]};${rgb[1]};${rgb[2]}`],
            byte:():[number, string]=>[0,`${16 + 36 * (Math.floor(rgb[0]/rgbmax * 6)) + 6 * (Math.floor(rgb[1])) + (Math.floor(rgb[2]))}`],
            bit3:():[number, string]=>{
                const i = (rgb[0]+rgb[1]+rgb[2])/3;
                return [0, `${4*+(rgb[0] > i) + 2*+(rgb[1] > i) + 1*+(rgb[2] > i)}`];
            },
            /**use auto determinded intense*/
            bit4 :():[number, string]=>{
                const i = (rgb[0]+rgb[1]+rgb[2])/3;
                return [intense_diff*+(i >= rgbmax/2), `${4*+(rgb[0] > i) + 2*+(rgb[1] > i) + 1*+(rgb[2] > i)}`]
            }
        } as const)[colorMode]();
        const start_code = toAnsiEscapeSequence(`${use_code[0] + add_base}`, ...use_code.slice(1), self);
        return function(text: string) {
            return `${start_code}${text}${reset_code}`
        }
    }
}

export class LocalLogManager { 
    #LOG_FILE_FORMAT: string;
    #MAX_LOGFILE_LINE_COUNT: number;

    savestream:    NodeJS.WritableStream;
    viewstream: NodeJS.WritableStream;
    getTimeStamp(format: string, DateObject: Date = new Date()) {
        
        const head4 = this.getPaddingOp('0', 4);
        const head2 = this.getPaddingOp('0', 2);
        const tail3 = this.getPaddingOp('0', 3, Function.prototype.call.bind(Array.prototype.toReversed));
        const data = {
            "YYYY": head4(DateObject.getUTCFullYear()),
            "MM":   head2(DateObject.getUTCMonth()  ),
            "DD":   head2(DateObject.getUTCDate()   ),
            "hh":   head2(DateObject.getUTCHours()),
            "mm":   head2(DateObject.getUTCMinutes()),
            "ss":   head2(DateObject.getUTCSeconds()),
            "SSS":  tail3(DateObject.getUTCMilliseconds()),
        }
        for(const [key, value] of Object.entries(data)) {
            format = format.replaceAll(key, value);
        }
        return format;
    }
    constructor(
        LOG_FILE_FORMAT: string = './logs/err/{#}.log', 
        MAX_LOGFILE_LINE_COUNT: number = 1024,
        logstream: NodeJS.WritableStream = process.stdout,
    ) {
        this.#LOG_FILE_FORMAT = LOG_FILE_FORMAT;
        this.#MAX_LOGFILE_LINE_COUNT = MAX_LOGFILE_LINE_COUNT;

        this.savestream = this.#createStream();
        this.viewstream = logstream;
    }
    #createStream() {
        const logfile_path = this.#LOG_FILE_FORMAT.replace(/\{\#\}/, this.getTimeStamp('YYYYMMDD'));
        const logStream = fs.createWriteStream(logfile_path, { flags: 'a' });
        return logStream;
    }

    defaultErrorFormatter: ($: Error) => string = function (error: Error) {
        return `<${error.message}>\n`+
        `${error.stack}`
    }
    
    saveErrorMessage(e:Error) {
        const date = new Date();
        if(!this.savestream.writable) this.savestream = this.#createStream();
        this.savestream.write(
            `[${this.getTimeStamp('YYYY/MM/DD hh:mm:ss', date)}]`+
            `${this.defaultErrorFormatter(e)}`
        );
        if(!this.viewstream.writable) {
            this.viewstream.write();
        }
    }
}

