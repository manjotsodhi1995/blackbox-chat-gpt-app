import { NextResponse } from "next/server";
import { baseURL } from "@/baseUrl";
import { websiteURL } from "@/websiteUrl";

/**
 * OAuth 2.0 Authorization Server Metadata
 * 
 * Returns OAuth 2.0 discovery metadata for ChatGPT MCP server integration.
 * This endpoint tells ChatGPT where to find OAuth endpoints.
 * 
 * RFC 8414: OAuth 2.0 Authorization Server Metadata
 */
export async function GET() {
  try {
    // OAuth authorization endpoint (on main app)
    const authorizationEndpoint = `${websiteURL}/api/auth/oauth`;
    
    // Token endpoint (on main app)
    const tokenEndpoint = `${websiteURL}/api/auth/token`;
    
    // Token introspection endpoint (on main app)
    const introspectionEndpoint = `${websiteURL}/api/auth/verify`;
    
    // Dynamic Client Registration endpoint (RFC 7591)
    const registrationEndpoint = `${baseURL}/.well-known/oauth-registration`;
    
    // Response
    return NextResponse.json({
      issuer: websiteURL,
      authorization_endpoint: authorizationEndpoint,
      token_endpoint: tokenEndpoint,
      introspection_endpoint: introspectionEndpoint,
      registration_endpoint: registrationEndpoint, // RFC 7591
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256", "plain"],
      scopes_supported: ["openid", "profile", "email"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
      response_modes_supported: ["query"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["HS256", "RS256"],
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[OAuth Discovery] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate OAuth metadata" },
      { status: 500 }
    );
  }
}
