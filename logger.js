const winston = require('winston');
const SlackTransport = require('./slack-transport');

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(winston.format.splat(), winston.format.simple()),
    transports: [
        new winston.transports.Console(),
    ],
});

logger.addSlackLogTransport = (bot, channelName) => {
    logger.add(new SlackTransport({ bot, channel: channelName }));
};

module.exports = logger;
