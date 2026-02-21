# 7tv-emote-usage-tracking

A Twitch chat bot that monitors chat messages, tracks 7TV emote usage, and provides a real-time web dashboard for analytics. Track how often each emote is used so you can identify which emotes aren't being used and clean up your emote list. Built with Bun and Twurple.

## Features

- 📖 Read-only chat monitoring (no bot commands sent)
- 🎨 7TV emote tracking and usage statistics
- 📈 Real-time web dashboard with auto-refresh
- 🌓 Light/dark theme toggle
- 🔍 Per-channel search/filter and sortable tables
- 📋 Shows all emotes (used + unused) so you can spot dead emotes
- 🔗 Direct "View on 7TV" links for each emote
- 🔄 Automatic OAuth token refreshing
- 💾 Persistent statistics (auto-save every 30s + graceful shutdown save)
- 📱 Responsive layout (desktop, tablet, mobile)

## Prerequisites

- [Bun](https://bun.sh) installed
- A Twitch account for the bot
- A Twitch application (create one at [dev.twitch.tv](https://dev.twitch.tv/console/apps))

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   ```bash
   bun run setup
   ```

   Fill in your `.env` file with:
   - `TWITCH_CLIENT_ID` - From your Twitch app
   - `TWITCH_CLIENT_SECRET` - From your Twitch app
   - `TWITCH_ACCESS_TOKEN` - Initial access token
   - `TWITCH_REFRESH_TOKEN` - Initial refresh token
   - `TWITCH_CHANNELS` - Comma-separated list of channels to monitor

3. **Get your tokens:**
   - Use the [Twitch Token Generator](https://twitchtokengenerator.com/) to get initial tokens
   - Make sure to select the `chat` scope

## Running the Bot

```bash
bun run dev
```

or

```bash
bun run start
```

The bot will start and automatically:
- Connect to the specified Twitch channels
- Load 7TV emotes for each channel
- Begin tracking emote usage statistics
- Start the web dashboard at **http://localhost:3000**

## Web Dashboard

Once the bot is running, open your browser to **http://localhost:3000** to view:

- 📊 Global stats cards (total messages, total emotes used, channels tracked)
- 🏆 Top emotes across all channels (card grid with images)
- 📈 Per-channel breakdown with top-10 emote cards
- 📋 Collapsible full emote tables per channel showing **all** emotes (used + unused)
- 🔍 Per-table search/filter to quickly find specific emotes
- ↕️ Sortable columns (Name, Uses) with persistent sort state
- 🔗 "View on 7TV" links for each emote
- 🌓 Light/dark theme toggle (saved to localStorage)
- 🔄 Auto-refresh toggle (5-second polling) with manual refresh button
- 📱 Responsive layout (desktop, tablet, mobile breakpoints)

## Project Structure

```
7tv-emote-usage-tracking/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment configuration
│   ├── auth/
│   │   └── token-manager.ts    # Token persistence and refreshing
│   ├── services/
│   │   ├── user-service.ts     # User lookup service
│   │   ├── emote-service.ts    # 7TV emote fetching & caching
│   │   └── statistics-service.ts # Emote usage statistics
│   ├── handlers/
│   │   └── message-handler.ts  # Chat message processing
│   ├── web/
│   │   └── server.ts           # Web dashboard server
│   ├── bot.ts                  # Main bot class
│   └── index.ts                # Entry point
├── data/                         # Runtime data (git-ignored)
│   ├── tokens/                 # Auto-refreshed tokens (created automatically)
│   └── statistics/             # Emote usage stats (created automatically)
├── .env                        # Your configuration (not in git)
├── .env.example                # Example configuration
└── package.json
```

## Customization

### Adding Custom Message Processing

Edit [src/handlers/message-handler.ts](src/handlers/message-handler.ts) to add your own message processing logic:

```typescript
async handleMessage(message: MessageEvent): Promise<void> {
  // Your custom logic here
  if (message.text.includes('keyword')) {
    // Do something
  }
}
```

### Using the Services

The bot includes several services for different functionality:

**User Service** - Look up Twitch user information:
```typescript
const userService = chatBot.getUserService();
const user = await userService.getUserByName('username');
console.log(`User ID: ${user?.id}`);
```

**Emote Service** - Fetch and detect 7TV emotes:
```typescript
const emoteService = chatBot.getEmoteService();
const emotes = await emoteService.getChannelEmotes('channelname');
const found = emoteService.findEmotesInMessage('Hello PogChamp', emotes);
```

**Statistics Service** - Access emote usage stats:
```typescript
const statsService = chatBot.getStatisticsService();
const topEmotes = statsService.getTopEmotes(10);
const channelStats = statsService.getChannelStats('channelname');
```

## How It Works

1. **Emote Loading**: On startup, the bot fetches all 7TV emotes for each configured channel using the channel's Twitch ID
2. **Message Processing**: Each chat message is analyzed to detect which emotes (if any) are being used
3. **Statistics Tracking**: Emote usage is tracked per channel and globally
4. **Persistent Storage**: Statistics are automatically saved to `data/statistics/stats.json` every 30 seconds and on shutdown
5. **Web Dashboard**: A Bun server provides a real-time dashboard showing all statistics
6. **Caching**: Emotes are cached for 5 minutes to reduce API calls

## Data Persistence

All emote usage statistics are automatically saved to disk and persist across bot restarts:

- **Auto-save**: Statistics save every 30 seconds if changes are detected
- **Graceful Shutdown**: Final save occurs when bot stops (Ctrl+C)
- **Location**: `data/statistics/stats.json`
- **On Startup**: Previous statistics are automatically loaded

This ensures you never lose your emote usage data, even during updates or restarts.

## API Endpoints

The web dashboard exposes the following endpoints:

- `GET /` - Main dashboard HTML page
- `GET /api/stats` - JSON statistics data

## License

MIT
