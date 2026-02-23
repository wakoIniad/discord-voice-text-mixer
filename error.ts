import fs from 'fs';
import pino from 'pino';

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
});

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

export class LocalLogManager { 
    #LOG_FILE_FORMAT: string;
    #MAX_LOGFILE_LINE_COUNT: number;

    stream: fs.WriteStream;

    getTimeStamp(format: string, DateObject: Date = new Date()) {
        const getPaddingOp = (
            char: string, 
            length: number, 
            preprocess: ($:any) => string = $ => String($),
            postprocess : ($:string[]) => string[] = $ => $
        ): ((c:any) => string) => {
            return function(raw: any): string {
                raw = preprocess(raw);
                return postprocess([char.repeat(Math.max(0, length - raw.length)), raw]).join()
            }
        }
        const head4 = getPaddingOp('0', 4);
        const head2 = getPaddingOp('0', 2);
        const tail3 = getPaddingOp('0', 3, Function.prototype.call.bind(Array.prototype.toReversed));
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
    constructor(LOG_FILE_FORMAT: string = './logs/err/{#}.log', MAX_LOGFILE_LINE_COUNT: number = 1024) {
        this.#LOG_FILE_FORMAT = LOG_FILE_FORMAT;
        this.#MAX_LOGFILE_LINE_COUNT = MAX_LOGFILE_LINE_COUNT;

        this.stream = this.#createStream();
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
    
    saveErrorMessage() {
        const date = new Date();
        if(!this.stream.writable) this.stream = this.#createStream();
        this.stream.write(
            `[${this.getTimeStamp('YYYY/MM/DD hh:mm:ss', date)}]`+
            `[]`
        );
    }
}

