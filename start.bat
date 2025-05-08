@echo off
cd %~dp0discord_bot
npm install
npm run deploy
npm run dev
pause