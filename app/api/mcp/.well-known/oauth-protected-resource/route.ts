import { NextRequest } from 'next/server';
import { generateProtectedResourceMetadata, jsonResponse } from '@/lib/oauth/metadata';

/**
 * OAuth Protected Resource Discovery for /api/mcp
 */
export async function GET(request: NextRequest) {
  return jsonResponse(generateProtectedResourceMetadata('/api/mcp', '/api/mcp/.well-known/oauth-authorization-server'));
}
