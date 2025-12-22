import { websiteURL } from '@/websiteUrl';
import type { AuthTokenResponse, UserInfo } from '@/lib/types/auth';

/**
 * Client for interacting with Better Auth service.
 * Treats auth service as black box - only knows public OAuth API.
 */
const AUTH_SERVICE_URL = process.env.BETTER_AUTH_URL || websiteURL;
const AUTH_CLIENT_ID = process.env.BETTER_AUTH_CLIENT_ID;
const AUTH_CLIENT_SECRET = process.env.BETTER_AUTH_CLIENT_SECRET;

class BetterAuthClient {
  /**
   * Generate OAuth authorization URL
   * @param redirectUri - Callback URL after OAuth flow
   * @param state - State parameter (should include MCP session ID)
   */
  generateAuthUrl(redirectUri: string, state: string): string {
    if (!AUTH_CLIENT_ID) {
      throw new Error('BETTER_AUTH_CLIENT_ID environment variable is required');
    }
    
    const params = new URLSearchParams({
      client_id: AUTH_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: state, // Include MCP session ID in state for CSRF protection
    });
    
    return `${AUTH_SERVICE_URL}/oauth/authorize?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<AuthTokenResponse> {
    if (!AUTH_CLIENT_ID || !AUTH_CLIENT_SECRET) {
      throw new Error('Auth client credentials are required');
    }
    
    const response = await fetch(`${AUTH_SERVICE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: AUTH_CLIENT_ID,
        client_secret: AUTH_CLIENT_SECRET,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }
  
  /**
   * Validate token (call auth service's introspection endpoint)
   * Returns user info if token is valid, null otherwise
   */
  async validateToken(token: string): Promise<UserInfo | null> {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/oauth/introspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      // Check if token is active (standard OAuth introspection response)
      if (!data.active) return null;
      
      return {
        id: data.sub || data.user_id || data.id,
        email: data.email,
        name: data.name,
      };
    } catch (error) {
      console.error('[Auth Client] Token validation error:', error);
      return null;
    }
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokenResponse> {
    if (!AUTH_CLIENT_ID || !AUTH_CLIENT_SECRET) {
      throw new Error('Auth client credentials are required');
    }
    
    const response = await fetch(`${AUTH_SERVICE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: AUTH_CLIENT_ID,
        client_secret: AUTH_CLIENT_SECRET,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }
}

export const authClient = new BetterAuthClient();

