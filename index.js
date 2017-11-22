const SlackBot = require('slackbots');
const fetch = require('node-fetch');
const FormData = require('form-data');
const messageHandler = require('./message-handler');
const config = require('./config');
const logger = require('./logger');

const API_TOKEN = config.get('slackApiToken');
const PRINTER_NAME = config.get('octoprintSlackUsername');
const TEST_CHANNEL = 'octoprint-bot-test';
const LOG_CHANNEL = 'octoprint-bot-log';

if (!API_TOKEN) {
    logger.error('Missing SLACK_API_TOKEN!');
    process.exit(1);
}

const bot = new SlackBot({
    token: API_TOKEN,
    name: PRINTER_NAME,
});

logger.addSlackLogTransport(bot, LOG_CHANNEL);

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection %s', reason);
    process.exit(1);
});

function websocketTrouble() {
    logger.error('WebSocket connection error. Exiting.');
    process.exit(1);
}

let messageId = 0;
let connectionTestTimer;
let botUser;
let botUserId;

bot.on('start', () => {
    logger.info('Bot started');
    botUser = bot.users.find(u => u.name === PRINTER_NAME);
    botUserId = botUser.id;

    bot.postMessageToGroup(TEST_CHANNEL, 'Hi');

    setInterval(() => {
        messageId += 1;
        bot.ws.send(JSON.stringify({
            id: messageId,
            type: 'ping',
        }));
        connectionTestTimer = setTimeout(websocketTrouble, 5000);
    }, 10000);
});

function getFileInfo(fileId) {
    return bot._api('files.info', { file: fileId })
        .then(body => Object.assign({}, body.file, { comments: body.comments }));
}

function exit(...msg) {
    if (msg) { logger.error(msg.join(' ')); }

    if (bot.ws && bot.ws.readyState === bot.ws.OPEN) {
        bot.ws.close(() => exit());
        return;
    }
    process.exit(1);
}

function respondTo(event, text, attachment) {
    return bot.postMessage(event.channel, text, { as_user: true, attachments: [attachment] })
        .catch(err => logger.error(err));
}

function uploadFile(channels, imageStream, responseText) {
    const form = new FormData();
    form.append('file', imageStream);
    form.append('channels', channels);
    form.append('token', API_TOKEN);
    if (responseText) {
        form.append('initial_comment', responseText);
    }

    fetch('https://slack.com/api/files.upload', { method: 'POST', body: form })
        .then(res => logger.info('File uploaded successfully %o', res))
        .catch(err => logger.error('File upload error %o', err));
}


bot.on('message', (event) => {
    const { text, type, file } = event;
    const isMention = text && text.includes(`<@${botUserId}>`);
    const isFile = type && type === 'file_shared' && file;
    const isFromMyself = (botUserId === event.user_id || PRINTER_NAME === event.username);
    const isPong = type && type === 'pong';
    // const isFileAnnouncement = type && type === 'message' && file;

    const isOfInterest = (isMention || isFile) && !isFromMyself;
    if (isPong) {
        clearTimeout(connectionTestTimer);
        return;
    } else if (!isOfInterest) {
        return; // ignore messages that doesn't mention the bot
    }

    const fileInfoPromise = (isFile ? getFileInfo(file.id) : Promise.resolve(null));

    logger.debug('Handling message: %s', text);

    messageHandler.handle({ text, fileInfoPromise })
        .then(({ responseText, imageStream }) => {
            logger.debug('Handle result: %s', responseText);
            let attachements;
            if (imageStream) {
                uploadFile(event.channel, imageStream, responseText);
            } else if (responseText) {
                respondTo(event, responseText, attachements);
            }
        })
        .catch((error) => {
            respondTo(event, error.message);
        });
});

bot.on('error', (event) => {
    exit('Bot error', event.message);
});

bot.on('close', () => {
    exit('Bot websocket connection closed');
});
