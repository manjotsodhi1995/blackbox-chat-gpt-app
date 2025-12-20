import { NextResponse } from "next/server";
import { baseURL } from "@/baseUrl";

/**
 * OAuth 2.0 Protected Resource Metadata (MCP variant)
 */
export async function GET() {
  try {
    return NextResponse.json({
      resource: `${baseURL}/mcp`,
      authorization_servers: [
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
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[OAuth Protected Resource MCP] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate protected resource metadata" },
      { status: 500 }
    );
  }
}

