import { NextRequest, NextResponse } from 'next/server';
import { baseURL } from '@/baseUrl';
import { getBetterAuthUrl } from '@/lib/auth/get-auth-url';
import { auth } from '@/lib/auth';

/**
 * MCP-specific OpenID Connect Discovery
 * Uses Better Auth plugin if available, otherwise returns custom metadata
 */
export async function GET(request: NextRequest) {
  // Try to use Better Auth plugin if auth instance is available
  if (auth) {
    try {
      const { oAuthDiscoveryMetadata } = await import('better-auth/plugins');
      const response = await oAuthDiscoveryMetadata(auth)(request);
      // Add MCP-specific metadata
      const data = await response.json();
      return NextResponse.json({
        ...data,
        mcp_oauth_required: true,
        mcp_auth_endpoint: `${baseURL}?mcp_auth_required=true`,
        mcp_server: `${baseURL}/mcp`,
      });
    } catch (error) {
      // Plugin not available, fall back to custom implementation
    }
  }
  
  // Custom implementation
  const authUrl = getBetterAuthUrl();
  
  return NextResponse.json({
    issuer: authUrl,
    authorization_endpoint: `${authUrl}/login`,
    token_endpoint: `${authUrl}/api/auth/token`,
    userinfo_endpoint: `${authUrl}/api/auth/get-session`,
    // OAuth 2.1 / OIDC required fields
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'], // PKCE support
    scopes_supported: ['openid', 'profile', 'email'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    // MCP-specific metadata
    mcp_oauth_required: true,
    mcp_auth_endpoint: `${baseURL}?mcp_auth_required=true`,
    mcp_server: `${baseURL}/mcp`,
  });
}

