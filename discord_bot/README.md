# Modular Discord Bot

A modular Discord bot with various functionalities including message sending, reaction roles, user verification, moderation tools, and a "gulag" system.

## Features

- **Predefined Messages**: Send specific messages via slash commands
- **Reaction Roles**: Allow users to self-assign roles by reacting to messages
- **Verification System**: Remove one role and assign another via a command
- **Gulag System**: Remove a user's roles and assign a "jail" role
- **Moderation Tools**: Delete messages, warn, kick, and ban users

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your bot token and application ID:
   ```
   TOKEN=your_discord_bot_token_here
   APPLICATION_ID=your_application_id_here
   ```
4. Deploy slash commands:
   ```
   npm run deploy
   ```
5. Start the bot:
   ```
   npm start
   ```

## Configuration

All bot configuration is stored in the `/config` directory as JSON files in Polish language:

- `wiadomosci.json`: Predefined messages
- `weryfikacja.json`: User verification settings
- `reakcje_role.json`: Role reaction settings
- `moderacja.json`: Moderation tools settings
- `gulag.json`: Gulag system settings

## Commands

- `/message [type]`: Send a predefined message
- `/verify [user]`: Verify a user (remove unverified role, add verified role)
- `/reactionroles [channel]`: Create a reaction roles message in a channel
- `/gulag [user] [reason] [duration]`: Send a user to the gulag
- `/ungulag [user]`: Release a user from the gulag
- `/clear [count]`: Delete a specified number of messages (1-100)
- `/warn [user] [reason]`: Warn a user
- `/kick [user] [reason]`: Kick a user from the server
- `/ban [user] [reason] [delete_days]`: Ban a user from the server

## Role Reactions

Users can get roles by reacting to messages with specific emojis, as defined in the `reakcje_role.json` configuration file.

## Development

To run the bot in development mode with auto-restart on file changes:
```
npm run dev
```

## License

ISC
