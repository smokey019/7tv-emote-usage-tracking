import { RefreshingAuthProvider } from '@twurple/auth';
import type { AccessToken } from '@twurple/auth';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Manages token persistence and refreshing
 */
export class TokenManager {
  private tokenDir = './data/tokens';

  /**
   * Creates a RefreshingAuthProvider with auto-persistence
   */
  async createAuthProvider(
    clientId: string,
    clientSecret: string,
    initialToken: AccessToken
  ): Promise<RefreshingAuthProvider> {
    // Ensure token directory exists
    await fs.mkdir(this.tokenDir, { recursive: true });

    const authProvider = new RefreshingAuthProvider({
      clientId,
      clientSecret
    });

    // Set up token refresh handler to persist new tokens
    authProvider.onRefresh(async (userId, newTokenData) => {
      await this.saveToken(userId, newTokenData);
      console.log(`[TokenManager] Tokens refreshed for user ${userId}`);
    });

    // Add the initial user token with chat scope
    await authProvider.addUserForToken(initialToken, ['chat']);

    return authProvider;
  }

  /**
   * Saves token data to disk
   */
  private async saveToken(userId: string, tokenData: AccessToken): Promise<void> {
    const filePath = path.join(this.tokenDir, `tokens.${userId}.json`);
    await fs.writeFile(
      filePath,
      JSON.stringify(tokenData, null, 2),
      'utf-8'
    );
  }

  /**
   * Creates an initial token object from environment variables
   */
  static createInitialToken(accessToken: string, refreshToken: string): AccessToken {
    return {
      accessToken,
      refreshToken,
      scope: ['chat'],
      expiresIn: 0,
      obtainmentTimestamp: Date.now()
    };
  }
}
