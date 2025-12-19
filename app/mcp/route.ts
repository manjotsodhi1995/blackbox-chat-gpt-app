import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { NextRequest } from "next/server";
import { validateToken } from "@/lib/auth";

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

// Store current user context (set per request)
let currentRequestUser: { id: string; email: string; name?: string } | null = null;

/**
 * Validate token from request and set user context
 */
async function validateRequestToken(request: NextRequest): Promise<{ id: string; email: string; name?: string } | null> {
  try {
    // Get token from Authorization header or query parameter
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const url = new URL(request.url);
      token = url.searchParams.get('token');
    }

    if (!token) {
      return null;
    }

    // Validate token
    const validation = await validateToken(token);
    if (!validation.valid || !validation.user) {
      return null;
    }

    return validation.user;
  } catch (error) {
    console.error('Error validating token in MCP route:', error);
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

  const blackboxAppUrl = process.env.NEXT_PUBLIC_BLACKBOX_APP_URL || 'http://localhost:3001'
  
  // Define tool with securitySchemes (mcp-handler types may not include it yet)
  const toolDefinition = {
    title: contentWidget.title,
    description:
      "Fetch and display the homepage content with the name of the user",
    inputSchema: {
      name: z.string().describe("The name of the user to display on the homepage"),
    },
    securitySchemes: {
      oauth2: {
        type: "oauth2" as const,
        flows: {
          authorizationCode: {
            authorizationUrl: `${blackboxAppUrl}/oauth/authorize`,
            tokenUrl: `${blackboxAppUrl}/oauth/token`,
            scopes: {
              "openid": "OpenID Connect",
              "profile": "User profile information",
              "email": "User email address",
            },
          },
        },
      },
    },
    _meta: widgetMeta(contentWidget),
  } as any // Type assertion to allow securitySchemes property
  
  server.registerTool(
    contentWidget.id,
    toolDefinition,
    async ({ name }) => {
      // Get user context from the module variable (set by route handler)
      const userContext = currentRequestUser;

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
          ...(userContext && { 
            user: {
              userId: userContext.id,
              userEmail: userContext.email,
              userName: userContext.name,
            }
          }),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );
});

export async function GET(request: NextRequest) {
  // Validate token and set user context for this request
  currentRequestUser = await validateRequestToken(request);
  
  try {
    return await handler(request);
  } finally {
    // Clear user context after request
    currentRequestUser = null;
  }
}

export async function POST(request: NextRequest) {
  // Validate token and set user context for this request
  currentRequestUser = await validateRequestToken(request);
  
  try {
    return await handler(request);
  } finally {
    // Clear user context after request
    currentRequestUser = null;
  }
}
