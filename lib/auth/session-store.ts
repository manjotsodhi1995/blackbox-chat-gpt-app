/**
 * Server-side session store mapping MCP session IDs to Better Auth session tokens.
 * 
 * In production, replace with Redis or similar persistent store.
 */
type MCPSession = {
  mcpSessionId: string;
  authSessionToken: string; // Better Auth session token
  userId: string;
  expiresAt: Date;
  createdAt: Date;
};

class MCPSessionStore {
  private sessions = new Map<string, MCPSession>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set(mcpSessionId: string, authSessionToken: string, userId: string, expiresAt: Date) {
    this.sessions.set(mcpSessionId, {
      mcpSessionId,
      authSessionToken,
      userId,
      expiresAt,
      createdAt: new Date(),
    });
  }

  get(mcpSessionId: string): MCPSession | null {
    const session = this.sessions.get(mcpSessionId);
    if (!session) return null;
    
    if (session.expiresAt < new Date()) {
      this.sessions.delete(mcpSessionId);
      return null;
    }
    
    return session;
  }

  delete(mcpSessionId: string) {
    this.sessions.delete(mcpSessionId);
  }

  private cleanup() {
    const now = new Date();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

export const mcpSessionStore = new MCPSessionStore();

