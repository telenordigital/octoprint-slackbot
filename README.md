# octoprint-slackbot
Allows you to chat with your 3D printer on Slack

**Only an experiment - not working yet**

## Why?

Because you might avoid exposing the Octoprint server publicly, but still be able to remote control it from anywhere. The implementation uses the Slack Real Time Messaging API, which uses websockets to communicate. Therefore it does not require a public facing server unlike many of the other Slack APIs.

## How to run

First install [Node.js 8.0+](https://nodejs.org/en/download/) and [yarn](https://yarnpkg.com/lang/en/docs/install/)

    yarn install
    OCTOPRINT_SLACK_API_TOKEN=xxx && OCTOPRINT_API_KEY=xxx && OCTOPRINT_ADDRESS=octoprint.local yarn start
