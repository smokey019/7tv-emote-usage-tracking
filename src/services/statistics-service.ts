import { promises as fs } from 'fs';
import path from 'path';

/**
 * Emote usage statistics
 */
export interface EmoteStats {
  emoteName: string;
  count: number;
  lastUsed: number;
  channel: string;
  emoteId?: string;
  imageUrl?: string;
  animated?: boolean;
}

/**
 * Channel statistics
 */
export interface ChannelStats {
  channelName: string;
  totalMessages: number;
  totalEmotesUsed: number;
  emotes: Map<string, EmoteStats>;
}

/**
 * Serializable version of ChannelStats for JSON storage
 */
interface SerializableChannelStats {
  channelName: string;
  totalMessages: number;
  totalEmotesUsed: number;
  emotes: EmoteStats[];
}

/**
 * Service for tracking emote usage statistics
 */
export class StatisticsService {
  private channelStats: Map<string, ChannelStats> = new Map();
  private dataDir = './data/statistics';
  private statsFile = path.join(this.dataDir, 'stats.json');
  private saveInterval: NodeJS.Timeout | null = null;
  private isDirty = false;

  /**
   * Records emote usage in a channel
   * @param channelName - The channel where the emote was used
   * @param emoteName - The name of the emote
   * @param metadata - Optional emote metadata (ID, image URL, animated flag)
   */
  recordEmoteUsage(
    channelName: string,
    emoteName: string,
    metadata?: { emoteId: string; imageUrl: string; animated: boolean }
  ): void {
    const channel = channelName.toLowerCase();

    // Initialize channel stats if doesn't exist
    if (!this.channelStats.has(channel)) {
      this.channelStats.set(channel, {
        channelName: channel,
        totalMessages: 0,
        totalEmotesUsed: 0,
        emotes: new Map()
      });
    }

    const stats = this.channelStats.get(channel)!;

    // Get or create emote stats
    let emoteStats = stats.emotes.get(emoteName);
    if (!emoteStats) {
      emoteStats = {
        emoteName,
        count: 0,
        lastUsed: Date.now(),
        channel,
        emoteId: metadata?.emoteId,
        imageUrl: metadata?.imageUrl,
        animated: metadata?.animated
      };
      stats.emotes.set(emoteName, emoteStats);
    }

    // Update stats
    emoteStats.count++;
    emoteStats.lastUsed = Date.now();
    stats.totalEmotesUsed++;
    this.isDirty = true;
  }

  /**
   * Records a message in a channel
   * @param channelName - The channel where the message was sent
   */
  recordMessage(channelName: string): void {
    const channel = channelName.toLowerCase();

    if (!this.channelStats.has(channel)) {
      this.channelStats.set(channel, {
        channelName: channel,
        totalMessages: 0,
        totalEmotesUsed: 0,
        emotes: new Map()
      });
    }

    this.channelStats.get(channel)!.totalMessages++;
    this.isDirty = true;
  }

  /**
   * Gets statistics for a specific channel
   */
  getChannelStats(channelName: string): ChannelStats | null {
    return this.channelStats.get(channelName.toLowerCase()) ?? null;
  }

  /**
   * Gets statistics for all channels
   */
  getAllStats(): ChannelStats[] {
    return Array.from(this.channelStats.values());
  }

  /**
   * Gets top emotes across all channels
   * @param limit - Maximum number of emotes to return
   */
  getTopEmotes(limit: number = 100): EmoteStats[] {
    const allEmotes: EmoteStats[] = [];

    for (const channelStats of this.channelStats.values()) {
      allEmotes.push(...Array.from(channelStats.emotes.values()));
    }

    return allEmotes
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Gets top emotes for a specific channel
   * @param channelName - The channel to get emotes for
   * @param limit - Maximum number of emotes to return
   */
  getTopEmotesForChannel(channelName: string, limit: number = 10): EmoteStats[] {
    const channelStats = this.getChannelStats(channelName);
    if (!channelStats) return [];

    return Array.from(channelStats.emotes.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Gets emote statistics in a format suitable for JSON export
   */
  exportStats() {
    const channels = this.getAllStats().map(channel => ({
      channelName: channel.channelName,
      totalMessages: channel.totalMessages,
      totalEmotesUsed: channel.totalEmotesUsed,
      emotes: Array.from(channel.emotes.values()).sort((a, b) => b.count - a.count)
    }));

    return {
      channels,
      topEmotes: this.getTopEmotes(20),
      lastUpdated: Date.now()
    };
  }

  /**
   * Clears all statistics
   */
  clearStats(): void {
    this.channelStats.clear();
    this.isDirty = true;
    console.log('[StatisticsService] All statistics cleared');
  }

  /**
   * Saves statistics to disk
   */
  async saveStats(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.dataDir, { recursive: true });

      // Convert Map to serializable format
      const serializableData: SerializableChannelStats[] = Array.from(this.channelStats.values()).map(channel => ({
        channelName: channel.channelName,
        totalMessages: channel.totalMessages,
        totalEmotesUsed: channel.totalEmotesUsed,
        emotes: Array.from(channel.emotes.values())
      }));

      // Write to file
      await fs.writeFile(
        this.statsFile,
        JSON.stringify(serializableData, null, 2),
        'utf-8'
      );

      this.isDirty = false;
      console.log('[StatisticsService] Statistics saved to disk');
    } catch (error) {
      console.error('[StatisticsService] Error saving statistics:', error);
    }
  }

  /**
   * Loads statistics from disk
   */
  async loadStats(): Promise<void> {
    try {
      const data = await fs.readFile(this.statsFile, 'utf-8');
      const serializableData: SerializableChannelStats[] = JSON.parse(data);

      // Convert back to Map structure
      this.channelStats.clear();
      for (const channel of serializableData) {
        const emotesMap = new Map<string, EmoteStats>();
        for (const emote of channel.emotes) {
          emotesMap.set(emote.emoteName, emote);
        }

        this.channelStats.set(channel.channelName, {
          channelName: channel.channelName,
          totalMessages: channel.totalMessages,
          totalEmotesUsed: channel.totalEmotesUsed,
          emotes: emotesMap
        });
      }

      console.log(`[StatisticsService] Loaded statistics for ${this.channelStats.size} channel(s)`);
      this.isDirty = false;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('[StatisticsService] No existing statistics file found, starting fresh');
      } else {
        console.error('[StatisticsService] Error loading statistics:', error);
      }
    }
  }

  /**
   * Starts auto-save interval (saves every 30 seconds if data changed)
   */
  startAutoSave(): void {
    if (this.saveInterval) {
      return;
    }

    this.saveInterval = setInterval(async () => {
      if (this.isDirty) {
        await this.saveStats();
      }
    }, 30000); // Save every 30 seconds

    console.log('[StatisticsService] Auto-save enabled (every 30 seconds)');
  }

  /**
   * Stops auto-save and performs final save
   */
  async stopAutoSave(): Promise<void> {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }

    // Final save if needed
    if (this.isDirty) {
      await this.saveStats();
    }

    console.log('[StatisticsService] Auto-save stopped');
  }
}
