import { NextRequest, NextResponse } from 'next/server';
import { baseURL } from '@/baseUrl';
import { getBetterAuthUrl } from '@/lib/auth/get-auth-url';

/**
 * MCP Server Discovery Document
 * This is what ChatGPT checks to determine if the MCP server implements OAuth
 */
export async function GET(request: NextRequest) {
  const authUrl = getBetterAuthUrl();
  
  return NextResponse.json({
    name: 'blackbox-mcp-server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    serverUrl: `${baseURL}/mcp`,
    // OAuth configuration
    auth: {
      type: 'oauth2',
      authorizationServerMetadataUrl: `${baseURL}/.well-known/oauth-authorization-server`,
      protectedResourceMetadataUrl: `${baseURL}/.well-known/oauth-protected-resource`,
      clientRegistrationUrl: `${authUrl}/api/auth/oauth/register`,
    },
  });
}

