import { NextResponse } from "next/server";
import { baseURL } from "@/baseUrl";

/**
 * OAuth 2.0 Protected Resource Metadata
 * 
 * Returns metadata about the protected resource (MCP server).
 * This tells clients what scopes and endpoints are available.
 * 
 * RFC 8414: OAuth 2.0 Protected Resource Metadata
 */
export async function GET() {
  try {
    return NextResponse.json({
      resource: baseURL,
      authorization_servers: [
        // Main app OAuth server
        process.env.BLACKBOX_APP_URL || "http://localhost:3000",
      ],
      scopes_supported: [
        "openid",
        "profile",
        "email",
        "mcp:build_app",
        "mcp:check_credits",
      ],
      bearer_methods_supported: ["header"],
      resource_documentation: `${baseURL}/docs`,
      resource_policy_uri: `${baseURL}/privacy`,
      resource_tos_uri: `${baseURL}/terms`,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[OAuth Protected Resource] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate protected resource metadata" },
      { status: 500 }
    );
  }
}

