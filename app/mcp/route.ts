import { baseURL } from "@/baseUrl";
import { websiteURL } from "@/websiteUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { cookies } from "next/headers";
import { getSession, getAuthToken } from "@/lib/auth-utils";
import { fetchWithNgrokSupport } from "@/lib/fetch-utils";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const { fetchWithNgrokSupport } = await import("@/lib/fetch-utils");
  const result = await fetchWithNgrokSupport(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

// Helper function to get authenticated session with backend verification
async function getAuthenticatedSession() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log("[MCP] All cookies in request:", allCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0,
    })));
    
    const session = await getSession();
    const authToken = await getAuthToken();
    
    console.log("[MCP] Session check - has session:", !!session, "has token:", !!authToken);
    if (session) {
      console.log("[MCP] Session details:", {
        email: session.user?.email,
        id: session.user?.id,
        customerId: session.user?.customerId,
      });
    }
    if (authToken) {
      console.log("[MCP] Auth token exists, length:", authToken.length);
    }
    
    if (!authToken) {
      console.log("[MCP] No auth token found - checking cookies directly");
      // Try to read cookies directly
      const directAuthToken = cookieStore.get("auth_token");
      const directUserSession = cookieStore.get("user_session");
      console.log("[MCP] Direct cookie read:", {
        hasAuthToken: !!directAuthToken,
        hasUserSession: !!directUserSession,
        authTokenValue: directAuthToken?.value ? `${directAuthToken.value.substring(0, 20)}...` : null,
      });
      return null;
    }
    
    // If we have a token but no session, try to get session from verify endpoint
    if (!session && authToken) {
      console.log("[MCP] No session in cookies, verifying token to get session");
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
          console.log("[MCP] Got session from verify endpoint");
          return sessionData.session;
        } else if (sessionResponse.status === 401) {
          // Token expired, try to refresh
          console.log("[MCP] Token expired (401) during verification, attempting refresh");
          try {
            const cookieStore = await cookies();
            const refreshToken = cookieStore.get("refresh_token")?.value;
            
            if (refreshToken) {
              const refreshResponse = await fetchWithNgrokSupport(`${websiteURL}/api/auth/refresh`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                const { access_token, expires_in, session: refreshedSession } = refreshData;
                
                // Update cookies
                const isSecure = baseURL.startsWith("https://");
                const cookieMaxAge = 60 * 60 * 24 * 30; // 30 days
                
                if (access_token) {
                  cookieStore.set("auth_token", access_token, {
                    httpOnly: true,
                    secure: isSecure,
                    sameSite: "lax",
                    maxAge: cookieMaxAge,
                    path: "/",
                  });
                }
                
                if (refreshedSession) {
                  cookieStore.set("user_session", JSON.stringify(refreshedSession), {
                    httpOnly: true,
                    secure: isSecure,
                    sameSite: "lax",
                    maxAge: cookieMaxAge,
                    path: "/",
                  });
                }
                
                console.log("[MCP] ✅ Token refreshed successfully");
                return refreshedSession;
              }
            }
          } catch (refreshError) {
            console.error("[MCP] Error during token refresh:", refreshError);
          }
          return null;
        } else {
          console.log("[MCP] Token verification failed:", sessionResponse.status);
          return null;
        }
      } catch (error) {
        console.error("[MCP] Error verifying token:", error);
        return null;
      }
    }
    
    // If we have both session and token, verify token is still valid
    if (session && authToken) {
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
          console.log("[MCP] Token verified, using fresh session data");
          return sessionData.session || session;
        } else if (sessionResponse.status === 401) {
          // Token expired, try to refresh using refresh_token
          console.log("[MCP] Token expired (401), attempting to refresh");
          try {
            const cookieStore = await cookies();
            const refreshToken = cookieStore.get("refresh_token")?.value;
            
            if (refreshToken) {
              console.log("[MCP] Refresh token found, attempting refresh");
              const refreshResponse = await fetchWithNgrokSupport(`${websiteURL}/api/auth/refresh`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                const { access_token, expires_in, session: refreshedSession } = refreshData;
                
                // Update cookies with new tokens
                const isSecure = baseURL.startsWith("https://");
                const cookieMaxAge = 60 * 60 * 24 * 30; // 30 days
                
                if (access_token) {
                  cookieStore.set("auth_token", access_token, {
                    httpOnly: true,
                    secure: isSecure,
                    sameSite: "lax",
                    maxAge: cookieMaxAge,
                    path: "/",
                  });
                }
                
                if (refreshedSession) {
                  cookieStore.set("user_session", JSON.stringify(refreshedSession), {
                    httpOnly: true,
                    secure: isSecure,
                    sameSite: "lax",
                    maxAge: cookieMaxAge,
                    path: "/",
                  });
                }
                
                console.log("[MCP] ✅ Token refreshed successfully");
                return refreshedSession || session;
              } else {
                console.log("[MCP] Token refresh failed:", refreshResponse.status);
                // Refresh failed, return null to trigger re-auth
                return null;
              }
            } else {
              console.log("[MCP] No refresh token available");
              return null;
            }
          } catch (refreshError) {
            console.error("[MCP] Error during token refresh:", refreshError);
            return null;
          }
        } else {
          // Other error, but we have a session, use it
          console.log("[MCP] Verification returned non-200, but using cached session");
          return session;
        }
      } catch (error) {
        console.error("[MCP] Error verifying session:", error);
        // If verification fails but we have a session, use it (network issues, etc.)
        console.log("[MCP] Using cached session due to verification error");
        return session;
      }
    }
    
    return session;
  } catch (error) {
    console.error("[MCP] Error getting session:", error);
    return null;
  }
}

