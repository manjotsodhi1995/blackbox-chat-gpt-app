import { NextRequest, NextResponse } from 'next/server';
import { baseURL } from '@/baseUrl';

/**
 * MCP-specific discovery endpoint for /api/mcp
 * Returns MCP server metadata including OAuth configuration
 */
export async function GET(request: NextRequest) {
  const mcpServerUrl = `${baseURL}/api/mcp`;
  
  return NextResponse.json({
    name: 'blackbox-mcp-server',
    version: '1.0.0',
    description: 'Blackbox MCP server with OAuth authentication',
    mcpVersion: '2024-11-05',
    capabilities: {
      tools: true,
      prompts: false,
      resources: false,
    },
    oauth: {
      required: true,
      authorizationServerMetadataUrl: `${baseURL}/api/mcp/.well-known/oauth-authorization-server`,
      protectedResourceMetadataUrl: `${baseURL}/api/mcp/.well-known/oauth-protected-resource`,
    },
    server: mcpServerUrl,
  });
}
