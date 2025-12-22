import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * RFC 7591 Dynamic Client Registration Endpoint
 * Handles OAuth 2.0 client registration requests from ChatGPT
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate client credentials
    const clientId = `mcp_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = crypto.randomBytes(32).toString('hex');
    
    // Extract client metadata from request
    const {
      redirect_uris = [],
      client_name = 'ChatGPT MCP Client',
      grant_types = ['authorization_code', 'refresh_token'],
      response_types = ['code'],
      token_endpoint_auth_method = 'client_secret_post',
      scope = 'openid profile email',
    } = body;
    
    // Store client registration (in-memory for now)
    // In production, you'd store this in a database
    const clientRegistration = {
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0, // Never expires
      redirect_uris,
      grant_types,
      response_types,
      client_name,
      token_endpoint_auth_method,
      scope,
    };
    
    console.log('[OAuth] Registered new client:', {
      client_id: clientId,
      client_name,
      redirect_uris,
    });
    
    // Return client credentials per RFC 7591
    return NextResponse.json(clientRegistration, { status: 201 });
  } catch (error) {
    console.error('[OAuth] Client registration error:', error);
    return NextResponse.json(
      {
        error: 'invalid_request',
        error_description: 'Failed to register OAuth client',
      },
      { status: 400 }
    );
  }
}
