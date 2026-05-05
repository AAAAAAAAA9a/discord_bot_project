# discord_bot

A Discord moderation bot built with discord.js v14. Made for managing a single server.

## Features

**Moderation**
- `/ban`, `/kick` - ban or kick a user
- `/warn`, `/warnings`, `/delwarn`, `/clearwarns` - warning system backed by SQLite
- `/clear` - bulk delete messages

**Gulag**
- `/gulag` - strips all roles from a user and assigns a prisoner role for a set duration
- `/ungulag` - manually release a user early
- Roles are automatically restored when the duration expires

**Verification**
- `/verify` - swaps an unverified role for a verified/member role

**Reaction roles**
- `/reactionroles` - posts an embed in a channel; users get roles by reacting to it

**Utility**
- `/message` - sends a predefined message from config (useful for repeated announcements)

## Setup

1. Copy `.env.example` to `.env` and fill in your bot token, application ID, and guild ID.
2. Edit the JSON files in `discord_bot/config/` to set up role IDs, channel IDs, and messages for each feature.
3. Run the start script:

   - Linux/macOS: `./start.sh`
   - Windows: `start.bat`

   This runs `npm install`, deploys slash commands to the guild, and starts the bot with nodemon.

## Config

Each feature has its own JSON config file in `discord_bot/config/`:

| File | Feature |
|---|---|
| `moderacja.json` | moderation messages and log channels |
| `gulag.json` | gulag roles, channels, durations |
| `weryfikacja.json` | verification roles and log channel |
| `reakcje_role.json` | reaction role mappings |
| `wiadomosci.json` | predefined messages for `/message` |
| `gulag_users.json` | persisted gulag state |

There is also a config UI under `src/config-ui` but it is not documented yet.

## Requirements

- Node.js 18+
- A Discord bot token with the Message Content intent enabled
