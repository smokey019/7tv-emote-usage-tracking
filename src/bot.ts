import { ApiClient } from '@twurple/api';
import type { RefreshingAuthProvider } from '@twurple/auth';
import { Bot } from '@twurple/easy-bot';
import { MessageHandler } from './handlers/message-handler';
import { EmoteService } from './services/emote-service';
import { StatisticsService } from './services/statistics-service';
import { UserService } from './services/user-service';

/**
 * Main bot class that sets up and manages the Twitch bot
 */
export class TwitchChatBot {
  private bot: Bot;
  private apiClient: ApiClient;
  private userService: UserService;
  private emoteService: EmoteService;
  private statisticsService: StatisticsService;
  private messageHandler: MessageHandler;

  constructor(
    authProvider: RefreshingAuthProvider,
    channels: string[]
  ) {
    // Create API client for user lookups
    this.apiClient = new ApiClient({ authProvider });

    // Initialize services
    this.userService = new UserService(this.apiClient);
    this.emoteService = new EmoteService(this.userService);
    this.statisticsService = new StatisticsService();
    this.messageHandler = new MessageHandler(
      this.userService,
      this.emoteService,
      this.statisticsService
    );

    // Create the bot instance
    this.bot = new Bot({
      authProvider,
      channels,
      commands: [] // No commands needed for read-only bot
    });

    this.setupEventHandlers();

    // Pre-load emotes for all channels
    this.emoteService.preloadChannelEmotes(channels).catch(err => {
      console.error('[Bot] Error pre-loading emotes:', err);
    });
  }

  /**
   * Sets up event handlers for the bot
   */
  private setupEventHandlers(): void {
    // Handle incoming messages
    this.bot.onMessage(async (message) => {
      await this.messageHandler.handleMessage(message);
    });

    // Handle bot connection
    this.bot.onConnect(() => {
      console.log('[Bot] Connected to Twitch chat');
    });

    // Handle bot disconnection
    this.bot.onDisconnect((manually, reason) => {
      if (manually) {
        console.log('[Bot] Manually disconnected');
      } else {
        console.log(`[Bot] Disconnected: ${reason}`);
      }
    });

    // Optional: Handle other events
    /*this.bot.onSub(({ broadcasterName, userName }) => {
      console.log(`[${broadcasterName}] ${userName} subscribed!`);
    });

    this.bot.onResub(({ broadcasterName, userName, months }) => {
      console.log(`[${broadcasterName}] ${userName} resubscribed for ${months} months!`);
    });

    this.bot.onRaid(({ broadcasterName, raidingBroadcasterName, viewers }) => {
      console.log(`[${broadcasterName}] Raided by ${raidingBroadcasterName} with ${viewers} viewers!`);
    });*/
  }

  /**
   * Gets the UserService instance for external use
   */
  getUserService(): UserService {
    return this.userService;
  }

  /**
   * Gets the EmoteService instance for external use
   */
  getEmoteService(): EmoteService {
    return this.emoteService;
  }

  /**
   * Gets the StatisticsService instance for external use
   */
  getStatisticsService(): StatisticsService {
    return this.statisticsService;
  }

  /**
   * Gets the Bot instance for external use
   */
  getBot(): Bot {
    return this.bot;
  }
}
