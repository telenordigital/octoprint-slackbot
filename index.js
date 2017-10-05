const SlackBot = require('slackbots');
const messageHandler = require('./message-handler');
const config = require('./config');

const API_TOKEN = config.get('slackApiToken');
const PRINTER_NAME = config.get('octoprintSlackUsername');

if (!API_TOKEN) {
    console.error('Missing SLACK_API_TOKEN!');
    process.exit(1);
}

const bot = new SlackBot({
    token: API_TOKEN,
    name: PRINTER_NAME,
});
let botUser;
let botUserId;

bot.on('start', () => {
    console.log('Bot started');
    botUser = bot.users.find(u => u.name === PRINTER_NAME);
    botUserId = botUser.id;

    setInterval(() => {
        console.log('Checing connection - ready state: ', bot.ws.readyState);
        bot.postMessageToGroup('octoprint-bot-test', 'ping', (data) => {
            if (data && (data instanceof Error || data.ok === false)) {
                process.exit('Connection test failed!', data.message || data.error);
            }
        });
    }, 60000);
});

function getFileInfo(fileId) {
    return bot._api('files.info', { file: fileId })
        .then(body => Object.assign({}, body.file, { comments: body.comments }));
}

function exit(...msg) {
    if (msg) { console.error(msg.join(' ')); }

    if (bot.ws && bot.ws.readyState === bot.ws.OPEN) {
        bot.ws.close(() => exit());
        return;
    }
    process.exit(1);
}

function respondTo(event, text, attachment) {
    return bot.postMessage(event.channel, text, { as_user: true, attachments: [attachment] });
}

bot.on('message', (event) => {
    const { text, type, file } = event;
    const isMention = text && text.includes(`<@${botUserId}>`);
    const isFile = type && type === 'file_shared' && file;
    // const isFileAnnouncement = type && type === 'message' && file;

    if (!isMention || !isFile) {
        return; // ignore messages that doesn't mention the bot
    }

    const fileInfoPromise = (isFile ? getFileInfo(file.id) : Promise.resolve(null));

    messageHandler.handle({ text, fileInfoPromise })
        .then((responseText) => {
            respondTo(event, responseText);
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
