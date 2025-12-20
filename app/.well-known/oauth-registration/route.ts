import { NextResponse } from "next/server";
import { baseURL } from "@/baseUrl";
import { websiteURL } from "@/websiteUrl";
import { randomBytes } from "crypto";

/**
 * OAuth 2.0 Dynamic Client Registration (RFC 7591)
 * 
 * Allows clients (like ChatGPT) to dynamically register with the OAuth server.
 * Returns client_id and client_secret for the client to use.
 * 
 * For MCP servers, we use a simplified registration that returns a static
 * client configuration since we don't need per-client secrets.
 */

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Extract client metadata from request
    const {
      client_name,
      redirect_uris = [],
      grant_types = ["authorization_code"],
      response_types = ["code"],
      scope,
      token_endpoint_auth_method = "none",
    } = body;

    // Generate client ID (for tracking, but not strictly required)
    const clientId = `mcp_${randomBytes(16).toString("hex")}`;
    
    // For MCP servers, we don't require client_secret
    // The OAuth flow uses public client flow (no secret needed)
    // This is common for MCP servers
    
    // Build redirect URIs - use MCP server callback URL
    const defaultRedirectUri = `${baseURL}/api/auth/callback`;
    const finalRedirectUris = redirect_uris.length > 0 
      ? redirect_uris 
      : [defaultRedirectUri];

    // Return client registration response (RFC 7591)
    return NextResponse.json({
      client_id: clientId,
      // client_secret: undefined, // Public client, no secret needed
      client_id_issued_at: Math.floor(Date.now() / 1000),
      // client_secret_expires_at: 0, // No expiration for public clients
      redirect_uris: finalRedirectUris,
      grant_types: grant_types,
      response_types: response_types,
      client_name: client_name || "ChatGPT MCP Client",
      scope: scope || "openid profile email",
      token_endpoint_auth_method: token_endpoint_auth_method,
      application_type: "web",
      // Additional metadata
      client_uri: baseURL,
      logo_uri: `${baseURL}/logo.png`,
      policy_uri: `${baseURL}/privacy`,
      tos_uri: `${baseURL}/terms`,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      status: 201, // Created
    });
  } catch (error) {
    console.error("[OAuth Registration] Error:", error);
    return NextResponse.json(
      { 
        error: "invalid_client_metadata",
        error_description: "Invalid client registration request"
      },
      { status: 400 }
    );
  }
}

/**
 * GET endpoint for registration endpoint discovery
 * Returns the registration endpoint URL
 */
export async function GET() {
  return NextResponse.json({
    registration_endpoint: `${baseURL}/.well-known/oauth-registration`,
    registration_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["openid", "profile", "email"],
  }, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
