import { NextRequest } from 'next/server';
import { generateOAuthServerMetadata, jsonResponse } from '@/lib/oauth/metadata';

/**
 * MCP-specific OAuth Authorization Server Discovery
 * Returns OAuth 2.0 Authorization Server Metadata (RFC 8414)
 */
export async function GET(request: NextRequest) {
  return jsonResponse(generateOAuthServerMetadata('/mcp'));
}

