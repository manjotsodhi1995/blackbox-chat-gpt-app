import { baseURL } from "@/baseUrl";
import { websiteURL } from "@/websiteUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { extractMCPSessionId, generateMCPSessionId } from "@/lib/mcp/session-extractor";
import { mcpSessionStore } from "@/lib/auth/session-store";
import { validateAuthToken, refreshAuthToken } from "@/lib/auth/token-handler";
import { getBetterAuthUrl } from "@/lib/auth/get-auth-url";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
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

/**
 * Create MCP handler with authentication.
 * 
 * Flow:
 * 1. Extract or generate MCP session ID
 * 2. Check if session is authenticated
 * 3. If not authenticated, return auth URL in error response
 * 4. If authenticated, register tools with auth token
 */
const createAuthenticatedMcpHandler = () => {
  return async (request: NextRequest) => {
    // Handle OAuth discovery requests
    const url = new URL(request.url);
    if (url.pathname.includes('.well-known')) {
      // Let the well-known routes handle OAuth discovery
      return NextResponse.next();
    }
    
    // Extract or generate MCP session ID
    let mcpSessionId = extractMCPSessionId(request);
    
    // If no session ID found, generate one and store in response header
    // This allows ChatGPT to reuse the session ID on subsequent requests
    if (!mcpSessionId) {
      mcpSessionId = generateMCPSessionId();
    }
    
    // Check authentication status
    const mcpSession = mcpSessionStore.get(mcpSessionId);
    
    if (!mcpSession) {
      // Check if this is an MCP JSON-RPC request
      if (request.method === 'POST') {
        try {
          const body = await request.clone().json();
          
          // Handle initialize method - return OAuth capabilities
          if (body.method === 'initialize') {
            const authUrl = new URL(baseURL);
            authUrl.searchParams.set('mcp_session_id', mcpSessionId);
            authUrl.searchParams.set('mcp_auth_required', 'true');
            
            const betterAuthUrl = getBetterAuthUrl();
            const mcpServerUrl = new URL('/mcp', baseURL).toString();
            
            return NextResponse.json({
              jsonrpc: '2.0',
              result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                  tools: {},
                  // Declare OAuth support
                  experimental: {
                    oauth: {
                      authorizationServerMetadataUrl: `${baseURL}/.well-known/oauth-authorization-server/mcp`,
                      protectedResourceMetadataUrl: `${baseURL}/.well-known/oauth-protected-resource/mcp`,
                      clientRegistrationUrl: `${baseURL}/api/auth/oauth/register`,
                    },
                  },
                },
                serverInfo: {
                  name: 'blackbox-mcp-server',
                  version: '1.0.0',
                },
              },
              id: body.id,
            }, {
              headers: {
                'X-MCP-Session-ID': mcpSessionId,
              },
            });
          }
          
          // For other methods, return an authentication error
          return NextResponse.json({
            jsonrpc: '2.0',
            error: {
              code: -32002,
              message: 'Authentication required',
              data: {
                authUrl: `${baseURL}?mcp_session_id=${mcpSessionId}&mcp_auth_required=true`,
                oauth: {
                  authorizationServerMetadataUrl: `${baseURL}/.well-known/oauth-authorization-server/mcp`,
                  protectedResourceMetadataUrl: `${baseURL}/.well-known/oauth-protected-resource/mcp`,
                },
              },
            },
            id: body.id,
          }, {
            status: 401,
            headers: {
              'X-MCP-Session-ID': mcpSessionId,
              'WWW-Authenticate': `Bearer realm="${baseURL}/mcp"`,
            },
          });
        } catch (error) {
          // If body parsing fails, return a generic auth error
          return NextResponse.json({
            jsonrpc: '2.0',
            error: {
              code: -32002,
              message: 'Authentication required',
            },
            id: null,
          }, {
            status: 401,
            headers: {
              'X-MCP-Session-ID': mcpSessionId,
            },
          });
        }
      }
      
      // For GET requests or non-JSON-RPC requests, redirect to auth
      const authUrl = new URL(baseURL);
      authUrl.searchParams.set('mcp_session_id', mcpSessionId);
      authUrl.searchParams.set('mcp_auth_required', 'true');
      
      return NextResponse.redirect(authUrl.toString(), {
        headers: {
          "X-MCP-Session-ID": mcpSessionId,
        },
      });
    }
    
    // Validate and refresh token if needed
    const validation = await validateAuthToken(mcpSession.authSessionToken);
    if (!validation.valid || !validation.session) {
      // Token invalid - clear session and require re-auth
      mcpSessionStore.delete(mcpSessionId);
      const authUrl = new URL(baseURL);
      authUrl.searchParams.set('mcp_session_id', mcpSessionId);
      authUrl.searchParams.set('mcp_auth_required', 'true');
      
      // Redirect directly to auth URL
      return NextResponse.redirect(authUrl.toString(), {
        headers: {
          "X-MCP-Session-ID": mcpSessionId,
        },
      });
    }
    
    // Refresh token if needed
    if (validation.needsRefresh) {
      const newToken = await refreshAuthToken(mcpSession.authSessionToken);
      if (newToken) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        mcpSessionStore.set(mcpSessionId, newToken, mcpSession.userId, expiresAt);
      }
    }
    
    // Session authenticated - create MCP handler with auth context
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

  // Build App Tool
      // Uses authenticated token from session store
  server.registerTool(
    "build_app",
    {
      title: "Build App",
      description: "Build an app in blackbox-v0cc with a prompt. Creates a new app project based on the provided prompt.",
      inputSchema: {
        prompt: z.string().describe("The prompt describing what app to build"),
      },
    },
        async ({ prompt }) => {
      try {
            // Get fresh session and validate
            const currentSession = mcpSessionStore.get(mcpSessionId);
            if (!currentSession) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Session not found. Please reconnect to the MCP server.",
                  },
                ],
              };
            }
            
            // Validate token
            const validation = await validateAuthToken(currentSession.authSessionToken);
            if (!validation.valid || !validation.session) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Authentication expired. Please reconnect to the MCP server.",
                  },
                ],
              };
            }
            
            const userEmail = validation.session.user?.email || '';

        const url = `${websiteURL}/api/mcp/build-app`;
        console.log("[MCP build_app] Calling URL:", url);
            console.log("[MCP build_app] User:", userEmail);
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
                "Cookie": `better-auth.session_token=${currentSession.authSessionToken}`, // Use Better Auth session token
          },
              body: JSON.stringify({ 
                prompt,
                email: userEmail,
              }),
        });

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
          };
        }

        const data = await response.json();
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
      // Uses authenticated token - checks credits for the authenticated user
  server.registerTool(
    "check_credits",
    {
      title: "Check Credits",
          description: "Check available credits for the authenticated user in blackbox-v0cc",
          inputSchema: {},
        },
        async () => {
          try {
            // Get fresh session and validate
            const currentSession = mcpSessionStore.get(mcpSessionId);
            if (!currentSession) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Session not found. Please reconnect to the MCP server.",
                  },
                ],
              };
            }
            
            // Validate token
            const validation = await validateAuthToken(currentSession.authSessionToken);
            if (!validation.valid || !validation.session) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Authentication expired. Please reconnect to the MCP server.",
      },
                ],
              };
            }
            
            const userEmail = validation.session.user?.email || '';
            
            const url = `${websiteURL}/api/mcp/credits?email=${encodeURIComponent(userEmail)}`;
        console.log("[MCP check_credits] Calling URL:", url);
            console.log("[MCP check_credits] User:", userEmail);
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
                "Cookie": `better-auth.session_token=${currentSession.authSessionToken}`, // Use Better Auth session token
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
                  text: `Credits for ${userEmail}:\n\nAvailable: ${creditsText}\nHas Payment Method: ${paymentMethodText}${data.customerId ? `\nCustomer ID: ${data.customerId}` : ""}`,
            },
          ],
          structuredContent: {
            credits: data.credits || 0,
            customerId: data.customerId || null,
            hasPaymentMethod: data.hasPaymentMethod || false,
                email: userEmail,
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

    // Execute the MCP handler with the request
    // The handler needs access to the request, so we pass it through
    // Note: mcp-handler may need to be modified to accept request context
    // For now, we'll use a workaround by storing session ID in a way the handler can access
    
    return handler(request);
  };
};

// Create the authenticated handler
const authenticatedHandler = createAuthenticatedMcpHandler();

export const GET = authenticatedHandler;
export const POST = authenticatedHandler;
