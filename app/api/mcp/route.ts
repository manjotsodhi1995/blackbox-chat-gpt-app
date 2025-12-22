import { NextRequest, NextResponse } from 'next/server';
import { extractMCPSessionId, generateMCPSessionId } from '@/lib/mcp/session-extractor';
import { mcpSessionStore } from '@/lib/auth/session-store';
import { validateAuthToken, refreshAuthToken } from '@/lib/auth/token-handler';
import { getBetterAuthUrl } from '@/lib/auth/get-auth-url';
import { baseURL } from '@/baseUrl';
import { getMCPTools } from '@/lib/mcp/tools';

// MCP Protocol Methods
type MCPMethod = 
  | 'initialize'
  | 'tools/list'
  | 'tools/call'
  | 'ping';

/**
 * GET handler for MCP discovery
 * Returns basic server information and OAuth configuration
 */
export async function GET(request: NextRequest) {
  const betterAuthUrl = getBetterAuthUrl();
  
  return NextResponse.json({
    name: 'blackbox-mcp-server',
    version: '1.0.0',
    description: 'Blackbox MCP server with OAuth authentication',
    mcpVersion: '2024-11-05',
    capabilities: {
      tools: true,
      prompts: false,
      resources: false,
    },
    oauth: {
      required: true,
      authorizationServerMetadataUrl: `${baseURL}/api/mcp/.well-known/oauth-authorization-server`,
      protectedResourceMetadataUrl: `${baseURL}/api/mcp/.well-known/oauth-protected-resource`,
      clientRegistrationUrl: `${baseURL}/api/auth/oauth/register`,
    },
    server: `${baseURL}/api/mcp`,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params, id } = body;

    // Extract or generate MCP session ID
    let mcpSessionId = extractMCPSessionId(request);
    if (!mcpSessionId) {
      mcpSessionId = generateMCPSessionId();
    }

    // Handle MCP protocol methods
    switch (method as MCPMethod) {
      case 'initialize':
        return handleInitialize(mcpSessionId, params, request, id);
      
      case 'tools/list':
        return handleToolsList(mcpSessionId, request, id);
      
      case 'tools/call':
        return handleToolCall(mcpSessionId, params, request, id);
      
      case 'ping':
        return NextResponse.json({ 
          jsonrpc: '2.0',
          result: 'pong',
          id,
        });
      
      default:
        return NextResponse.json(
          { 
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${method}` },
            id,
          },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('MCP handler error:', error);
    return NextResponse.json(
      { 
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal error' },
        id: null,
      },
      { status: 500 }
    );
  }
}

async function handleInitialize(
  mcpSessionId: string,
  params: any,
  request: NextRequest,
  id: any
) {
  // Check if session is authenticated
  const mcpSession = mcpSessionStore.get(mcpSessionId);
  
  if (!mcpSession) {
    // Not authenticated - return OAuth information in capabilities
    // This tells ChatGPT that OAuth is required
    const authUrl = new URL(baseURL);
    authUrl.searchParams.set('mcp_session_id', mcpSessionId);
    authUrl.searchParams.set('mcp_auth_required', 'true');
    
    const betterAuthUrl = getBetterAuthUrl();
    const mcpServerUrl = new URL('/api/mcp', baseURL).toString();
    
    return NextResponse.json({
      jsonrpc: '2.0',
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          // Declare OAuth support
          experimental: {
            oauth: {
              authorizationServerMetadataUrl: `${baseURL}/api/mcp/.well-known/oauth-authorization-server`,
              protectedResourceMetadataUrl: `${baseURL}/api/mcp/.well-known/oauth-protected-resource`,
              clientRegistrationUrl: `${baseURL}/api/auth/oauth/register`,
            },
          },
        },
        serverInfo: {
          name: 'blackbox-mcp-server',
          version: '1.0.0',
        },
        // Include OAuth redirect URL for client
        authUrl: authUrl.toString(),
      },
      id,
    }, {
      headers: {
        'X-MCP-Session-ID': mcpSessionId,
      },
    });
  }

  // Authenticated - return MCP server info with OAuth capabilities
  // OAuth capabilities should always be declared to indicate OAuth support
  const betterAuthUrl = getBetterAuthUrl();
  
  return NextResponse.json({
    jsonrpc: '2.0',
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        // Always declare OAuth support
        experimental: {
          oauth: {
            authorizationServerMetadataUrl: `${baseURL}/api/mcp/.well-known/oauth-authorization-server`,
            protectedResourceMetadataUrl: `${baseURL}/api/mcp/.well-known/oauth-protected-resource`,
            clientRegistrationUrl: `${baseURL}/api/auth/oauth/register`,
          },
        },
      },
      serverInfo: {
        name: 'blackbox-mcp-server',
        version: '1.0.0',
      },
    },
    id,
  });
}

async function handleToolsList(mcpSessionId: string, request: NextRequest, id: any) {
  // Verify authentication
  const authResult = await verifyMCPSession(mcpSessionId);
  if (!authResult.authenticated) {
    // If redirect is needed, redirect directly
    if (authResult.redirect && authResult.authUrl) {
      return NextResponse.redirect(authResult.authUrl, {
        headers: {
          'X-MCP-Session-ID': mcpSessionId,
        },
      });
    }
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: 401,
          message: 'Authentication required',
          data: { authUrl: authResult.authUrl },
        },
        id,
      },
      { status: 401 }
    );
  }

  // Return available tools in MCP format
  const tools = getMCPTools();
  const mcpTools = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  return NextResponse.json({
    jsonrpc: '2.0',
    result: { tools: mcpTools },
    id,
  });
}

async function handleToolCall(
  mcpSessionId: string,
  params: { name: string; arguments?: any },
  request: NextRequest,
  id: any
) {
  // Verify authentication
  const authResult = await verifyMCPSession(mcpSessionId);
  if (!authResult.authenticated || !authResult.session) {
    // If redirect is needed, redirect directly
    if (authResult.redirect && authResult.authUrl) {
      return NextResponse.redirect(authResult.authUrl, {
        headers: {
          'X-MCP-Session-ID': mcpSessionId,
        },
      });
    }
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: 401,
          message: 'Authentication required',
          data: { authUrl: authResult.authUrl },
        },
        id,
      },
      { status: 401 }
    );
  }

  // Execute tool with authenticated session
  const tools = getMCPTools();
  const tool = tools.find(t => t.name === params.name);
  if (!tool) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: `Tool not found: ${params.name}`,
        },
        id,
      },
      { status: 404 }
    );
  }

  try {
    // Pass authenticated session to tool handler
    const result = await tool.handler(params.arguments || {}, {
      userId: authResult.session.user.id,
      sessionToken: authResult.sessionToken!,
    });

    // Format result for MCP protocol
    return NextResponse.json({
      jsonrpc: '2.0',
      result: {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          },
        ],
        // Include structured content if available
        ...(typeof result === 'object' && result !== null && !Array.isArray(result) 
          ? { structuredContent: result } 
          : {}),
      },
      id,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Tool execution failed',
        },
        id,
      },
      { status: 500 }
    );
  }
}

async function verifyMCPSession(mcpSessionId: string): Promise<{
  authenticated: boolean;
  session?: any;
  sessionToken?: string;
  authUrl?: string;
  redirect?: boolean;
}> {
  const mcpSession = mcpSessionStore.get(mcpSessionId);
  
  if (!mcpSession) {
    const authUrl = new URL(baseURL);
    authUrl.searchParams.set('mcp_session_id', mcpSessionId);
    authUrl.searchParams.set('mcp_auth_required', 'true');
    
    return {
      authenticated: false,
      authUrl: authUrl.toString(),
      redirect: true,
    };
  }

  // Validate and refresh token if needed
  const validation = await validateAuthToken(mcpSession.authSessionToken);
  
  if (!validation.valid) {
    mcpSessionStore.delete(mcpSessionId);
    const authUrl = new URL(baseURL);
    authUrl.searchParams.set('mcp_session_id', mcpSessionId);
    authUrl.searchParams.set('mcp_auth_required', 'true');
    
    return {
      authenticated: false,
      authUrl: authUrl.toString(),
      redirect: true,
    };
  }

  // Refresh token if needed
  if (validation.needsRefresh) {
    const newToken = await refreshAuthToken(mcpSession.authSessionToken);
    if (newToken) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      mcpSessionStore.set(
        mcpSessionId,
        newToken,
        mcpSession.userId,
        expiresAt
      );
      return {
        authenticated: true,
        session: validation.session,
        sessionToken: newToken,
      };
    }
  }

  return {
    authenticated: true,
    session: validation.session,
    sessionToken: mcpSession.authSessionToken,
  };
}

