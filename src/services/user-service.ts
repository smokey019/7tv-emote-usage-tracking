import type { ApiClient } from '@twurple/api';
import type { HelixUser } from '@twurple/api';

/**
 * Service for looking up Twitch user information
 */
export class UserService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Gets a user's ID by their username
   * @param username - The Twitch username to look up
   * @returns The user's ID or null if not found
   */
  async getUserIdByName(username: string): Promise<string | null> {
    try {
      const user = await this.apiClient.users.getUserByName(username);
      return user?.id ?? null;
    } catch (error) {
      console.error(`[UserService] Error looking up user "${username}":`, error);
      return null;
    }
  }

  /**
   * Gets full user information by username
   * @param username - The Twitch username to look up
   * @returns The HelixUser object or null if not found
   */
  async getUserByName(username: string): Promise<HelixUser | null> {
    try {
      return await this.apiClient.users.getUserByName(username);
    } catch (error) {
      console.error(`[UserService] Error looking up user "${username}":`, error);
      return null;
    }
  }

  /**
   * Gets user information by user ID
   * @param userId - The Twitch user ID
   * @returns The HelixUser object or null if not found
   */
  async getUserById(userId: string): Promise<HelixUser | null> {
    try {
      return await this.apiClient.users.getUserById(userId);
    } catch (error) {
      console.error(`[UserService] Error looking up user ID "${userId}":`, error);
      return null;
    }
  }

  /**
   * Gets multiple users by their usernames (batched for efficiency)
   * @param usernames - Array of Twitch usernames
   * @returns Array of HelixUser objects
   */
  async getUsersByNames(usernames: string[]): Promise<HelixUser[]> {
    try {
      return await this.apiClient.users.getUsersByNames(usernames);
    } catch (error) {
      console.error(`[UserService] Error looking up users:`, error);
      return [];
    }
  }
}