const handler = createMcpHandler(async (server) => {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/");

  const contentWidget: ContentWidget = {
    id: "show_content",
    title: "Show Content",
    templateUri: "ui://widget/content-template.html",
    invoking: "Loading content...",
    invoked: "Content loaded",
    html: html,
    description: "Displays the homepage content",
    widgetDomain: "https://nextjs.org/docs",
  };
  server.registerResource(
    "content-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description:
        "Fetch and display the homepage content with the name of the user",
      inputSchema: {
        name: z.string().describe("The name of the user to display on the homepage"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: name,
          },
        ],
        structuredContent: {
          name: name,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );

  // Authenticate Tool
  server.registerTool(
    "authenticate",
    {
      title: "Authenticate",
      description: "Authenticate with blackbox-v0cc to enable app building and other features. Opens authentication page in browser.",
      inputSchema: {},
    },
    async () => {
      try {
        console.log("[MCP authenticate] Checking existing authentication...");
        // Check if already authenticated
        const existingSession = await getAuthenticatedSession();
        if (existingSession) {
          console.log("[MCP authenticate] Already authenticated as:", existingSession.user?.email);
          return {
            content: [
              {
                type: "text",
                text: `You are already authenticated as ${existingSession.user?.email || existingSession.user?.name || "user"}. You can use build_app and other tools now.`,
              },
            ],
            structuredContent: {
              authenticated: true,
              session: existingSession,
            },
          };
        }
        
        // Return authentication URL
        const authUrl = `${baseURL}/api/auth/login?returnUrl=${encodeURIComponent(baseURL)}`;
        console.log("[MCP authenticate] Not authenticated, returning auth URL:", authUrl);
        return {
          content: [
            {
              type: "text",
              text: `Please authenticate to continue. Open this URL in your browser:\n\n${authUrl}\n\nAfter authentication, you'll be redirected back and can use the build_app tool.`,
            },
          ],
          structuredContent: {
            authenticated: false,
            authUrl: authUrl,
            message: "Authentication required. Please visit the authentication URL.",
          },
        };
      } catch (error) {
        console.error("[MCP authenticate] Error:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error checking authentication: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    }
  );

  // Check Authentication Status Tool
  server.registerTool(
    "check_auth_status",
    {
      title: "Check Authentication Status",
      description: "Check if the user is currently authenticated with blackbox-v0cc",
      inputSchema: {},
    },
    async () => {
      try {
        console.log("[MCP check_auth_status] Starting authentication check");
        const session = await getAuthenticatedSession();
        console.log("[MCP check_auth_status] Session result:", !!session);
        
        if (session) {
          console.log("[MCP check_auth_status] User authenticated:", session.user?.email);
          return {
            content: [
              {
                type: "text",
                text: `Authenticated as: ${session.user?.email || session.user?.name || "user"}\nUser ID: ${session.user?.id || "N/A"}\nCustomer ID: ${session.user?.customerId || "N/A"}`,
              },
            ],
            structuredContent: {
              authenticated: true,
              session: session,
            },
          };
        } else {
          console.log("[MCP check_auth_status] User not authenticated");
          // Try to get more details about why
          try {
            const cookieStore = await cookies();
            const authToken = cookieStore.get("auth_token");
            const userSession = cookieStore.get("user_session");
            console.log("[MCP check_auth_status] Cookie check:", {
              hasAuthToken: !!authToken,
              hasUserSession: !!userSession,
            });
          } catch (cookieError) {
            console.error("[MCP check_auth_status] Error checking cookies:", cookieError);
          }
          
          return {
            content: [
              {
                type: "text",
                text: "Not authenticated. Please use the authenticate tool to log in.",
              },
            ],
            structuredContent: {
              authenticated: false,
            },
          };
        }
      } catch (error) {
        console.error("[MCP check_auth_status] Error:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error checking authentication: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    }
  );

  // Build App Tool
  server.registerTool(
    "build_app",
    {
      title: "Build App",
      description: "Build an app in blackbox-v0cc with a prompt. Creates a new app project based on the provided prompt. Requires authentication.",
      inputSchema: {
        email: z.string().email().describe("The email address of the user building the app"),
        prompt: z.string().describe("The prompt describing what app to build"),
      },
    },
    async ({ email, prompt }) => {
      try {
        // Try to get authenticated session (may be null for server-to-server requests)
        const session = await getAuthenticatedSession();
        const cookieStore = await cookies();
        const authToken = cookieStore.get("auth_token")?.value;
        
        console.log("[MCP build_app] Starting build request:", {
          email,
          hasSession: !!session,
          hasAuthToken: !!authToken,
          sessionEmail: session?.user?.email,
        });
        
        // If we have a session, verify email matches
        if (session?.user?.email && session.user.email !== email) {
          return {
            content: [
              {
                type: "text",
                text: `Email mismatch. You are authenticated as ${session.user.email}, but provided ${email}. Please use the correct email or re-authenticate.`,
              },
            ],
            structuredContent: {
              error: "Email mismatch",
              authenticatedEmail: session.user.email,
              providedEmail: email,
            },
          };
        }

        const url = `${websiteURL}/api/mcp/build-app`;
        
        console.log("[MCP build_app] Calling URL:", url);
        console.log("[MCP build_app] Request details:", {
          email,
          hasAuthToken: !!authToken,
          hasSession: !!session,
        });
        
        // Call the API - backend will handle authentication
        // If we have a token, send it; otherwise backend may use email-based auth
        const response = await fetchWithNgrokSupport(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { "Authorization": `Bearer ${authToken}` }),
          },
          body: JSON.stringify({ 
            email, 
            prompt, 
            ...(session && { session }), // Include session if available
          }),
        });

        console.log("[MCP build_app] Response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("[MCP build_app] Error response:", response.status, errorData);
          return {
            content: [
              {
                type: "text",
                text: `Failed to build app: ${errorData.error || errorData.message || `HTTP ${response.status}`}`,
              },
            ],
            structuredContent: {
              error: errorData.error || errorData.message,
              status: response.status,
            },
          };
        }

        const data = await response.json();
        console.log("[MCP build_app] ✅ Success:", {
          chatId: data.chatId,
          name: data.name,
          url: data.url,
        });
        
        return {
          content: [
            {
              type: "text",
              text: `App built successfully!\n\nChat ID: ${data.chatId}\nName: ${data.name}\nURL: ${data.url}`,
            },
          ],
          structuredContent: {
            chatId: data.chatId,
            url: data.url,
            name: data.name,
            success: true,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error building app: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    }
  );

  // Check Credits Tool
  server.registerTool(
    "check_credits",
    {
      title: "Check Credits",
      description: "Check available credits for a user in blackbox-v0cc",
      inputSchema: {
        email: z.string().email().describe("The email address of the user to check credits for"),
      },
    },
    async ({ email }) => {
      try {
        const url = `${websiteURL}/api/mcp/credits?email=${encodeURIComponent(email)}`;
        console.log("[MCP check_credits] Calling URL:", url);
        
        const response = await fetchWithNgrokSupport(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("[MCP check_credits] Error response:", response.status, errorData);
          return {
            content: [
              {
                type: "text",
                text: `Failed to check credits: ${errorData.error || errorData.message || `HTTP ${response.status}`}`,
              },
            ],
          };
        }

        const data = await response.json();
        const creditsText = data.credits !== null ? `${data.credits.toFixed(2)} credits` : "No credits found";
        const paymentMethodText = data.hasPaymentMethod ? "Yes" : "No";
        
        return {
          content: [
            {
              type: "text",
              text: `Credits for ${email}:\n\nAvailable: ${creditsText}\nHas Payment Method: ${paymentMethodText}${data.customerId ? `\nCustomer ID: ${data.customerId}` : ""}`,
            },
          ],
          structuredContent: {
            credits: data.credits || 0,
            customerId: data.customerId || null,
            hasPaymentMethod: data.hasPaymentMethod || false,
            email,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error checking credits: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    }
  );
});

// Wrap handler to access request and log headers
export async function GET(request: Request) {
  console.log("[MCP GET] Request headers:", {
    cookie: request.headers.get("cookie") ? "present" : "missing",
    userAgent: request.headers.get("user-agent"),
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
  });
  return handler(request);
}

export async function POST(request: Request) {
  console.log("[MCP POST] Request headers:", {
    cookie: request.headers.get("cookie") ? "present" : "missing",
    userAgent: request.headers.get("user-agent"),
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
  });
  return handler(request);
}
