import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { websiteURL } from "@/websiteUrl";
import { baseURL } from "@/baseUrl";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;
    const userSession = cookieStore.get("user_session")?.value;
    
    // If we have a token, verify it's still valid and get fresh session data
    if (authToken) {
      try {
        // Verify token and get session from your backend
        const sessionResponse = await fetch(`${websiteURL}/api/auth/verify`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          return NextResponse.json({
            authenticated: true,
            session: sessionData.session || (userSession ? JSON.parse(userSession) : null),
            token: authToken,
          });
        } else {
          // Token might be expired, try refresh
          const refreshToken = cookieStore.get("refresh_token")?.value;
          if (refreshToken) {
            const refreshResponse = await fetch(`${websiteURL}/api/auth/refresh`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              const { access_token, expires_in, session } = refreshData;
              
              // Update cookies
              // Use secure cookies only for HTTPS (production or ngrok)
              const isSecure = baseURL.startsWith("https://");
              
              // When refreshing, extend cookie expiration to 30 days to maintain persistence
              const cookieMaxAge = 60 * 60 * 24 * 30; // 30 days
              
              cookieStore.set("auth_token", access_token, {
                httpOnly: true,
                secure: isSecure,
                sameSite: "lax",
                maxAge: cookieMaxAge, // 30 days - persist until logout
                path: "/",
              });
              
              if (session) {
                cookieStore.set("user_session", JSON.stringify(session), {
                  httpOnly: true,
                  secure: isSecure,
                  sameSite: "lax",
                  maxAge: cookieMaxAge, // 30 days - persist until logout
                  path: "/",
                });
              }
              
              return NextResponse.json({
                authenticated: true,
                session: session || (userSession ? JSON.parse(userSession) : null),
                token: access_token,
              });
            }
          }
        }
      } catch (verifyError) {
        console.error("[Auth Session] Verification error:", verifyError);
      }
    }
    
    // No valid session found
    return NextResponse.json({
      authenticated: false,
      session: null,
      token: null,
    });
  } catch (error) {
    console.error("[Auth Session] Error:", error);
    return NextResponse.json(
      { error: "Failed to get session", authenticated: false },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    
    // Clear all auth cookies
    cookieStore.delete("auth_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("user_session");
    cookieStore.delete("oauth_state");
    cookieStore.delete("oauth_return_url");
    
    return NextResponse.json({ success: true, authenticated: false });
  } catch (error) {
    console.error("[Auth Session] Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}

