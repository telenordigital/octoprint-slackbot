#!/bin/bash

yarn install
yarn test
rm -rf /opt/octoprint-slackbot/*
cp -r * /opt/octoprint-slackbot/
