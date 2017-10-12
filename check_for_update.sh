#!/bin/bash

git remote update
git status | grep behind

if [ $? -gt 0 ]
then
  exit 0
fi

set -e

echo "origin has changed - updating"
git pull --rebase

./test_and_redeploy.sh
