import { cookies } from "next/headers";
import { websiteURL } from "@/websiteUrl";
import { fetchWithNgrokSupport } from "@/lib/fetch-utils";

export interface UserSession {
  user: {
    name?: string;
    email?: string;
    image?: string;
    id?: string;
    PhoneVerified?: boolean;
    customerId?: string;
  };
  expires?: string;
  isNewUser?: boolean;
}

/**
 * Get the current authenticated session from cookies
 * If session cookie is missing but token exists, tries to fetch from verify endpoint
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;
    const userSession = cookieStore.get("user_session")?.value;
    
    if (!authToken) {
      return null;
    }
    
    // Return stored session if available
    if (userSession) {
      try {
        const parsed = JSON.parse(userSession);
        // Validate session has required fields
        if (parsed && parsed.user && (parsed.user.email || parsed.user.id)) {
          return parsed;
        }
      } catch {
        // Invalid JSON, continue to fetch fresh session
        console.warn("[Auth Utils] Invalid session JSON in cookie");
      }
    }
    
    // If we have a token but no session cookie, try to fetch from verify endpoint
    // This handles cases where session cookie wasn't set properly
    if (authToken && !userSession) {
      try {
        const sessionResponse = await fetchWithNgrokSupport(`${websiteURL}/api/auth/verify`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.session) {
            // Optionally update the session cookie for future requests
            // Use 30 days expiration to match refresh token and maintain persistence
            try {
              const isSecure = process.env.MCP_BASE_URL?.startsWith("https://") || 
                               (!process.env.MCP_BASE_URL && process.env.NODE_ENV === "production");
              const cookieMaxAge = 60 * 60 * 24 * 30; // 30 days
              cookieStore.set("user_session", JSON.stringify(sessionData.session), {
                httpOnly: true,
                secure: isSecure,
                sameSite: "lax",
                maxAge: cookieMaxAge, // 30 days - persist until logout
                path: "/",
              });
            } catch (cookieError) {
              // Cookie setting failed, but we still have the session
              console.warn("[Auth Utils] Failed to update session cookie:", cookieError);
            }
            return sessionData.session;
          }
        }
      } catch (error) {
        console.error("[Auth Utils] Error fetching session from verify endpoint:", error);
      }
    }
    
    return null;
  } catch (error) {
    console.error("[Auth Utils] Error getting session:", error);
    return null;
  }
}

/**
 * Get the authentication token from cookies
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("auth_token")?.value || null;
  } catch (error) {
    console.error("[Auth Utils] Error getting token:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

