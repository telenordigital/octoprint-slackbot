const convict = require('convict');

const config = convict({
    env: {
        doc: 'The applicaton environment.',
        format: ['production', 'development', 'test'],
        default: 'development',
        env: 'NODE_ENV',
    },
    slackApiToken: {
        doc: 'The Slack API token for octoprint',
        format: String,
        default: 'xoxb-012345678901-abcdefghijklmnopqrstuvwx',
        env: 'OCTOPRINT_SLACK_API_TOKEN',
    },
    octoprintApiKey: {
        doc: 'The API key to Octoprint',
        format: String,
        default: '0123456789ABCDEF0123456789ABCDEF',
        env: 'OCTOPRINT_API_KEY',
    },
    octoprintAddress: {
        doc: 'The address to octoprint',
        format: String,
        default: 'octopi.local',
        env: 'OCTOPRINT_ADDRESS',
    },
    octoprintSlackUsername: {
        doc: 'The slackbot username',
        format: String,
        default: 'octoprint',
        env: 'PRINTER_NAME',
    },
});

const env = config.get('env');
config.loadFile(`./config/${env}.json`);
config.validate({ allowed: 'strict' });

module.exports = config;
