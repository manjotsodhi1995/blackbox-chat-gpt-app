import { NextRequest, NextResponse } from 'next/server';
import { baseURL } from '@/baseUrl';

/**
 * MCP-specific OAuth Protected Resource Discovery
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    resource: `${baseURL}/mcp`,
    authorization_servers: [`${baseURL}/.well-known/oauth-authorization-server`],
    mcp_oauth_required: true,
    mcp_auth_endpoint: `${baseURL}?mcp_auth_required=true`,
    mcp_server: `${baseURL}/mcp`,
  });
}

