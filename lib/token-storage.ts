/**
 * Dynamic Token Storage for MCP Server
 * 
 * Stores OAuth tokens in Redis keyed by email, allowing server-to-server
 * requests to retrieve tokens even when cookies aren't available.
 * 
 * This solves the problem where ChatGPT makes server-to-server requests
 * that don't include browser cookies, so we store tokens in Redis instead.
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client if credentials are available
let redis: Redis | null = null

try {
  if (process.env.KV_2_URL && process.env.KV_2_TOKEN) {
    redis = new Redis({
      url: process.env.KV_2_URL,
      token: process.env.KV_2_TOKEN,
    })
    console.log('[Token Storage] Redis initialized for token storage')
  } else {
    console.warn('[Token Storage] Redis credentials not available - token storage disabled')
  }
} catch (error) {
  console.error('[Token Storage] Failed to initialize Redis:', error)
  redis = null
}

export interface StoredTokenData {
  access_token: string
  refresh_token?: string
  expires_at: number // Unix timestamp
  session: {
    user: {
      email: string
      id?: string
      name?: string
      customerId?: string
    }
    expires?: string
  }
}

/**
 * Store OAuth tokens for a user (keyed by email)
 * Tokens expire after 30 days (matching refresh token expiration)
 */
export async function storeUserTokens(
  email: string,
  tokenData: StoredTokenData
): Promise<boolean> {
  if (!redis) {
    console.warn('[Token Storage] Redis not available, cannot store tokens')
    return false
  }

  try {
    const key = `mcp:auth:${email.toLowerCase()}`
    const expiresIn = 60 * 60 * 24 * 30 // 30 days
    
    await redis.set(key, JSON.stringify(tokenData), { ex: expiresIn })
    console.log('[Token Storage] ✅ Stored tokens for:', email, {
      expiresIn: `${expiresIn / 86400} days`,
    })
    return true
  } catch (error) {
    console.error('[Token Storage] Failed to store tokens:', error)
    return false
  }
}

/**
 * Retrieve stored tokens for a user by email
 */
export async function getUserTokens(
  email: string
): Promise<StoredTokenData | null> {
  if (!redis) {
    console.log('[Token Storage] Redis not available, cannot retrieve tokens')
    return null
  }

  try {
    const key = `mcp:auth:${email.toLowerCase()}`
    const data = await redis.get<StoredTokenData>(key)
    
    if (data) {
      // Check if token is expired
      if (data.expires_at && data.expires_at < Date.now() / 1000) {
        console.log('[Token Storage] Token expired for:', email)
        // Try to refresh if refresh token is available
        if (data.refresh_token) {
          console.log('[Token Storage] Attempting to refresh expired token')
          // Token refresh will be handled by the caller
        } else {
          // Delete expired token
          await redis.del(key)
          return null
        }
      }
      
      console.log('[Token Storage] ✅ Retrieved tokens for:', email)
      return data
    }
    
    console.log('[Token Storage] No tokens found for:', email)
    return null
  } catch (error) {
    console.error('[Token Storage] Failed to retrieve tokens:', error)
    return null
  }
}

/**
 * Update stored tokens (e.g., after refresh)
 */
export async function updateUserTokens(
  email: string,
  updates: Partial<StoredTokenData>
): Promise<boolean> {
  if (!redis) {
    return false
  }

  try {
    const existing = await getUserTokens(email)
    if (!existing) {
      return false
    }

    const updated: StoredTokenData = {
      ...existing,
      ...updates,
    }

    return await storeUserTokens(email, updated)
  } catch (error) {
    console.error('[Token Storage] Failed to update tokens:', error)
    return false
  }
}

/**
 * Delete stored tokens for a user (on logout)
 */
export async function deleteUserTokens(email: string): Promise<boolean> {
  if (!redis) {
    return false
  }

  try {
    const key = `mcp:auth:${email.toLowerCase()}`
    await redis.del(key)
    console.log('[Token Storage] ✅ Deleted tokens for:', email)
    return true
  } catch (error) {
    console.error('[Token Storage] Failed to delete tokens:', error)
    return false
  }
}

/**
 * Check if Redis is available
 */
export function isTokenStorageAvailable(): boolean {
  return redis !== null
}

