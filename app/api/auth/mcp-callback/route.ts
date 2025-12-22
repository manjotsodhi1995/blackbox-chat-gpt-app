import { NextRequest, NextResponse } from 'next/server';
import { mcpSessionStore } from '@/lib/auth/session-store';
import { getBetterAuthUrl } from '@/lib/auth/get-auth-url';
import { baseURL } from '@/baseUrl';

/**
 * OAuth callback handler for MCP authentication flow.
 * 
 * Better Auth handles the OAuth flow and sets session cookies.
 * This handler extracts the session token and maps it to the MCP session ID.
 * 
 * Note: This assumes Better Auth is configured and accessible.
 * You may need to import auth from '@/lib/auth' if available.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mcpSessionId = searchParams.get('mcp_session_id');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!mcpSessionId) {
    return NextResponse.json(
      { error: 'Missing mcp_session_id parameter' },
      { status: 400 }
    );
  }

  // Verify the OAuth callback
  // Better Auth handles the OAuth flow and sets session cookies
  // We need to extract the session token from the cookies
  
  try {
    // Get session from Better Auth using the request cookies
    // Note: Adjust this based on your Better Auth setup
    // If you have auth.api.getSession available, use it:
    // const cookieStore = await cookies();
    // const session = await auth.api.getSession({
    //   headers: request.headers,
    // });
    
    // For now, we'll extract the session token from cookies directly
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
    
    if (!sessionTokenMatch) {
      // Try to get session via Better Auth API
      const authUrl = getBetterAuthUrl();
      const sessionResponse = await fetch(`${authUrl}/api/auth/get-session`, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
        },
      });
      
      if (!sessionResponse.ok) {
        return NextResponse.redirect(
          new URL(`/?error=no_session&mcp_session_id=${mcpSessionId}`, baseURL)
        );
      }
      
      const session = await sessionResponse.json();
      
      if (!session || !session.session) {
        return NextResponse.redirect(
          new URL(`/?error=no_session&mcp_session_id=${mcpSessionId}`, baseURL)
        );
      }

      // Extract session token from Better Auth session
      // Better Auth stores session token in session.session.token
      const sessionToken = session.session.token || session.session.id;
      const expiresAt = new Date(session.session.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Store mapping: MCP session ID → Better Auth session token
      mcpSessionStore.set(
        mcpSessionId,
        sessionToken,
        session.user.id,
        expiresAt
      );

      // Redirect to success page or back to app
      return NextResponse.redirect(
        new URL(`/?auth_success=true&mcp_session_id=${mcpSessionId}`, baseURL)
      );
    }
    
    // If we have session token from cookie, validate it and store
    const sessionToken = sessionTokenMatch[1];
    const authUrl = process.env.BETTER_AUTH_URL || process.env.BLACKBOX_APP_URL || baseURL;
    const sessionResponse = await fetch(`${authUrl}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Cookie': `better-auth.session_token=${sessionToken}`,
      },
    });
    
    if (!sessionResponse.ok) {
      return NextResponse.redirect(
        new URL(`/?error=invalid_session&mcp_session_id=${mcpSessionId}`, baseURL)
      );
    }
    
    const session = await sessionResponse.json();
    
    if (!session || !session.user) {
      return NextResponse.redirect(
        new URL(`/?error=no_session&mcp_session_id=${mcpSessionId}`, baseURL)
      );
    }
    
    const expiresAt = new Date(session.session?.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Store mapping: MCP session ID → Better Auth session token
    mcpSessionStore.set(
      mcpSessionId,
      sessionToken,
      session.user.id,
      expiresAt
    );

    // Redirect to success page or back to app
    return NextResponse.redirect(
      new URL(`/?auth_success=true&mcp_session_id=${mcpSessionId}`, baseURL)
    );
  } catch (error) {
    console.error('MCP callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=callback_failed&mcp_session_id=${mcpSessionId}`, baseURL)
    );
  }
}

