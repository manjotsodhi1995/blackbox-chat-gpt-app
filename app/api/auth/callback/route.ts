import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { baseURL } from "@/baseUrl";
import { websiteURL } from "@/websiteUrl";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    
    const cookieStore = await cookies();
    const storedState = cookieStore.get("oauth_state")?.value;
    const returnUrl = cookieStore.get("oauth_return_url")?.value || baseURL;
    
    // Handle OAuth errors
    if (error) {
      console.error("[Auth Callback] OAuth error:", error);
      return NextResponse.redirect(
        `${returnUrl}/auth?error=${encodeURIComponent(error)}`
      );
    }
    
    // Verify state token
    if (!state || state !== storedState) {
      console.error("[Auth Callback] Invalid state token");
      return NextResponse.redirect(
        `${returnUrl}/auth?error=invalid_state`
      );
    }
    
    // Exchange authorization code for access token
    if (!code) {
      return NextResponse.redirect(
        `${returnUrl}/auth?error=no_code`
      );
    }
    
    try {
      // Exchange code for token with your backend
      const tokenResponse = await fetch(`${websiteURL}/api/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          redirect_uri: `${baseURL}/api/auth/callback`,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        console.error("[Auth Callback] Token exchange failed:", errorData);
        return NextResponse.redirect(
          `${returnUrl}/auth?error=token_exchange_failed`
        );
      }
      
      const tokenData = await tokenResponse.json();
      const { access_token, refresh_token, expires_in, session } = tokenData;
      
      console.log("[Auth Callback] Token exchange successful:", {
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token,
        hasSession: !!session,
        expiresIn: expires_in,
        sessionEmail: session?.user?.email,
      });
      
      // Store tokens securely in cookies
      // Use secure cookies only for HTTPS (production or ngrok)
      const isSecure = baseURL.startsWith("https://");
      
      // Don't set explicit domain - let the browser handle it
      // Setting an explicit domain can prevent cookies from being sent in some contexts
      // The browser will automatically use the correct domain based on the request
      const cookieOptions: any = {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax" as const,
        path: "/",
        // Explicitly don't set domain - this allows cookies to work in all contexts
      };
      
      // Use refresh token expiration (30 days) for all cookies to ensure persistence
      // Access tokens will be refreshed automatically when they expire
      const cookieMaxAge = 60 * 60 * 24 * 30; // 30 days - matches refresh token
      
      if (access_token) {
        cookieStore.set("auth_token", access_token, {
          ...cookieOptions,
          maxAge: cookieMaxAge, // Set to 30 days - will be refreshed when expired
        });
        console.log("[Auth Callback] ✅ Set auth_token cookie", {
          secure: isSecure,
          maxAge: cookieMaxAge,
          path: "/",
        });
      } else {
        console.warn("[Auth Callback] ⚠️ No access_token in response");
      }
      
      if (refresh_token) {
        cookieStore.set("refresh_token", refresh_token, {
          ...cookieOptions,
          maxAge: cookieMaxAge, // 30 days
        });
        console.log("[Auth Callback] ✅ Set refresh_token cookie (30 days)");
      }
      
      // Store session data if provided - use long expiration to persist
      if (session) {
        cookieStore.set("user_session", JSON.stringify(session), {
          ...cookieOptions,
          maxAge: cookieMaxAge, // 30 days - persist until logout
        });
        console.log("[Auth Callback] ✅ Set user_session cookie for:", session.user?.email, {
          secure: isSecure,
          maxAge: cookieMaxAge,
          path: "/",
        });
      } else {
        console.warn("[Auth Callback] ⚠️ No session data in response");
      }
      
      // Verify cookies were set by reading them back
      try {
        const verifyCookies = cookieStore.getAll();
        console.log("[Auth Callback] Cookies after setting:", verifyCookies.map(c => ({
          name: c.name,
          hasValue: !!c.value,
          valueLength: c.value?.length || 0,
        })));
      } catch (verifyError) {
        console.error("[Auth Callback] Error verifying cookies:", verifyError);
      }
      
      // Clean up OAuth state cookies
      cookieStore.delete("oauth_state");
      cookieStore.delete("oauth_return_url");
      
      // Redirect back to return URL with success
      return NextResponse.redirect(
        `${returnUrl}/auth?success=true&authenticated=true`
      );
    } catch (tokenError) {
      console.error("[Auth Callback] Token exchange error:", tokenError);
      return NextResponse.redirect(
        `${returnUrl}/auth?error=token_exchange_error`
      );
    }
  } catch (error) {
    console.error("[Auth Callback] Error:", error);
    return NextResponse.redirect(
      `${baseURL}/auth?error=callback_error`
    );
  }
}

