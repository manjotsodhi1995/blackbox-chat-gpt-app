import { NextResponse } from "next/server";
import { baseURL } from "@/baseUrl";
import { websiteURL } from "@/websiteUrl";

/**
 * OAuth 2.0 Authorization Server Metadata (MCP variant)
 * 
 * ChatGPT sometimes appends /mcp to discovery endpoints.
 * This is an alias to the main discovery endpoint.
 */
export async function GET() {
  try {
    const authorizationEndpoint = `${websiteURL}/api/auth/oauth`;
    const tokenEndpoint = `${websiteURL}/api/auth/token`;
    const introspectionEndpoint = `${websiteURL}/api/auth/verify`;
    
    // Dynamic Client Registration endpoint (RFC 7591)
    const registrationEndpoint = `${baseURL}/.well-known/oauth-registration`;
    
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
    console.error("[OAuth Discovery MCP] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate OAuth metadata" },
      { status: 500 }
    );
  }
}

