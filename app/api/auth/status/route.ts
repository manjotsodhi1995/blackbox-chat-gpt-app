import { NextRequest, NextResponse } from 'next/server';
import { mcpSessionStore } from '@/lib/auth/session-store';
import { extractMCPSessionId } from '@/lib/mcp/session-extractor';
import { validateAuthToken } from '@/lib/auth/token-handler';
import { baseURL } from '@/baseUrl';
import type { AuthStatusResponse } from '@/lib/types/auth';

/**
 * Check authentication status for MCP session.
 * 
 * Returns:
 * - { authenticated: true, user: {...} } if authenticated
 * - { authenticated: false, authUrl: "..." } if not authenticated
 */
export async function GET(request: NextRequest): Promise<NextResponse<AuthStatusResponse>> {
  const mcpSessionId = extractMCPSessionId(request);
  
  if (!mcpSessionId) {
    return NextResponse.json(
      { authenticated: false, error: 'No MCP session ID provided' },
      { status: 400 }
    );
  }
  
  const mcpSession = mcpSessionStore.get(mcpSessionId);
  
  if (!mcpSession) {
    // Not authenticated - generate auth URL
    const authUrl = new URL(baseURL);
    authUrl.searchParams.set('mcp_session_id', mcpSessionId);
    authUrl.searchParams.set('mcp_auth_required', 'true');
    
    return NextResponse.json({
      authenticated: false,
      authUrl: authUrl.toString(),
    });
  }
  
  // Validate token
  const validation = await validateAuthToken(mcpSession.authSessionToken);
  
  if (!validation.valid || !validation.session) {
    const authUrl = new URL(baseURL);
    authUrl.searchParams.set('mcp_session_id', mcpSessionId);
    authUrl.searchParams.set('mcp_auth_required', 'true');
    
    return NextResponse.json({
      authenticated: false,
      authUrl: authUrl.toString(),
    });
  }
  
  // Authenticated - return user info
  return NextResponse.json({
    authenticated: true,
    user: {
      id: validation.session.user.id,
      email: validation.session.user.email,
      name: validation.session.user.name,
    },
  });
}

