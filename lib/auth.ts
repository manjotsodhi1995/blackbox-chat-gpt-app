/**
 * Authentication Utilities for ChatGPT App
 */

import type { User, TokenValidationResponse } from '@/types/auth'

const TOKEN_KEY = 'blackbox_oauth_token'

function getBlackboxAppUrl(): string {
  const url = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_BLACKBOX_APP_URL || 'http://localhost:3001'
    : process.env.BLACKBOX_APP_URL || process.env.NEXT_PUBLIC_BLACKBOX_APP_URL || 'http://localhost:3001'
  
  if (!url || url === 'undefined') {
    console.error('BLACKBOX_APP_URL is not set!')
    throw new Error('OAuth server URL is not configured. Please set NEXT_PUBLIC_BLACKBOX_APP_URL (client) or BLACKBOX_APP_URL (server) environment variable.')
  }
  
  return url
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Store authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Remove authentication token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Validate token by calling blackbox-v0cc API
 */
export async function validateToken(token: string): Promise<TokenValidationResponse> {
  try {
    const blackboxUrl = getBlackboxAppUrl()
    const response = await fetch(`${blackboxUrl}/api/oauth/validate?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        valid: false,
        error: 'Token validation failed',
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error validating token:', error)
    return {
      valid: false,
      error: 'Failed to validate token',
    }
  }
}

/**
 * Get current user from token
 */
export async function getUser(): Promise<User | null> {
  const token = getAuthToken()
  if (!token) {
    return null
  }

  const validation = await validateToken(token)
  if (!validation.valid || !validation.user) {
    clearAuthToken()
    return null
  }

  return validation.user
}

/**
 * Revoke token (logout)
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const blackboxUrl = getBlackboxAppUrl()
    const response = await fetch(`${blackboxUrl}/api/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    return response.ok
  } catch (error) {
    console.error('Error revoking token:', error)
    return false
  }
}

/**
 * Get OAuth 2.1 authorization URL with PKCE
 * Returns URL and stores code_verifier in sessionStorage for later exchange
 */
export async function getOAuthUrl(redirectUri?: string): Promise<{ url: string; codeVerifier: string }> {
  const blackboxUrl = getBlackboxAppUrl()
  const callbackUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/oauth/callback`
    : redirectUri || ''
  
  // Generate PKCE parameters
  const { generateCodeVerifier, generateCodeChallenge } = await import('./oauth-pkce')
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  // Store code_verifier for later exchange
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_code_verifier', codeVerifier)
    if (redirectUri) {
      sessionStorage.setItem('oauth_redirect_uri', redirectUri)
    }
  }
  
  const url = new URL(`${blackboxUrl}/oauth/authorize`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', 'chatgpt-app')
  url.searchParams.set('redirect_uri', callbackUrl)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('scope', 'openid profile email')
  if (redirectUri && redirectUri !== callbackUrl) {
    url.searchParams.set('state', encodeURIComponent(redirectUri))
  }
  
  return { url: url.toString(), codeVerifier }
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<{ access_token: string; token_type: string; expires_in: number } | null> {
  try {
    const blackboxUrl = getBlackboxAppUrl()
    const response = await fetch(`${blackboxUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: 'chatgpt-app',
        code_verifier: codeVerifier,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Token exchange failed:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error exchanging authorization code:', error)
    return null
  }
}

