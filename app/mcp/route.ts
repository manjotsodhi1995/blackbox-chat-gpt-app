import { baseURL } from "@/baseUrl";
import { websiteURL } from "@/websiteUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { NextRequest } from "next/server";

// Store current request's user info and token (request-scoped)
let currentRequestUser: { email: string; userId: string; name: string } | null = null;
let currentRequestToken: string | null = null;

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
 * Extract token from request headers
 */
function extractTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try X-API-Key header
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Validate token and get user information
 */
async function validateToken(token: string): Promise<{
  valid: boolean;
  user?: { email: string; userId: string; name: string };
  error?: string;
}> {
  try {
    const response = await fetch(`${websiteURL}/api/mcp/validate-token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      return {
        valid: false,
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[MCP] Token validation error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
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

  // Build App Tool
  server.registerTool(
    "build_app",
    {
      title: "Build App",
      description: "Build an app in blackbox-v0cc with a prompt. Creates a new app project based on the provided prompt. Requires authentication token.",
      inputSchema: {
        prompt: z.string().describe("The prompt describing what app to build"),
        token: z.string().optional().describe("Optional: API token for authentication. If not provided, token from Authorization header will be used."),
      },
    },
    async ({ prompt, token: providedToken }) => {
      try {
        // Determine which token to use
        const tokenToUse = providedToken || currentRequestToken;
        
        if (!tokenToUse) {
          return {
            content: [
              {
                type: "text",
                text: "Authentication required. Please provide an API token in the Authorization header (Bearer <token>) or as the 'token' parameter.",
              },
            ],
          };
        }

        // Validate token if provided as parameter (it's already validated if from headers)
        let userEmail: string | undefined;
        if (providedToken && providedToken !== currentRequestToken) {
          // Token was provided as parameter, validate it
          const validationResult = await validateToken(providedToken);
          if (!validationResult.valid || !validationResult.user) {
            return {
              content: [
                {
                  type: "text",
                  text: `Invalid token: ${validationResult.error || 'Token validation failed'}`,
                },
              ],
            };
          }
          userEmail = validationResult.user.email;
        } else {
          // Use email from already-validated token
          userEmail = currentRequestUser?.email;
        }

        if (!userEmail) {
          return {
            content: [
              {
                type: "text",
                text: "Unable to determine user email from token. Please ensure you have provided a valid authentication token.",
              },
            ],
          };
        }

        const url = `${websiteURL}/api/mcp/build-app`;
        console.log("[MCP build_app] Calling URL:", url);
        console.log("[MCP build_app] Request body:", { email: userEmail, prompt });
        
        // Use provided token or current request token
        const authToken = providedToken || currentRequestToken;
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ email: userEmail, prompt }),
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
  server.registerTool(
    "check_credits",
    {
      title: "Check Credits",
      description: "Check available credits for the authenticated user in blackbox-v0cc. Requires authentication token.",
      inputSchema: {
        token: z.string().optional().describe("Optional: API token for authentication. If not provided, token from Authorization header will be used."),
      },
    },
    async ({ token: providedToken }) => {
      try {
        // Determine which token to use
        const tokenToUse = providedToken || currentRequestToken;
        
        if (!tokenToUse) {
          return {
            content: [
              {
                type: "text",
                text: "Authentication required. Please provide an API token in the Authorization header (Bearer <token>) or as the 'token' parameter.",
              },
            ],
          };
        }

        // Validate token if provided as parameter (it's already validated if from headers)
        let userEmail: string | undefined;
        if (providedToken && providedToken !== currentRequestToken) {
          // Token was provided as parameter, validate it
          const validationResult = await validateToken(providedToken);
          if (!validationResult.valid || !validationResult.user) {
            return {
              content: [
                {
                  type: "text",
                  text: `Invalid token: ${validationResult.error || 'Token validation failed'}`,
                },
              ],
            };
          }
          userEmail = validationResult.user.email;
        } else {
          // Use email from already-validated token
          userEmail = currentRequestUser?.email;
        }

        if (!userEmail) {
          return {
            content: [
              {
                type: "text",
                text: "Unable to determine user email from token. Please ensure you have provided a valid authentication token.",
              },
            ],
          };
        }

        const url = `${websiteURL}/api/mcp/credits?email=${encodeURIComponent(userEmail)}`;
        console.log("[MCP check_credits] Calling URL:", url);
        
        // Use the token we validated
        const authToken = tokenToUse;
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {}),
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

  // Authenticate Tool
  server.registerTool(
    "authenticate",
    {
      title: "Authenticate",
      description: "Get authentication instructions and link to generate an API key for MCP tool access. Users need to generate an API key and provide it to the AI for authenticated tool calls.",
      inputSchema: {
        email: z.string().email().optional().describe("Optional: Your email address for API key generation"),
      },
    },
    async ({ email }) => {
      const apiKeysUrl = `${websiteURL}/api-keys`;
      const instructions = `To authenticate and use MCP tools, follow these steps:

1. **Visit the API Keys Page:**
   Click this link to open the API key management page: ${apiKeysUrl}
   
   You'll need to sign in if you haven't already.

2. **Generate a New API Key:**
   - Click the "Create API Key" button
   - Enter a descriptive name (e.g., "MCP ChatGPT Integration")
   - Click "Create API Key"
   - **Important:** Copy the API key immediately - it will only be shown once!
   - The API key will start with "bbai_"

3. **Provide the API Key to the AI:**
   - Share your copied API key with me (the AI assistant)
   - I will automatically use it in the Authorization header for all subsequent tool calls
   - You don't need to manually add headers - I'll handle that

4. **Using Your API Key:**
   Once you provide the key, I'll use it automatically. The key will be sent in requests as:
   - Authorization header: \`Authorization: Bearer <your-api-key>\`
   - Or X-API-Key header: \`X-API-Key: <your-api-key>\`

**🔗 API Key Management Page:** ${apiKeysUrl}
${email ? `\n**Your Email:** ${email}` : ''}

**Security Notes:**
- Keep your API key secure and don't share it publicly
- You can view, manage, and revoke your API keys anytime at ${apiKeysUrl}
- Revoked keys will immediately stop working`;

      return {
        content: [
          {
            type: "text",
            text: instructions,
          },
        ],
        structuredContent: {
          authenticationUrl: apiKeysUrl,
          apiEndpoint: `${websiteURL}/api/api-keys`,
          instructions: [
            "Visit the API Keys page using the provided link",
            "Sign in if required",
            "Click 'Create API Key' and enter a name",
            "Copy the generated API key immediately (shown only once)",
            "Provide the API key to the AI assistant",
            "The AI will automatically use the key for authenticated tool calls",
          ],
          headerFormat: "Authorization: Bearer <api-key>",
          email: email || null,
        },
      };
    }
  );
});

// Wrap handler to extract and validate token
async function wrappedHandler(request: NextRequest) {
  // Extract token from request
  const token = extractTokenFromRequest(request);
  
  // Reset current request user and token
  currentRequestUser = null;
  currentRequestToken = null;
  
  // If token is provided, validate it
  if (token) {
    const validationResult = await validateToken(token);
    if (validationResult.valid && validationResult.user) {
      currentRequestUser = validationResult.user;
      currentRequestToken = token;
    }
  }
  
  try {
    return await handler(request);
  } finally {
    // Clear user info and token after request
    currentRequestUser = null;
    currentRequestToken = null;
  }
}

export const GET = wrappedHandler;
export const POST = wrappedHandler;
