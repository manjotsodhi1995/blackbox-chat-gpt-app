/**
 * PKCE (Proof Key for Code Exchange) Utilities for Client
 * Implements RFC 7636 for OAuth 2.1
 */

/**
 * Generate a random code verifier (43-128 characters)
 */
export function generateCodeVerifier(): string {
  // Generate 32 random bytes and base64url encode
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/**
 * Generate code challenge from verifier using S256 method
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

/**
 * Base64URL encode (RFC 4648 Section 5)
 */
function base64UrlEncode(array: Uint8Array): string {
  // Convert to base64
  let base64 = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let i = 0
  while (i < array.length) {
    const a = array[i++]
    const b = i < array.length ? array[i++] : 0
    const c = i < array.length ? array[i++] : 0

    const bitmap = (a << 16) | (b << 8) | c

    base64 += chars.charAt((bitmap >> 18) & 63)
    base64 += chars.charAt((bitmap >> 12) & 63)
    base64 += i - 2 < array.length ? chars.charAt((bitmap >> 6) & 63) : '='
    base64 += i - 1 < array.length ? chars.charAt(bitmap & 63) : '='
  }

  // Convert to base64url
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

