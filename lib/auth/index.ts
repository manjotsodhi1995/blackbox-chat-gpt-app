/**
 * Better Auth instance
 * 
 * Since Better Auth is in a separate service, we create a client instance
 * that can be used with Better Auth plugins.
 * 
 * If you have Better Auth configured locally, import it directly:
 * ```typescript
 * import { betterAuth } from "better-auth";
 * export const auth = betterAuth({ ... });
 * ```
 */

import { getBetterAuthUrl } from './get-auth-url';

// For remote Better Auth service, we need to check if better-auth is available
let authInstance: any = null;

try {
  // Try to use Better Auth client if available
  // This requires better-auth package to be installed
  const { createAuthClient } = require('better-auth/client');
  authInstance = createAuthClient({
    baseURL: getBetterAuthUrl(),
  });
} catch (error) {
  // Better Auth not available or not installed
  // Will use custom OAuth discovery instead
  console.warn('[Auth] Better Auth client not available, using custom OAuth discovery');
}

export const auth = authInstance;

