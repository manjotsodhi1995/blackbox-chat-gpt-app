import { NextRequest } from 'next/server';
import { generateProtectedResourceMetadata, jsonResponse } from '@/lib/oauth/metadata';

/**
 * Root OAuth Protected Resource Discovery
 */
export async function GET(request: NextRequest) {
  return jsonResponse(generateProtectedResourceMetadata());
}

