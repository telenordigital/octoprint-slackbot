#!/bin/bash

cd "$(dirname "$0")"

yarn install
yarn test
rm -rf /opt/octoprint-slackbot/*
cp -r * /opt/octoprint-slackbot/
pm2 restart octoprint-slackbot
echo octoprint-slackbot updated and redeployed
