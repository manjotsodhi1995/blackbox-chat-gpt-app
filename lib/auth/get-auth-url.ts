import { websiteURL } from '@/websiteUrl';

/**
 * Get the Better Auth service URL.
 * Uses BETTER_AUTH_URL environment variable if set, otherwise falls back to websiteURL.
 */
export function getBetterAuthUrl(): string {
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || websiteURL;
}
