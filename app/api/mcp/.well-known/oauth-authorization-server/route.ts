import { NextRequest } from 'next/server';
import { generateOAuthServerMetadata, jsonResponse } from '@/lib/oauth/metadata';

/**
 * OAuth Authorization Server Discovery for /api/mcp
 */
export async function GET(request: NextRequest) {
  return jsonResponse(generateOAuthServerMetadata('/api/mcp'));
}
