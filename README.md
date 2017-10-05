# octoprint-slackbot
Allows you to chat with your 3D printer on Slack

**Only an experiment - not working yet**

## Why?

Because you might avoid exposing the Octoprint server publicly, but still be able to remote control it from anywhere. The implementation uses the Slack Real Time Messaging API, which uses websockets to communicate. Therefore it does not require a public facing server unlike many of the other Slack APIs.
