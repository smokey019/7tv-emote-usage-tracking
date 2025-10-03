import { loadEnv } from './config/env';
import { TokenManager } from './auth/token-manager';
import { TwitchChatBot } from './bot';
import { DashboardServer } from './web/server';

// Store chatBot globally for graceful shutdown
let chatBot: TwitchChatBot | null = null;

/**
 * Main entry point for the Twitch chat bot
 */
async function main() {
  try {
    console.log('[Main] Starting Twitch Chat Bot...');

    // Load environment variables
    const config = loadEnv();
    console.log(`[Main] Loaded configuration for ${config.channels.length} channel(s): ${config.channels.join(', ')}`);

    // Create token manager and auth provider
    const tokenManager = new TokenManager();
    const initialToken = TokenManager.createInitialToken(
      config.accessToken,
      config.refreshToken
    );

    const authProvider = await tokenManager.createAuthProvider(
      config.clientId,
      config.clientSecret,
      config.botUserId,
      initialToken
    );

    console.log('[Main] Authentication provider initialized');

    // Create and start the bot
    chatBot = new TwitchChatBot(authProvider, config.channels);

    // Load existing statistics
    await chatBot.getStatisticsService().loadStats();

    // Start auto-save
    chatBot.getStatisticsService().startAutoSave();

    console.log('[Main] Bot initialized and connecting to channels...');
    console.log('[Main] Bot is now listening to chat messages. Press Ctrl+C to stop.');

    // Start the web dashboard
    const dashboard = new DashboardServer(
      chatBot.getStatisticsService(),
      chatBot.getEmoteService(),
      3000
    );
    dashboard.start();

    console.log('[Main] Dashboard available at http://localhost:3000');

  } catch (error) {
    console.error('[Main] Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function shutdown() {
  console.log('\n[Main] Shutting down bot...');

  if (chatBot) {
    // Stop auto-save and perform final save
    await chatBot.getStatisticsService().stopAutoSave();
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the bot
main();
