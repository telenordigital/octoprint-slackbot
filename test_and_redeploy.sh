#!/bin/bash

yarn install
yarn test
rm -rf /opt/octoprint-slackbot/*
cp -r * /opt/octoprint-slackbot/
pm2 restart octoprint-slackbot
