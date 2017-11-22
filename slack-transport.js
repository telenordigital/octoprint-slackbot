const Transport = require('winston-transport');

const levelToColor = {
    DEBUG: '#0000ff',
    INFO: '#00ff00',
    WARN: '#ff8000',
    ERROR: '#ff0000',
};

module.exports = class SlackTransport extends Transport {
    constructor(opts) {
        super(opts);
        if (!opts.bot || !opts.channel) {
            throw new Error('Missing bots option');
        }
        this.bot = opts.bot;
        this.channel = opts.channel;
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        const level = info[Symbol.for('level')];

        this.bot.postMessageToGroup(this.channel, info[Symbol.for('message')], {
            attachments: [{
                pretext: level,
                color: levelToColor[level],
            }],
        });

        // Perform the writing to the remote service
        callback();
    }
};
