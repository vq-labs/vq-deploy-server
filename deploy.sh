#!/bin/sh
git pull
npm install
pm2 restart ../ecosystem.config.js --only 'Deploy Server'