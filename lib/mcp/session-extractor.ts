/**
 * Extract MCP session ID from request.
 * 
 * Priority order:
 * 1. X-MCP-Session-ID header
 * 2. Authorization header (Bearer mcp-session:xxx)
 * 3. Query parameter (mcp_session_id)
 */
export function extractMCPSessionId(request: Request): string | null {
  // Priority 1: X-MCP-Session-ID header
  const headerSessionId = request.headers.get('X-MCP-Session-ID');
  if (headerSessionId) return headerSessionId;

  // Priority 2: Authorization header (Bearer mcp-session:xxx)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer mcp-session:')) {
    return authHeader.replace('Bearer mcp-session:', '');
  }

  // Priority 3: Query parameter (for initial connection)
  try {
    const url = new URL(request.url);
    const querySessionId = url.searchParams.get('mcp_session_id');
    if (querySessionId) return querySessionId;
  } catch {
    // Invalid URL, continue
  }

  return null;
}

/**
 * Generate a new MCP session ID
 */
export function generateMCPSessionId(): string {
  return `mcp_${crypto.randomUUID()}`;
}

