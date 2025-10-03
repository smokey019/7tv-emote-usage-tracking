# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

7tv-emote-usage-tracking is a Twitch chat bot that monitors chat messages, tracks 7TV emote usage, and provides a real-time web dashboard for analytics. Built with Bun and Twurple API.

## Commands

### Running the Bot
```bash
bun run dev         # Development mode with auto-reload
bun run start       # Production mode
```

### Installing Dependencies
```bash
bun install
```

### Initial Setup
```bash
cp .env.example .env
# Then fill in the Twitch credentials in .env
```

## Key Architecture Concepts

### Service-Oriented Design

The bot follows a service-oriented architecture where each major functionality is isolated into its own service:

1. **UserService** (`src/services/user-service.ts`)
   - Wraps Twurple's `ApiClient.users` (HelixUserApi)
   - Converts Twitch usernames to user IDs via `getUserIdByName()`
   - Required by EmoteService for 7TV API calls

2. **EmoteService** (`src/services/emote-service.ts`)
   - Fetches 7TV emotes from `https://7tv.io/v3/users/twitch/{channelID}`
   - Caches emotes per channel (5 minute TTL)
   - Stores both emote names (for detection) and metadata (ID, image URL, animated flag)
   - `findEmotesInMessage()` returns unique emotes per message (no duplicates)

3. **StatisticsService** (`src/services/statistics-service.ts`)
   - Tracks emote usage counts per channel
   - Stores emote metadata (ID, imageUrl, animated) alongside usage stats
   - In-memory storage only (resets on restart)
   - Used by dashboard to show usage statistics

4. **MessageHandler** (`src/handlers/message-handler.ts`)
   - Orchestrates all message processing
   - Gets emotes for channel → finds emotes in message → records to statistics
   - Each emote counted once per message (duplicates ignored)

### Authentication Flow

**Token Management** (`src/auth/token-manager.ts`):
- Uses Twurple's `RefreshingAuthProvider` for automatic token refresh
- Initial tokens from `.env` → stored in `data/tokens/tokens.{userId}.json`
- Tokens auto-refresh and persist to disk via `onRefresh` handler
- Requires `chat` scope for read-only access

### Bot Initialization Sequence

1. `index.ts` loads environment config
2. TokenManager creates RefreshingAuthProvider with initial tokens
3. TwitchChatBot instantiates all services in dependency order:
   - ApiClient → UserService → EmoteService → StatisticsService → MessageHandler
4. Bot connects to Twurple chat
5. EmoteService pre-loads emotes for all channels (parallel fetches)
6. DashboardServer starts on port 3000

### Web Dashboard

**Architecture** (`src/web/server.ts`):
- Single-file Bun HTTP server (no Express)
- Serves HTML with embedded CSS/JavaScript (no build step)
- Two routes: `/` (dashboard HTML) and `/api/stats` (JSON endpoint)

**Key Features**:
- Auto-refresh toggle (prevents losing table sort state)
- Collapsible tables per channel showing ALL emotes (used + unused)
- Tables only render HTML when expanded (performance optimization)
- Sortable columns (Name, Uses) with persistent sort state
- Scrollable table wrapper (max-height: 600px) with sticky header

**API Enhancement**:
- `/api/stats` merges StatisticsService data with EmoteService metadata
- Returns ALL available emotes for each channel (not just used ones)
- Each emote includes: `emoteName`, `count`, `emoteId`, `imageUrl`, `animated`

### 7TV Integration

**Emote Metadata Structure**:
```typescript
{
  id: string;              // 7TV emote ID
  name: string;            // Emote name (case-sensitive)
  imageUrl: string;        // https://cdn.7tv.app/emote/{id}/1x.webp
  animated: boolean;       // Is animated emote
}
```

**API Response**: `GET https://7tv.io/v3/users/twitch/{channelID}` returns nested structure at `data.emote_set.emotes[]`

**Channel ID Requirement**: 7TV API requires Twitch numeric user IDs, not usernames. UserService converts username → ID before calling 7TV.

## Important Patterns

### Emote Detection
Emotes are detected by exact word matching (split on whitespace). Each unique emote is counted once per message regardless of repetition.

### Dashboard State Management
- `tableStates`: Tracks expand/collapse state per channel
- `sortStates`: Tracks sort column/direction per channel
- `latestChannelData`: Caches last API response to re-render without fetch
- `autoRefreshEnabled`: Controls 5-second polling interval

### Service Access Pattern
Services are accessible via TwitchChatBot getter methods:
```typescript
const bot = new TwitchChatBot(authProvider, channels);
bot.getUserService();
bot.getEmoteService();
bot.getStatisticsService();
```

DashboardServer receives EmoteService + StatisticsService via constructor injection.

### Statistics Persistence

**Storage Mechanism**:
- Statistics saved to `data/statistics/stats.json`
- Auto-saves every 30 seconds if data changed (dirty flag pattern)
- Final save on graceful shutdown (SIGINT/SIGTERM)
- Loads previous stats on startup via `loadStats()`

**File Structure**: Maps are serialized to arrays for JSON storage, then reconstructed on load:
```typescript
// Saved format
[{
  channelName: "summit1g",
  totalMessages: 100,
  totalEmotesUsed: 50,
  emotes: [{ emoteName: "peepoArrive", count: 10, ... }]
}]

// Runtime format
Map<channelName, { emotes: Map<emoteName, EmoteStats> }>
```

**Graceful Shutdown**: `index.ts` captures SIGINT/SIGTERM → calls `stopAutoSave()` → performs final save → exits

## Configuration

**Required Environment Variables**:
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET`: Twitch app credentials
- `TWITCH_BOT_USER_ID`: Bot account's numeric user ID
- `TWITCH_ACCESS_TOKEN` / `TWITCH_REFRESH_TOKEN`: Initial OAuth tokens
- `TWITCH_CHANNELS`: Comma-separated channel names (e.g., "summit1g,smokey")

**Token Generation**: Use https://twitchtokengenerator.com/ with `chat:read` scope

**User ID Lookup**: https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/

## Runtime Notes

- Bot runs continuously until SIGINT/SIGTERM
- Dashboard accessible at http://localhost:3000
- Emotes cached for 5 minutes (reduces 7TV API calls)
- Statistics persist to disk (auto-save every 30s + on shutdown)
- Statistics file: `data/statistics/stats.json` (excluded from git)
- All logging prefixed with module name (e.g., `[EmoteService]`, `[Bot]`)
