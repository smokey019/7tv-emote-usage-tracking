/**
 * Environment configuration loader
 * Validates and loads all required environment variables
 */

export interface EnvConfig {
  clientId: string;
  clientSecret: string;
  botUserId: string;
  accessToken: string;
  refreshToken: string;
  channels: string[];
}

/**
 * Loads and validates environment variables
 * @throws {Error} If any required environment variable is missing
 */
export function loadEnv(): EnvConfig {
  const required = [
    'TWITCH_CLIENT_ID',
    'TWITCH_CLIENT_SECRET',
    'TWITCH_BOT_USER_ID',
    'TWITCH_ACCESS_TOKEN',
    'TWITCH_REFRESH_TOKEN',
    'TWITCH_CHANNELS'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const channels = process.env.TWITCH_CHANNELS!
    .split(',')
    .map(ch => ch.trim())
    .filter(ch => ch.length > 0);

  if (channels.length === 0) {
    throw new Error('TWITCH_CHANNELS must contain at least one channel name');
  }

  return {
    clientId: process.env.TWITCH_CLIENT_ID!,
    clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    botUserId: process.env.TWITCH_BOT_USER_ID!,
    accessToken: process.env.TWITCH_ACCESS_TOKEN!,
    refreshToken: process.env.TWITCH_REFRESH_TOKEN!,
    channels
  };
}
