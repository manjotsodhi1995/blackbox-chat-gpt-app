import { baseURL } from "@/baseUrl";
import { websiteURL } from "@/websiteUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

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
      description: "Build an app in blackbox-v0cc with a prompt. Creates a new app project based on the provided prompt.",
      inputSchema: {
        email: z.string().email().describe("The email address of the user building the app"),
        prompt: z.string().describe("The prompt describing what app to build"),
      },
    },
    async ({ email, prompt }) => {
      try {
        // Hardcoded session data
        const session = {
          user: {
            name: 'Manjot Singh',
            email: 'manjot.developer.singh@gmail.com',
            image: 'https://lh3.googleusercontent.com/a/ACg8ocIkrnjRRyNOnywWdzJS7NzBypE5JapmH-_0XCRQeu26lxPY-Q=s96-c',
            id: '4d1a58bd-d20c-4518-866b-18bc5d2a8113',
            PhoneVerified: false,
            customerId: 'cus_TPwkObTkcxoVCM'
          },
          expires: '2026-01-18T16:42:02.214Z',
          isNewUser: false
        };

        const url = `${websiteURL}/api/mcp/build-app`;
        console.log("[MCP build_app] Calling URL:", url);
        console.log("[MCP build_app] Request body:", { email, prompt, session });
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, prompt, session }),
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
      description: "Check available credits for a user in blackbox-v0cc",
      inputSchema: {
        email: z.string().email().describe("The email address of the user to check credits for"),
      },
    },
    async ({ email }) => {
      try {
        const url = `${websiteURL}/api/mcp/credits?email=${encodeURIComponent(email)}`;
        console.log("[MCP check_credits] Calling URL:", url);
        
        const response = await fetch(url, {
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

export const GET = handler;
export const POST = handler;
