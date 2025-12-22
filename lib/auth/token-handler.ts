/**
 * Token validation and refresh utilities for Better Auth session tokens.
 */

// Note: These imports need to be adjusted based on your actual Better Auth setup
// You may need to import auth from '@/lib/auth' and env from '@/env'
// For now, using placeholder types

type BetterAuthSession = {
  user: any;
  session: {
    token: string;
    expiresAt: Date | string;
  };
};

export type TokenValidationResult = {
  valid: boolean;
  session?: BetterAuthSession;
  needsRefresh?: boolean;
};

import { getBetterAuthUrl as getAuthUrl } from './get-auth-url';

/**
 * Validate Better Auth session token
 * Assumes Better Auth service has session validation endpoint
 */
export async function validateAuthToken(sessionToken: string): Promise<TokenValidationResult> {
  try {
    // Use Better Auth API to validate session
    // This creates a request with the session token as a cookie
    const authUrl = getAuthUrl();
    const response = await fetch(`${authUrl}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Cookie': `better-auth.session_token=${sessionToken}`,
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    const session = await response.json();
    
    if (!session || !session.user) {
      return { valid: false };
    }

    // Check if token needs refresh (expires in < 5 minutes)
    const expiresAt = new Date(session.session?.expiresAt || 0);
    const now = new Date();
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
    
    return {
      valid: true,
      session,
      needsRefresh: minutesUntilExpiry < 5,
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

/**
 * Refresh Better Auth session token
 * Assumes Better Auth service has refresh endpoint
 */
export async function refreshAuthToken(sessionToken: string): Promise<string | null> {
  try {
    const authUrl = getAuthUrl();
    const response = await fetch(`${authUrl}/api/auth/refresh-session`, {
      method: 'POST',
      headers: {
        'Cookie': `better-auth.session_token=${sessionToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    // Extract new session token from response cookies
    const setCookieHeader = response.headers.get('Set-Cookie');
    if (!setCookieHeader) return null;

    const match = setCookieHeader.match(/better-auth\.session_token=([^;]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

