import { websiteURL } from '@/websiteUrl';

export type ToolContext = {
  userId: string;
  sessionToken: string;
};

export type MCPTool = {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, context: ToolContext) => Promise<any>;
};

export function getMCPTools(): MCPTool[] {
  return [
    {
      name: 'build_app',
      description: 'Build an app in blackbox-v0cc with a prompt. Creates a new app project based on the provided prompt.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The prompt describing what app to build',
          },
        },
        required: ['prompt'],
      },
      handler: async (args, context) => {
        const response = await fetch(`${websiteURL}/api/mcp/build-app`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Use cookie if Better Auth expects it, or Bearer token
            'Cookie': `better-auth.session_token=${context.sessionToken}`,
          },
          body: JSON.stringify({
            prompt: args.prompt,
            // User email/ID from context
            userId: context.userId,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }
        
        return await response.json();
      },
    },
    {
      name: 'check_credits',
      description: 'Check available credits for the authenticated user in blackbox-v0cc',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (args, context) => {
        // Get user info first to get email
        const authUrl = process.env.BETTER_AUTH_URL || process.env.BLACKBOX_APP_URL || websiteURL;
        const userResponse = await fetch(`${authUrl}/api/auth/get-session`, {
          method: 'GET',
          headers: {
            'Cookie': `better-auth.session_token=${context.sessionToken}`,
          },
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to get user info');
        }
        
        const session = await userResponse.json();
        const userEmail = session.user?.email;
        
        if (!userEmail) {
          throw new Error('User email not found');
        }
        
        const response = await fetch(`${websiteURL}/api/mcp/credits?email=${encodeURIComponent(userEmail)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `better-auth.session_token=${context.sessionToken}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }
        
        return await response.json();
      },
    },
  ];
}

