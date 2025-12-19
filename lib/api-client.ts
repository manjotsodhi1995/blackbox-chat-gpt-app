/**
 * API Client with automatic token injection
 */

import { getAuthToken, getOAuthUrl } from './auth'

function getBlackboxAppUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BLACKBOX_APP_URL || 'http://localhost:3001'
  }
  return process.env.BLACKBOX_APP_URL || process.env.NEXT_PUBLIC_BLACKBOX_APP_URL || 'http://localhost:3001'
}

export interface ApiClientOptions extends RequestInit {
  requireAuth?: boolean
}

/**
 * Make an authenticated API request
 * Automatically injects auth token and handles 401 responses
 */
export async function apiClient(
  url: string,
  options: ApiClientOptions = {},
): Promise<Response> {
  const { requireAuth = true, headers: originalHeaders = {}, ...fetchOptions } = options

  // Convert headers to a plain object if needed
  const headers: Record<string, string> = {}
  
  // Handle different header types
  if (originalHeaders instanceof Headers) {
    originalHeaders.forEach((value, key) => {
      headers[key] = value
    })
  } else if (Array.isArray(originalHeaders)) {
    originalHeaders.forEach(([key, value]) => {
      headers[key] = value
    })
  } else if (originalHeaders && typeof originalHeaders === 'object') {
    Object.assign(headers, originalHeaders)
  }

  // Add auth token if available
  const token = getAuthToken()
  if (token && requireAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  // Handle 401 - redirect to OAuth
  if (response.status === 401 && requireAuth && typeof window !== 'undefined') {
    const { url } = await getOAuthUrl(window.location.href)
    window.location.href = url
    throw new Error('Unauthorized - redirecting to OAuth')
  }

  return response
}

/**
 * Make a request to blackbox-v0cc API
 */
export async function blackboxApiClient(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<Response> {
  const blackboxUrl = getBlackboxAppUrl()
  const url = `${blackboxUrl}${endpoint}`
  return apiClient(url, options)
}

