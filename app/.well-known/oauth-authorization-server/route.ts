import { NextRequest } from 'next/server';
import { generateOAuthServerMetadata, jsonResponse } from '@/lib/oauth/metadata';

/**
 * Root OAuth Authorization Server Discovery
 */
export async function GET(request: NextRequest) {
  return jsonResponse(generateOAuthServerMetadata());
}

