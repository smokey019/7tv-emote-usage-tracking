import type { UserService } from './user-service';

/**
 * Represents a 7TV emote
 */
export interface SevenTVEmote {
  id: string;
  name: string;
  flags: number;
  timestamp: number;
  actor_id: string | null;
  data: {
    id: string;
    name: string;
    flags: number;
    lifecycle: number;
    state: string[];
    listed: boolean;
    animated: boolean;
    owner: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string;
    };
  };
}

/**
 * 7TV API response structure
 */
interface SevenTVResponse {
  id: string;
  platform: string;
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set_id: string | null;
  emote_set: {
    id: string;
    name: string;
    flags: number;
    capacity: number;
    emotes: SevenTVEmote[];
  } | null;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

/**
 * Emote metadata for tracking
 */
export interface EmoteMetadata {
  id: string;
  name: string;
  imageUrl: string;
  animated: boolean;
}

/**
 * Service for fetching and managing 7TV emotes
 */
export class EmoteService {
  private emoteCache: Map<string, Set<string>> = new Map();
  private emoteMetadataCache: Map<string, Map<string, EmoteMetadata>> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private userService: UserService) {}

  /**
   * Fetches emotes for a channel from 7TV API
   * @param channelName - The Twitch channel name
   * @returns Set of emote names
   */
  async fetchChannelEmotes(channelName: string): Promise<Set<string>> {
    // Check cache first
    const cached = this.getCachedEmotes(channelName);
    if (cached) {
      return cached;
    }

    try {
      // Get channel ID from username
      const channelId = await this.userService.getUserIdByName(channelName);
      if (!channelId) {
        console.error(`[EmoteService] Could not find channel ID for ${channelName}`);
        return new Set();
      }

      // Fetch from 7TV API
      const response = await fetch(`https://7tv.io/v3/users/twitch/${channelId}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[EmoteService] Channel ${channelName} has no 7TV emotes`);
          return new Set();
        }
        throw new Error(`7TV API returned ${response.status}`);
      }

      const data = await response.json() as SevenTVResponse;

      // Extract emote names and metadata
      const emoteNames = new Set<string>();
      const emoteMetadata = new Map<string, EmoteMetadata>();

      if (data.emote_set?.emotes) {
        for (const emote of data.emote_set.emotes) {
          emoteNames.add(emote.name);

          // Store metadata for this emote
          emoteMetadata.set(emote.name, {
            id: emote.data.id,
            name: emote.name,
            imageUrl: `https://cdn.7tv.app/emote/${emote.data.id}/1x.webp`,
            animated: emote.data.animated
          });
        }
      }

      console.log(`[EmoteService] Loaded ${emoteNames.size} emotes for ${channelName}`);

      // Cache the results
      this.emoteCache.set(channelName.toLowerCase(), emoteNames);
      this.emoteMetadataCache.set(channelName.toLowerCase(), emoteMetadata);
      this.cacheTimestamps.set(channelName.toLowerCase(), Date.now());

      return emoteNames;
    } catch (error) {
      console.error(`[EmoteService] Error fetching emotes for ${channelName}:`, error);
      return new Set();
    }
  }

  /**
   * Gets cached emotes if still valid
   */
  private getCachedEmotes(channelName: string): Set<string> | null {
    const cached = this.emoteCache.get(channelName.toLowerCase());
    const timestamp = this.cacheTimestamps.get(channelName.toLowerCase());

    if (cached && timestamp) {
      const age = Date.now() - timestamp;
      if (age < this.CACHE_DURATION) {
        return cached;
      }
    }

    return null;
  }

  /**
   * Gets all emotes for a channel (from cache or fetch)
   */
  async getChannelEmotes(channelName: string): Promise<Set<string>> {
    return this.fetchChannelEmotes(channelName);
  }

  /**
   * Finds which emotes from a set are present in a message (unique only)
   * @param message - The chat message text
   * @param emotes - Set of emote names to check
   * @returns Array of unique emote names found in the message
   */
  findEmotesInMessage(message: string, emotes: Set<string>): string[] {
    const found = new Set<string>();
    const words = message.split(/\s+/);

    for (const word of words) {
      if (emotes.has(word)) {
        found.add(word);
      }
    }

    return Array.from(found);
  }

  /**
   * Gets metadata for a specific emote
   * @param channelName - The channel name
   * @param emoteName - The emote name
   * @returns Emote metadata or null if not found
   */
  getEmoteMetadata(channelName: string, emoteName: string): EmoteMetadata | null {
    const channelMetadata = this.emoteMetadataCache.get(channelName.toLowerCase());
    return channelMetadata?.get(emoteName) ?? null;
  }

  /**
   * Gets all emote metadata for a channel
   */
  getAllEmoteMetadata(channelName: string): Map<string, EmoteMetadata> | null {
    return this.emoteMetadataCache.get(channelName.toLowerCase()) ?? null;
  }

  /**
   * Pre-loads emotes for multiple channels
   */
  async preloadChannelEmotes(channelNames: string[]): Promise<void> {
    console.log(`[EmoteService] Pre-loading emotes for ${channelNames.length} channel(s)...`);

    const promises = channelNames.map(channel => this.fetchChannelEmotes(channel));
    await Promise.all(promises);

    console.log('[EmoteService] Emote pre-loading complete');
  }
}
