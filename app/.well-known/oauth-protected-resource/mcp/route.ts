import { NextRequest } from 'next/server';
import { generateProtectedResourceMetadata, jsonResponse } from '@/lib/oauth/metadata';

/**
 * MCP-specific OAuth Protected Resource Discovery
 */
export async function GET(request: NextRequest) {
  return jsonResponse(generateProtectedResourceMetadata('/mcp', '/.well-known/oauth-authorization-server/mcp'));
}

