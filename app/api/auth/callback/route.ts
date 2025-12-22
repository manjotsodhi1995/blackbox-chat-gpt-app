import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth/client';
import { mcpSessionStore } from '@/lib/auth/session-store';
import { baseURL } from '@/baseUrl';

/**
 * OAuth callback handler.
 * 
 * Flow:
 * 1. Better Auth service redirects here with authorization code
 * 2. Exchange code for tokens
 * 3. Store MCP session → token mapping
 * 4. Redirect back to app
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contains MCP session ID
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, baseURL)
    );
  }
  
  if (!code || !state) {
    console.error('[Auth Callback] Missing code or state');
    return NextResponse.redirect(
      new URL('/?error=missing_params', baseURL)
    );
  }
  
  try {
    // Exchange code for tokens
    const redirectUri = new URL('/api/auth/callback', baseURL).toString();
    const tokenResponse = await authClient.exchangeCodeForToken(code, redirectUri);
    
    // Validate token to get user info
    const userInfo = await authClient.validateToken(tokenResponse.access_token);
    if (!userInfo) {
      throw new Error('Token validation failed after exchange');
    }
    
    // Store session mapping: MCP session ID → auth token
    // Note: This route uses OAuth tokens, but Better Auth uses session tokens
    // This route may not be used if using Better Auth's mcp-callback route
    const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));
    mcpSessionStore.set(
      state,
      tokenResponse.access_token, // authSessionToken
      userInfo.id, // userId
      expiresAt
    );
    
    console.log(`[Auth Callback] Successfully authenticated MCP session: ${state}`);
    
    // Redirect back to app (ChatGPT will retry MCP connection)
    return NextResponse.redirect(new URL('/?auth_success=true', baseURL));
    
  } catch (error) {
    console.error('[Auth Callback] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorMessage)}`, baseURL)
    );
  }
}

