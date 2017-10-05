#!/bin/bash

git remote update
git status | grep behind

if [ $? -gt 0 ]
then
  exit 0
fi

echo "origin has changed - updating"
git pull --rebase && echo "restaring app" && pm2 restart octoprint-slackbot
