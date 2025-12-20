import { NextResponse } from "next/server";
import { websiteURL } from "@/websiteUrl";

/**
 * OpenID Connect Discovery
 * 
 * Returns OpenID Connect discovery metadata.
 * This is similar to OAuth authorization server metadata but includes OpenID-specific fields.
 */
export async function GET() {
  try {
    return NextResponse.json({
      issuer: websiteURL,
      authorization_endpoint: `${websiteURL}/api/auth/oauth`,
      token_endpoint: `${websiteURL}/api/auth/token`,
      userinfo_endpoint: `${websiteURL}/api/auth/verify`,
      jwks_uri: `${websiteURL}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["HS256"],
      scopes_supported: ["openid", "profile", "email"],
      claims_supported: [
        "sub",
        "iss",
        "aud",
        "exp",
        "iat",
        "email",
        "email_verified",
        "name",
        "picture"
      ],
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[OpenID Discovery] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate OpenID configuration" },
      { status: 500 }
    );
  }
}

