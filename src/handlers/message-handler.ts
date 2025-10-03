import type { ChatMessage } from '@twurple/easy-bot';
import type { EmoteService } from '../services/emote-service';
import type { StatisticsService } from '../services/statistics-service';
import type { UserService } from '../services/user-service';

/**
 * Handles incoming chat messages
 */
export class MessageHandler {
  constructor(
    private userService: UserService,
    private emoteService: EmoteService,
    private statisticsService: StatisticsService
  ) { }

  /**
   * Processes an incoming chat message
   * @param message - The chat message event from Twurple
   */
  async handleMessage(message: ChatMessage): Promise<void> {
    const channelName = message.broadcasterName;
    const userName = message.userDisplayName;
    const userId = message.userId;
    const messageText = message.text;

    // Safely access userInfo properties (may be undefined in some contexts)
    const userInfo = (message as any).userInfo;
    const isMod = userInfo?.isMod ?? false;
    const isSubscriber = userInfo?.isSubscriber ?? false;
    const isBroadcaster = userInfo?.isBroadcaster ?? false;
    const isVip = userInfo?.isVip ?? false;

    // Log the message with user information

    // Example: Get additional user information using the UserService
    // Uncomment if you want to fetch full user details for each message
    /*
    const userDetails = await this.userService.getUserById(userId);
    if (userDetails) {
      console.log(`  User Info - Created: ${userDetails.creationDate}, Description: ${userDetails.description}`);
    }
    */

    // Log user badges/status
    const badges: string[] = [];
    if (isBroadcaster) badges.push('BROADCASTER');
    if (isMod) badges.push('MOD');
    if (isVip) badges.push('VIP');
    if (isSubscriber) badges.push('SUB');

    if (badges.length > 0) {
      console.log(`  Badges: ${badges.join(', ')}`);
    }

    // Track message statistics
    this.statisticsService.recordMessage(channelName);

    // Check for 7TV emotes in the message
    const channelEmotes = await this.emoteService.getChannelEmotes(channelName);
    const foundEmotes = this.emoteService.findEmotesInMessage(messageText, channelEmotes);

    // Record emote usage with metadata
    if (foundEmotes.length > 0) {
      for (const emote of foundEmotes) {
        const metadata = this.emoteService.getEmoteMetadata(channelName, emote);
        if (metadata) {
          this.statisticsService.recordEmoteUsage(channelName, emote, {
            emoteId: metadata.id,
            imageUrl: metadata.imageUrl,
            animated: metadata.animated
          });
        } else {
          this.statisticsService.recordEmoteUsage(channelName, emote);
        }
      }

      console.log(`[${channelName}] ${userName}: ${messageText}`);
      console.log(`  Emotes found: ${foundEmotes.join(', ')}`);
    }
  }
}
