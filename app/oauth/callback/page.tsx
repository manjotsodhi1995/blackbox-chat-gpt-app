'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setAuthToken } from '@/lib/auth'

function OAuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')
      const state = searchParams.get('state')

      if (errorParam) {
        setError(searchParams.get('error_description') || 'Authorization failed')
        setTimeout(() => {
          router.push('/')
        }, 3000)
        return
      }

      if (!code) {
        setError('No authorization code received')
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return
      }

      // Get stored code_verifier and redirect_uri
      const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
      const storedRedirectUri = sessionStorage.getItem('oauth_redirect_uri')
      const redirectUri = storedRedirectUri || `${window.location.origin}/oauth/callback`

      if (!codeVerifier) {
        setError('Missing code verifier. Please try again.')
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return
      }

      // Exchange authorization code for access token
      const { exchangeAuthorizationCode } = await import('@/lib/auth')
      const tokenResponse = await exchangeAuthorizationCode(code, codeVerifier, redirectUri)

      if (!tokenResponse || !tokenResponse.access_token) {
        setError('Failed to exchange authorization code for token')
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return
      }

      // Store token
      setAuthToken(tokenResponse.access_token)

      // Clean up session storage
      sessionStorage.removeItem('oauth_code_verifier')
      sessionStorage.removeItem('oauth_redirect_uri')

      // Get the original redirect URL from state or default to home
      const finalRedirectUrl = state ? decodeURIComponent(state) : '/'

      // Redirect to intended page
      router.push(finalRedirectUrl)
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg mb-2">Completing authorization...</p>
        <p className="text-sm text-muted-foreground">Please wait</p>
      </div>
    </div>
  )
}

/**
 * Handle OAuth callback from blackbox-v0cc
 * Extract token from query parameters, store it, and redirect
 */
export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Loading...</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  )
}

