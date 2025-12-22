import { NextRequest } from 'next/server';
import { generateOpenIDConfiguration, jsonResponse } from '@/lib/oauth/metadata';

/**
 * OpenID Connect Discovery for /api/mcp
 */
export async function GET(request: NextRequest) {
  return jsonResponse(generateOpenIDConfiguration('/api/mcp'));
}
