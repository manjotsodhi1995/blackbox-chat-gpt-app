import { NextResponse } from "next/server";
import { baseURL } from "@/baseUrl";
import { websiteURL } from "@/websiteUrl";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get("returnUrl") || baseURL;
    
    // Generate state token for OAuth security
    const state = randomBytes(32).toString("hex");
    const timestamp = Date.now();
    
    // Store state in cookie with expiration (5 minutes)
    const cookieStore = await cookies();
    // Use secure cookies only for HTTPS (production or ngrok)
    const isSecure = baseURL.startsWith("https://");
    
    cookieStore.set("oauth_state", state, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });
    
    // Store return URL for redirect after auth
    cookieStore.set("oauth_return_url", returnUrl, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    
    // Construct OAuth URL - adjust this based on your website's OAuth endpoint
    const oauthUrl = new URL(`${websiteURL}/api/auth/oauth`);
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("redirect_uri", `${baseURL}/api/auth/callback`);
    oauthUrl.searchParams.set("response_type", "code");
    
    // Redirect to OAuth provider
    return NextResponse.redirect(oauthUrl.toString());
  } catch (error) {
    console.error("[Auth Login] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate authentication" },
      { status: 500 }
    );
  }
}

